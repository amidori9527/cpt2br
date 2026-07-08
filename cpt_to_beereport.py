#!/usr/bin/env python3
import argparse
import json
import re
import sys
import uuid
import zipfile
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET


FR_UNITS_PER_MM = 144000
FR_UNITS_PER_PX = 38100
BEE_GLOBAL_FUNCTIONS = {
    "avg": "avg",
    "count": "count",
    "datedelta": "dateDelta",
    "day": "day",
    "if": "IF",
    "len": "LEN",
    "left": "left",
    "map": "MAP",
    "max": "max",
    "min": "min",
    "month": "month",
    "seq": "seq",
    "sum": "sum",
    "sumsafely": "sumSafely",
    "switch": "SWITCH",
    "today": "today",
    "value": "VALUE",
    "year": "year",
}


def is_legal_ds_name(name):
    return bool(re.fullmatch(r"[A-Za-z0-9]+", name or ""))


def make_dataset_name_map(root):
    original_names = [
        table_data.attrib.get("name", "")
        for table_data in root.findall("./TableDataMap/TableData")
    ]
    used_names = {name for name in original_names if is_legal_ds_name(name)}
    name_map = {}
    next_index = 1

    for name in original_names:
        if not name or name in name_map:
            continue
        if is_legal_ds_name(name):
            name_map[name] = name
            continue
        while f"ds{next_index}" in used_names:
            next_index += 1
        mapped_name = f"ds{next_index}"
        name_map[name] = mapped_name
        used_names.add(mapped_name)
        next_index += 1

    return name_map


def text_of(node):
    return (node.text or "").strip() if node is not None else ""


def int_attr(node, name, default=0):
    if node is None:
        return default
    value = node.attrib.get(name)
    return int(value) if value not in (None, "") else default


def fr_color_to_hex(value):
    if value is None:
        return None
    color = int(value)
    if color < 0:
        color = (1 << 32) + color
    return f"#{color & 0xFFFFFF:06X}"


def emu_to_px(value):
    return round(int(value) / FR_UNITS_PER_PX)


def emu_to_mm(value):
    return round(int(value) / FR_UNITS_PER_MM)


def col_name_to_index(name):
    index = 0
    for ch in name.upper():
        index = index * 26 + (ord(ch) - ord("A") + 1)
    return index - 1


def cell_addr_to_pos(addr):
    match = re.fullmatch(r"([A-Za-z]+)(\d+)", addr or "")
    if not match:
        return None
    return int(match.group(2)) - 1, col_name_to_index(match.group(1))


def pos_to_cell(row, col):
    col += 1
    letters = ""
    while col:
        col, rem = divmod(col - 1, 26)
        letters = chr(ord("A") + rem) + letters
    return f"{letters}{row + 1}"


def parse_csv_ints(text):
    return [int(item) for item in text.split(",") if item.strip()]


def parse_styles(root):
    styles = []
    for style_node in root.findall("./StyleList/Style"):
        style = {}
        align = style_node.attrib.get("horizontal_alignment")
        if align == "0":
            style["ht"] = 2
        elif align == "1":
            style["ht"] = 1
        elif align == "2":
            style["ht"] = 3

        font_node = style_node.find("./FRFont")
        if font_node is not None:
            font_name = font_node.attrib.get("name")
            if font_name:
                style["ff"] = normalize_font(font_name)
            size = font_node.attrib.get("size")
            if size:
                style["fs"] = round(int(size) / 8)
            if font_node.attrib.get("style") == "1":
                style["bl"] = 1
            foreground = font_node.find("./foreground/FineColor")
            fg = fr_color_to_hex(foreground.attrib.get("color")) if foreground is not None else None
            if fg:
                style["cl"] = {"rgb": fg}

        background = style_node.find("./Background")
        if background is not None and background.attrib.get("name") == "ColorBackground":
            color_node = background.find("./color/FineColor")
            bg = fr_color_to_hex(color_node.attrib.get("color")) if color_node is not None else None
            if bg:
                style["bg"] = {"rgb": bg}

        border = {}
        border_node = style_node.find("./Border")
        if border_node is not None:
            for fr_side, bee_side in (("Top", "t"), ("Bottom", "b"), ("Left", "l"), ("Right", "r")):
                side_node = border_node.find(f"./{fr_side}")
                if side_node is None:
                    continue
                color_node = side_node.find("./color/FineColor")
                color = fr_color_to_hex(color_node.attrib.get("color")) if color_node is not None else "#000000"
                border[bee_side] = {"s": map_border_style(side_node.attrib.get("style")), "cl": {"rgb": color}}
        if border:
            style["bd"] = border

        styles.append(style)
    return styles


def normalize_font(name):
    if name in ("Microsoft YaHei UI", "Microsoft YaHei"):
        return "Microsoft YaHei"
    return name


def map_border_style(style):
    if not style or style == "0":
        return 0
    return 1


def parse_param_node(param_node):
    attrs = param_node.find("./Attributes")
    name = attrs.attrib.get("name", "") if attrs is not None else ""
    if not name:
        return None
    return {
        "parameterName": name,
        "parameterType": "string",
        "parameterDesc": normalize_param_default(text_of(param_node.find("./O"))),
        "parameterScope": f"$$reportScope.{name}",
    }


def normalize_param_default(value):
    return (value or "").strip().replace("\\'", "'")


def parse_root_params(root):
    params = {}
    for param_node in root.findall("./Parameters/Parameter"):
        param = parse_param_node(param_node)
        if param:
            params[param["parameterName"]] = param
    return params


def parse_dataset_params(table_data, root_params, sql):
    params = []
    seen = set()
    for param_node in table_data.findall("./Parameters/Parameter"):
        param = parse_param_node(param_node)
        if param:
            params.append(param)
            seen.add(param["parameterName"])
    for name in extract_sql_parameter_names(sql):
        if name in seen:
            continue
        params.append(root_params.get(name) or make_string_param(name))
        seen.add(name)
    return params


def merge_params(params, extra_params):
    seen = {param["parameterName"] for param in params}
    for param in extra_params:
        name = param["parameterName"]
        if name in seen:
            continue
        params.append(param)
        seen.add(name)
    return params


def make_string_param(name):
    return {
        "parameterName": name,
        "parameterType": "string",
        "parameterDesc": "",
        "parameterScope": f"$$reportScope.{name}",
    }


def rewrite_identifier_functions(expression, used_functions):
    result = []
    index = 0
    quote = None
    while index < len(expression):
        ch = expression[index]
        if quote:
            result.append(ch)
            if ch == "\\" and index + 1 < len(expression):
                index += 1
                result.append(expression[index])
            elif ch == quote:
                quote = None
            index += 1
            continue
        if ch in ("'", '"', "`"):
            quote = ch
            result.append(ch)
            index += 1
            continue
        if ch.isalpha() or ch in ("_", "$"):
            start = index
            index += 1
            while index < len(expression) and (expression[index].isalnum() or expression[index] in ("_", "$")):
                index += 1
            name = expression[start:index]
            probe = index
            while probe < len(expression) and expression[probe].isspace():
                probe += 1
            is_function_call = probe < len(expression) and expression[probe] == "("
            replacement = BEE_GLOBAL_FUNCTIONS.get(name.lower(), name) if is_function_call else None
            if replacement:
                used_functions.add(replacement)
                result.append(f"$${replacement}")
            elif name.upper() == "AND":
                result.append("&&")
            elif name.upper() == "OR":
                result.append("||")
            else:
                result.append(name)
            continue
        result.append(ch)
        index += 1
    return "".join(result)


def normalize_formula_equality(expression):
    result = []
    quote = None
    index = 0
    while index < len(expression):
        ch = expression[index]
        if quote:
            result.append(ch)
            if ch == "\\" and index + 1 < len(expression):
                index += 1
                result.append(expression[index])
            elif ch == quote:
                quote = None
            index += 1
            continue
        if ch in ("'", '"', "`"):
            quote = ch
            result.append(ch)
            index += 1
            continue
        if ch == "<" and index + 1 < len(expression) and expression[index + 1] == ">":
            result.append("!=")
            index += 2
            continue
        if ch == "=":
            prev_ch = expression[index - 1] if index > 0 else ""
            next_ch = expression[index + 1] if index + 1 < len(expression) else ""
            if prev_ch not in ("=", "!", "<", ">") and next_ch not in ("=", ">"):
                result.append("==")
            else:
                result.append(ch)
            index += 1
            continue
        result.append(ch)
        index += 1
    return "".join(result)


def transform_sql_expression(expression, used_functions):
    expression = rewrite_identifier_functions(expression, used_functions)
    return normalize_formula_equality(expression)


def transform_sql(sql):
    used_functions = set()

    def replace(match):
        return "${" + transform_sql_expression(match.group(1), used_functions) + "}"

    converted_sql = re.sub(r"\$\{(.*?)\}", replace, sql, flags=re.S)
    return converted_sql, used_functions


def extract_sql_parameter_names(sql):
    names = []
    for match in re.finditer(r"\$\{(.*?)\}", sql, flags=re.S):
        for name in extract_expression_identifiers(match.group(1)):
            if name not in names:
                names.append(name)
    return names


def extract_expression_identifiers(expression):
    reserved = {
        "true",
        "false",
        "null",
        "undefined",
        "return",
        "new",
        "String",
        "Number",
        "Boolean",
        "Math",
        "Date",
    }
    identifiers = []
    index = 0
    quote = None
    while index < len(expression):
        ch = expression[index]
        if quote:
            if ch == "\\":
                index += 2
                continue
            if ch == quote:
                quote = None
            index += 1
            continue
        if ch in ("'", '"', "`"):
            quote = ch
            index += 1
            continue
        if ch.isalpha() or ch in ("_", "$"):
            start = index
            index += 1
            while index < len(expression) and (expression[index].isalnum() or expression[index] in ("_", "$")):
                index += 1
            name = expression[start:index]
            if (
                name not in reserved
                and not name.startswith("$$")
                and not name.startswith("__fr_")
                and name not in identifiers
            ):
                identifiers.append(name)
            continue
        index += 1
    return identifiers


def make_function_config(function_names):
    return []


def convert_fine_sql(sql):
    converted_sql, used_functions = transform_sql(sql)
    return {
        "sql": converted_sql,
        "params": [make_string_param(name) for name in extract_sql_parameter_names(converted_sql)],
        "functionConfig": make_function_config(used_functions),
    }


def parse_datasets(root, ds_name_map):
    datasets = []
    used_functions = set()
    root_params = parse_root_params(root)
    all_params = list(root_params.values())
    for table_data in root.findall("./TableDataMap/TableData"):
        db_name = text_of(table_data.find("./Connection/DatabaseName"))
        original_ds_name = table_data.attrib.get("name", "")
        ds_name = ds_name_map.get(original_ds_name, original_ds_name)
        sql, sql_functions = transform_sql(text_of(table_data.find("./Query")))
        used_functions.update(sql_functions)
        params = parse_dataset_params(table_data, root_params, sql)
        merge_params(all_params, params)
        datasets.append(
            {
                "dsName": ds_name,
                "dbId": "",
                "dbCd": db_name,
                "sql": sql,
                "params": params,
                "timeout": 30,
                "limit": 1000,
                "type": "normaldb",
            }
        )
    return datasets, make_function_config(used_functions), make_scope_config(all_params)


def make_scope_config(params):
    return [
        {
            "name": param["parameterName"],
            "defaultValue": param.get("parameterDesc", ""),
            "type": param.get("parameterType", "string"),
            "remark": "",
        }
        for param in params
    ]


def parse_dataset_outputs(root, ds_name_map):
    fields_by_dataset = {}
    dataset_order = []

    for table_data in root.findall("./TableDataMap/TableData"):
        original_ds_name = table_data.attrib.get("name", "")
        ds_name = ds_name_map.get(original_ds_name, original_ds_name)
        if not ds_name or ds_name in fields_by_dataset:
            continue
        fields_by_dataset[ds_name] = []
        dataset_order.append(ds_name)

    for attrs in root.findall("./Report/CellElementList/C/O[@t='DSColumn']/Attributes"):
        original_ds_name = attrs.attrib.get("dsName", "")
        ds_name = ds_name_map.get(original_ds_name, original_ds_name)
        column_name = attrs.attrib.get("columnName", "")
        if not ds_name or not column_name:
            continue
        fields_by_dataset.setdefault(ds_name, [])
        if ds_name not in dataset_order:
            dataset_order.append(ds_name)
        if column_name not in fields_by_dataset[ds_name]:
            fields_by_dataset[ds_name].append(column_name)

    return [
        {
            "parameterName": ds_name,
            "parameterType": "array",
            "parameterDesc": [
                {"parameterName": field, "parameterType": "string", "parameterDesc": ""}
                for field in fields
            ],
        }
        for ds_name in dataset_order
        for fields in [fields_by_dataset[ds_name]]
    ]


def parse_ds_column_setting(o_node, field):
    rg = o_node.find("./RG")
    if rg is None:
        return {"v": f"$DS.S({field})"}

    rg_class = rg.attrib.get("class", "")
    if rg_class.endswith("FunctionGrouper"):
        return {"v": f"$DS.G({field})", "dataSetting": "group"}

    if rg_class.endswith("SummaryGrouper"):
        fn = text_of(rg.find("./FN"))
        detail = 1 if fn.endswith("MaxFunction") else 0
        name = "最大值" if detail == 1 else "求和"
        return {
            "v": f"$DS.{name}({field})",
            "dataSetting": "compute",
            "dataSettingDetail": detail,
        }

    return {"v": f"$DS.S({field})"}


def map_filter_operator(op):
    return {
        "0": "=",
        "1": "!=",
        "2": ">",
        "3": "<",
        "4": ">=",
        "5": "<=",
        "6": "{",
        "7": "!{",
    }.get(op)


def parse_common_filter(condition):
    field = text_of(condition.find("./CNAME"))
    compare = condition.find("./Compare")
    column_row = compare.find("./ColumnRow") if compare is not None else None
    operator = map_filter_operator(compare.attrib.get("op", "")) if compare is not None else None
    if not field or column_row is None or not operator:
        return None
    return {
        "filterType": 0,
        "field": field,
        "operator": operator,
        "refType": "cell",
        "refDSName": "",
        "refField": "",
        "refCell": f"{int_attr(column_row, 'row')}/{int_attr(column_row, 'column')}",
        "refLogic": "and",
        "refValue": "",
        "groups": None,
    }


def parse_ds_column_filters(o_node):
    condition = o_node.find("./Condition")
    if condition is None:
        return []

    condition_class = condition.attrib.get("class", "")
    if condition_class.endswith("CommonCondition"):
        filter_item = parse_common_filter(condition)
        return [filter_item] if filter_item else []

    if condition_class.endswith("ListCondition"):
        filters = []
        for join_condition in condition.findall("./JoinCondition"):
            child_condition = join_condition.find("./Condition")
            if child_condition is None:
                continue
            child_class = child_condition.attrib.get("class", "")
            if not child_class.endswith("CommonCondition"):
                continue
            filter_item = parse_common_filter(child_condition)
            if filter_item:
                filters.append(filter_item)
        return filters

    return []


def parse_cell_value(c_node, ds_name_map):
    o_node = c_node.find("./O")
    if o_node is None:
        return {"v": "", "t": 1}

    if o_node.attrib.get("t") == "DSColumn":
        attrs = o_node.find("./Attributes")
        original_ds_name = attrs.attrib.get("dsName", "") if attrs is not None else ""
        ds_name = ds_name_map.get(original_ds_name, original_ds_name)
        column = attrs.attrib.get("columnName", "") if attrs is not None else ""
        field = f"{ds_name}.{column}" if ds_name and column else column
        meta = {
            "t": 1,
            "type": "columnData",
            "field": field,
            "dsName": ds_name,
        }
        meta.update(parse_ds_column_setting(o_node, field))
        filters = parse_ds_column_filters(o_node)
        if filters:
            meta["filter"] = filters
        return meta

    if o_node.attrib.get("class") == "com.fr.base.Formula":
        return {"v": normalize_formula(text_of(o_node.find("./Attributes"))), "t": 1, "type": "formula"}

    return {"v": text_of(o_node), "t": 1}


def normalize_formula(value):
    if value.startswith("="):
        used_functions = set()
        return rewrite_identifier_functions(value[1:], used_functions)
    return value


def apply_expand(meta, c_node):
    expand = c_node.find("./Expand")
    if expand is None:
        return
    direction = expand.attrib.get("dir")
    if direction == "0":
        meta["expandDirection"] = "v"
    elif direction == "1":
        meta["expandDirection"] = "h"
    elif direction == "2":
        meta["expandDirection"] = "h"
    else:
        meta["expandDirection"] = "none"

    up = expand.attrib.get("up")
    if up:
        pos = cell_addr_to_pos(up)
        meta["topParentLattice"] = f"{pos[0]}/{pos[1]}" if pos else "custom"
    elif expand.attrib.get("upParentDefault") == "false":
        meta["topParentLattice"] = "none"
    else:
        meta["topParentLattice"] = "default"

    left = expand.attrib.get("left")
    if left:
        pos = cell_addr_to_pos(left)
        meta["leftParentLattice"] = f"{pos[0]}/{pos[1]}" if pos else "custom"
    elif expand.attrib.get("leftParentDefault") == "false":
        meta["leftParentLattice"] = "none"
    else:
        meta["leftParentLattice"] = "default"


def parse_report_reference(report, styles, ds_name_map):
    row_values = parse_csv_ints(text_of(report.find("./RowHeight")))
    col_values = parse_csv_ints(text_of(report.find("./ColumnWidth")))
    rows = [emu_to_px(value) for value in row_values]
    cols = [emu_to_px(value) for value in col_values]
    hidden_rows = [index for index, value in enumerate(row_values) if value == 0]
    hidden_cols = [index for index, value in enumerate(col_values) if value == 0]

    cell_nodes = report.findall("./CellElementList/C")
    max_row = max([int_attr(c, "r") + int_attr(c, "rs", 1) for c in cell_nodes] + [len(rows)])
    max_col = max([int_attr(c, "c") + int_attr(c, "cs", 1) for c in cell_nodes] + [len(cols)])

    source = [[None for _ in range(max_col)] for _ in range(max_row)]
    meta = []
    merges = []

    for c_node in cell_nodes:
        row = int_attr(c_node, "r")
        col = int_attr(c_node, "c")
        row_span = int_attr(c_node, "rs", 1)
        col_span = int_attr(c_node, "cs", 1)

        cell = {"row": row, "col": col}
        cell.update(parse_cell_value(c_node, ds_name_map))
        style_index = c_node.attrib.get("s")
        if style_index is not None and int(style_index) < len(styles):
            cell["s"] = styles[int(style_index)]
        apply_expand(cell, c_node)
        cell["proxyCell"] = False
        meta.append(cell)
        source[row][col] = cell.get("v")

        if row_span > 1 or col_span > 1:
            merges.append(
                {
                    "startRow": row,
                    "startColumn": col,
                    "endRow": row + row_span - 1,
                    "endColumn": col + col_span - 1,
                }
            )
            for proxy_row in range(row, row + row_span):
                for proxy_col in range(col, col + col_span):
                    if proxy_row == row and proxy_col == col:
                        continue
                    proxy_cell = {
                        "row": proxy_row,
                        "col": proxy_col,
                        "s": cell.get("s", {}),
                        "proxyCell": True,
                        "realCellPosition": {"row": row, "col": col},
                    }
                    for key in ("expandDirection", "leftParentLattice", "topParentLattice"):
                        if key in cell:
                            proxy_cell[key] = cell[key]
                    meta.append(proxy_cell)
                    source[proxy_row][proxy_col] = None

    rows = rows + [emu_to_px(int_attr(report.find("./RowHeight"), "defaultValue", 723900))] * (max_row - len(rows))
    cols = cols + [emu_to_px(int_attr(report.find("./ColumnWidth"), "defaultValue", 2743200))] * (max_col - len(cols))

    return {
        "source": source,
        "meta": meta,
        "merges": merges,
        "resized": {"rows": rows[:max_row], "cols": cols[:max_col]},
        "hidden": {"cols": hidden_cols, "rows": hidden_rows},
        "floatElements": [],
    }


def parse_page_config(report):
    page = report.find("./ReportAttrSet/ReportSettings/PaperSetting/PaperSize")
    margin = report.find("./ReportAttrSet/ReportSettings/PaperSetting/Margin")
    if page is None:
        page_w = 297
        page_h = 210
    else:
        page_w = emu_to_mm(int_attr(page, "width", 297 * FR_UNITS_PER_MM))
        page_h = emu_to_mm(int_attr(page, "height", 210 * FR_UNITS_PER_MM))
    return {
        "direction": "horizontal" if page_w > page_h else "vertical",
        "pagePadding": {
            "top": emu_to_mm(int_attr(margin, "top", 0)),
            "left": emu_to_mm(int_attr(margin, "left", 0)),
            "bottom": emu_to_mm(int_attr(margin, "bottom", 0)),
            "right": emu_to_mm(int_attr(margin, "right", 0)),
        },
        "pageHeader": 0,
        "pageFooter": 0,
        "pageW": page_w,
        "pageH": page_h,
        "unit": "millimeter",
        "pagingOrder": "columnRow",
        "previewAlign": "left",
        "autoLineHeightType": "1",
        "horizontalCenter": False,
        "verticalCenter": False,
        "startPageNumber": 1,
        "autoAdjust": "rowHeight",
        "pageHeaderConfig": [],
        "pageFooterConfig": [],
        "pageSizeValue": f"{page_w}x{page_h}",
        "pageSizeConf": "predefine",
        "printMode": "server",
        "printFormat": "html",
        "bbPlaceholder": False,
        "needFillByRow": False,
        "fillBy": 0,
        "fixedColWidthInNormal": False,
        "withPageSize": False,
    }


def parse_split_layout(report):
    attr = report.find("./WorkSheetAttr")
    if attr is None:
        return {"enable": False, "mode": "", "condition": 0, "splitCount": 0, "splitArea": "", "copyIndex": "", "fillSpace": False}

    start = int(attr.attrib.get("start", "1")) - 1
    end = int(attr.attrib.get("end", "1")) - 1
    oppo_start = int(attr.attrib.get("oppoStart", "1")) - 1
    oppo_end = int(attr.attrib.get("oppoEnd", "1")) - 1
    direction = attr.attrib.get("direction")
    mode = "column" if direction == "1" else "row"
    split_area = f"{pos_to_cell(oppo_start, start)}:{pos_to_cell(oppo_end, end)}"
    return {
        "enable": True,
        "mode": mode,
        "condition": int(attr.attrib.get("maxRowOrColumn", "0")),
        "splitCount": 0,
        "splitArea": split_area,
        "copyIndex": attr.attrib.get("indexsToCopy", ""),
        "fillSpace": False,
    }


def make_report_config(report, datasets, outputs, function_config, scope_config):
    return {
        "pageConfig": parse_page_config(report),
        "splitLayout": parse_split_layout(report),
        "headerRepeat": {
            "headerRow": {"isEnabled": False, "start": 1, "end": 1},
            "headerCol": {"isEnabled": False, "start": 1, "end": 1},
        },
        "footerRepeat": {
            "footerRow": {"isEnabled": False, "start": 1, "end": 1},
            "footerCol": {"isEnabled": False, "start": 1, "end": 1},
        },
        "headerFrozen": {
            "headerRow": {"isEnabled": False, "start": 1, "end": 1},
            "headerCol": {"isEnabled": False, "start": 1, "end": 1},
        },
        "followUpPrintOpt": {
            "fuCol": {"isEnabled": False, "start": 1, "end": 1},
            "fuRow": {"isEnabled": False, "start": 1, "end": 1},
            "offset": 10,
            "offsetPosition": ["left"],
        },
        "scopeConfig": scope_config,
        "searchBarConfig": {},
        "eventConfig": [],
        "serviceConfig": {
            "dbConfig": datasets,
            "inputsType": -1,
            "outputsFilterScript": "",
            "requestHeaderScript": "",
            "serverDbConfig": [],
            "outputs": outputs,
            "datasourceType": "3" if datasets else "0",
        },
        "headerOptions": {},
        "printOptions": {
            "printName": "",
            "duplex": "simplex",
            "pageState": "",
            "page": "",
            "printMode": "server",
            "printFormat": "html",
            "pl": "",
            "printType": "electron",
            "mostOnePrint": 100,
        },
        "functionConfig": function_config,
        "engineConfig": {"enable": False, "pageSize": 10, "showTotalPage": False},
    }


def convert(cpt_path, report_code, report_name, category_id, tenant_id, version):
    root = ET.parse(cpt_path).getroot()
    report = root.find("./Report")
    if report is None:
        raise ValueError("CPT does not contain a Report node")

    styles = parse_styles(root)
    ds_name_map = make_dataset_name_map(root)
    datasets, function_config, scope_config = parse_datasets(root, ds_name_map)
    outputs = parse_dataset_outputs(root, ds_name_map)
    template = {
        "reportReference": parse_report_reference(report, styles, ds_name_map),
        "reportConfig": make_report_config(report, datasets, outputs, function_config, scope_config),
    }

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {
        "id": uuid.uuid4().hex[:24],
        "cd": report_code,
        "na": report_name,
        "categoryId": category_id,
        "version": version,
        "template": json.dumps(template, ensure_ascii=False, separators=(",", ":")),
        "instr": f"{report_code},{report_name}",
        "tenantId": tenant_id,
        "createDate": now,
        "modifyDate": now,
        "createUser": "",
        "modifyUser": "",
        "active": True,
    }


def write_report_zip(report_obj, output_path):
    output_path = Path(output_path)
    report_name = f"{report_obj['cd']}-{report_obj['version']}.report"
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(report_name, json.dumps(report_obj, ensure_ascii=False, separators=(",", ":")))


def write_reports_zip(report_objs, output_path):
    output_path = Path(output_path)
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for report_obj in report_objs:
            report_name = f"{report_obj['cd']}-{report_obj['version']}.report"
            zf.writestr(report_name, json.dumps(report_obj, ensure_ascii=False, separators=(",", ":")))


def validate_report_zip(path):
    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
        if len(names) != 1:
            raise ValueError(f"expected one .report file, got {names}")
        outer = json.loads(zf.read(names[0]).decode("utf-8"))
        template = json.loads(outer["template"])
        reference = template["reportReference"]
        if len(reference["resized"]["rows"]) != len(reference["source"]):
            raise ValueError("resized.rows length does not match source rows")
        if reference["source"] and len(reference["resized"]["cols"]) != len(reference["source"][0]):
            raise ValueError("resized.cols length does not match source cols")
        return names[0], outer, template


def validate_report_object(report_obj):
    template = json.loads(report_obj["template"])
    reference = template["reportReference"]
    if len(reference["resized"]["rows"]) != len(reference["source"]):
        raise ValueError("resized.rows length does not match source rows")
    if reference["source"] and len(reference["resized"]["cols"]) != len(reference["source"][0]):
        raise ValueError("resized.cols length does not match source cols")
    return template


def validate_reports_zip(path):
    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
        if not names:
            raise ValueError("expected at least one .report file")
        reports = []
        for name in names:
            outer = json.loads(zf.read(name).decode("utf-8"))
            template = validate_report_object(outer)
            reports.append((name, outer, template))
        return reports


def prompt_required(label):
    while True:
        value = input(label).strip()
        if value:
            return value
        print("不能为空，请重新输入。")


def prompt_with_default(label, default):
    value = input(f"{label}（默认：{default}）：").strip()
    return value or default


def find_cpt_files(folder):
    cpt_files = sorted(list(folder.glob("*.cpt")) + list(folder.glob("*.CPT")))
    if not cpt_files:
        raise FileNotFoundError(f"目录下没有 .cpt 文件：{folder}")
    return cpt_files


def normalize_input_path(raw_path):
    raw_path = (raw_path or "").strip()
    if len(raw_path) >= 2 and raw_path[0] == raw_path[-1] and raw_path[0] in ("'", '"'):
        raw_path = raw_path[1:-1]
    return Path(raw_path).expanduser().resolve()


def prompt_cpt_targets():
    while True:
        raw = input("请输入 CPT 文件路径或文件夹路径：").strip()
        if not raw:
            print("路径不能为空，请重新输入。")
            continue
        path = normalize_input_path(raw)
        if path.is_file():
            if path.suffix.lower() != ".cpt":
                print("文件不是 .cpt，请重新输入。")
                continue
            return [path]
        if path.is_dir():
            return find_cpt_files(path)
        print(f"路径不存在：{path}")


def run_conversion(cpt_path, report_code, report_name, category_id, tenant_id, version, output=None):
    output_path = output or f"{report_code}-{version}.zip"
    report_obj = convert(cpt_path, report_code, report_name, category_id, tenant_id, version)
    write_report_zip(report_obj, output_path)
    entry_name, _, template = validate_report_zip(output_path)
    reference = template["reportReference"]
    print(f"已生成：{output_path}")
    print(f"包内文件：{entry_name}")
    print(f"报表 ID：{report_obj['id']}")
    print(f"表格尺寸：{len(reference['source'])}x{len(reference['source'][0]) if reference['source'] else 0}")
    print(f"单元格 meta：{len(reference['meta'])}，合并区域：{len(reference['merges'])}")


def prompt_report_info(cpt_path, used_codes=None):
    report_name = prompt_with_default("请输入转换后的报表名 na", cpt_path.stem)
    while True:
        report_code = prompt_required("请输入标识符名 cd：")
        if used_codes is None or report_code not in used_codes:
            return report_code, report_name
        print(f"cd 已重复：{report_code}，请重新输入。")


def run_batch_conversion(cpt_paths, version="1.0.1"):
    report_objs = []
    used_codes = set()
    for index, cpt_path in enumerate(cpt_paths, 1):
        print(f"\n正在转换第 {index}/{len(cpt_paths)} 个：{cpt_path}")
        report_code, report_name = prompt_report_info(cpt_path, used_codes)
        used_codes.add(report_code)
        report_obj = convert(cpt_path, report_code, report_name, "report@报表", "", version)
        validate_report_object(report_obj)
        report_objs.append(report_obj)

    output_path = cpt_paths[0].parent / f"{cpt_paths[0].parent.name}-{version}.zip"
    write_reports_zip(report_objs, output_path)
    reports = validate_reports_zip(output_path)
    print(f"已生成：{output_path}")
    print(f"包内文件：{len(reports)} 个")
    for name, report_obj, template in reports:
        reference = template["reportReference"]
        print(
            f"- {name}，报表 ID：{report_obj['id']}，"
            f"表格尺寸：{len(reference['source'])}x{len(reference['source'][0]) if reference['source'] else 0}，"
            f"单元格 meta：{len(reference['meta'])}，合并区域：{len(reference['merges'])}"
        )


def interactive_main():
    cpt_paths = prompt_cpt_targets()
    if len(cpt_paths) == 1:
        cpt_path = cpt_paths[0]
        report_code, report_name = prompt_report_info(cpt_path)
        run_conversion(
            cpt_path=cpt_path,
            report_code=report_code,
            report_name=report_name,
            category_id="report@报表",
            tenant_id="",
            version="1.0.1",
            output=cpt_path.parent / f"{report_code}-1.0.1.zip",
        )
    else:
        run_batch_conversion(cpt_paths)
    input("转换完成，按回车退出。")


def cli_main(argv):
    parser = argparse.ArgumentParser(description="Convert a FineReport .cpt XML template to a BeeReport .report zip.")
    parser.add_argument("cpt", help="input .cpt file")
    parser.add_argument("-o", "--output", help="output .zip path")
    parser.add_argument("--code", help="report code")
    parser.add_argument("--name", help="report name")
    parser.add_argument("--category-id", default="report@报表")
    parser.add_argument("--tenant-id", default="")
    parser.add_argument("--version", default="1.0.1")
    args = parser.parse_args(argv)

    cpt_path = Path(args.cpt)
    report_code = args.code or cpt_path.stem
    report_name = args.name or cpt_path.stem
    run_conversion(cpt_path, report_code, report_name, args.category_id, args.tenant_id, args.version, args.output)


def main():
    try:
        if len(sys.argv) == 1:
            interactive_main()
        else:
            cli_main(sys.argv[1:])
    except Exception as exc:
        print(f"转换失败：{exc}")
        if len(sys.argv) == 1:
            input("按回车退出。")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
