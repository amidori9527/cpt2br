export type Primitive = string | number | boolean | null;
export type JsonValue =
  | Primitive
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

/**
 * 报表模板根对象。
 * 1. reportReference
 * 2. reportConfig
 */
export interface BeeReportTemplate {
  /**
   * 报表底稿层：
   * - 二维表格原始值
   * - 单元格元信息
   * - 单元格合并信息
   * - 行列尺寸
   * - 行列隐藏
   * - 浮动元素
   */
  reportReference: ReportReference;

  /**
   * 报表行为层：
   * - 页面布局
   * - 分页/重复/冻结
   * - 查询栏
   * - 数据源
   * - 打印选项
   * - 引擎配置
   */
  reportConfig: ReportConfig;
}

/**
 * reportReference：报表底稿层。
 */
export interface ReportReference {
  /**
   * 原始二维网格值。
   * - 外层数组表示行
   * - 内层数组表示列
   * - 示例：[[1, 2, 3]]
   */
  source: Array<Array<JsonValue>>;

  /**
   * 单元格元信息数组。
   * - 示例：[{row: 0, col: 0, v: 1}]
   */
  meta: MetaCell[];

  /**
   * 合并单元格区域列表。
   */
  merges: MergeRange[];

  /**
   * 行高、列宽调整结果。
   */
  resized: ResizedConfig;

  /**
   * 被隐藏的行、列。
   */
  hidden: HiddenConfig;

  /**
   * 浮动元素列表。
   * - custom 自定义浮动内容
   * - image 图片浮动内容
   * - chart 图表浮动内容
   */
  floatElements: FloatElement[];
}

/**
 * meta[]：单元格元信息。
 */
export interface MetaCell {
  /**
   * 行索引，从0开始。
   */
  row: number;

  /**
   * 列索引，从0开始。
   */
  col: number;

  /**
   * 单元格值。
   */
  v?: JsonValue;

  /**
   * 单元格类型编码。
   * 值枚举：
   * - 1：文本
   * - 2：数字
   */
  t?: number;

  /**
   * 单元格样式对象。
   */
  s?: CellStyle;

  /**
   * 条形码配置。
   */
  barcodeOptions?: BarcodeOptions;

  /**
   * 二维码配置。
   */
  qrcodeOptions?: QrcodeOptions;

  /**
   * 图片配置。
   */
  image?: ImageOptions;

  /**
   * 单元格形态类型。
   * 值枚举
   * - imageShape：图片
   * - qrCode：二维码
   * - barCode：条码
   * - dataDic：数据字典
   */
  contentType?: string;

  /**
   * 数据字典形态配置。
   *
   * 仅在 `contentType = 'dataDic'` 时使用。
   */
  dataDicOptions?: DataDicOptions;

  /**
   * 单元格元素类型。
   * 值枚举：
   * - diagonal：斜线
   * - subReport：子报表
   * - formula：公式
   * - columnData：数据列
   */
  type?: string;

  /**
   * 元素格式大类。
   * 值枚举（按设计器格式类型）：
   * - `convention`：常规
   * - `number`：数字
   * - `text`：文本
   * - `percent`：百分比
   */
  formatType?: string;

  /**
   * 具体格式化器。
   *
   * 它通常要和 `formatType` 搭配看：
   *
   * - `formatType = 'convention'`
   *   - 常规型通常没有固定格式列表
   *   - 常见做法是留空字符，或不传 `formatter`
   *
   * - `formatType = 'number'`
   *   - 项目里已知格式列表示例：
   *   - `#0`
   *   - `#0.00`
   *   - `#0.0#`
   *   - `#,##0`
   *   - `#,##0.00`
   *
   * - `formatType = 'text'`
   *   - 文本型通常没有固定格式列表
   *   - 常见做法也是留空，按原文本输出
   *
   * - `formatType = 'percent'`
   *   - 项目里已知格式列表示例：
   *   - `#0%`
   *   - `#0.0%`
   *   - `#0.00%`
   *   - `#0.000%`
   *   - `#0.0000%`
   */
  formatter?: string;

  /**
   * 字段名。
   * 用于把单元格和数据集字段绑定起来。
   */
  field?: string;

  /**
   * 数据集名称。
   */
  dsName?: string;

  /**
   * 过滤条件数组。
   */
  filter?: MetaFilter[];

  /**
   * 数据设置类型。
   *
   * 取值参考 `dataSettingList`：
   * - `group`：分组，单元格作为分组字段，用于层级/分类展开
   * - `list`：列表，单元格作为明细字段，按每条记录展开取值
   * - `compute`：汇总，单元格作为汇总字段，配合 `dataSettingDetail` 指定聚合方式
   */
  dataSetting?: string;

  /**
   * 数据设置细分策略。
   *
   * 当 `dataSetting = 'compute'时用于指定汇总方式：
   * - `0` = `SUM`：求和
   * - `1` = `MAX`：最大值
   * - `2` = `MIN`：最小值
   * - `3` = `AVG`：平均
   * - `4` = `COUNT`：个数
   *
   * 在非 `compute` 模式下通常可以不传或留空。
   */
  dataSettingDetail?: number;

  /**
   * 扩展方向。
   *
   * 值枚举：
   * - `h`：横向扩展，向右按列展开
   * - `v`：纵向扩展，向下按行展开
   * - `none`：不扩展，显式表示关闭扩展
   *
   * 实际数据里也可能为空或不传，通常等价于未配置扩展方向。
   */
  expandDirection?: string;

  /**
   * 扩展后排序方式。
   *
   * 值枚举：
   * - `'none'`：不排序
   * - `'ascending'`：升序
   * - `'descending'`：降序
   */
  expandAfterSort?: 'none' | 'ascending' | 'descending';

  /**
   * 扩展后排序公式/脚本。
   *
   * 仅在 `expandAfterSort` 为 `'ascending'` 或 `'descending'` 时生效，
   * 通过公式输入组件配置排序依据表达式。
   */
  expandAfterSortFn?: string;

  /**
   * 左父格配置来源。
   *
   * 值枚举：
   * - `none`：无左父格，不建立左父格依赖
   * - `default`：默认左父格，运行时按规则自动向左查找父格
   * - `<row>/<col>`：自定义左父格坐标，例如 `3/1`
   *
   * 其中 `<row>/<col>` 使用 0 基行列坐标，表示父格在模板中的位置。
   */
  leftParentLattice?: string;

  /**
   * 上父格配置来源。
   *
   * 值枚举：
   * - `none`：无上父格，不建立上父格依赖
   * - `default`：默认上父格，运行时按规则自动向上查找父格
   * - `<row>/<col>`：自定义上父格坐标，例如 `2/4`
   *
   * 其中 `<row>/<col>` 使用 0 基行列坐标，表示父格在模板中的位置。
   */
  topParentLattice?: string;

  /**
   * 是否允许横向可伸展。
   */
  acrossExtendable?: boolean;

  /**
   * 是否允许纵向可伸展。
   */
  verticalExtendable?: boolean;

  /**
   * 是否代理单元格。
   */
  proxyCell?: boolean;

  /**
   * 代理单元格指向的真实单元格的位置。
   */
  realCellPosition?: {row: number, col: number};

  /**
   * 超链接配置数组。
   *
   * 一个单元格可以配置多个链接动作，点击时按 `id` 区分具体触发项。
   *
   * 当前项目里的 `type`：
   * - `webLink`：网页链接
   * - `javascriptConf`：执行 JS 脚本
   * - `dynamicParams`：回写动态参数到当前报表作用域
   * - `internetReport`：打开网络报表
   */
  hyperlink?: HyperlinkConfig[];

  /**
   * 行前分页：是否位于分页前边界行。
   */
  rowBeforePaging?: boolean;

  /**
   * 行后分页：是否位于分页后边界行。
   */
  rowAfterPaging?: boolean;

  /**
   * 列前分页：是否位于分页前边界列。
   */
  colBeforePaging?: boolean;

  /**
   * 列后分页：是否位于分页后边界列。
   */
  colAfterPaging?: boolean;

  /**
   * 同值合并策略。
   * 值枚举：
   * - 1：横向同值合并
   * - 2：纵向同值合并
   */
  sameValueMerge?: string;

  /**
   * 是否隐藏单元格内容
   */
  isHiddenContent?: boolean;

  /**
   * 条件属性配置。
   */
  conditionAttribute?: ConditionAttribute[];

  /**
   * 字间距。
   */
  letterSpacing?: number;

  /**
   * 行高。
   */
  lineHeight?: number;

  /**
   * 尾页独行隐藏。
   */
  singleLineHidden?: boolean;

  /**
   * 是否使用 HTML 展示内容。
   */
  htmlContentShow?: boolean;

  /**
   * 控件配置。
   */
  widget?: WidgetConfig;

  /**
   * 是否缩放自适应单元格。
   */
  isAutoScaleContent?: boolean;

  /**
   * 始终复用行。
   */
  sharedRow?: boolean;

  /**
   * 值枚举：
   * - `noAdjust`不自动调整
   * - `adjustHeight`自动调整行高
   */
  contentLayout?: string;

  /**
   * 分页时可以断开。
   */
  pagingDisconnect?: boolean;

  /**
   * 分页断开时值重复显示。
   */
  repetitionShow?: boolean;

  /**
   * 扩展属性。
   */
  otherCustomConf?: OtherCustomConfItem[];
}

/**
 * 扩展属性键值对项。
 */
export interface OtherCustomConfItem {
  /** 属性名。 */
  key?: string;

  /** 属性值。 */
  value?: string;
}

/**
 * 合并区域定义。
 */
export interface MergeRange {
  /**
   * 起始行。
   */
  startRow: number;

  /**
   * 结束行。
   */
  endRow: number;

  /**
   * 起始列。
   */
  startColumn: number;

  /**
   * 结束列。
   */
  endColumn: number;
}

/**
 * 单元格底层样式对象。
 *
 * 你提到希望它长成：
 * `{ bl: 1, cl: { rgb: '#a4cafe' } }`
 *
 * 这正是项目底层样式结构的风格：
 * - `bl`：bold
 * - `cl`：前景色
 * - `bg`：背景色
 * - `bd`：边框
 * - `ff`：字体
 * - `fs`：字号
 * - `ht` / `vt`：水平 / 垂直对齐
 */
export interface CellStyle {
  /**
   * 文本旋转。
   */
  tr?: CellTextRotation | null;

  /**
   * 水平对齐。
   * 1 左，2 中，3 右。
   */
  ht?: 1 | 2 | 3 | null;

  /**
   * 垂直对齐。
   * 1 上，2 中，3 下。
   */
  vt?: 1 | 2 | 3 | null;

  /**
   * 自动换行策略。
   * 1 overflow，2 clip，3 wrap。
   */
  tb?: 1 | 2 | 3 | null;

  /**
   * 内边距。
   */
  pd?: CellPadding | null;

  /**
   * 字体。
   *
   * 值枚举：
   * - `Arial`
   * - `Times New Roman`
   * - `Tahoma`
   * - `Verdana`
   * - `Microsoft YaHei`（微软雅黑）
   * - `SimSun`（宋体）
   * - `SimHei`（黑体）
   * - `Kaiti`（楷体）
   * - `FangSong`（仿宋）
   * - `NSimSun`（新宋体）
   * - `STXinwei`（华文新魏）
   * - `STXingkai`（华文行楷）
   * - `STLiti`（华文隶书）
   *
   * 项目默认值常见为：`"SimSun"`。
   */
  ff?: string | null;

  /**
   * 字号。
   */
  fs?: number;

  /**
   * 是否斜体。
   * 0 false，1 true。
   */
  it?: 0 | 1;

  /**
   * 是否加粗。
   * 0 false，1 true。
   */
  bl?: 0 | 1;

  /**
   * 下划线。
   * 例如：`{ s: 1 }`
   */
  ul?: CellTextDecoration;

  /**
   * 删除线。
   * 例如：`{ s: 1 }`
   */
  st?: CellTextDecoration;

  /**
   * 背景色。
   * 例如：`{ rgb: '#a4cafe' }`
   */
  bg?: CellColorStyle | null;

  /**
   * 边框。
   */
  bd?: CellBorderData | null;

  /**
   * 前景色 / 字色。
   * 例如：`{ rgb: '#a4cafe' }`
   */
  cl?: CellColorStyle | null;

  /**
   * 数字 / 日期格式。
   * 例如：`{ pattern: '#,##0.00' }`
   */
  n?: CellNumFmt | null;
}

/**
 * 文本旋转。
 */
export interface CellTextRotation {
  /**
   * 角度。
   */
  a: number;

  /**
   * 是否竖排。
   * 0 false，1 true。
   */
  v?: 0 | 1;
}

/**
 * 内边距。
 */
export interface CellPadding {
  t?: number;
  r?: number;
  b?: number;
  l?: number;
}

/**
 * 颜色对象。
 * - `rgb`：直接颜色值
 * - `th`：主题色索引
 */
export interface CellColorStyle {
  rgb?: string | null;
}

/**
 * 文本装饰。
 */
export interface CellTextDecoration {
  s: 0 | 1;
}

/**
 * 单条边框线样式。
 */
export interface CellBorderStyleData {
  /**
   * 边框样式编码。
   * 项目里已知：
   * 0 NONE
   * 1 THIN
   * 2 HAIR
   * 3 DOTTED
   * 4 DASHED
   * 5 DASH_DOT
   * 6 DASH_DOT_DOT
   * 7 DOUBLE
   * 8 MEDIUM
   * 9 MEDIUM_DASHED
   * 10 MEDIUM_DASH_DOT
   * 11 MEDIUM_DASH_DOT_DOT
   * 12 SLANT_DASH_DOT
   * 13 THICK
   */
  s: number;

  /**
   * 线条颜色。
   */
  cl: CellColorStyle;
}

/**
 * 边框对象。
 */
export interface CellBorderData {
  t?: CellBorderStyleData | null;
  r?: CellBorderStyleData | null;
  b?: CellBorderStyleData | null;
  l?: CellBorderStyleData | null;
}

/**
 * 数字 / 日期格式对象。
 */
export interface CellNumFmt {
  pattern: string;
}

/**
 * 数据字典形态配置。
 *
 * 挂在 `meta[].dataDicOptions` 下，与 `meta[].contentType = 'dataDic'` 搭配使用。
 * 根据 `type` 字段决定使用哪种数据来源。
 */
export interface DataDicOptions {
  /**
   * 数据字典类型。
   *
   * 值枚举：
   * - `'dataQuery'`：数据查询，从数据集中查询实际值和显示值
   * - `'custom'`：自定义，手动配置值映射
   */
  type?: 'dataQuery' | 'custom';

  /**
   * 数据查询配置。
   *
   * 仅在 `type = 'dataQuery'` 时使用。
   */
  dataQuery?: DataDicDataQueryConfig;

  /**
   * 自定义映射配置。
   *
   * 仅在 `type = 'custom'` 时使用。
   */
  custom?: DataDicCustomConfig;
}

/**
 * 数据字典 - 数据查询配置。
 */
export interface DataDicDataQueryConfig {
  /** 数据集名称。 */
  dataSet?: string;

  /** 实际值列名。 */
  actualColumnName?: string;

  /** 显示值列名。 */
  showColumnName?: string;
}

/**
 * 数据字典 - 自定义映射配置。
 */
export interface DataDicCustomConfig {
  /**
   * 值映射数组。
   *
   * 每项定义实际值与显示值的映射关系。
   */
  valueMap?: DataDicValueMapItem[];
}

/**
 * 数据字典 - 自定义映射项。
 */
export interface DataDicValueMapItem {
  /** 实际值。 */
  actualValue?: string;

  /** 显示值。 */
  showValue?: string;
}

/**
 * 数据字典 - 数据库表查询配置（当前已注释，暂不可用）。
 */
export interface DataDicDatabaseTableConfig {
  /** 数据库名。 */
  database?: string;

  /** 数据模型。 */
  model?: string;

  /** 表名。 */
  tableName?: string;

  /** 实际值列名。 */
  actualColumnName?: string;

  /** 实际值列号。 */
  actualColumnNumber?: string;

  /** 显示值列名。 */
  showColumnName?: string;

  /** 显示值列号。 */
  showColumnNumber?: string;

  /** 显示值公式。 */
  showFormula?: string;
}

/**
 * 数据字典 - 公式配置（当前已注释，暂不可用）。
 */
export interface DataDicFormulaConfig {
  /** 实际值公式。 */
  actualValue?: string;

  /** 显示值公式。 */
  showValue?: string;
}

/**
 * 条形码配置。
 *
 * 这组配置通常挂在 `meta[].barcodeOptions` 下，并和
 * `meta[].contentType = 'barCode'` 搭配使用。
 *
 * 项目里“插入条码”命令的常见默认值是：
 * - `format: 'CODE39'`
 * - `width: 2`
 * - `height: 30`
 * - `displayValue: true`
 * - `margin: 10`
 */
export interface BarcodeOptions {
  /**
   * - `true`：条码下方显示原始值
   * - `false`：只显示条码图形，不显示文本
   *
   * 适用场景：
   * - 需要人工核对编码内容时，通常设为 `true`
   * - 只追求版面紧凑、扫码即可时，通常设为 `false`
   */
  displayValue?: boolean;

  /**
   * 条码编码制式 / 格式。
   *
   * 这个字段决定“同一个值”最终按哪种条码标准渲染。
   * 不同格式支持的字符集、校验规则、外观宽度都可能不同。
   *
   * 值枚举：
   * - `CODE39`
   * - `CODE128`
   * - `CODE128A`
   * - `CODE128B`
   * - `CODE128C`
   * - `EAN13`
   * - `EAN8`
   * - `EAN5`
   * - `EAN2`
   * - `UPC`
   * - `UPCE`
   * - `ITF14`
   * - `ITF`
   * - `MSI`
   * - `MSI10`
   * - `MSI11`
   * - `MSI1010`
   * - `MSI1110`
   * - `pharmacode`
   * - `codabar`
   * - `GenericBarcode`
   *
   * 如果没有特殊要求，项目里常见默认值是 `CODE39`。
   */
  format?: string;

  /**
   * 条码图形高度。
   *
   * 这个值控制黑白条纹区域本身的高度，不是整个单元格高度。
   * 数值越大，条码越高。
   *
   * 常见写法：
   * - `30`
   * - `40`
   * - `60`
   *
   * 项目“插入条码”命令默认值常见为：`30`
   */
  height: number;

  /**
   * 条码整体外边距。
   *
   * 这个值会在条码四周预留空白，避免条码图形紧贴边界。
   * 数值越大，四周留白越多。
   *
   * 常见作用：
   * - 提高扫描容错
   * - 让条码在单元格里看起来不那么拥挤
   *
   * 项目“插入条码”命令默认值常见为：`10`
   */
  margin?: number;

  /**
   * 单个条纹的基础宽度 / 模块宽度。
   *
   * 这个值会直接影响条码横向占用空间：
   * - 值越大，条码越宽
   * - 值越小，条码越紧凑
   *
   * 常见写法：
   * - `1`
   * - `2`
   * - `3`
   *
   * 项目“插入条码”命令默认值常见为：`2`
   *
   * 注意：
   * - 它不是“整个条码总宽度”
   * - 如果值过大，条码可能超出单元格宽度
   * - 如果值过小，可能影响可读性和扫码稳定性
   */
  width?: number;
}

/**
 * 二维码配置。
 *
 * 这组配置通常挂在 `meta[].qrcodeOptions` 下，并和
 * `meta[].contentType = 'qrCode'` 搭配使用。
 *
 * 项目里“插入二维码”命令的常见默认值是：
 * - `width: 90`
 * - `height: 90`
 * - `colorDark: '#000000'`
 * - `colorLight: '#ffffff'`
 * - `margin: 10`
 * - `correctLevel: 'H'`
 *
 * 常见写法例如：
 * `{ width: 90, height: 90, colorDark: '#000000', colorLight: '#ffffff', margin: 10, correctLevel: 'H' }`
 */
export interface QrcodeOptions {
  /**
   * 二维码前景色 / 深色块颜色。
   *
   * 常见值：
   * - `#000000`
   * - `#333333`
   *
   * 一般就是二维码小方块的颜色。
   */
  colorDark?: string;

  /**
   * 二维码背景色 / 浅色区域颜色。
   *
   * 常见值：
   * - `#ffffff`
   * - `transparent`
   *
   * 一般就是二维码底色。
   */
  colorLight?: string;

  /**
   * 二维码尺寸。
   *
   * 常见值：
   * - `90`
   * - `120`
   * - `150`
   *
   * 项目常见默认值：`90`
   */
  width?: number;

  /**
   * 二维码四周留白。
   *
   * 常见值：
   * - `0`
   * - `4`
   * - `10`
   *
   * 项目常见默认值：`10`
   *
   * 这个值越大，二维码四周空白越多，更不容易贴边。
   */
  margin?: number;

  /**
   * 二维码纠错等级。
   *
   * 项目常见默认值：`H`
   * 常见可选值通常为：
   * - `L`
   * - `M`
   * - `Q`
   * - `H`
   *
   * 一般可理解为：
   * - `L`：纠错最弱，容量更大
   * - `M`：中等纠错
   * - `Q`：较高纠错
   * - `H`：最高纠错，容错更强
   *
   * 如果没有特殊要求，项目里更常见使用 `H`。
   */
  correctLevel?: string;
}

/**
 * 单元格图片配置。
 */
export interface ImageOptions {
  /**
   * 图片铺放模式。
   * 项目中已知：
   * - auto
   * - 100% 100%
   * - cover
   */
  mode?: "auto" | "100% 100%" | "cover" | string;

  /**
   * 图片地址。
   */
  src?: string;

  /**
   * 图片文件ID
   */
  fileId?: string;
}

/**
 * 单元格过滤配置。
 */
export type MetaFilterOperator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "{"
  | "!{"
  | "}"
  | "!}";

/**
 * 过滤条件里的关联值来源类型。
 *
 * 项目里已知可选值：
 * - `string`：字符串
 * - `int`：整数
 * - `double`：浮点数
 * - `formula`：公式结果
 * - `cell`：单元格
 * - `columnData`：关联数据列
 * - `group`：分组
 */
export type MetaFilterRefType =
  | "string"
  | "int"
  | "double"
  | "formula"
  | "cell"
  | "columnData"
  | "group";

/**
 * 多个过滤条件之间的拼接逻辑。
 *
 * - `and`：交集，多个条件都要满足
 * - `or`：并集，满足任意条件即可
 */
export type MetaFilterLogic = "and" | "or";

export interface MetaFilter {
  /**
   * 过滤类型。
   *
   * 值枚举：
   * - `0`：普通过滤
   * - `1`：公式过滤
   *
   * 说明：
   * - `0` 时，通常依赖 `field`、`operator`、`refType`、`refValue/refDSName/refField/refCell`
   * - `1` 时，核心看 `filterScript`
   */
  filterType?: 0 | 1;

  /**
   * 公式过滤脚本。
   *
   * 只有在 `filterType = 1` 时才是核心字段。
   * 运行时会把它当成一段可执行表达式来求值：
   * - 返回真：当前数据命中过滤
   * - 返回假：当前数据被过滤掉
   *
   * 如果脚本里引用了单元格，还可能结合 `refCell` 做替换。
   */
  filterScript?: string;

  /**
   * 当前过滤作用到哪个字段。
   *
   * 一般就是“当前单元格绑定数据集里的字段名”。
   * 过滤执行时，经常会拿这个字段去和右侧引用值比较。
   */
  field?: string;

  /**
   * 比较运算符。
   *
   * 复杂枚举：
   * - `=`：等于
   * - `!=`：不等于
   * - `>`：大于
   * - `<`：小于
   * - `>=`：大于等于
   * - `<=`：小于等于
   * - `{`：包含
   * - `!{`：不包含
   * - `}`：被包含于 / 属于
   * - `!}`：不被包含于
   *
   * 说明：
   * - 设计器里常见输入是 `=`、`!=` 这类符号
   */
  operator?: MetaFilterOperator;

  /**
   * 右侧比较值的来源类型。
   *
   * 复杂枚举：
   * - `string`
   * - `int`
   * - `double`
   * - `formula`
   * - `cell`
   * - `columnData`
   * - `group`
   *
   * 这个字段决定：
   * - `refValue` 怎么解释
   * - 是按字面值比较、按单元格比较，还是按关联数据集字段比较
   */
  refType?: MetaFilterRefType;

  /**
   * 右侧比较值。
   *
   * 常见用法：
   * - `refType = 'string'`：这里直接写字符串值
   * - `refType = 'int' / 'double'`：这里写数字字面量
   * - `refType = 'formula'`：这里写公式或表达式文本
   *
   * 如果右侧值来自数据集字段或单元格，则这个字段通常不是主字段。
   */
  refValue?: string;

  /**
   * 关联数据集名称。
   *
   * 主要在 `refType = 'columnData'` 时使用。
   * 表示“右侧比较值来自哪个数据集”。
   */
  refDSName?: string;

  /**
   * 关联数据集字段名。
   *
   * 主要在 `refType = 'columnData'` 时使用。
   * 它通常和 `refDSName` 搭配，表示：
   * “把当前字段和目标数据集里的哪个字段做关联比较”。
   */
  refField?: string;

  /**
   * 关联单元格位置。
   *
   * 主要在 `refType = 'cell'` 时使用。
   * 项目里常见格式是：
   * - `row/col`
   * - 例如 `0/1` 表示第 1 行第 2 列（0 基）
   *
   * 在公式过滤里，它也可能被用来收集脚本里引用到的单元格位置。
   */
  refCell?: string;

  /**
   * 当前条件和上一个条件之间的逻辑关系。
   *
   * 值枚举：
   * - `and`：交集
   * - `or`：并集
   *
   * 说明：
   * - 第一条条件通常不太依赖这个值
   * - 从第二条开始，这个字段决定如何和前面的命中结果合并
   */
  refLogic?: MetaFilterLogic;

  /**
   * 条件分组。
   *
   * 这是一个递归结构：
   * - 每一项仍然是 `MetaFilter`
   * - 用于表达“括号里的子条件集合”
   *
   * 如果这里有值，运行时通常会优先递归处理 `groups`，
   * 而不是把当前节点当成普通单条比较条件处理。
   */
  groups?: MetaFilter[];
}

/**
 * 条件属性符号枚举。
 *
 * 对应设计器中条件属性面板可添加的属性类型，
 * 与 `EAttributeInfo` 枚举值一一对应。
 *
 * 值枚举：
 * - `color`：前景色 / 字体颜色
 * - `bgColor`：背景色（支持纯色、纹理、渐变、背景图）
 * - `font`：字体样式（字体族、加粗、斜体、字号、字色、下划线、删除线）
 * - `shape`：形态（普通 / 其他形态）
 * - `textIndex`：缩进（左缩进、右缩进）
 * - `rowHeight`：行高
 * - `colWidth`：列宽
 * - `page`：分页（不分页 / 行后分页 / 行前分页 / 列后分页 / 列前分页）
 * - `link`：超级链接
 * - `border`：边框
 * - `control`：控件
 * - `newValue`：新值（条件命中后替换单元格值）
 */
export type AttributeSymbol =
  | 'color'
  | 'bgColor'
  | 'font'
  | 'rowHeight'
  | 'colWidth'
  | 'link'
  | 'border'
  | 'newValue';

/**
 * 条件属性命中后要激活的单条属性配置。
 *
 * 每个条目对应设计器条件属性面板中的一行属性设置，
 * 由 `symbol` 标识属性类型，`value` 存储属性值。
 *
 * 不同 `symbol` 对应的 `value` 结构不同：
 * - `color`：`string`，如 `'#000000'`
 * - `bgColor`：`BgColorValue | string`，如 `{ dataType: 'color', data: '#ffffff' }`
 * - `font`：`FontAttributeValue`
 * - `shape`：`string`，如 `'0'`（普通）、`'1'`（其他形态）
 * - `textIndex`：无 `value`，使用 `leftIndent` / `rightIndent`
 * - `rowHeight`：`number`，如 `24`
 * - `colWidth`：`number`，如 `90`
 * - `page`：`string`，如 `'0'`（不分页）、`'1'`（行后分页）
 * - `link`：`HyperlinkConfig[] | string`，超级链接配置数组
 * - `border`：`string`（颜色值）或 `BorderAttributeValue`（每条边独立配置）
 * - `control`：`string`，控件配置
 * - `newValue`：`NewValueAttribute | string | number`，如 `{ dataType: 'string', data: '' }`
 */
export interface AttributeActiveInfo {
  /**
   * 属性显示名称。
   *
   * 值枚举：
   * - `'颜色'`
   * - `'背景'`
   * - `'字体'`
   * - `'行高'`
   * - `'列宽'`
   * - `'超级链接'`
   * - `'边框'`
   * - `'新值'`
   */
  name: string;

  /**
   * 属性符号标识。
   *
   * 用于运行时匹配条件表达式返回对象中的 key，
   * 也用于区分不同属性类型的 UI 渲染逻辑。
   */
  symbol: AttributeSymbol;

  /**
   * 属性值。
   *
   * 类型随 `symbol` 不同而变化，详见 `AttributeActiveInfo` 接口文档头部说明。
   */
  value?: AttributeValue;

  /**
   * 作用范围。
   *
   * 值枚举：
   * - `'cell'`：当前格子
   * - `'row'`：当前行
   * - `'col'`：当前列
   *
   * 仅部分属性（颜色、背景、字体）支持此字段。
   */
  cellRange?: 'cell' | 'row' | 'col';

  /**
   * 是否启用。
   *
   * 仅 `symbol = 'link'`，
   * 控制是否实际启用超级链接。
   */
  checked?: boolean;
}

/**
 * 条件属性值联合类型。
 *
 * 根据 `symbol` 不同，`value` 可能是：
 * - 字符串（颜色值、分页类型等）
 * - 数字（行高、列宽等）
 * - 背景色配置对象
 * - 字体属性对象
 * - 新值配置对象
 * - 边框配置对象
 * - 超级链接配置数组
 */
export type AttributeValue =
  | string
  | number
  | BgColorValue
  | FontAttributeValue
  | NewValueAttribute
  | BorderAttributeValue
  | HyperlinkConfig[]
  | Record<string, unknown>;

/**
 * 背景色属性值。
 *
 * 支持纯色和背景图两种模式。
 */
export interface BgColorValue {
  /**
   * 背景类型。
   *
   * 值枚举：
   * - `'color'`：纯色背景
   * - `'image'`：图片背景
   */
  dataType: 'color' | 'image';

  /**
   * 背景数据。
   *
   * - `dataType = 'color'` 时为颜色字符串，如 `'#ffffff'`
   * - `dataType = 'image'` 时为图片配置对象
   */
  data: string | BgColorImageData;
}

/**
 * 背景图数据。
 */
export interface BgColorImageData {
  /**
   * 图片文件 ID。
   */
  fileId: string;

  /**
   * 图片铺放模式。
   *
   * 值枚举：
   * - `'auto'`：默认
   * - `'100% 100%'`：拉伸铺满
   * - `'cover'`：自适应
   */
  mode: 'auto' | '100% 100%' | 'cover';
}

/**
 * 字体属性值。
 */
export interface FontAttributeValue {
  /**
   * 字体族。
   *
   * 值枚举：
   * - `'Arial'`
   * - `'Tahoma'`
   * - `'Verdana'`
   * - `'Microsoft YaHei'`（微软雅黑）
   * - `'SimSun'`（宋体）
   * - `'SimHei'`（黑体）
   * - `'Kaiti'`（楷体）
   * - `'FangSong'`（仿宋）
   * - `'NSimSun'`（新宋体）
   * - `'STXinwei'`（华文新魏）
   * - `'STXingkai'`（华文行楷）
   * - `'STLiti'`（华文隶书）
   * - `'HanaleiFill'`
   * - `'Pacifico'`
   * - `'Anton'`
   * 
   * 项目默认值常见为：`'SimSun'`。
   */
  fontFamily: string;

  /**
   * 是否加粗。
   */
  bold: boolean;

  /**
   * 是否斜体。
   */
  italic: boolean;

  /**
   * 字号。
   */
  fontSize: number;

  /**
   * 字体颜色。
   *
   * 如 `'#000'`、`'#ff0000'`。
   */
  fontColor: string;

  /**
   * 下划线。
   *
   * - `0`：无下划线
   * - `thin`：实线下划线
   */
  underline: 0 | 'thin';

  /**
   * 是否有删除线。
   */
  lineThrough: boolean;
}

/**
 * 新值属性配置。
 *
 * 条件命中后替换单元格的值。
 */
export interface NewValueAttribute {
  /**
   * 数据类型。
   *
   * 值枚举：
   * - `'string'`：字符串
   * - `'int'`：整数
   * - `'double'`：双精度型
   * - `'date'`：日期
   * - `'boolean'`：布尔型
   * - `'cell'`：单元格引用
   */
  dataType: string;

  /**
   * 数据值。
   *
   * - `dataType = 'string'` / `'int'` / `'double'` / `'date'` / `'boolean'`：直接值
   * - `dataType = 'cell'`：`{ row: number, col: string}` 单元格坐标
   */
  data: string | number | boolean | { row: number; col: string };
}

/**
 * 边框属性值（每条边独立配置）。
 */
export interface BorderAttributeValue {
  /**
   * 下边框。
   */
  b?: BorderEdgeValue;

  /**
   * 左边框。
   */
  l?: BorderEdgeValue;

  /**
   * 右边框。
   */
  r?: BorderEdgeValue;

  /**
   * 上边框。
   */
  t?: BorderEdgeValue;
}

/**
 * 单条边框线配置。
 */
export interface BorderEdgeValue {
  /**
   * 边框颜色。
   */
  color: string;

  /**
   * 边框样式编码。
   *
   * 值枚举：
   * - `0`：无边框
   * - `1`：细实线
   * - `4`：短划线
   * - `8`：中等粗细实线
   * - `9`：中等粗细短划线
   * - `13`：粗实线
   */
  s: number;
}

/**
 * 条件属性配置。
 *
 * 每个单元格可以配置多条条件属性，每条条件属性包含：
 * - 条件表达式（`expressionStatement`）：判断条件是否成立
 * - 属性激活列表（`attributeActiveInfo`）：条件成立后要修改的样式/值
 * - 元信息（`id`、`name` 等）：用于设计器 UI 管理
 *
 * 条件表达式可以返回：
 * 1. 布尔值（`true`/`false`），表示条件是否成立
 *    示例：`return $$currentValue == 1`
 * 2. 对象，覆盖 `attributeActiveInfo` 中对应 `symbol` 的 `value`
 *    示例：
 *    ```
 *    return {
 *        color: '#fff',
 *        bgColor: { dataType: 'color', data: '#fff' },
 *        rowHeight: 24,
 *        colWidth: 90,
 *        newValue: 1
 *    }
 *    ```
 */
export interface ConditionAttribute {
  /**
   * 条件属性唯一标识。
   *
   * 由 `nanoid()` 生成，用于设计器中标识和选中条件属性条目。
   */
  id?: string;

  /**
   * 条件属性显示名称。
   *
   * 在设计器左侧列表中显示，默认格式为 `'条件属性N'`（N 为自增序号）。
   * 支持双击重命名。
   */
  name?: string;

  /**
   * 条件表达式。
   *
   * 运行时执行此表达式判断条件是否成立：
   * - 返回 `true` / `false`：条件是否成立
   * - 返回对象：条件成立，且对象中 key 匹配 `attributeActiveInfo[].symbol` 的值会覆盖对应属性
   *
   * 可用变量：
   * - `$$currentValue`：当前单元格的值
   * - `$$scope`：当前报表全局作用域
   * - `$$reportInfo`：当前报表信息（na: 报表名称、cd: 报表编码、version: 报表版本）
   * - `$$meta`：当前单元格元数据（row: 行、col: 列）
   * - `$$pageInfo`：当前分页信息（currentPage: 当前页、totalPage: 全部页数）
   * - `$$dataSet`：数据集
   * - `$$rowsCount`：报表总行数
   * - `$$rowData`：当前单元格行数据
   * - `$$A1`：指定单元格
   */
  expressionStatement?: string;

  /**
   * 命中条件后要激活的属性集合。
   *
   * 每一项对应一种属性修改（颜色、背景、字体、行高、列宽、边框、超级链接、新值），
   * 条件成立后运行时会按 `symbol` 匹配并应用对应 `value`。
   */
  attributeActiveInfo?: AttributeActiveInfo[];

  /**
   * 是否处于名称可编辑状态。
   *
   * 设计器 UI 状态字段，双击条件属性名称时切换为 `true`，
   * 失焦时切换回 `false`。运行时不参与计算。
   */
  isEditable?: boolean;
}

/**
 * 控件类型（PC 端 Element UI 组件）。
 *
 * 值枚举：
 * - `'button'`：按钮控件
 * - `'select'`：选择器
 * - `'checkbox'`：复选框
 * - `'radiogroup'`：单选框组
 * - `'checkboxgroup'`：复选框组
 * - `'datePicker'`：日期选择器
 * - `'datePickerQuick'`：日期选择器（快速输入）
 * - `'timePicker'`：时间选择器
 * - `'input'`：输入框
 * - `'upload'`：上传
 * - `'richtext'`：富文本
 */
export type WidgetType =
  | 'button'
  | 'select'
  | 'checkbox'
  | 'radiogroup'
  | 'checkboxgroup'
  | 'datePicker'
  | 'datePickerQuick'
  | 'timePicker'
  | 'input'
  | 'upload'
  | 'richtext';

/**
 * 控件类型（移动端 Vant 组件）。
 *
 * 值枚举：
 * - `'vantText'`：文本控件
 * - `'vantButton'`：按钮控件
 * - `'vantSelect'`：选择器
 * - `'vantRadiogroup'`：单选框组
 * - `'vantCheckboxgroup'`：复选框组
 * - `'vantDateTimePicker'`：日期时间选择器
 * - `'vantInput'`：输入框
 */
export type VantWidgetType =
  | 'vantText'
  | 'vantButton'
  | 'vantSelect'
  | 'vantRadiogroup'
  | 'vantCheckboxgroup'
  | 'vantDateTimePicker'
  | 'vantInput';

/**
 * 单元格控件配置。
 *
 * 控件是单元格内可交互的表单元素，支持 PC 端（Element UI）
 * 和移动端（Vant）两套组件体系，由 `type` 字段区分。
 *
 * 控件绑定作用域字段后，用户在报表运行态可进行输入、选择、提交等操作，
 * 填写结果会回写到报表作用域变量中。
 */
export interface WidgetConfig {
  /**
   * 控件类型。
   *
   * PC 端取值见 `WidgetType`，移动端取值见 `VantWidgetType`。
   * 运行时根据 `type` 是否包含 `'vant'` 前缀判断渲染模式。
   *
   * 值枚举（PC 端）：
   * - `'text'`：文本控件
   * - `'button'`：按钮控件
   * - `'select'`：选择器
   * - `'checkbox'`：复选框
   * - `'radiogroup'`：单选框组
   * - `'checkboxgroup'`：复选框组
   * - `'datePicker'`：日期选择器
   * - `'datePickerQuick'`：日期选择器（快速输入）
   * - `'timePicker'`：时间选择器
   * - `'input'`：输入框
   * - `'upload'`：上传
   * - `'richtext'`：富文本
   *
   * 值枚举（移动端）：
   * - `'vantText'`：文本控件
   * - `'vantButton'`：按钮控件
   * - `'vantSelect'`：选择器
   * - `'vantRadiogroup'`：单选框组
   * - `'vantCheckboxgroup'`：复选框组
   * - `'vantDateTimePicker'`：日期时间选择器
   * - `'vantInput'`：输入框
   */
  type?: WidgetType | VantWidgetType;

  /**
   * 控件名称。
   *
   * 在设计器中显示的控件标识，用于区分同一类型的多个控件。
   */
  name?: string;

  /**
   * 控件唯一标识。
   *
   * 用于运行时定位控件实例，联动、校验、显隐等逻辑均依赖此标识。
   * 同一报表内应保持唯一。
   *
   * 生成规则：
   * 由 `genIdentifier()` 函数生成，从大小写英文字母池
   * `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`（共 52 个字符）
   * 中随机抽取 4 个字符拼接而成。
   *
   * 示例值：`'aXkQ'`、`'Bmnp'`、`'ZyRt'`
   *
   * 生成算法等价伪代码：
   * ```
   * chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
   * identifier = 随机取 chars 中 4 个字符拼接
   * ```
   *
   * 注意事项：
   * - 长度固定为 4，仅含大小写字母，不含数字和特殊字符
   * - 理论组合数为 52⁴ = 7,311,616，在单份报表内碰撞概率极低
   * - 复制/粘贴/提交报表时，系统会重新生成 identifier 以避免冲突
   * - 新增控件时若未提供 identifier，系统会自动调用 `genIdentifier()` 补全
   */
  identifier?: string;

  /**
   * 绑定作用域字段。
   *
   * 控件值与报表全局作用域变量的绑定路径，
   * 支持 `.` 分隔的嵌套字段，如 `'form.name'`。
   * 用户在控件中输入/选择的值会回写到该字段。
   */
  scopeField?: string;

  /**
   * 控件表现属性。
   *
   * PC 端和移动端使用不同的属性接口，由 `type` 字段区分：
   *
   * PC 端（Element UI）：
   * - `type = 'input'` → `PCInputAttribute`
   * - `type = 'button'` → `PCButtonAttribute`
   * - `type = 'select'` → `PCSelectAttribute`
   * - `type = 'radiogroup'` → `PCRadioGroupAttribute`
   * - `type = 'checkbox'` → `PCCheckboxAttribute`
   * - `type = 'checkboxgroup'` → `PCCheckBoxGroupAttribute`
   * - `type = 'datePicker'` → `PCDateAttribute`
   * - `type = 'datePickerQuick'` → `PCDatePickerQuickAttribute`
   * - `type = 'timePicker'` → `PCTimeAttribute`
   * - `type = 'upload'` → `PCUploadAttribute`
   * - `type = 'richtext'` → `PCRichtextAttribute`
   *
   * 移动端（Vant）：
   * - `type = 'vantInput'` → `VantInputAttribute`
   * - `type = 'vantButton'` → `VantButtonAttribute`
   * - `type = 'vantSelect'` → `VantSelectAttribute`
   * - `type = 'vantRadiogroup'` → `VantRadioGroupAttribute`
   * - `type = 'vantCheckboxgroup'` → `VantCheckboxGroupAttribute`
   * - `type = 'vantDateTimePicker'` → `VantDateTimePickerAttribute`
   */
  attribute?: PCWidgetAttribute | VantWidgetAttribute;

  /**
   * 控件逻辑配置。
   *
   * 包含事件、联动、数据源、校验、提交、插删行等行为配置。
   */
  componentLogic?: WidgetLogic;
}

/**
 * PC 端输入框属性（Element UI el-input）。
 */
export interface PCInputAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /** 尺寸，如 `'medium'`、`'small'`、`'mini'`。 */
  size?: string;

  /** 最大输入长度。 */
  maxlength?: number;

  /** 占位文本。 */
  placeholder?: string;

  /** 是否可清空。 */
  clearable?: boolean;

  /** 是否精简模式。 */
  simplify?: boolean;

  /** 输入框类型，如 `'text'`、`'textarea'`。 */
  type?: string;

  /** 是否只读。 */
  readonly?: boolean;
}

/**
 * PC 端按钮属性（Element UI el-button）。
 */
export interface PCButtonAttribute {
  /** 按钮内容文本。 */
  slot?: string;

  /** 按钮样式类型，如 `'default'`、`'primary'`、`'success'`、`'warning'`、`'danger'`、`'info'`、`'text'`。 */
  type?: string;

  /** 是否朴素按钮。 */
  plain?: boolean;

  /**
   * 按钮功能类型。
   *
   * 值枚举：
   * - `'normal'`：普通按钮
   * - `'treebtn'`：树按钮
   * - `'submitbtn'`：提交按钮
   * - `'insertbtn'`：插入按钮
   * - `'deletebtn'`：删除按钮
   */
  buttonType?: 'normal' | 'treebtn' | 'submitbtn' | 'insertbtn' | 'deletebtn';

  /** 尺寸，如 `'medium'`、`'small'`、`'mini'`。 */
  size?: string;
}

/**
 * PC 端选择器属性（Element UI el-select）。
 */
export interface PCSelectAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /** 尺寸，如 `'medium'`、`'small'`、`'mini'`。 */
  size?: string;

  /** 占位文本。 */
  placeholder?: string;

  /** 是否可清空。 */
  clearable?: boolean;

  /** 是否可搜索。 */
  filterable?: boolean;

  /** 是否多选。 */
  multiple?: boolean;

  /** 是否精简模式。 */
  simplify?: boolean;

  /** 选项配置，如 `{ label, value, disabled }` 映射。 */
  props?: Record<string, unknown>;
}

/**
 * PC 端单选框组属性（Element UI el-radio-group）。
 */
export interface PCRadioGroupAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否纵向排列。 */
  vertical?: boolean;

  /** 选项配置，如 `{ label, value, disabled }` 映射。 */
  props?: Record<string, unknown>;
}

/**
 * PC 端复选框属性（Element UI el-checkbox）。
 *
 * 单个复选框，仅支持禁用配置。
 */
export interface PCCheckboxAttribute {
  /** 是否禁用。 */
  disabled?: boolean;
}

/**
 * PC 端复选框组属性（Element UI el-checkbox-group）。
 */
export interface PCCheckBoxGroupAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否纵向排列。 */
  vertical?: boolean;

  /** 可被勾选的最小数量。 */
  min?: number;

  /** 是否启用最大勾选数量限制。 */
  enableMax?: boolean;

  /** 可被勾选的最大数量。 */
  max?: number;

  /** 选项配置，如 `{ label, value, disabled }` 映射。 */
  props?: Record<string, unknown>;
}

/**
 * PC 端日期选择器属性（Element UI el-date-picker）。
 */
export interface PCDateAttribute {
  /** 尺寸，如 `'medium'`、`'small'`、`'mini'`。 */
  size?: string;

  /** 值格式，如 `'yyyy-MM-dd'`、`'yyyy-MM-dd HH:mm:ss'`。 */
  valueFormat?: string;

  /**
   * 初始值类型。
   *
   * 值枚举：
   * - `'0'`：无
   * - `'1'`：当前日期
   * - `'2'`：当前日期时间
   * - `'3'`：自定义日期
   */
  initState?: '0' | '1' | '2' | '3';

  /** 初始值。 initState为3的时候可配置*/
  initValue?: string;

  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否可清空。 */
  clearable?: boolean;

  /** 是否精简模式。 */
  simplify?: boolean;

  /**
   * 选择器类型。
   *
   * 值枚举：
   * - `'year'`：年
   * - `'month'`：月
   * - `'date'`：日
   * - `'dates'`：多个日期
   * - `'months'`：多个月
   * - `'week'`：周
   * - `'datetime'`：日期时间
   * - `'datetimerange'`：日期时间范围
   * - `'daterange'`：日期范围
   * - `'monthrange'`：月份范围
   */
  type?: 'year' | 'month' | 'date' | 'dates' | 'months' | 'week' | 'datetime' | 'datetimerange' | 'daterange' | 'monthrange';

  /** 占位文本。 */
  placeholder?: string;
}

/**
 * PC 端日期选择器快捷输入属性（Element UI el-date-picker + 快捷输入）。
 *
 * 在 `PCDateAttribute` 基础上新增 `'input-control'` 字段，
 * 启用后用户可直接在输入框中键入日期文本，无需打开选择面板。
 */
export interface PCDatePickerQuickAttribute {
  /**
   * 是否启用快捷输入。
   *
   * 启用后日期选择器支持键盘直接输入日期文本，
   * 而非仅通过面板点选。
   */
  'input-control'?: boolean;

  /** 尺寸，如 `'medium'`、`'small'`、`'mini'`。 */
  size?: string;

  /** 值格式，如 `'yyyy-MM-dd'`、`'yyyy-MM-dd HH:mm:ss'`。 */
  valueFormat?: string;

  /**
   * 初始值类型。
   *
   * 值枚举：
   * - `'0'`：无
   * - `'1'`：当前日期
   * - `'2'`：当前日期时间
   * - `'3'`：自定义日期
   */
  initState?: '0' | '1' | '2' | '3';

  /** 初始值。 initState为3的时候可配置 */
  initValue?: string;

  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否可清空。 */
  clearable?: boolean;

  /** 是否精简模式。 */
  simplify?: boolean;

  /**
   * 选择器类型。
   *
   * 值枚举：
   * - `'year'`：年
   * - `'month'`：月
   * - `'date'`：日
   * - `'dates'`：多个日期
   * - `'months'`：多个月
   * - `'week'`：周
   * - `'datetime'`：日期时间
   * - `'datetimerange'`：日期时间范围
   * - `'daterange'`：日期范围
   * - `'monthrange'`：月份范围
   */
  type?: 'year' | 'month' | 'date' | 'dates' | 'months' | 'week' | 'datetime' | 'datetimerange' | 'daterange' | 'monthrange';

  /** 占位文本。 */
  placeholder?: string;
}

/**
 * PC 端时间选择器属性（Element UI el-time-picker）。
 */
export interface PCTimeAttribute {
  /** 尺寸，如 `'medium'`、`'small'`、`'mini'`。 */
  size?: string;

  /** 值格式。 */
  valueFormat?: string;

  /** 范围分隔符。 */
  rangeSeparator?: string;

  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否可清空。 */
  clearable?: boolean;

  /** 是否范围选择。 */
  isRange?: boolean;

  /** 是否精简模式。 */
  simplify?: boolean;

  /** 占位文本。 */
  placeholder?: string;
}

/**
 * PC 端上传控件属性（Element UI el-upload）。
 */
export interface PCUploadAttribute {
  /** 接受的文件类型，如 `'.jpg,.png'`、`'.pdf'`。 */
  accept?: string;

  /** 上传地址（必填）。 */
  action?: string;

  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否启用拖拽上传。 */
  drag?: boolean;

  /** 是否显示已上传文件列表。 */
  showFileList?: boolean;

  /** 最大允许上传个数，`0` 表示不限制。 */
  limit?: number;

  /**
   * 文件列表类型。
   *
   * 值枚举：
   * - `'text'`：文本列表
   * - `'picture'`：图片列表
   * - `'picture-card'`：照片墙
   */
  listType?: 'text' | 'picture' | 'picture-card';

  /** 是否自动上传（选取文件后立即上传）。 */
  autoUpload?: boolean;

  /** 是否支持多选文件。 */
  multiple?: boolean;

  /** 上传文件字段名，默认 `'file'`。 */
  name?: string;

  /** 是否支持发送 cookie 凭证信息。 */
  withCredentials?: boolean;

  /**
   * 上传前钩子脚本。
   *
   * 参数：`file`（上传文件对象）
   * 返回：`boolean`，返回 `false` 则阻止上传
   */
  beforeUpload?: string;

  /**
   * 删除前钩子脚本。
   *
   * 参数：`file`（待删除文件对象）
   * 返回：`boolean`，返回 `false` 则阻止删除
   */
  beforeRemove?: string;
}

/**
 * PC 端富文本控件属性。
 *
 * 富文本控件通过 `conf` 字段存储编辑器配置，
 * 配置内容为 JSON 对象，在设计器中通过 Monaco 编辑器编辑。
 */
export interface PCRichtextAttribute {
  /**
   * 富文本编辑器配置。
   *
   * JSON 对象，具体结构取决于富文本编辑器实现。
   * 在设计器中通过 Monaco 编辑器以 JSON 格式编辑。
   */
  conf?: Record<string, unknown>;
}

/**
 * PC 端控件属性联合类型。
 *
 * 根据 `WidgetConfig.type` 对应关系：
 * - `type = 'input'` → `PCInputAttribute`
 * - `type = 'button'` → `PCButtonAttribute`
 * - `type = 'select'` → `PCSelectAttribute`
 * - `type = 'radiogroup'` → `PCRadioGroupAttribute`
 * - `type = 'checkbox'` → `PCCheckboxAttribute`
 * - `type = 'checkboxgroup'` → `PCCheckBoxGroupAttribute`
 * - `type = 'datePicker'` → `PCDateAttribute`
 * - `type = 'datePickerQuick'` → `PCDatePickerQuickAttribute`
 * - `type = 'timePicker'` → `PCTimeAttribute`
 * - `type = 'upload'` → `PCUploadAttribute`
 * - `type = 'richtext'` → `PCRichtextAttribute`
 */
export type PCWidgetAttribute =
  | PCInputAttribute
  | PCButtonAttribute
  | PCSelectAttribute
  | PCRadioGroupAttribute
  | PCCheckboxAttribute
  | PCCheckBoxGroupAttribute
  | PCDateAttribute
  | PCDatePickerQuickAttribute
  | PCTimeAttribute
  | PCUploadAttribute
  | PCRichtextAttribute;

/**
 * 移动端输入框属性（Vant van-field）。
 *
 * 与 PC 端差异：
 * - 新增 `readonly`（只读模式，移动端输入框常配合弹窗选择器使用）
 * - 新增 `clearTrigger`（清空触发时机）
 * - 新增 `clickable`（是否可点击）
 * - 无 `simplify`（精简模式为 PC 端独有）
 */
export interface VantInputAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否只读。 */
  readonly?: boolean;

  /** 是否可清空。 */
  clearable?: boolean;

  /** 输入框类型，如 `'text'`、`'textarea'`。 */
  type?: string;

  /** 尺寸。 如： `'large'`、`''` */
  size?: string;

  /** 最大输入长度。 */
  maxlength?: number;

  /** 占位文本。 */
  placeholder?: string;
}

/**
 * 移动端按钮属性（Vant van-button）。
 *
 * 与 PC 端差异：
 * - 使用 `text` 替代 `slot` 作为按钮文本字段
 * - 新增 `color`（自定义颜色）
 * - 新增 `icon` / `iconPrefix` / `iconPosition`（图标配置）
 * - 新增 `block` / `square` / `round` / `hairline`（外观形状）
 * - 新增 `loading` / `loadingText` / `loadingType` / `loadingSize`（加载状态）
 * - 新增 `url` / `to`（路由跳转）
 * - 新增 `nativeType` / `tag`（原生属性）
 * - 保留 `buttonType` 功能类型
 * - 尺寸取值不同：`'large'` / `'normal'` / `'small'` / `'mini'`
 */
export interface VantButtonAttribute {
  /** 按钮文本。 */
  text?: string;

  /** 按钮样式类型，如 `'default'`、`'primary'`、`'warning'`、`'danger'`、`'info'`。 */
  type?: string;

  /** 尺寸，取值 `'large'`、`'normal'`、`'small'`、`'mini'`。 */
  size?: string;

  /** 是否朴素按钮。 */
  plain?: boolean;

  /**
   * 按钮功能类型（继承自 PC 端逻辑）。
   *
   * 值枚举：
   * - `'normal'`：普通按钮
   * - `'treebtn'`：树按钮
   * - `'submitbtn'`：提交按钮
   * - `'insertbtn'`：插入按钮
   * - `'deletebtn'`：删除按钮
   */
  buttonType?: 'normal' | 'treebtn' | 'submitbtn' | 'insertbtn' | 'deletebtn';
}

/**
 * 移动端选择器属性（Vant van-popup + van-radio-group / van-checkbox-group）。
 *
 * 与 PC 端差异：
 * - 使用 `fieldNames` 替代 `props` 作为选项字段映射
 * - 无 `size` / `simplify`（为 PC 端独有）
 * - 新增 `loading`（加载状态）
 * - 新增 `noMatchText`（无匹配文本）
 * - 新增 `remote` / `remoteMethod`（远程搜索）
 * - 选择器以弹窗形式展示，UI 差异大
 */
export interface VantSelectAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /** 占位文本。 */
  placeholder?: string;

  /** 是否可清空。 */
  clearable?: boolean;

  /** 是否可搜索。 */
  filterable?: boolean;

  /** 是否多选。 */
  multiple?: boolean;

  /**
   * 选项字段映射。
   * 默认值：`{ label: 'label', value: 'value', disabled: 'disabled' }`
   */
  props?: Record<string, unknown>;
}

/**
 * 移动端单选框组属性（Vant van-radio-group）。
 *
 * 与 PC 端差异：
 * - 使用 `direction` 替代 `vertical` 控制排列方向
 * - 新增 `iconSize` / `checkedColor` / `shape`（图标样式）
 * - 使用 `fieldNames` 替代 `props`
 */
export interface VantRadioGroupAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /**
   * 排列方向。
   *
   * 值枚举：
   * - `'vertical'`：纵向（默认）
   * - `'horizontal'`：横向
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * 选项字段映射。
   *
   * 默认值：`{ label: 'label', value: 'value', disabled: 'disabled' }`
   */
  props?: Record<string, unknown>;
}

/**
 * 移动端复选框组属性（Vant van-checkbox-group）。
 *
 * 与 PC 端差异：
 * - 使用 `direction` 替代 `vertical` 控制排列方向
 * - 新增 `iconSize` / `checkedColor` / `shape`（图标样式）
 * - 使用 `fieldNames` 替代 `props`
 */
export interface VantCheckboxGroupAttribute {
  /** 是否禁用。 */
  disabled?: boolean;

  /**
   * 排列方向。
   *
   * 值枚举：
   * - `'vertical'`：纵向（默认）
   * - `'horizontal'`：横向
   */
  direction?: 'vertical' | 'horizontal';

  /** 是否启用最大勾选数量限制。 */
  enableMax?: boolean;

  /** 可被勾选的最大数量，`0` 表示不限制。 */
  max?: number;

  /**
   * 选项字段映射。
   *
   * 默认值：`{ label: 'label', value: 'value', disabled: 'disabled' }`
   */
  props?: Record<string, unknown>;
}

/**
 * 移动端日期时间选择器属性（Vant van-datetime-picker）。
 *
 * 与 PC 端差异：
 * - 合并了日期和时间选择为同一组件
 * - 新增 `title` / `confirmButtonText` / `cancelButtonText`（弹窗标题和按钮）
 * - 新增 `showToolbar`（是否显示顶部操作栏）
 * - 新增 `loading` / `filter` / `formatter` / `columnsOrder`（列控制）
 * - 新增 `itemHeight` / `visibleItemCount` / `swipeDuration`（滚动控制）
 * - 新增 `minDate` / `maxDate` / `minHour` / `maxHour` / `minMinute` / `maxMinute`（范围限制）
 * - 无 `initState` / `initValue` / `simplify` / `size`（为 PC 端独有）
 * - 以弹窗形式展示
 */
export interface VantDateTimePickerAttribute {
  /** 选择器类型，如 `'datetime'`、`'date'`、`'time'`、`'year-month'`、`'month-day'`、`'datehour'`。 */
  type?: string;

  /** 值格式，如 `'yyyy-MM-dd'`、`'yyyy-MM-dd HH:mm:ss'`。 */
  valueFormat?: string;

  /** 是否禁用。 */
  disabled?: boolean;

  /** 是否可清空。 */
  clearable?: boolean;
  
  /** 占位文本。 */
  placeholder?: string;
  
}

/**
 * 移动端控件属性联合类型。
 *
 * 根据 `WidgetConfig.type` 对应关系：
 * - `type = 'vantInput'` → `VantInputAttribute`
 * - `type = 'vantButton'` → `VantButtonAttribute`
 * - `type = 'vantSelect'` → `VantSelectAttribute`
 * - `type = 'vantRadiogroup'` → `VantRadioGroupAttribute`
 * - `type = 'vantCheckboxgroup'` → `VantCheckboxGroupAttribute`
 * - `type = 'vantDateTimePicker'` → `VantDateTimePickerAttribute`
 */
export type VantWidgetAttribute =
  | VantInputAttribute
  | VantButtonAttribute
  | VantSelectAttribute
  | VantRadioGroupAttribute
  | VantCheckboxGroupAttribute
  | VantDateTimePickerAttribute;

/**
 * 控件逻辑配置。
 *
 * 包含控件的事件响应、联动、数据源、校验、提交、插删行等全部行为逻辑。
 */
export interface WidgetLogic {
  /**
   * 事件配置数组。
   *
   * 定义控件上绑定的事件及其处理脚本。
   */
  events?: WidgetLogicEvent[];

  /**
   * 联动配置。
   *
   * 定义控件与其他字段/变量之间的联动关系。
   */
  interaction?: WidgetInteraction;

  /**
   * 选项数据源配置。
   *
   * 用于选择器、单选框组、复选框组等需要选项列表的控件。
   */
  dataSource?: WidgetDataSource;

  /**
   * 校验配置。
   *
   * 定义控件的输入校验规则。
   */
  validate?: WidgetValidate;

  /**
   * 提交配置。
   *
   * 定义控件值提交到后端的方式。
   */
  submit?: WidgetSubmit;

  /**
   * 插删行配置。
   *
   * 用于动态行场景下控件的插入/删除行行为。
   */
  insertCell?: InsertCellConfig;
}

/**
 * 控件事件配置。
 *
 * 每个事件条目对应控件上的一个事件绑定，
 * 事件触发时执行 `handler` 脚本。
 *
 * 同一控件同一事件类型只能绑定一个事件，
 * 添加后该事件类型会从可选列表中移除。
 */
export interface WidgetLogicEvent {
  /**
   * 事件唯一标识。
   *
   * 由 `nanoid()` 生成，用于设计器中标识和选中事件条目。
   */
  id?: string;

  /**
   * 事件名称。
   *
   * 默认为事件类型的中文标签（如 `'点击'`、`'状态改变'`、`'输入'`），
   * 支持双击重命名。
   */
  name?: string;

  /**
   * 事件类型。
   *
   * 不同控件支持的事件类型不同：
   *
   * PC 端（Element UI）：
   * - `button`：`'click'`
   * - `select`：`'change'`、`'blur'`、`'clear'`、`'focus'`
   * - `checkbox`：`'change'`
   * - `radiogroup`：`'change'`
   * - `checkboxgroup`：`'change'`
   * - `datePicker`：`'change'`、`'blur'`、`'focus'`
   * - `datePickerQuick`：`'change'`、`'blur'`、`'focus'`
   * - `timePicker`：`'change'`、`'blur'`、`'focus'`
   * - `input`：`'input'`、`'focus'`、`'blur'`、`'dblclick.native'`、`'change'`、`'clear'`
   * - `upload`：`'on-change'`、`'on-error'`、`'on-exceed'`、`'on-progress'`、`'on-remove'`、`'on-success'`、`'on-preview'`
   *
   * 移动端（Vant）：
   * - `vantButton`：`'click'`、`'touchstart'`
   * - `vantInput`：`'input'`、`'focus'`、`'blur'`、`'clear'`
   * - `vantSelect`：`'change'`
   * - `vantRadiogroup`：`'change'`
   * - `vantCheckboxgroup`：`'change'`
   * - `vantDateTimePicker`：`'change'`、`'confirm'`、`'cancel'`
   */
  type?: WidgetEventType;

  /**
   * 事件处理脚本。
   *
   * 事件触发时执行的 JavaScript 脚本，在设计器中通过 Monaco 编辑器编辑。
   *
   * 可用变量：
   * - `$$reportForm`：报表表单数据对象
   * - `$$value`：当前控件的值
   * - `$$formItemInfo`：当前表单项信息
   * - `$$scope`：全局作用域变量
   * - `$$reportInfo`：报表信息对象
   *
   */
  handler?: string;
}

/**
 * 控件事件类型。
 *
 * 不同控件支持的事件类型不同，具体映射见 `WidgetLogicEvent.type` 注释。
 */
export type WidgetEventType =
  | 'click'
  | 'dblclick.native'
  | 'change'
  | 'input'
  | 'focus'
  | 'blur'
  | 'clear'
  | 'touchstart'
  | 'confirm'
  | 'cancel'
  | 'on-change'
  | 'on-error'
  | 'on-exceed'
  | 'on-progress'
  | 'on-remove'
  | 'on-success'
  | 'on-preview';

/**
 * 控件联动配置。
 *
 * 定义控件与其他字段/变量之间的响应关系，
 * 包括字段依赖、属性响应和自定义动作脚本。
 */
export interface WidgetInteraction {
  /**
   * 依赖字段配置数组。
   *
   * 当依赖字段的值变化时，可触发联动逻辑。
   */
  dependencies?: InteractionDependency[];

  /**
   * 属性响应配置数组。
   *
   * 定义联动触发后的属性变更动作，如显隐、禁用、字段值、可选项等。
   */
  actionConfig?: InteractionActionConfig[];
}

/**
 * 联动依赖字段。
 */
export interface InteractionDependency {
  /**
   * 来源字段名。
   */
  field?: string;

  /**
   * 变量名。
   *
   * 自动生成，生成规则：`'v_' + randomString(11, true)`
   *
   * 即固定前缀 `v_` + 11 位随机字符，总长度 13。
   * 随机字符取自字符集 `ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789`
   * （排除了易混淆字符 `I/L/O/U`、`g/l/o/q/u`）。
   *
   * 示例：`'v_3KmRbXwNpQa'`
   *
   * 该变量名用于联动脚本中引用依赖字段的值，通过 `$$deps` 访问。
   */
  variableName?: string;

  /**
   * 变量类型 ，目前是写死的any。
   */
  fieldProp?: string;
}

/**
 * 联动属性响应配置。
 */
export interface InteractionActionConfig {
  /**
   * 响应类型。
   *
   * 值枚举：
   * - `'visibility'`：显隐控制
   * - `'disabled'`：禁用控制
   * - `'value'`：字段值设置
   * - `'options'`：可选项设置（仅 `select`、`radiogroup`、`checkboxgroup` 可用）
   */
  actionType?: 'visibility' | 'disabled' | 'value' | 'options';

  /**
   * 响应脚本。
   *
   * 联动触发时执行的 JavaScript 脚本，在设计器中通过 Monaco 编辑器编辑。
   * 脚本需返回对应类型的值，由 `$self` 对象设置到控件属性上。
   *
   * 各 `actionType` 对应的脚本模板和返回值类型：
   *
   * - `actionType = 'visibility'`：
   *   ```
   *   $self.visibility = (//返回值类型为`boolean`)
   *   ```
   *   返回 `true` 显示控件，`false` 隐藏控件。
   *
   * - `actionType = 'disabled'`：
   *   ```
   *   $self.disabled = (//返回值类型为`boolean`)
   *   ```
   *   返回 `true` 禁用控件，`false` 启用控件。
   *
   * - `actionType = 'value'`：
   *   ```
   *   $self.value = (//返回值类型为`any`)
   *   ```
   *   返回任意类型的值设置到控件绑定的字段上。
   *
   * - `actionType = 'options'`：
   *   ```
   *   $self.options = (//返回值类型为`object`)
   *   ```
   *   返回 `Array<{ label?: string, value?: any }>` 类型的选项列表，
   *   仅 `select`、`radiogroup`、`checkboxgroup` 控件可用。
   *
   * 可用变量：
   * - `$$scope`：当前表单全局作用域
   * - `$$reportForm`：所有控件数据的集合
   * - `$$reportInstance`：报表实例（可使用实例获取指定表单元素实例）
   * - `$$deps`：联动依赖项列表
   */
  action?: string;
}

/**
 * 控件数据源配置。
 *
 * 为选择器、单选框组、复选框组等控件提供选项数据。
 */
export interface WidgetDataSource {
  /**
   * 数据源类型。
   *
   * 值枚举：
   * - `'1'`：静态数据
   * - `'3'`：字典数据
   * - `'6'`：全局作用域
   * - `'7'`：RPC
   * - `'8'`：数据库查询
   */
  type?: '1' | '3' | '6' | '7' | '8';

  /**
   * 数据值 / 数据生成器。
   *
   * 根据 `type` 不同，`dataMaker` 的结构不同：
   *
   * - `type = '1'`（静态数据）：`string`
   *   JSON 字符串，通过 Monaco 编辑器编辑，需符合合法 JSON 格式。
   *   格式为选项数组：
   *   ```json
   *   [{"label":"选项1","value":"1"},{"label":"选项2","value":"2"}]
   *   ```
   *
   * - `type = '3'`（字典数据）：`string[]`
   *   通过级联选择器（Cascader）选取字典项，值为多级路径数组。
   *   层级深度取决于后端字典树结构，通常为两级，也可能更多。
   *   每级值为字典节点的 `key`。
   *   示例：`["字典分类key", "字典项key"]` 或 `["分类key", "子分类key", "字典项key"]`
   *
   * - `type = '6'`（全局作用域）：`string`
   *   通过下拉选择器选取全局变量名，仅显示类型为 `ARRAY` 的作用域变量。
   *   值为作用域变量名。
   *   示例：`"myScopeVar"`
   *
   * - `type = '7'`（RPC）：`DataSourceRPCConfig`
   *   RPC 服务调用配置对象，结构如下：
   *   ```typescript
   *   {
   *     rpcService: string;       // RPC 服务名
   *     rpcMethod: string;        // RPC 方法名
   *     serviceInputsScript: string; // 入参脚本，返回数组，如 "return []"
   *   }
   *   ```
   *
   * - `type = '8'`（数据库查询）：`string`
   *   通过下拉选择器选取数据集名，值为数据集的 `parameterName`。
   *   示例：`"ds1"`
   */
  dataMaker?: string | string[] | DataSourceRPCConfig;
}

/**
 * RPC 数据源配置。
 *
 * 当 `WidgetDataSource.type = '7'` 时，`dataMaker` 使用此结构。
 */
export interface DataSourceRPCConfig {
  /** RPC 服务名。 */
  rpcService?: string;

  /** RPC 方法名。 */
  rpcMethod?: string;

  /**
   * 入参脚本。
   *
   * JavaScript 脚本，需返回数组作为 RPC 调用参数。
   * 默认值：`'return []'`
   */
  serviceInputsScript?: string;
}

/**
 * 控件校验配置。
 */
export interface WidgetValidate {
  /**
   * 错误提示位置。
   *
   * 值枚举：
   * - `'innerBottomLeft'`：内部左下
   * - `'innerBottomRight'`：内部右下
   * - `'outerBottomLeft'`：外部左下
   */
  errorPosition?: 'innerBottomLeft' | 'innerBottomRight' | 'outerBottomLeft';

  /**
   * 校验规则数组。
   */
  rules?: WidgetValidateRule[];
}

/**
 * 单条校验规则。
 */
export interface WidgetValidateRule {
  /**
   * 触发方式。
   *
   * 值枚举：
   * - `'change'`：值变化时触发
   * - `'blur'`：失去焦点时触发
   */
  trigger?: 'change' | 'blur';

  /**
   * 校验类型。
   *
   * 值枚举：
   * - `'common'`：常用校验
   * - `'reg'`：正则校验
   * - `'validator'`：自定义校验
   */
  type?: 'common' | 'reg' | 'validator';

  /**
   * 校验器脚本。
   *
   * 根据 `type` 不同，`validMaker` 的含义不同：
   *
   * - `type = 'common'`：内置常用校验的正则表达式字符串，可选值：
   *   - `'^1[3456789]\\d{9}$'`：手机号验证
   *   - `'^-?\\d*\\.?\\d+$'`：数字格式验证
   *   - `'^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'`：邮箱验证
   *   - `'^(https?|ftp):\\/\\/[^\\s/$.?#].[^\\s]*$'`：URL 验证
   *   - `'[\\u4E00-\\u9FA5]'`：中文验证
   *   - `'(^[1-9]\\d{5}(18|19|([23]\\d))\\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$)|(^[1-9]\\d{5}\\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\\d{3}$)'`：身份证验证
   *
   * - `type = 'reg'`：自定义正则表达式字符串
   *
   * - `type = 'validator'`：自定义校验函数脚本
   *   PC 端：`function validate($$rule, $$value, $$callback) {}`
   *   移动端：`function validate($$value, $$rule) {}`
   *   可用变量：
   *   - `$$rule`：验证规则对象
   *   - `$$value`：输入的值
   *   - `$$callback`：回调函数（仅 PC 端）
   */
  validMaker?: string;

  /**
   * 是否必填。
   */
  required?: boolean;

  /**
   * 校验失败时的错误消息。
   */
  errorMessage?: string;
}

/**
 * 控件提交配置。
 *
 * 定义控件值提交到后端的方式，支持 HTTP 和 RPC 两种通道。
 */
export interface WidgetSubmit {
  /**
   * 数据源类型。
   *
   * 值枚举：
   * - `0`：RPC
   * - `1`：HTTP
   */
  datasourceType?: 0 | 1;

  /**
   * HTTP 请求地址。
   *
   * 仅在 `datasourceType = 1`（HTTP）时使用。
   */
  requestUrl?: string;

  /**
   * HTTP 请求方法。
   *
   * 如 `'POST'`、`'GET'`。
   * 仅在 `datasourceType = 1`（HTTP）时使用。
   */
  requestMethod?: string;

  /**
   * HTTP 请求头设置脚本。
   *
   * 仅在 `datasourceType = 1`（HTTP）时使用。
   */
  requestHeaderScript?: string;

  /**
   * RPC 服务名。
   *
   * 仅在 `datasourceType = 0`（RPC）时使用。
   */
  rpcService?: string;

  /**
   * RPC 方法名。
   *
   * 仅在 `datasourceType = 0`（RPC）时使用。
   */
  rpcMethod?: string;

  /**
   * 入参处理器脚本。
   *
   * 提交前对入参进行加工/过滤的脚本。
   */
  inputsFilterScript?: string;
}

/**
 * 插删行配置。
 *
 * 用于动态行场景，定义控件关联的行范围和作用域字段。
 */
export interface InsertCellConfig {
  /**
   * 插入行起始索引。
   */
  rowstart?: number;

  /**
   * 插入行结束索引。
   */
  rowend?: number;

  /**
   * 插入/删除行关联的作用域字段。
   */
  scopeField?: string;
}

/**
 * 行高、列宽配置。
 */
export interface ResizedConfig {
  /**
   * 行高列表。
   * 示例：[24]
   */
  rows: number[];

  /**
   * 列宽列表。
   * 示例：[66, 66, 66]
   */
  cols: number[];
}

/**
 * 隐藏行列配置。
 */
export interface HiddenConfig {
  /**
   * 被隐藏的列索引列表。
   * 示例：[1]
   */
  cols: number[];

  /**
   * 被隐藏的行索引列表。
   * 示例：[1, 5]
   */
  rows: number[];
}

/**
 * 浮动元素。
 */
export interface FloatElement {
  /**
   * 是否允许拖拽、缩放等变换。
   */
  allowTransform: boolean;

  /**
   * 浮动组件类型。
   * 当前样例：
   * - floatElement：普通浮动元素
   * - floatChart：浮动图表
   */
  componentKey: "floatElement" | "floatChart" | string;

  /**
   * 浮动元素数据。
   */
  data: FloatElementData;

  /**
   * 浮动绘制类型编码，univer内使用（固定值：8）。
   */
  drawingType: number;

  /**
   * 绑定到 univer的sheet 位置的信息。
   */
  sheetTransform: SheetTransform;

  /**
   * 最终渲染坐标系中的几何信息。
   */
  transform: TransformRect;
}

/**
 * 浮动元素的数据主体。
 */
export interface FloatElementData {
  /**
   * 浮动元素类型。
   * 值枚举：
   * - custom
   * - image
   * - chart
   */
  type: "custom" | "image" | "chart" | string;

  /**
   * 浮动元素唯一 ID。
   */
  id: string;

  /**
   * 具体配置。
   * 会随 type 不同而变化。
   */
  conf: FloatElementConf;
}

/**
 * 浮动元素配置联合类型。
 */
export type FloatElementConf =
  | FloatCustomConf
  | FloatImageConf
  | FloatChartConf;

/**
 * custom 类型浮动元素配置。
 */
export interface FloatCustomConf {
  /**
   * 自定义浮动元素内容（返回 HTML 字符串的脚本）。
   * 示例：
   * return '<div style="color:red;">demo</div>';
   */
  domScript: string;

  /**
   * 自定义浮动内容标题。
   */
  floatCustomTitle: string;
}

/**
 * image 类型浮动元素配置。
 */
export interface FloatImageConf {
  /**
   * 图片适配方式。
   * 项目中已知：
   * - auto
   * - 100% 100%
   * - cover
   */
  mode: "auto" | "100% 100%" | "cover" | string;

  /**
   * 图片文件 ID。
   */
  fileId: string;
}

/**
 * chart 类型浮动元素配置。
 */
export interface FloatChartConf {
  /**
   * 图表类型配置。
   */
  chartTypeConf: ChartTypeConf;

  /**
   * 图表数据配置。
   */
  chartDataConf: ChartDataConf;

  /**
   * 图表样式配置。
   */
  chartStyleConf: ChartStyleConf;
}

/**
 * 图表大类与子类。
 */
export interface ChartTypeConf {
  /**
   * 图表大类。
   *
   * 值枚举：
   * - `'pie'`：饼图
   * - `'bar'`：柱状图
   * - `'strip'`：条形图
   * - `'line'`：折线图
   * - `'scatter'`：散点图
   * - `'area'`：面积图
   */
  type: 'pie' | 'bar' | 'strip' | 'line' | 'scatter' | 'area' | string;

  /**
   * 图表子类。
   *
   * 根据 type 不同，可选子类不同：
   * - `type = 'pie'`：`'base'`（基础饼图）、`'equalArcs'`（等弧度玫瑰图）、`'unequalArcs'`（不等弧度玫瑰图）
   * - `type = 'bar'`：`'base'`（基础柱状图）、`'stacked'`（堆积柱状图）、`'percent'`（百分比堆积柱状图）
   * - `type = 'strip'`：`'base'`（基础条形图）、`'stacked'`（堆积条形图）、`'percent'`（百分比堆积条形图）
   * - `type = 'line'`：`'base'`（基础折线图）、`'stacked'`（堆积折线图）
   * - `type = 'scatter'`：`'base'`（散点图）
   * - `type = 'area'`：`'base'`（基础面积图）、`'stacked'`（堆积面积图）、`'percent'`（百分比堆积面积图）
   */
  subType: 'base' | 'stacked' | 'percent' | 'equalArcs' | 'unequalArcs' | string;
}

/**
 * 图表数据配置。
 */
export interface ChartDataConf {
  /**
   * 单元格取数模式配置。
   */
  cellDataConf: CellDataConf;

  /**
   * 分类维度过滤配置。
   */
  classifyFilterConf: ChartFilterConf;
  
  /**
   * 数据来源类型。
   * 值枚举：
   * - datasetData：数据集
   * - rpcData：RPC
   * - tableCell：单元格
   */
  dataSourceType: string;

  /**
   * 数据集模式配置。
   */
  datasetDataConf: DatasetDataConf;

  /**
   * RPC 模式配置。
   */
  rpcDataConf: RpcDataConf;

  /**
   * 系列维度过滤配置。
   */
  seriesFilterConf: ChartFilterConf;
}

/**
 * datasetData 模式配置。
 */
export interface DatasetDataConf {
  /**
   * 分类字段列表。
   * 示例：["分类"]，默认['']
   */
  classifyFields: string[];

  /**
   * 绑定的数据集名称。
   * 当前样例：chart
   */
  dataset: string;

  /**
   * 系列名使用字段名的时候的系列字段配置对象数组。
   */
  fieldNameList: ChartFieldNameItem[];

  /**
   * 系列字段。
   * 示例：系列
   */
  seriesField: string;

  /**
   * 系列名使用方式。
   * 值枚举：
   * - fieldValue：字段值
   * - fieldName：字段名
   */
  seriesUseType: string;

  /**
   * 系列值字段。
   * 示例：值
   */
  seriesValueField: string;
  
  /**
   * 汇总方式。
   * 值枚举：
   * first / last / sum / max / min / avg / count
   */
  summaryMethod: string;

  /**
   * X 轴字段（散点图需要）。
   */
  xField: string;

  /**
   * Y 轴字段（散点图需要）。
   */
  yField: string;
}

/**
 * RPC 数据模式配置。
 */
export interface RpcDataConf {
  /**
   * 分类字段列表。
   */
  classifyFields: string[];

  /**
   * 系列名使用字段名的时候的系列字段配置对象数组。
   */
  fieldNameList: ChartFieldNameItem[];

  /**
   * RPC 结果过滤脚本。
   */
  outputsFilterScript: string;

  /**
   * RPC 方法名。
   */
  rpcMethod: string;

  /**
   * RPC 服务名。
   */
  rpcService: string;

  /**
   * 系列字段。
   */
  seriesField: string;

  /**
   * 系列名使用方式。
   * 值枚举：
   * - fieldValue：字段值
   * - fieldName：字段名
   */
  seriesUseType: string;
  
  /**
   * 系列值字段。
   */
  seriesValueField: string;

  /**
   * RPC 入参的脚本。
   */
  serviceInputsScript: string;
  
  /**
   * 汇总方式。
   * 值枚举：
   * first / last / sum / max / min / avg / count
   */
  summaryMethod?: string;

  /**
   * X 轴字段（散点图需要）。
   */
  xField: string;

  /**
   * Y 轴字段（散点图需要）。
   */
  yField: string;
}

/**
 * 单元格取数模式配置。
 */
export interface CellDataConf {
  /**
   * 分类名的公式。
   */
  classifyCell: string;

  /**
   * 分类字段列表，固定值：['']
   */
  classifyFields: string[];

  /**
   * 字段与单元格映射列表。
   */
  fieldCellList: ChartFieldCellItem[];

  /**
   * 字段名列表（固定值[]）。
   */
  fieldNameList: [];

  /**
   * 系列字段（固定值''）。
   */
  seriesField: string;

  /**
   * 系列名使用类型，固定值：fieldValue
   */
  seriesUseType: string;

  /**
   * 系列值字段（固定值''）。
   */
  seriesValueField: string;

  /**
   * 汇总方式（固定值'sum'）。
   */
  summaryMethod: string;

  /**
   * x-散点图（固定值''）。
   */
  xField: string;

  /**
   * y-散点图（固定值''）。
   */
  yField: string;
}

/**
 * 图表在 fieldName 模式下的系列字段配置。
 */
export interface ChartFieldNameItem {
  /**
   * 实际取值字段名。
   */
  fieldName?: string;

  /**
   * 系列显示名。
   */
  seriesName?: string;

  /**
   * 汇总方式。
   * 值枚举：
   * first / last / sum / max / min / avg / count
   */
  summaryMethod?: string;
}

/**
 * 单元格图表模式下的字段-单元格映射项。
 */
export interface ChartFieldCellItem {
  /**
   * 唯一ID。
   */
  id?: string;

  /**
   * 系列名称-表达式。
   */
  seriesName?: string;

  /**
   * 系列数值-表达式。
   */
  seriesNum?: string;

  /**
   * x 字段-表达式（仅散点图有）。
   */
  xField?: string;

  /**
   * y 字段-表达式（仅散点图有）。
   */
  yField?: string;
}

/**
 * 图表过滤配置。
 * classifyFilterConf 和 seriesFilterConf 使用同一结构。
 */
export interface ChartFilterConf {
  /**
   * 限制项数量。
   */
  limitNum: string;

  /**
   * 超出限制的数据是否合并为“其他”。
   */
  mergeOther: boolean;

  /**
   * 是否不显示空值。
   */
  noShowNullValue: boolean;

  /**
   * 值映射配置（形态）
   * - 数据形态
   * - 公式形态
   */
  shape: FilterShapeConf;
}

/**
 * 图表过滤中的值映射配置。
 */
export interface FilterShapeConf {
  /**
   * 形态类型。
   * 值枚举：
   * - none：无形态
   * - dataDic：数据字典
   * - formulaShape：公式
   */
  shapeType: string;

  /**
   * 数据字典映射配置。
   */
  dataDic: FilterDataDicConf;

  /**
   * 公式映射配置。
   */
  formulaShape: FormulaShapeConf;
}

/**
 * 数据字典映射配置。
 */
export interface FilterDataDicConf {
  /**
   * 数据字典来源类型。
   *
   * 值枚举：
   * - `'dataQuery'`
   * - `'custom'`
   */
  type: 'dataQuery' | 'custom' | string;

  /**
   * 数据查询方式的字典配置。
   */
  dataQuery: DataDicDataQueryConfig;

  /**
   * 自定义映射方式的配置。
   */
  custom: DataDicCustomConfig;
}

/**
 * 公式映射配置。
 */
export interface FormulaShapeConf {
  /**
   * 公式字符串。
   */
  formulaValue: string;
}

/**
 * 图表样式配置。
 */
export interface BaseChartStyleConf {
  /**
   * 背景配置。
   */
  backgroundConf: ChartBackgroundConf;

  /**
   * 标题配置。
   */
  titleConf: ChartTitleConf;

  /**
   * 图例配置。
   */
  legendConf: ChartLegendConf;
}

/**
 * 饼图 / 环形图 / 玫瑰图样式配置。
 *
 * 这一类图表没有坐标轴配置。
 */
export interface PieChartStyleConf extends BaseChartStyleConf {
  /**
   * 饼图 tooltip 配置。
   */
  tooltipConf: PieChartTooltipConf;

  /**
   * 饼图标签配置。
   */
  labelConf: PieChartLabelConf;

  /**
   * 饼图系列配置。
   */
  seriesConf: PieChartSeriesConf;
}

/**
 * 柱状图样式配置。
 *
 * 轴组合通常是：
 * - `xAxis(category)`
 * - `yAxis(value)`
 */
export interface BarChartStyleConf extends BaseChartStyleConf {
  /**
   * 柱状图 tooltip 配置。
   */
  tooltipConf: BarChartTooltipConf;

  /**
   * 坐标轴配置数组。
   */
  axisConf: BarChartAxisConf;

  /**
   * 柱状图标签配置。
   */
  labelConf: BarChartLabelConf;

  /**
   * 柱状图系列配置。
   */
  seriesConf: BarChartSeriesConf;
}

/**
 * 条形图（横向柱图）样式配置。
 *
 * 轴组合通常是：
 * - `xAxis(value)`
 * - `yAxis(category)`
 */
export interface StripChartStyleConf extends BaseChartStyleConf {
  /**
   * 条形图 tooltip 配置。
   */
  tooltipConf: StripChartTooltipConf;

  /**
   * 坐标轴配置数组。
   */
  axisConf: StripChartAxisConf;

  /**
   * 条形图标签配置。
   */
  labelConf: StripChartLabelConf;

  /**
   * 条形图系列配置。
   */
  seriesConf: StripChartSeriesConf;
}

/**
 * 折线图样式配置。
 *
 * 轴组合通常是：
 * - `xAxis(category)`
 * - `yAxis(value)`
 */
export interface LineChartStyleConf extends BaseChartStyleConf {
  /**
   * 折线图 tooltip 配置。
   */
  tooltipConf: LineChartTooltipConf;

  /**
   * 坐标轴配置数组。
   */
  axisConf: LineChartAxisConf;

  /**
   * 折线图标签配置。
   */
  labelConf: LineChartLabelConf;

  /**
   * 折线图系列配置。
   */
  seriesConf: LineChartSeriesConf;
}

/**
 * 面积图样式配置。
 *
 * 轴组合通常是：
 * - `xAxis(category)`
 * - `yAxis(value)`
 */
export interface AreaChartStyleConf extends BaseChartStyleConf {
  /**
   * 面积图 tooltip 配置。
   */
  tooltipConf: AreaChartTooltipConf;

  /**
   * 坐标轴配置数组。
   */
  axisConf: AreaChartAxisConf;

  /**
   * 面积图标签配置。
   */
  labelConf: AreaChartLabelConf;

  /**
   * 面积图系列配置。
   */
  seriesConf: AreaChartSeriesConf;
}

/**
 * 散点图样式配置。
 *
 * 轴组合通常是：
 * - `xAxis(value)`
 * - `yAxis(value)`
 */
export interface ScatterChartStyleConf extends BaseChartStyleConf {
  /**
   * 散点图 tooltip 配置。
   */
  tooltipConf: ScatterChartTooltipConf;

  /**
   * 坐标轴配置数组。
   */
  axisConf: ScatterChartAxisConf;

  /**
   * 散点图标签配置。
   */
  labelConf: ScatterChartLabelConf;

  /**
   * 散点图系列配置。
   */
  seriesConf: ScatterChartSeriesConf;
}

/**
 * 图表样式配置。
 *
 * 当前项目按图表类型拆成不同结构：
 * - `PieChartStyleConf`
 * - `BarChartStyleConf`
 * - `StripChartStyleConf`
 * - `LineChartStyleConf`
 * - `AreaChartStyleConf`
 * - `ScatterChartStyleConf`
 */
export type ChartStyleConf =
  | PieChartStyleConf
  | BarChartStyleConf
  | StripChartStyleConf
  | LineChartStyleConf
  | AreaChartStyleConf
  | ScatterChartStyleConf;

/**
 * 通用文字样式。
 */
export interface SimpleTextStyle {
  /**
   * 字体。
   */
  fontFamily: string;

  /**
   * 字号。
   */
  fontSize: string;

  /**
   * 字体颜色。
   */
  color: string;

  /**
   * 是否斜体。
   */
  italic: boolean;

  /**
   * 是否加粗。
   */
  bold: boolean;
}

/**
 * 标题配置。
 */
export interface ChartTitleConf {
  /**
   * 是否显示标题。
   */
  show: boolean;

  /**
   * 标题文本。
   */
  text: string;

  /**
   * 标题水平位置。
   * 值枚举：
   * - `'left'`：左
   * - `'center'`：中
   * - `'right'`：右
   */
  left: string;

  /**
   * 标题文本样式类型
   * 值枚举：
   * - `'1'`：跟随主题
   * - `'2'`：自定义
   */
  textType: string;

  /**
   * 标题文字样式（textType=2 时生效）。
   */
  textStyle: SimpleTextStyle;
}

/**
 * 图例配置。
 */
export interface ChartLegendConf {
  /**
   * 是否显示图例。
   */
  show: boolean;

  /**
   * 图例位置。
   * 值枚举：
   * - `'top'`：上方
   * - `'bottom'`：下方
   * - `'left'`：左
   * - `'right'`：右
   * - `'rightTop'`：右上
   */
  left: string;

  /**
   * 图例样式类型。
   * 值枚举：
   * - `'1'`：跟随主题
   * - `'2'`：自定义
   */
  character: string;

  /**
   * 图例文本样式（character=2 时生效）。
   */
  textStyle: SimpleTextStyle;

  /**
   * 图例排列方向（页面没开放配置）。
   * 固定值：vertical
   */
  orient: string;

  /**
   * 是否开启固定显示（是否允许点击图例进行筛选）。
   */
  selectedMode: boolean;
}

/**
 * 标签文本中的格式化配置（暂时无用，formatType/ formatter都是空字符）。
 */
export interface LabelFormatConf {
  /**
   * 格式化类型。
   */
  formatType: string;

  /**
   * 格式化器字符串。
   */
  formatter: string;
}

/**
 * 通用图表标签 key。
 *
 * 适用于：
 * - `pie`
 * - `bar`
 * - `strip`
 * - `line`
 * - `area`
 *
 * 值枚举：
 * - `seriesName`：系列名
 * - `cateName`：分类名
 * - `value`：数值
 * - `percentage`：百分比
 */
export type CommonChartLabelTextKey =
  | 'seriesName'
  | 'cateName'
  | 'value'
  | 'percentage';

/**
 * 散点图标签 key。
 *
 * 在通用图表标签基础上，增加：
 * - `xValue`：x 轴值
 * - `yValue`：y 轴值
 */
export type ScatterChartLabelTextKey =
  | CommonChartLabelTextKey
  | 'xValue'
  | 'yValue';

/**
 * 饼图分类标签 key。
 *
 * 适用于 `pie.cateLabelText`。
 *
 * 值枚举：
 * - `cateName`：分类名
 * - `summaryValue`：该分类汇总值
 */
export type PieCategoryLabelTextKey =
  | 'cateName'
  | 'summaryValue';

/**
 * 图表标签 key 总集合。
 */
export type ChartLabelTextKey =
  | CommonChartLabelTextKey
  | ScatterChartLabelTextKey
  | PieCategoryLabelTextKey;

/**
 * 标签文本项。
 */
export interface LabelTextItem<TKey extends ChartLabelTextKey = ChartLabelTextKey> {
  /**
   * 引用的数据键。
   *
   * 常见按图表类型区分：
   * - `pie.valueLabelText`
   *   - `seriesName` / `cateName` / `value` / `percentage`
   * - `pie.cateLabelText`
   *   - `cateName` / `summaryValue`
   * - `bar` / `strip` / `line` / `area`
   *   - `seriesName` / `cateName` / `value` / `percentage`
   * - `scatter`
   *   - `seriesName` / `cateName` / `value` / `percentage` / `xValue` / `yValue`
   */
  key: TKey;

  /**
   * 文本格式化配置。
   */
  formatConf: LabelFormatConf;
}

/**
 * 图表文本字体枚举。
 */
export type ChartFontFamily =
  | 'Arial'
  | 'Times New Roman'
  | 'Tahoma'
  | 'Verdana'
  | 'Microsoft YaHei'
  | 'SimSun'
  | 'SimHei'
  | 'KaiTi'
  | 'FangSong'
  | 'NSimSun'
  | 'STXinwei'
  | 'STXingkai'
  | 'STLiti';

/**
 * 图表标签字体样式。
 */
export interface ChartTextStyle {
  /**
   * 字体名。
   *
   * 值枚举：
   * - `Arial`
   * - `Times New Roman`
   * - `Tahoma`
   * - `Verdana`
   * - `Microsoft YaHei`
   * - `SimSun`
   * - `SimHei`
   * - `KaiTi`
   * - `FangSong`
   * - `NSimSun`
   * - `STXinwei`
   * - `STXingkai`
   * - `STLiti`
   *
   * 当前样例常见：`SimSun`
   */
  fontFamily?: ChartFontFamily;

  /**
   * 字号。
   */
  fontSize?: string | number;

  /**
   * 字体颜色。
   */
  color?: string;

  /**
   * 是否斜体。
   */
  italic?: boolean;

  /**
   * 是否加粗。
   */
  bold?: boolean;
}

/**
 * 标签字体跟随主题或自定义的配置。
 */
export interface LabelCharacterConf {
  /**
   * 字体样式来源。
   * 值枚举：
   * - `'followTheme'`：跟随主题
   * - `'custom'`：自定义
   */
  type: string;

  /**
   * 自定义文本样式。
   */
  textStyle: ChartTextStyle;
}

/**
 * 标签内容配置。
 */
export interface LabelValueTextConf<TKey extends ChartLabelTextKey = ChartLabelTextKey> {
  /**
   * 标签文本列表。
   */
  textList: LabelTextItem<TKey>[];

  /**
   * 标签字符样式配置。
   */
  characterConf: LabelCharacterConf;
}

/**
 * 通用值标签配置。
 */
export interface ChartValueLabelText<TKey extends ChartLabelTextKey = ChartLabelTextKey> {
  /**
   * 标签文本组装模式。
   * 固定值：common
   */
  type: string;

  /**
   * 标签文本详细配置。
   */
  conf: LabelValueTextConf<TKey>;
}

/**
 * 图表标签基础配置。
 */
export interface BaseChartLabelConf<TKey extends ChartLabelTextKey = ChartLabelTextKey> {
  /**
   * 是否显示标签。
   */
  show: boolean;

  /**
   * 标签文本内容配置。
   */
  valueLabelText: ChartValueLabelText<TKey>;
}

/**
 * 饼图 / 环形图 / 玫瑰图标签配置。
 */
export interface PieChartLabelConf extends BaseChartLabelConf<CommonChartLabelTextKey> {
  /**
   * 数值标签位置。
   * 值枚举：
   * - `'inside'`：饼图内
   * - `'outside'`：饼图外
   */
  position: string;

  /**
   * 标签牵引线是否显示。
   */
  showLabelLine: boolean;

  /**
   * 分类标签文本配置。
   * 常用于多饼图 / 分组饼图的额外分类标题。
   */
  cateLabelText: ChartValueLabelText<PieCategoryLabelTextKey>;

  /**
   * 分类标签位置。
   * 值枚举：
   * - `'top'`：上方
   * - `'bottom'`：下方
   * - `'middle'`：居中
   */
  cateLabelPosition: string;
}

/**
 * 柱状图标签配置。
 */
export interface BarChartLabelConf extends BaseChartLabelConf<CommonChartLabelTextKey> {
  /**
   * 标签位置。
   * 值枚举：
   * - `'auto'`：自动
   * - `'insideTop'`：内侧
   * - `'top'`：外侧
   * - `'inside'`：居中
   */
  labelPosition: string;

  /**
   * 文本方向。
   * 值枚举：
   * - `'landscape'`：横向
   * - `'vertical'`：纵向
   */
  textDirection: string;

  /**
   * 标签重叠时是否隐藏。
   */
  hideOverlap: boolean;
}

/**
 * 条形图（横向柱图）标签配置。
 */
export interface StripChartLabelConf extends BaseChartLabelConf<CommonChartLabelTextKey> {
  /**
   * 标签位置。
   * 值枚举：
   * - `'auto'`：自动
   * - `'insideRight'`：内侧
   * - `'right'`：外侧
   * - `'inside'`：居中
   */
  labelPosition: string;

  /**
   * 标签重叠调整是否开启。
   */
  overlapAdjust: boolean;

  /**
   * 标签重叠时是否隐藏。
   */
  hideOverlap: boolean;
}

/**
 * 折线图标签配置。
 */
export interface LineChartLabelConf extends BaseChartLabelConf<CommonChartLabelTextKey> {
  /**
   * 标签位置。
   * 值枚举：
   * - `'top'`：上方
   * - `'bottom'`：下方
   */
  labelPosition: string;
}

/**
 * 面积图标签配置。
 * 结构与折线图一致。
 */
export interface AreaChartLabelConf extends BaseChartLabelConf<CommonChartLabelTextKey> {
  /**
   * 标签位置。
   * 值枚举：
   * - `'top'`：上方
   * - `'bottom'`：下方
   */
  labelPosition: string;
}

/**
 * 散点图标签配置。
 */
export interface ScatterChartLabelConf extends BaseChartLabelConf<ScatterChartLabelTextKey> {}

/**
 * 数据标签配置。
 *
 * 当前项目按图表类型拆成不同标签结构：
 * - `PieChartLabelConf`
 * - `BarChartLabelConf`
 * - `StripChartLabelConf`
 * - `LineChartLabelConf`
 * - `AreaChartLabelConf`
 * - `ScatterChartLabelConf`
 */
export type ChartLabelConf =
  | PieChartLabelConf
  | BarChartLabelConf
  | StripChartLabelConf
  | LineChartLabelConf
  | AreaChartLabelConf
  | ScatterChartLabelConf;

/**
 * 图表系列基础配置。
 */
export interface BaseChartSeriesConf {
  /**
   * 系列主题名。
   * 值枚举：
   * - `'kangningBlue'`：康宁蓝
   * - `'clearBlue'`：清朗蓝
   * - `'healthyGreen'`：健康绿
   * - `'warmOrangeGreen'`：暖橙绿
   * - `'woodyBrown'`：木本棕
   */
  theme: string;
}

/**
 * 饼图 / 环形图 / 玫瑰图系列配置。
 */
export interface PieChartSeriesConf extends BaseChartSeriesConf {
  /**
   * 起始角度。
   */
  startAngle: number;

  /**
   * 结束角度。
   */
  endAngle: number;

  /**
   * 内径占比。
   */
  innerDiameter: number;

  /**
   * 半径设置方式。
   * 值枚举：
   * - `'auto'`：自动
   * - `'fixed'`：固定
   */
  radiusType: string;

  /**
   * 固定半径值。
   * `radiusType = 'fixed'` 时有效。
   */
  radius: number;
}

/**
 * 柱状图系列配置。
 */
export interface BarChartSeriesConf extends BaseChartSeriesConf {
  /**
   * 是否固定柱宽。
   * 值枚举：
   * - `'true'`：是
   * - `'false'`：否
   */
  widthSet: string;

  /**
   * 固定柱宽。
   */
  barWidth: number;

  /**
   * 系列间距。
   */
  barGap: number;

  /**
   * 类目间距。
   */
  barCategoryGap: number;
}

/**
 * 条形图（横向柱图）系列配置。
 * 结构与柱状图一致。
 */
export interface StripChartSeriesConf extends BaseChartSeriesConf {
  /**
   * 是否固定柱宽。
   * 值枚举：
   * - `'true'`：是
   * - `'false'`：否
   */
  widthSet: string;

  /**
   * 固定柱宽。
   */
  barWidth: number;

  /**
   * 系列间距。
   */
  barGap: number;

  /**
   * 类目间距。
   */
  barCategoryGap: number;
}

/**
 * 折线图系列配置。
 */
export interface LineChartSeriesConf extends BaseChartSeriesConf {
  /**
   * 线型。
   * 值枚举：
   * - `'thin'`：细
   * - `'dashed'`：虚线
   */
  lineType: string;

  /**
   * 线宽。
   */
  lineWidth: number;

  /**
   * 线条形态。
   * 值枚举：
   * - `'ordinary'`：普通
   * - `'vertical'`：垂直
   * - `'curve'`：曲线
   */
  lineShape: string;

  /**
   * 空值是否断开。
   */
  nullValueBreak: boolean;

  /**
   * 标记点填充颜色来源。
   * 值枚举：
   * - `'seriesColor'`：系列颜色
   * - `'color'`：自定义
   */
  symbolColorType: string;

  /**
   * 自定义标记点颜色。
   */
  symbolColor: string;

  /**
   * 标记点形状（固定值：circle，页面没开放配置）。
   * 值枚举：
   * - `'circle'`：圆
   */
  symbol: string;

  /**
   * 标记点半径大小。
   */
  symbolSize: number;
}

/**
 * 面积图系列配置。
 * 在折线图配置基础上，增加面积填充相关字段。
 */
export interface AreaChartSeriesConf extends LineChartSeriesConf {
  /**
   * 面积填充颜色来源。
   * 值枚举：
   * - `'seriesColor'`：系列颜色
   * - `'color'`：自定义
   */
  areaFillColorType: string;

  /**
   * 面积填充透明度。
   */
  areaFillColorOpacity: string;

  /**
   * 自定义面积填充颜色。
   */
  areaFillColor: string;
}

/**
 * 散点图系列配置。
 */
export interface ScatterChartSeriesConf extends BaseChartSeriesConf {
  /**
   * 连线类型（固定值：0，页面没开放配置）。
   */
  lineType: number;

  /**
   * 连线宽度（固定值：2，页面没开放配置）。
   */
  lineWidth: number;

  /**
   * 连线颜色（固定值：‘’，页面没开放配置）。
   */
  lineColor: string;

  /**
   * 散点颜色来源。
   * 值枚举：
   * - `'seriesColor'`：系列颜色
   * - `'color'`：自定义
   */
  symbolColorType: string;

  /**
   * 自定义散点颜色。
   */
  symbolColor: string;

  /**
   * 散点形状（固定值：‘auto’，页面没开放配置）。
   */
  symbol: string;

  /**
   * 散点半径大小。
   */
  symbolSize: number;
}

/**
 * 系列样式配置。
 *
 * 当前项目按图表类型拆成不同系列结构：
 * - `PieChartSeriesConf`
 * - `BarChartSeriesConf`
 * - `StripChartSeriesConf`
 * - `LineChartSeriesConf`
 * - `AreaChartSeriesConf`
 * - `ScatterChartSeriesConf`
 */
export type ChartSeriesConf =
  | PieChartSeriesConf
  | BarChartSeriesConf
  | StripChartSeriesConf
  | LineChartSeriesConf
  | AreaChartSeriesConf
  | ScatterChartSeriesConf;

/**
 * 背景样式配置。
 */
export interface ChartBackgroundConf {
  /**
   * 背景填充模式编码。
   *
   * 值枚举：
   * - `'1'`：跟随主题
   * - `'2'`：自定义颜色（此时 `fillColor` 字段生效）
   */
  background: '1' | '2' | string;

  /**
   * 边框颜色。
   */
  color: string;

  /**
   * 背景填充色。
   */
  fillColor: string;

  /**
   * 边框样式。
   */
  line: number;

  /**
   * 背景透明度。
   * 当前样例：100
   */
  opacity: number;

  /**
   * 边框圆角半径。
   */
  radius: number;

  /**
   * 是否显示阴影。
   */
  shadow: boolean;
}

/**
 * 图表 tooltip 通用配置。
 */
export interface BaseChartTooltipConf<TKey extends ChartLabelTextKey = ChartLabelTextKey> {
  /**
   * 是否显示 tooltip。
   */
  show: boolean;

  /**
   * tooltip 文本配置。
   */
  valueLabelText: ChartValueLabelText<TKey>;

  /**
   * tooltip 定位方式。
   * 值枚举：
   * - `'followMouse'`：跟随鼠标
   * - `'noFollowMouse'`：不跟随鼠标
   */
  position: string;
}

/**
 * 饼图 tooltip 配置。
 *
 * 单项提示，不支持 showAllSeries。
 */
export interface PieChartTooltipConf extends BaseChartTooltipConf<CommonChartLabelTextKey> {}

/**
 * 柱状图 tooltip 配置。
 *
 * 支持同类目聚合展示多个系列。
 */
export interface BarChartTooltipConf extends BaseChartTooltipConf<CommonChartLabelTextKey> {
  /**
   * 是否显示当前类目下的所有系列。
   */
  showAllSeries: boolean;
}

/**
 * 条形图 tooltip 配置。
 *
 * 支持同类目聚合展示多个系列。
 */
export interface StripChartTooltipConf extends BaseChartTooltipConf<CommonChartLabelTextKey> {
  /**
   * 是否显示当前类目下的所有系列。
   */
  showAllSeries: boolean;
}

/**
 * 折线图 tooltip 配置。
 *
 * 支持同类目聚合展示多个系列。
 */
export interface LineChartTooltipConf extends BaseChartTooltipConf<CommonChartLabelTextKey> {
  /**
   * 是否显示当前类目下的所有系列。
   */
  showAllSeries: boolean;
}

/**
 * 面积图 tooltip 配置。
 *
 * 支持同类目聚合展示多个系列。
 */
export interface AreaChartTooltipConf extends BaseChartTooltipConf<CommonChartLabelTextKey> {
  /**
   * 是否显示当前类目下的所有系列。
   */
  showAllSeries: boolean;
}

/**
 * 散点图 tooltip 配置。
 *
 * 支持 xValue / yValue 等散点图专属字段，不支持 showAllSeries。
 */
export interface ScatterChartTooltipConf extends BaseChartTooltipConf<ScatterChartLabelTextKey> {}

/**
 * 图表 tooltip 配置。
 *
 * 会根据图表类型映射到不同结构：
 * - `PieChartTooltipConf`
 * - `BarChartTooltipConf`
 * - `StripChartTooltipConf`
 * - `LineChartTooltipConf`
 * - `AreaChartTooltipConf`
 * - `ScatterChartTooltipConf`
 */
export type ChartTooltipConf =
  | PieChartTooltipConf
  | BarChartTooltipConf
  | StripChartTooltipConf
  | LineChartTooltipConf
  | AreaChartTooltipConf
  | ScatterChartTooltipConf;

/**
 * 轴值类型。
 */
export type ChartAxisValueType = 'category' | 'value';

/**
 * 轴方向类型。
 */
export type ChartAxisDirection = 'xAxis' | 'yAxis';

/**
 * 轴名称位置。
 */
export type ChartAxisNameLocation = 'center' | 'start' | 'end';

/**
 * 文字样式来源类型。
 */
export type ChartAxisTextStyleType = 'followTheme' | 'custom';

/**
 * 轴线颜色来源类型。
 */
export type ChartAxisLineColorType = 'followTheme' | 'custom';

/**
 * 刻度标签格式模式。
 */
export type ChartAxisLabelFormatType = 'normal' | 'special';

/**
 * 通用刻度标签格式化策略。
 */
export type ChartAxisLabelFormatter = 'general' | 'number' | 'percent' | 'date';

/**
 * 刻度标签位置。
 */
export type ChartAxisLabelPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * 轴线类型。
 */
export type ChartAxisLineType = 0 | 'solid' | 'dashed' | 'dotted';

/**
 * 类目轴标签显示策略。
 */
export type CategoryAxisLabelShowType =
  | 'intervalDisplay'
  | 'thumbnailDisplay'
  | 'breakDisplay';

/**
 * 坐标轴项通用结构。
 */
export interface BaseChartAxisItem<
  TType extends ChartAxisValueType = ChartAxisValueType,
  TAxisType extends ChartAxisDirection = ChartAxisDirection,
  TConf extends ChartAxisConf = ChartAxisConf
> {
  /**
   * 轴名称。
   * 示例：x轴 / y轴
   */
  name: string;

  /**
   * 轴值类型。
   * 值枚举：
   * - category：类目轴
   * - value：数值轴
   */
  type: TType;

  /**
   * 轴方向类型。
   * 值枚举：
   * - xAxis：x 轴
   * - yAxis：y 轴
   */
  axisType: TAxisType;

  /**
   * 轴详细配置。
   */
  conf: TConf;
}

/**
 * x 轴类目轴项。
 */
export type CategoryXAxisItem = BaseChartAxisItem<'category', 'xAxis', CategoryAxisConf>;

/**
 * x 轴数值轴项。
 */
export type ValueXAxisItem = BaseChartAxisItem<'value', 'xAxis', ValueAxisConf>;

/**
 * y 轴类目轴项。
 */
export type CategoryYAxisItem = BaseChartAxisItem<'category', 'yAxis', CategoryAxisConf>;

/**
 * y 轴数值轴项。
 */
export type ValueYAxisItem = BaseChartAxisItem<'value', 'yAxis', ValueAxisConf>;

/**
 * 坐标轴项。
 */
export type ChartAxisItem =
  | CategoryXAxisItem
  | ValueXAxisItem
  | CategoryYAxisItem
  | ValueYAxisItem;

/**
 * 柱状图轴配置。
 */
export type BarChartAxisConf = [CategoryXAxisItem, ValueYAxisItem];

/**
 * 条形图轴配置。
 */
export type StripChartAxisConf = [ValueXAxisItem, CategoryYAxisItem];

/**
 * 折线图轴配置。
 */
export type LineChartAxisConf = [CategoryXAxisItem, ValueYAxisItem];

/**
 * 面积图轴配置。
 */
export type AreaChartAxisConf = [CategoryXAxisItem, ValueYAxisItem];

/**
 * 散点图轴配置。
 */
export type ScatterChartAxisConf = [ValueXAxisItem, ValueYAxisItem];

/**
 * 坐标轴详细配置。
 *
 * 字段组合由外层 `ChartAxisItem.type`（category / value）和 `ChartAxisItem.axisType`（xAxis / yAxis）共同决定：
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 通用字段（所有组合都有）                                            │
 * │ showName, name, nameLocation, nameTextStyleType, nameTextStyle,   │
 * │ showAxisLabel, axisLabelTextStyleType, axisLabelTextStyle,        │
 * │ axisLabelRotate, axisLineColorType, axisLineColor,                │
 * │ showMinorTick, inverse, axisLabelFormatType, axisLabelFormatter,  │
 * │ formatterLabel, monacoFormatter, axisLabel, axisTick, minorTick,  │
 * │ axisLabelPosition, showAxisTick, axisLineType                     │
 * ├─────────────────────────┬───────────────────────────────────────────┤
 * │ type = 'category' 独有  │ axisLabelShowType, width                  │
 * ├─────────────────────────┼───────────────────────────────────────────┤
 * │ type = 'value' 独有     │ minCustom, min, maxCustom, max,          │
 * │                         │ mainTickUnitCustom, mainTickUnit,         │
 * │                         │ minorTickUnitCustom, minorTickUnit        │
 * └─────────────────────────┴───────────────────────────────────────────┘
 *
 * axisType 影响的默认值：
 * - axisType = 'xAxis'：axisLabelPosition='bottom'，showAxisTick=true，axisLineType='solid'
 * - axisType = 'yAxis'：axisLabelPosition='left'，showAxisTick=false，axisLineType=0
 * （条形图 strip 例外：xAxis 的 showAxisTick=false / axisLineType=0，yAxis 的 showAxisTick=true / axisLineType='solid'）
 *
 * 各图表类型的轴组合：
 * - bar / line / area：xAxis(category) + yAxis(value)
 * - strip：xAxis(value) + yAxis(category)
 * - scatter：xAxis(value) + yAxis(value)
 * - pie：无坐标轴（axisConf 为空数组）
 *
 * 生成示例（柱状图 bar）：
 * ```json
 * "axisConf": [
 *   { "name": "x轴", "type": "category", "axisType": "xAxis", "conf": { "type": "category", ...通用字段, "axisLabelPosition": "bottom", "showAxisTick": true, "axisLineType": "solid", "axisLabelShowType": "intervalDisplay", "width": 100 } },
 *   { "name": "y轴", "type": "value",    "axisType": "yAxis", "conf": { "type": "value",    ...通用字段, "axisLabelPosition": "left",   "showAxisTick": false, "axisLineType": 0, "minCustom": false, "min": "", "maxCustom": false, "max": "", "mainTickUnitCustom": false, "mainTickUnit": "", "minorTickUnitCustom": false, "minorTickUnit": "" } }
 * ]
 * ```
 */
export interface BaseChartAxisConf {
  /**
   * 轴类型（与外层 `ChartAxisItem.type` 一致）。
   *
   * 值枚举：
   * - `'category'`：类目轴，独有字段 `axisLabelShowType`、`width`
   * - `'value'`：数值轴，独有字段 `minCustom`、`min`、`maxCustom`、`max`、`mainTickUnitCustom`、`mainTickUnit`、`minorTickUnitCustom`、`minorTickUnit`
   */
  type: ChartAxisValueType;

  /**
   * 是否显示轴名称。
   */
  showName: boolean;

  /**
   * 轴名称。
   */
  name: string;

  /**
   * 轴名称位置。
   *
   * 值枚举：
   * - `'center'`：居中
   * - `'start'`：起始
   * - `'end'`：末尾
   */
  nameLocation: ChartAxisNameLocation;

  /**
   * 轴名称样式来源。
   *
   * 值枚举：
   * - `'followTheme'`：跟随主题
   * - `'custom'`：自定义
   */
  nameTextStyleType: ChartAxisTextStyleType;

  /**
   * 轴名称样式。
   */
  nameTextStyle: SimpleTextStyle;

  /**
   * 是否显示刻度标签。
   */
  showAxisLabel: boolean;

  /**
   * 刻度标签样式来源。
   *
   * 值枚举：
   * - `'followTheme'`：跟随主题
   * - `'custom'`：自定义
   */
  axisLabelTextStyleType: ChartAxisTextStyleType;

  /**
   * 刻度标签样式。
   */
  axisLabelTextStyle: SimpleTextStyle;

  /**
   * 刻度标签旋转角度。
   */
  axisLabelRotate: number;

  /**
   * 轴线颜色来源。
   *
   * 值枚举：
   * - `'followTheme'`：跟随主题
   * - `'custom'`：自定义
   */
  axisLineColorType: ChartAxisLineColorType;

  /**
   * 轴线颜色（axisLineColorType = 'custom' 时生效）。
   */
  axisLineColor: string;

  /**
   * 是否显示次刻度。
   */
  showMinorTick: boolean;

  /**
   * 是否反向坐标轴。
   */
  inverse: boolean;

  /**
   * 刻度标签格式模式。
   *
   * 值枚举：
   * - `'normal'`：通用格式
   * - `'special'`：自定义格式
   */
  axisLabelFormatType: ChartAxisLabelFormatType;

  /**
   * 通用格式化策略（axisLabelFormatType = 'normal' 时生效）。
   *
   * 值枚举：
   * - `'general'`：通用
   * - `'number'`：数字
   * - `'percent'`：百分比
   * - `'date'`：日期
   */
  axisLabelFormatter: ChartAxisLabelFormatter;

  /**
   * 刻度格式模板。
   * - 通用：`'#0'`
   * - 数字：如 `'#,##0.00'`
   * - 百分比：如 `'#0%'`
   * - 日期：如 `'yyyy-MM-dd'`
   */
  formatterLabel: string;

  /**
   * 高级脚本格式化器（axisLabelFormatType = 'special' 时生效）。
   */
  monacoFormatter: string;

  /**
   * 原始 axisLabel 对象（ECharts 原生配置透传）。
   */
  axisLabel: Record<string, unknown>;

  /**
   * 原始 axisTick 对象（ECharts 原生配置透传）。
   */
  axisTick: Record<string, unknown>;

  /**
   * 原始 minorTick 对象（ECharts 原生配置透传）。
   */
  minorTick: Record<string, unknown>;

  /**
   * 刻度标签位置。
   *
   * 受 axisType 影响：
   * - axisType = 'xAxis'：默认 `'bottom'`
   * - axisType = 'yAxis'：默认 `'left'`
   */
  axisLabelPosition: ChartAxisLabelPosition;

  /**
   * 是否显示主刻度。
   *
   * 受 axisType 影响：
   * - axisType = 'xAxis'：默认 `true`（strip 为 `false`）
   * - axisType = 'yAxis'：默认 `false`（strip 为 `true`）
   */
  showAxisTick: boolean;

  /**
   * 轴线类型。
   *
   * 受 axisType 影响：
   * - axisType = 'xAxis'：默认 `'solid'`（strip 为 `0`）
   * - axisType = 'yAxis'：默认 `0`（strip 为 `'solid'`）
   *
   * 值为 `0` 时表示隐藏轴线，值为 `'solid'`/`'dashed'`/`'dotted'` 时表示显示对应样式的轴线。
   */
  axisLineType: ChartAxisLineType;
}

/**
 * 类目轴详细配置。
 */
export interface CategoryAxisConf extends BaseChartAxisConf {
  /**
   * 轴类型。
   */
  type: 'category';

  /**
   * 轴标签显示策略。
   *
   * 值枚举：
   * - `'intervalDisplay'`：间隔显示
   * - `'thumbnailDisplay'`：缩略显示（超出 width 时截断并省略号）
   * - `'breakDisplay'`：换行显示（超出 width 时自动换行）
   */
  axisLabelShowType: CategoryAxisLabelShowType;

  /**
   * 轴标签文本宽度或占比。
   *
   * 当 axisLabelShowType 为 `'thumbnailDisplay'` 或 `'breakDisplay'` 时生效。
   */
  width: number;
}

/**
 * 数值轴详细配置。
 */
export interface ValueAxisConf extends BaseChartAxisConf {
  /**
   * 轴类型。
   */
  type: 'value';

  /**
   * 是否自定义最小值。
   */
  minCustom: boolean;

  /**
   * 最小值。
   *
   * minCustom 为 true 时生效，为空则不限制。
   */
  min: string;

  /**
   * 是否自定义最大值。
   */
  maxCustom: boolean;

  /**
   * 最大值。
   *
   * maxCustom 为 true 时生效，为空则不限制。
   */
  max: string;

  /**
   * 是否自定义主刻度间隔。
   */
  mainTickUnitCustom: boolean;

  /**
   * 主刻度间隔。
   *
   * mainTickUnitCustom 为 true 时生效，对应 ECharts axis.interval。
   */
  mainTickUnit: string;

  /**
   * 是否自定义次刻度间隔。
   */
  minorTickUnitCustom: boolean;

  /**
   * 次刻度间隔。
   *
   * minorTickUnitCustom 为 true 时生效，对应 ECharts minorTick.splitNumber，默认 5。
   */
  minorTickUnit: string;
}

/**
 * 坐标轴详细配置。
 */
export type ChartAxisConf = CategoryAxisConf | ValueAxisConf;

/**
 * 浮动元素在 sheet 坐标系中的变换信息。
 */
export interface SheetTransform {
  /**
   * 旋转角度。
   */
  angle: number;

  /**
   * 是否 X 轴翻转。
   */
  flipX: boolean;

  /**
   * 是否 Y 轴翻转。
   */
  flipY: boolean;

  /**
   * 起始锚点。
   */
  from: SheetAnchor;

  /**
   * X 轴倾斜。
   */
  skewX: number;

  /**
   * Y 轴倾斜。
   */
  skewY: number;

  /**
   * 结束锚点。
   */
  to: SheetAnchor;
}

/**
 * sheet 锚点。
 */
export interface SheetAnchor {
  /**
   * 列索引。
   */
  column: number;

  /**
   * 列内偏移量。
   */
  columnOffset: number;

  /**
   * 行索引。
   */
  row: number;

  /**
   * 行内偏移量。
   */
  rowOffset: number;
}

/**
 * 最终渲染矩形。
 */
export interface TransformRect {
  /**
   * 旋转角度。
   */
  angle: number;
  
  /**
   * 是否 X 轴翻转。
   */
  flipX: boolean;
  
  /**
   * 是否 Y 轴翻转。
   */
  flipY: boolean;
  
  /**
   * 高度。
   */
  height: number;

  /**
   * 左偏移。
   */
  left: number;
  
  /**
   * X 轴倾斜。
   */
  skewX: number;

  /**
   * Y 轴倾斜。
   */
  skewY: number;

  /**
   * 上偏移。
   */
  top: number;

  /**
   * 宽度。
   */
  width: number;
}

/**
 * reportConfig：报表行为层。
 * 字段顺序严格跟随样例。
 */
export interface ReportConfig {
  /**
   * 引擎配置。
   */
  engineConfig: EngineConfig;

  /**
   * 事件配置。
   */
  eventConfig: EventConfigItem[];

  /**
   * 续打 / 偏移打印配置。
   */
  followUpPrintOpt: FollowUpPrintOpt;

  /**
   * 页尾重复打印配置。
   */
  footerRepeat: FooterRepeatConfig;

  /**
   * 报表函数配置。
   */
  functionConfig: FunctionConfigItem[];

  /**
   * 冻结表头配置。
   */
  headerFrozen: HeaderFrozenConfig;

  /**
   * 页面头部工具栏配置。
   */
  headerOptions: HeaderOptions;

  /**
   * 页头重复打印配置。
   */
  headerRepeat: HeaderRepeatConfig;

  /**
   * 页面布局配置。
   */
  pageConfig: PageConfig;

  /**
   * 打印选项配置。
   */
  printOptions: PrintOptions;

  /**
   * 全局作用域变量配置。
   */
  scopeConfig: ScopeConfigItem[];

  /**
   * 查询栏配置。
   */
  searchBarConfig: SearchBarConfig;

  /**
   * 数据源配置。
   */
  serviceConfig: ServiceConfig;

  /**
   * 报表分栏配置。
   */
  splitLayout: SplitLayout;
}

/**
 * 页面配置。
 */
export interface PageConfig {
  /**
   * 根据单元格内容自动调整。
   * 值枚举：
   * - none 不自动调整
   * - rowHeight 行高
   * - colWidth 列宽
   */
  autoAdjust: string;

  /**
   * 自动行高算法, 表示计算行高的时候 到底是用canvas还是dom去计算。
   * 值枚举：
   * - '1' canvas
   * - '2' dom
   */
  autoLineHeightType: string;

  /**
   * 底部边框补齐。
   */
  bbPlaceholder: boolean;

  /**
   * 页面方向。
   */
  direction: "vertical" | "horizontal";

  /**
   * 表示使用第几行填充页面纵向空白行。
   */
  fillBy: number;

  /**
   * 是否开启按指定行填充页面纵向空白行。
   */
  needFillByRow: boolean;

  /**
   * 页脚高度。
   */
  pageFooter: number;

  /**
   * 页脚配置列表。
   */
  pageFooterConfig: PageRegionConfig[];

  /**
   * 页面高度。
   */
  pageH: number;

  /**
   * 页眉高度。
   */
  pageHeader: number;

  /**
   * 页眉配置列表。
   */
  pageHeaderConfig: PageRegionConfig[];

  /**
   * 页面四边距。
   */
  pagePadding: PagePadding;

  /**
   * 页面尺寸来源。
   * 值枚举
   * - predefine 预定义
   * - custom 自定义
   */
  pageSizeConf: string;

  /**
   * 页面尺寸值。
   * 当前样例：210x297
   */
  pageSizeValue: string;

  /**
   * 页面宽度。
   */
  pageW: number;

  /**
   * 分页顺序。
   * 值枚举：
   * - columnRow 先列后行
   * - rowColumn 先行后列
   */
  pagingOrder: string;

  /**
   * 报表预览位置。
   * 值枚举：
   * - left 靠左
   * - center 居中
   */
  previewAlign: string;

  /**
   * 打印格式。
   * 值枚举：
   * - html HTML
   * - pdf PDF
   */
  printFormat: string;

  /**
   * 打印方式。
   * 值枚举：
   * - client 客户端
   * - server 服务器
   */
  printMode: string;

  /**
   * 起始页码。
   */
  startPageNumber: number;

  /**
   * 页面尺寸单位。
   * 值枚举：
   * - millimeter 毫米
   * - inch 英寸
   */
  unit: string;

  /**
   * 是否以纸张大小打印。
   */
  withPageSize: boolean;
}

/**
 * 页面四边距。
 */
export interface PagePadding {
  /**
   * 上边距。
   */
  top: number;

  /**
   * 左边距。
   */
  left: number;

  /**
   * 下边距。
   */
  bottom: number;

  /**
   * 右边距。
   */
  right: number;
}

/**
 * 页眉 / 页脚单项配置。
 */
export interface PageRegionConfig {
  /**
   * 是否启用当前页型配置(是否定义选中的类型)。
   */
  checked: boolean;

  /**
   * 是否禁用复选框的编辑(是否定义选中的类型)。
   */
  disabled: boolean;

  /**
   * 是否开启分割线。
   */
  divider: boolean;

  /**
   * 页型名称。
   * 当前样例：
   * 默认页 / 首页 / 最后一页 / 奇数页 / 偶数页
   */
  name: string;

  /**
   * 整体位置。
   * 值枚举：
   * - Right 右
   * - Left 左
   * - Center 中
   */
  position: string;

  /**
   * 中区域内容列表。
   */
  regionCenter: PageRegionItem[];

  /**
   * 左区域内容列表。
   */
  regionLeft: PageRegionItem[];

  /**
   * 右区域内容列表。
   */
  regionRight: PageRegionItem[];

  /**
   * 页型编码（页型索引）。
   *
   * 对应页型在 `pageTabs` 数组中的下标，字符串形式：
   * - `'0'`：默认页
   * - `'1'`：首页
   * - `'2'`：最后一页
   * - `'3'`：奇数页
   * - `'4'`：偶数页
   */
  value: string;
}

/**
 * 页眉 / 页脚区域内容项。
 */
export interface PageRegionItem {
  /**
   * 颜色配置。
   */
  colorData: ColorData;

  /**
   * 字体配置。
   */
  fontData: FontData;

  /**
   * 格式化配置。
   */
  formatData: FormatData;

  /**
   * 图片配置。
   */
  imageData: ImageData;

  /**
   * 区域内排序序号。
   *
   * 表示该项在区域数组（regionLeft / regionCenter / regionRight）中的位置索引，
   * 从 `0` 开始递增。
   */
  num: number;

  /**
   * 内容主体。
   * 可以是纯文本，也可以是脚本表达式。
   */
  text: string;
  
  /**
   * 内容类型编码。
   * 当前样例出现：0 / 1 / 2 / 3
   */
  type: number;
}

/**
 * 字体配置。
 */
export interface FontData {
  /**
   * 文字颜色。
   */
  color: string;

  /**
   * 特效数组。
   *
   * 可多选，值为字符串编码：
   * - `'0'`：删除线（text-decoration: line-through）
   * - `'1'`：阴影（text-shadow: 2px 2px 2px #000000）
   * - `'2'`：上标（vertical-align: super）
   * - `'3'`：下标（vertical-align: sub）
   */
  effect: ('0' | '1' | '2' | '3')[];

  /**
   * 字体名编码。
   *
   * 值枚举：
   * Arial
   * Tahoma
   * Times New Roman
   * Verdana
   * 微软雅黑
   * 宋体（SimSun）
   * 黑体（SimHei）
   * 楷体（KaiTi）
   * 仿宋（FangSong）
   * 新宋体（NSimSun）
   * 华文新魏（STXinwei）
   * 华文行楷（STXingkai）
   * 华文隶书（STLiti）
   */
  family: string;

  /**
   * 字号。
   */
  fontSize: string;

  /**
   * 字形风格。
   */
  fontStyle: string;

  /**
   * 下划线配置编码。
   */
  underline: string;
}

/**
 * 内容格式化配置。
 */
export interface FormatData {
  /**
   * 格式类型编码。
   *
   * 值枚举：
   * - `0`：常规
   * - `1`：数字
   * - `2`：货币
   * - `3`：百分比
   * - `4`：千分比
   * - `5`：科学计算
   * - `6`：日期型
   * - `7`：时间型
   * - `8`：文本型
   */
  type: number;

  /**
   * 格式串。
   *
   * 值为 `'分类编码-子格式索引'`，各分类下的可用格式如下：
   *
   * - `type = 0`（常规）：无子格式，`format` 为空
   *
   * - `type = 1`（数字）：
   *   - `'1-0'`：`#0`
   *   - `'1-1'`：`#0.00`
   *   - `'1-2'`：`#0.0#`
   *   - `'1-3'`：`#,##0`
   *   - `'1-4'`：`#,##0.00`
   *
   * - `type = 2`（货币）：
   *   - `'2-0'`：`¤#0`
   *   - `'2-1'`：`¤#0.00`
   *   - `'2-2'`：`¤#,##0`
   *   - `'2-3'`：`¤#,##0.0`
   *   - `'2-4'`：`¤#,##0.00`
   *   - `'2-5'`：`¤#,##0;¤-#,##0`
   *   - `'2-6'`：`¤#,##0.00;¤-#,##0.00`
   *   - `'2-7'`：`¤#,##0.00;(¤#,##0.00)`
   *   - `'2-8'`：`$#,##0;($#,##0)`
   *   - `'2-9'`：`$#,##0.00;($#,##0.00)`
   *   - `'2-10'`：`#,##0;-#,##0`
   *
   * - `type = 3`（百分比）：
   *   - `'3-0'`：`#0%`
   *   - `'3-1'`：`#0.0%`
   *   - `'3-2'`：`#0.00%`
   *   - `'3-3'`：`#0.000%`
   *   - `'3-4'`：`#0.0000%`
   *
   * - `type = 4`（千分比）：
   *   - `'4-0'`：`#0‰`
   *   - `'4-1'`：`#0.0‰`
   *   - `'4-2'`：`#0.00‰`
   *   - `'4-3'`：`#0.000‰`
   *   - `'4-4'`：`#0.0000‰`
   *
   * - `type = 5`（科学计算）：
   *   - `'5-0'`：`0.00E00`
   *   - `'5-1'`：`##0.0E0`
   *
   * - `type = 6`（日期型）：
   *   - `'6-0'`：`yyyy-MM-dd`
   *   - `'6-1'`：`yyyyMMdd`
   *   - `'6-2'`：`yyyy/MM/dd`
   *   - `'6-3'`：`yyyy年MM月dd日`
   *   - `'6-4'`：`yyyy-M-d`
   *   - `'6-5'`：`yyyy/M/d`
   *   - `'6-6'`：`yyyy年M月d日`
   *   - `'6-7'`：`yyyy-MM`
   *   - `'6-8'`：`yyyy/MM`
   *   - `'6-9'`：`yyyy年MM月`
   *   - `'6-10'`：`yyyy`
   *   - `'6-11'`：`yyyy年`
   *   - `'6-12'`：`MM/dd/yyyy`
   *   - `'6-13'`：`MM/d/yy`
   *   - `'6-14'`：`MM.dd.yyyy`
   *   - `'6-15'`：`MM.d.yyyy`
   *   - `'6-16'`：`MM-yy`
   *   - `'6-17'`：`M-d-yy`
   *
   * - `type = 7`（时间型）：
   *   - `'7-0'`：`yyyy-MM-dd HH:mm:ss`
   *   - `'7-1'`：`yyyy/MM/dd HH:mm:ss`
   *   - `'7-2'`：`yyyy-MM-dd hh:mm:ss`
   *   - `'7-3'`：`yyyy/MM/dd hh:mm:ss`
   *   - `'7-4'`：`yyyy-MM-dd HH:mm:ss a`
   *   - `'7-5'`：`yyyy/MM/dd HH:mm:ss a`
   *   - `'7-6'`：`yyyy-MM-dd hh:mm:ss a`
   *   - `'7-7'`：`yyyy/MM/dd hh:mm:ss a`
   *   - `'7-8'`：`MM/dd/yyyy hh:mm:ss`
   *   - `'7-9'`：`MM/dd/yyyy HH:mm:ss`
   *   - `'7-10'`：`MM/dd/yyyy hh:mm:ss a`
   *   - `'7-11'`：`MM/dd/yyyy HH:mm:ss a`
   *   - `'7-12'`：`MM/dd/yyyy h:mm a`
   *   - `'7-13'`：`MM/dd/yyyy H:mm a`
   *   - `'7-14'`：`yyyy-M-d h:mm`
   *   - `'7-15'`：`yyyy-M-d H:mm`
   *   - `'7-16'`：`h:mm:ss a`
   *   - `'7-17'`：`HH:mm:ss a`
   *   - `'7-18'`：`HH:mm:ss`
   *   - `'7-19'`：`hh:mm:ss`
   *   - `'7-20'`：`h:mm`
   *   - `'7-21'`：`H:mm`
   *   - `'7-22'`：`h:mm:ss`
   *   - `'7-23'`：`H:mm:ss`
   *   - `'7-24'`：`hh:mm`
   *   - `'7-25'`：`HH:mm`
   *   - `'7-26'`：`mm:ss`
   *
   * - `type = 8`（文本型）：无子格式，`format` 为空
   */
  format: string;
}

/**
 * 图片配置。
 */
export interface ImageData {
  /**
   * 图片地址。
   */
  imgUrl: string;

  /**
   * 图片重复方式。
   */
  repeat: string;
}

/**
 * 颜色配置。
 */
export interface ColorData {
  /**
   * 背景色。
   */
  bg: string;

  /**
   * 前景色 / 字色。
   */
  color: string;

  /**
   * 渐变配置。
   */
  gradient: string;

  /**
   * 背景图配置。
   */
  imageData: BackgroundImageData;

  /**
   * 图案配置。
   */
  pattern: string;

  /**
   * 纹理配置。
   */
  texture: string;
}

/**
 * 颜色配置中的背景图信息。
 */
export interface BackgroundImageData {
  /**
   * 图片地址。
   */
  imgUrl: string;

  /**
   * 图片重复方式。
   */
  repeat: string;
}

/**
 * 版面切分配置。
 */
export interface SplitLayout {
  /**
   * 超过多少行/列分栏。
   */
  condition: number;

  /**
   * 要复制的行/列索引。
   */
  copyIndex: string;

  /**
   * 是否启用报表分栏。
   */
  enable: boolean;

  /**
   * 分栏切分模式。
   * 值枚举：
   * - row 行分栏
   * - column 列分栏
   */
  mode: string;

  /**
   * 切分区域。
   * 示例：A2:D5
   */
  splitArea: string;

  /**
   * 切分数量。
   */
  splitCount: number;
}

/**
 * 重复区域公共结构。
 */
export interface RepeatArea {
  /**
   * 是否启用。
   */
  isEnabled: boolean;

  /**
   * 起始行 / 列。
   */
  start: number;

  /**
   * 结束行 / 列。
   */
  end: number;
}

/**
 * 页头重复配置。
 */
export interface HeaderRepeatConfig {
  /**
   * 重复页头行。
   */
  headerRow: RepeatArea;

  /**
   * 重复页头列。
   */
  headerCol: RepeatArea;
}

/**
 * 页尾重复配置。
 */
export interface FooterRepeatConfig {
  /**
   * 重复页尾行。
   */
  footerRow: RepeatArea;

  /**
   * 重复页尾列。
   */
  footerCol: RepeatArea;
}

/**
 * 冻结表头配置。
 */
export interface HeaderFrozenConfig {
  /**
   * 冻结行。
   */
  headerRow: RepeatArea;
}

/**
 * 续打区域公共结构。
 */
export interface FollowUpArea {
  /**
   * 是否启用。
   */
  isEnabled: boolean;

  /**
   * 起始位置。
   */
  start: number;

  /**
   * 结束位置。
   */
  end: number;
}

/**
 * 续打 / 偏移打印配置。
 */
export interface FollowUpPrintOpt {
  /**
   * 按列续打配置。
   */
  fuCol: FollowUpArea;

  /**
   * 按行续打配置。
   */
  fuRow: FollowUpArea;

  /**
   * 报表续打偏移值。
   */
  offset: number;

  /**
   * 续打偏移值显示位置（可多选）。
   *
   * 控制续打偏移值在打印输出中的显示侧：
   * - `'left'`：左侧
   * - `'right'`：右侧
   *
   * 可同时选择两侧，值为选中项的标签字符串数组。
   */
  offsetPosition: string[];
}

/**
 * 报表变量配置项。
 */
export interface ScopeConfigItem {
  /**
   * 变量名。
   */
  name: string;

  /**
   * 默认值。
   */
  defaultValue: JsonValue;

  /**
   * 变量类型。
   */
  type: "string" | "number" | "boolean" | "object" | "array" | "list" | string;

  /**
   * 备注。
   */
  remark: string;

  /**
   * 列表项结构描述（仅 `type = 'list'` 时有效，其他类型时忽略）。
   *
   * schema 定义了 list 类型变量中每一行的字段结构，是 list 变量的核心配置。
   * 当 `type` 切换为 `'list'` 时，`defaultValue` 会被重置为 `[]`，`schema` 初始化为 `[]`。
   *
   * ## 运行时行为
   *
   * 当用户点击"插入行"按钮时，运行时调用 `insertDynamicCell(scopeField)` 方法：
   * 1. 在 `scopeConfig` 中查找 `name === scopeField` 且 `schema.length > 0` 的变量
   * 2. 遍历 schema 数组，为每一项生成 `{ [schemaItem.name]: schemaItem.defaultValue }` 的键值对
   * 3. 将生成的对象 push 到 `reportForm[scopeField]` 数组中，形成一行新数据
   *
   * 示例：若 schema 为 `[{name:'userName', type:'string', defaultValue:''}, {name:'age', type:'number', defaultValue:0}]`，
   * 则插入一行后 `reportForm.listVar` 变为 `[{userName: '', age: 0}]`。
   *
   * ## 级联选择器映射
   *
   * 在控件"绑定字段"配置中，`convertToCascader()` 函数会将 list 类型变量转换为二级级联选项：
   * - 第一级：变量名（`item.name`），label 格式为 `"变量名(备注)"`
   * - 第二级：schema 字段名（`schemaItem.name`），label 格式为 `"字段名(备注)"`
   * - 选中后 `scopeField` 值为 `"变量名.字段名"`（如 `"listVar.userName"`）
   *
   * 非 list 类型变量只有一级选项，没有 children。
   *
   * ## 插入行控件关联
   *
   * 在控件"插入字段"配置（`insertCell.scopeField`）中，只列出 `type === 'list'` 的变量，
   * 用于指定该按钮控件向哪个 list 变量插入新行。
   */
  schema?: ScopeSchemaItem[];
}

/**
 * 列表变量的字段结构项（ScopeConfigItem.schema 数组的元素类型）。
 *
 * 每个 ScopeSchemaItem 描述 list 变量中一个字段的名称、类型、默认值和备注。
 */
export interface ScopeSchemaItem {
  /**
   * 字段名。
   *
   * 命名规则：必须以英文字母或下划线 `_` 开头，后续可包含字母、数字、下划线。
   * 可以作为级联选择器第二级的 `value` 和 `label` 的一部分。
   *
   * 示例：`'userName'`、`'_orderCount'`
   */
  name: string;

  /**
   * 字段类型。
   *
   * 值枚举（与 ScopeConfigItem.type 相比不含 `'list'`，schema 不支持嵌套 list）：
   * - `'string'`：字符串，`defaultValue` 初始化为 `''`
   * - `'number'`：数值，`defaultValue` 初始化为 `0`
   * - `'boolean'`：布尔值，`defaultValue` 初始化为 `false`
   * - `'object'`：对象，`defaultValue` 初始化为 `{}`，通过 JSON 编辑器配置
   * - `'array'`：数组，`defaultValue` 初始化为 `[]`，通过 JSON 编辑器配置
   *
   * 切换 type 时，`defaultValue` 会自动重置为对应类型的初始值。
   */
  type: "string" | "number" | "boolean" | "object" | "array";

  /**
   * 字段默认值。
   *
   * 根据类型不同，值的形态和编辑方式不同：
   * - `type = 'string'`：字符串，通过输入框编辑
   * - `type = 'number'`：数值，通过数字输入框编辑
   * - `type = 'boolean'`：布尔值，通过开关切换
   * - `type = 'object'` / `type = 'array'`：通过 Monaco JSON 编辑器编辑，
   *   编辑器打开时自动格式化，保存时 JSON.parse 解析
   *
   */
  defaultValue: JsonValue;

  /**
   * 字段备注。
   *
   * 用于在级联选择器 label 中展示（格式为 `"字段名(备注)"`），
   * 帮助用户识别字段含义。备注为空时 label 只显示字段名。
   */
  remark?: string;
}

/**
 * 查询栏配置。
 */
export interface SearchBarConfig {
  /**
   * 查询表单运行时数据模型。
   *
   * 键名为控件的 `_$field`（自动生成的6位随机标识符），键值为控件当前值。
   * 示例：`{ "PhDbbG": "", "Brfsmf": "", "NAhxaw": "" }`
   */
  form: Record<string, unknown>;

  /**
   * 查询表单描述对象。
   */
  formDesc: SearchBarFormDesc;
}

/**
 * 查询表单描述对象。
 */
export interface SearchBarFormDesc {
  /**
   * 字段字典。
   *
   * 键名为控件的 `_$field`（6位随机标识符），值为 SearchBarFieldItem 结构。
   */
  fields: Record<string, SearchBarFieldItem>;

  /**
   * 查询栏布局配置。
   */
  layout: SearchBarLayout;

  /**
   * 生命周期脚本（页面上暂时没有开放配置）。
   */
  lifeCycle: SearchBarLifeCycle;

  /**
   * 查询栏内部变量（页面上暂时没有开放配置）。
   */
  scope: unknown[];

  /**
   * 布局控件列表。
   *
   * 扁平数组，仅包含 row 和 col 两种布局控件。
   * 表单控件（input、select 等）不在此列表中，存放在 fields 字典中。
   *
   * 渲染时通过 `getRenderTreeData` 将扁平结构转换为树形结构：
   * - row.columns 中的 `_$field` 字符串会被替换为对应的 col 对象
   * - col.columns 中的 `_$field` 字符串会被替换为对应的 fields 中的表单控件对象
   * - 没有 parent 的控件为根节点（即 row），按 layout 数值排序
   */
  widgets: SBWidgetRow[] | SBWidgetCol[];
}

/**
 * 查询栏 - 行布局控件（type = 'row'）。
 *
 * 行控件是查询栏布局的根节点，包含一个或多个 col 子控件。
 * 在 widgets 扁平数组中，没有 parent 的控件即为 row。
 * 渲染时按 layout 数值从小到大排列。
 */
export interface SBWidgetRow {
  /**
   * 子列标识数组。
   *
   * 初始值为 col 控件的 `_$field` 字符串数组。
   */
  columns: string[];

  /**
   * 组件信息。
   */
  componentInfo: {
    /** 控件类型，固定为 `'row'` */
    type: 'row';
    /** 行配置 */
    config: SBRowConfig;
  };

  /** 默认值，行控件固定为空字符串 */
  defaultValue: string;

  /** 表单尺寸，固定 `'xs'` */
  formSize: string;

  /** 标签文本，行控件固定为空 */
  label: string;

  /**
   * 行位置编号（字符串数字）。
   *
   * 从 `'1'` 开始，用于排序行控件的渲染顺序。
   * 删除行后会自动重新编号。
   */
  layout: string;

  /**
   * 父级控件的 `_$field`。
   * 行控件为根节点，parent 为空字符串。
   */
  parent: string;

  /** 是否可见 */
  visible: boolean;

  /** 字段标识 */
  _$field: string;
}

/**
 * 查询栏 - 行配置（type = 'row'）。
 */
export interface SBRowConfig {
  /** 栅格间隔，默认 16 */
  gutter: number;
  /**
   * 切片类型。
   * 值枚举：
   * - `'auto'`：自动
   */
  slice: string;
}

/**
 * 查询栏 - 列布局控件（type = 'col'）。
 *
 * 列控件是行控件的子节点，包含一个或多个表单控件。
 * col 的 parent 指向所属 row 的 `_$field`。
 */
export interface SBWidgetCol {
  /**
   * 子控件标识数组。
   *
   * 初始值为表单控件的 `_$field` 字符串数组。
   */
  columns: string[];

  /**
   * 组件信息。
   */
  componentInfo: {
    /** 控件类型，固定为 `'col'` */
    type: 'col';
    /** 列配置 */
    config: SBColConfig;
  };

  /** 组件逻辑配置（col 控件仅有 events 空数组） */
  componentLogic: {
    /** 事件配置（当前未使用，固定为空数组） */
    events: unknown[];
  };

  /** 默认值，列控件固定为空字符串 */
  defaultValue: string;

  /** 表单尺寸，固定 `'xs'` */
  formSize: string;

  /** 标签文本，列控件固定为空 */
  label: string;

  /**
   * 父级控件的 `_$field`。
   * 列控件的 parent 为所属 row 的 `_$field`。
   */
  parent: string;

  /** 是否可见 */
  visible: boolean;

  /** 字段标识 */
  _$field: string;
}

/**
 * 查询栏 - 列配置（type = 'col'）。
 */
export interface SBColConfig {
  /** 栅格占据的列数，默认 8（共 24 栏） */
  span: number;
  /** 栅格左侧的间隔格数 */
  offset: number;
  /** 栅格向右移动格数 */
  push: number;
  /** 栅格向左移动格数 */
  pull: number;
}

/**
 * 查询栏字段项（SearchBarFormDesc.fields 的值类型）。
 *
 * 每个字段项描述查询栏中的一个控件（输入框、选择器、日期选择器等）
 */
export interface SearchBarFieldItem {
  /**
   * 组件信息（控件类型和配置）。
   */
  componentInfo: SearchBarComponentInfo;

  /**
   * 组件逻辑配置（数据源、校验、联动、事件）。
   */
  componentLogic: SearchBarFieldLogic;

  /**
   * 默认值。
   * 与 `componentInfo.config.value` 对应，用于初始化 form 中的值。
   */
  defaultValue: string | unknown[];

  /**
   * 展开配置。
   */
  expand?: unknown[];

  /**
   * 字段值类型。
   *
   * 值枚举：
   * - `'string'`：字符串 — input、select、radio
   * - `'date'`：日期 — datePicker、timePicker
   * - `'array'`：数组 — checkbox、cascader
   *
   * 按钮和布局控件（button）无此属性。
   */
  fieldType?: 'string' | 'date' | 'array' | string;

  /**
   * 表单尺寸。
   * 值写死 `'xs'`。
   */
  formSize: string;

  /**
   * 控件标签文本。
   * 如 "输入框"、"选择器"、"日期选择器" 等，布局控件和按钮通常为空。
   */
  label: string;

  /**
   * 标签宽度。
   */
  labelWidth: string;

  /**
   * 父级控件的 `_$field`，用于建立控件层级关系。
   * 普通控件的 parent 为所在 col 控件的 `_$field`。
   */
  parent: string;

  /**
   * 绑定的报表作用域变量名。
   * 用于将查询控件的值映射到报表级变量。
   */
  scopeField?: string;

  /**
   * 是否可见。
   */
  visible: boolean;

  /**
   * 字段标识（6位随机字符串，如 `"PhDbbG"`）。
   * 同时作为 fields 字典的键名和 form 数据模型的键名。
   */
  _$field: string;
}

/**
 * 查询栏控件组件信息。
 */
export interface SearchBarComponentInfo {
  /**
   * 控件类型。
   *
   * 值枚举：
   * - `'input'`：输入框
   * - `'select'`：选择器
   * - `'cascader'`：级联选择器
   * - `'datePicker'`：日期选择器
   * - `'timePicker'`：时间选择器
   * - `'radio'`：单选框
   * - `'checkbox'`：复选框
   * - `'button'`：按钮（搜索/重置/自定义）
   */
  type: string;

  /**
   * 控件配置（不同 type 对应不同结构）。
   */
  config:
    | SBInputConfig
    | SBSelectConfig
    | SBCascaderConfig
    | SBDatePickerConfig
    | SBTimePickerConfig
    | SBRadioConfig
    | SBCheckboxConfig
    | SBButtonConfig
}

/**
 * 查询栏 - 输入框配置（type = 'input'）。
 */
export interface SBInputConfig {
  /** 是否可清空 */
  clearable: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 最大输入长度 */
  maxlength: number;
  /** 最小输入长度 */
  minlength: number;
  /** 占位文本 */
  placeholder: string;
  /** 是否只读 */
  readonly: boolean;
  /** 是否必填 */
  required: boolean;
  /** 是否显示密码切换按钮（type 为 password 时有效） */
  showPassword: boolean;
  /** 是否显示字数统计 */
  showWordLimit: boolean;
  /**
   * 尺寸。
   *
   * 值枚举：
   * - `'small'`：小
   * - `'medium'`：中
   * - `'large'`：大
   */
  size: string;
  /**
   * 输入框类型。
   *
   * 值枚举：
   * - `'text'`：文本
   */
  type: string;
  /** 当前值 */
  value: string;
  /** 逻辑配置-事件配置的自定义脚本 */
  handler: string;
}

/**
 * 查询栏 - 选择器配置（type = 'select'）。
 */
export interface SBSelectConfig {
  /** 是否允许用户创建新条目 */
  allowCreate: boolean;
  /** 是否追加到自身而非 body */
  appendToSelf: boolean;
  /** 自动补全类型 */
  autocomplete: string;
  /** 选中项图标类名 */
  checkIcon: string;
  /** 是否可清空 */
  clearable: boolean;
  /** 多选时是否折叠标签 */
  collapseTags: boolean;
  /** 是否在选项出现后默认选中第一个 */
  defaultFirstOption: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 自定义搜索过滤方法 */
  filterMethod: unknown;
  /** 是否可搜索 */
  filterable: boolean;
  /** 是否正在加载远程数据 */
  loading: boolean;
  /** 加载中显示的文本 */
  loadingText: string;
  /** 是否多选 */
  multiple: boolean;
  /** 多选时最多可选数量，0 表示不限制 */
  multipleLimit: number;
  /** 多选展示类型 */
  multipleType: string;
  /** 无数据时显示的文本 */
  noDataText: string;
  /** 搜索无匹配时显示的文本 */
  noMatchText: string;
  /** 占位文本 */
  placeholder: string;
  /** 选项字段映射 */
  props: {
    /** 选项显示文本的字段名 */
    label: string;
    /** 选项值的字段名 */
    value: string;
    /** 选项禁用状态的字段名 */
    disabled: string;
  };
  /** 是否只读 */
  readonly: boolean;
  /** 是否为远程搜索 */
  remote: boolean;
  /** 自定义远程搜索方法 */
  remoteMethod: unknown;
  /** 多选时是否保留搜索关键词 */
  reserveKeyword: boolean;
  /** 是否必填 */
  required: boolean;
  /**
   * 尺寸。
   *
   * 值枚举：
   * - `'small'`：小
   * - `'medium'`：中
   * - `'large'`：大
   */
  size: string;
  /** 当前值 */
  value: string;
  /** 多选时选项的唯一标识键名 */
  valueKey: string;
  /** 逻辑配置-事件配置的自定义脚本 */
  handler: string;
}

/**
 * 查询栏 - 级联选择器配置（type = 'cascader'）。
 */
export interface SBCascaderConfig {
  /** 是否可清空 */
  clearable: boolean;
  /** 多选时是否折叠标签 */
  collapseTags: boolean;
  /** 搜索关键词去抖延迟（毫秒） */
  debounce: number;
  /** 是否禁用 */
  disabled: boolean;
  /** 是否可搜索 */
  filterable: boolean;
  /** 是否只显示最后一级标签 */
  hideAllLevels: boolean;
  /** 占位文本 */
  placeholder: string;
  /** 下拉弹出框的自定义类名 */
  popperClass: string;
  /** 级联选项字段映射 */
  props: {
    /** 是否允许选择任意一级选项（不强制选到叶子） */
    checkStrictly: boolean;
    /** 子选项列表的字段名 */
    children: string;
    /** 选项禁用状态的字段名 */
    disabled: string;
    /** 选项显示文本的字段名 */
    label: string;
    /** 叶子节点标识的字段名 */
    leaf: string;
    /** 是否返回完整路径数组 */
    emitPath: boolean;
    /**
     * 次级菜单的展开方式。
     *
     * 值枚举：
     * - `'click'`：点击展开
     * - `'hover'`：悬停展开
     */
    expandTrigger: string;
    /** 是否开启动态加载 */
    lazy: boolean;
    /** 动态加载数据的方法 */
    lazyLoad: boolean;
    /** 是否多选 */
    multiple: boolean;
    /** 选项值的字段名 */
    value: string;
  };
  /** 是否必填 */
  required: boolean;
  /** 路径分隔符 */
  separator: string;
  /**
   * 尺寸。
   *
   * 值枚举：
   * - `'small'`：小
   * - `'medium'`：中
   * - `'large'`：大
   */
  size: string;
  /** 当前值（路径数组） */
  value: unknown[];
  /** 逻辑配置-事件配置的自定义脚本 */
  handler: string;
}

/**
 * 查询栏 - 日期选择器配置（type = 'datePicker'）。
 */
export interface SBDatePickerConfig {
  /**
   * 对齐方式。
   *
   * 值枚举：
   * - `'left'`：左对齐
   * - `'center'`：居中
   * - `'right'`：右对齐
   */
  align: string;
  /** 是否追加到自身而非 body */
  appendToSelf: boolean;
  /** 清除图标类名 */
  clearIcon: string;
  /** 是否可清空 */
  clearable: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 是否允许手动输入日期 */
  editable: boolean;
  /** 范围选择时结束日期的占位文本 */
  endPlaceholder: string;
  /** 是否禁止触发校验事件 */
  forbidValidateEvent: boolean;
  /** 显示格式，如 `'yyyy-MM-dd'` */
  format: string;
  /**
   * 初始状态编码。
   *
   * 非 range 类型时值枚举：
   * - `'0'`：无初始值
   * - `'1'`：当前日期
   * - `'2'`：当前日期时间
   * - `'3'`：自定义日期（需配合 initValue）
   *
   * range 类型时值枚举：
   * - `'0'`：无初始值
   * - `'4'`：近一个月
   * - `'5'`：近一个星期
   */
  initState: string;
  /** 初始值表达式 */
  initValue: string;
  /** 占位文本 */
  placeholder: string;
  /** 下拉弹出框的自定义类名 */
  popperClass: string;
  /** 前缀图标类名 */
  prefixIcon: string;
  /** 范围选择时分隔符 */
  rangeSeparator: string;
  /** 是否只读 */
  readonly: boolean;
  /** 是否必填 */
  required: boolean;
  /**
   * 尺寸。
   *
   * 值枚举：
   * - `'small'`：小
   * - `'medium'`：中
   * - `'large'`：大
   */
  size: string;
  /** 范围选择时起始日期的占位文本 */
  startPlaceholder: string;
  /**
   * 日期类型。
   *
   * 枚举：
   * - `'year'`：年
   * - `'month'`：月
   * - `'date'`：日
   * - `'dates'`：多个日期
   * - `'months'`：多个月
   * - `'week'`：周
   * - `'datetime'`：日期时间
   * - `'datetimerange'`：日期时间范围
   * - `'daterange'`：日期范围
   * - `'monthrange'`：月份范围
   */
  type: string;
  /** 范围选择时是否取消两个面板联动 */
  unlinkPanels: boolean;
  /** 当前值 */
  value: string;
  /** 值格式，如 `'yyyy-MM-dd'` */
  valueFormat: string;
  /** 逻辑配置-事件配置的自定义脚本 */
  handler: string;
}

/**
 * 查询栏 - 时间选择器配置（type = 'timePicker'）。
 */
export interface SBTimePickerConfig {
  /**
   * 对齐方式。
   *
   * 值枚举：
   * - `'left'`：左对齐
   * - `'center'`：居中
   * - `'right'`：右对齐
   */
  align: string;
  /** 清除图标类名 */
  clearIcon: string;
  /** 是否可清空 */
  clearable: boolean;
  /** 默认值 */
  defaultValue: string;
  /** 是否禁用 */
  disabled: boolean;
  /** 是否允许手动输入时间 */
  editable: boolean;
  /** 范围选择时结束时间的占位文本 */
  endPlaceholder: string;
  /** 是否为时间范围选择 */
  isRange: boolean;
  /** 时间选择器选项 */
  pickerOptions: {
    /** 显示格式，如 `'HH:mm:ss'` */
    format: string;
    /** 可选时间范围，如 `'06:00:00 - 20:00:00'` */
    selectableRange: string;
  };
  /** 占位文本 */
  placeholder: string;
  /** 下拉弹出框的自定义类名 */
  popperClass: string;
  /** 前缀图标类名 */
  prefixIcon: string;
  /** 范围选择时分隔符 */
  rangeSeparator: string;
  /** 是否只读 */
  readonly: boolean;
  /** 是否必填 */
  required: boolean;
  /**
   * 尺寸。
   *
   * 值枚举：
   * - `'small'`：小
   * - `'medium'`：中
   * - `'large'`：大
   */
  size: string;
  /** 范围选择时起始时间的占位文本 */
  startPlaceholder: string;
  /** 当前值 */
  value: string;
  /** 值格式，如 `'HH:mm:ss'` */
  valueFormat: string;
  /** 逻辑配置-事件配置的自定义脚本 */
  handler: string;
}

/**
 * 查询栏 - 单选框配置（type = 'radio'）。
 */
export interface SBRadioConfig {
  /** 是否禁用 */
  disabled: boolean;
  /** 是否默认选中 */
  marked: boolean;
  /** 选项字段映射 */
  props: {
    /** 选项显示文本的字段名 */
    label: string;
    /** 选项值的字段名 */
    value: string;
    /** 选项禁用状态的字段名 */
    disabled: string;
    /** 选项选中状态的字段名 */
    marked: string;
  };
  /** 当前值 */
  value: string;
  /** 逻辑配置-事件配置的自定义脚本 */
  handler: string;
}

/**
 * 查询栏 - 复选框配置（type = 'checkbox'）。
 */
export interface SBCheckboxConfig {
  /** 是否禁用 */
  disabled: boolean;
  /** 是否默认全选 */
  marked: boolean;
  /** 最多可选数量，空字符串表示不限制 */
  max: string | number;
  /** 最少可选数量，空字符串表示不限制 */
  min: string | number;
  /** 选项字段映射 */
  props: {
    /** 选项显示文本的字段名 */
    label: string;
    /** 选项值的字段名 */
    value: string;
    /** 选项禁用状态的字段名 */
    disabled: string;
    /** 选项选中状态的字段名 */
    marked: string;
  };
  /** 当前值（选中项值数组） */
  value: unknown[];
  /** 逻辑配置-事件配置的自定义脚本 */
  handler: string;
}

/**
 * 查询栏 - 按钮配置（type = 'button'）。
 *
 * 按钮通过 `state` 区分不同功能：
 * - `state = 0`：重置按钮
 * - `state = 1`：搜索按钮
 * - `state = 4`：自定义按钮（额外有 `handler` 属性）
 */
export interface SBButtonConfig {
  /** 是否自动聚焦 */
  autofocus: boolean;
  /** 是否圆形按钮 */
  circle: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 自定义处理脚本（仅 state = 4 自定义按钮时有效） */
  handler?: string;
  /** 图标类名 */
  icon: string;
  /** 是否加载中状态 */
  loading: boolean;
  /** 原生 button 类型，如 `'button'`、`'submit'`、`'reset'` */
  nativeType: string;
  /** 打印页大小（仅 state = 2 打印按钮时有效，默认 -1） 但是打印按钮暂时用不到，所以这个配置也用不到*/
  pageSize?: number;
  /** 是否朴素按钮 */
  plain: boolean;
  /** 是否方形按钮 */
  quadrate: boolean;
  /** 是否圆角按钮 */
  round: boolean;
  /** 尺寸 */
  size: string;
  /** 按钮文本 */
  slot: string;
  /** 是否正方形按钮 */
  square: boolean;
  /** 按钮功能状态码 */
  state: number;
  /**
   * 按钮样式类型。
   *
   * 值枚举：
   * - `'default'`：默认
   * - `'primary'`：主要
   * - `'warning'`：警告
   * - `'success'`：成功
   * - `'danger'`：危险
   * - `'link'`：链接
   * - `'icon'`：图标
   */
  type: string;
}

/**
 * 查询栏 - 联动配置。
 *
 * 定义当前控件与其他控件之间的响应式联动关系。
 * 当依赖字段的值发生变化时，根据配置的动作自动修改目标控件的属性。
 */
export interface SBInteraction {
  /**
   * 依赖字段列表。
   *
   * 声明当前控件依赖哪些源控件，当源控件的值变化时触发联动。
   */
  dependencies: SBInteractionDependency[];

  /**
   * 响应动作配置列表。
   *
   * 定义当依赖值变化时，对目标控件执行的具体动作。
   */
  actionConfig: SBInteractionAction[];

  /**
   * 自定义联动脚本（页面上暂时没开放配置）。
   *
   * 当 actionConfig 无法满足需求时使用，可编写任意逻辑。
   * 脚本中可使用 `$deps`（依赖值字典）和 `$value`（当前变更值）。
   */
  customAction: string;
}

/**
 * 查询栏 - 联动依赖项。
 *
 * 声明一个依赖关系：监听源控件的某个属性，当其变化时触发联动。
 */
export interface SBInteractionDependency {
  /**
   * 依赖的源控件 `_$field` 标识。
   *
   * 当该控件的值发生变化时，会触发当前控件的联动计算。
   */
  field: string;

  /**
   * 在联动脚本中引用该依赖值的变量名。
   *
   * 在 actionConfig 的 action 脚本和 customAction 脚本中，
   * 通过 `$deps[variableName]` 获取该依赖字段的当前值。
   */
  variableName: string;

  /**
   * 依赖的属性名。
   *
   * 通常为 `'value'`，表示监听控件的值变化。
   */
  fieldProp: string;
}

/**
 * 查询栏 - 联动响应动作。
 *
 * 定义联动触发后对目标控件执行的具体操作。
 * 不同 actionType 对应不同的操作行为和脚本返回值类型。
 */
export interface SBInteractionAction {
  /**
   * 动作类型编码。
   *
   * 值枚举：
   * - `0`：显示/隐藏 — 控制目标控件的可见性
   * - `2`：只读 — 控制目标控件的只读状态
   * - `3`：禁用 — 控制目标控件的禁用状态
   * - `4`：字段值 — 设置目标控件的值
   * - `5`：可选项 — 设置目标控件的选项列表
   * - `6`：组件属性 — 合并修改目标控件的配置属性
   */
  actionType: 0 | 2 | 3 | 4 | 5 | 6 | number;

  /**
   * 动作脚本表达式。
   *
   * 联动触发时执行此脚本，根据 actionType 不同，返回值类型不同：
   * - `actionType = 0`：返回 `boolean`，`true` 显示，`false` 隐藏
   * - `actionType = 2`：返回 `boolean`，`true` 只读，`false` 可编辑
   * - `actionType = 3`：返回 `boolean`，`true` 禁用，`false` 启用
   * - `actionType = 4`：返回 `any`，设置为目标控件的新值
   * - `actionType = 5`：返回 `Array<{ label: string; value: any }>`，设置为目标控件的选项列表
   * - `actionType = 6`：返回 `object`，属性会合并到目标控件的配置中
   *
   * 脚本中可使用的变量：
   * - `$deps`：依赖值字典，key 为 variableName，value 为对应依赖字段的当前值
   * - `$value`：当前触发联动的变更值
   */
  action: string;
}

/**
 * 查询栏 - 数据源配置。
 *
 * 决定可选项控件（select / radio / checkbox / cascader）的选项数据来源。
 * 根据 type 不同，dataMaker 的结构不同。
 */
export interface SBDataSource {
  /**
   * 数据源类型编码。
   *
   * 值枚举：
   * - `'1'`：静态数据
   * - `'3'`：字典数据
   * - `'6'`：全局作用域变量
   * - `'7'`：RPC 服务
   * - `'8'`：数据库查询（数据集）
   */
  type: '1' | '3' | '6' | '7' | '8' | string;

  /**
   * 数据构造器。
   *
   * 根据 type 不同，结构不同：
   * - `type = '1'`（静态数据）：JSON 字符串，如 `'[{"label":"选项1","value":"1"}]'`
   * - `type = '3'`（字典数据）：级联选择器选中的字典路径
   * - `type = '6'`（全局作用域变量）：scopeConfig 中定义的 array 类型变量名
   * - `type = '7'`（RPC 服务）：SBDataSourceRpc 对象
   * - `type = '8'`（数据库查询/数据集）：数据集名称字符串
   */
  dataMaker: string | SBDataSourceRpc;
}

/**
 * 查询栏 - RPC 服务数据构造器（dataSource.type = '7' 时使用）。
 */
export interface SBDataSourceRpc {
  /** RPC 服务名 */
  rpcService: string;
  /** RPC 方法名 */
  rpcMethod: string;
  /**
   * RPC 入参脚本。
   *
   * 脚本返回一个数组，数组元素将作为 RPC 方法的参数传入。
   * 示例：`return [scopeField1, scopeField2]`
   */
  serviceInputsScript: string;
  /**
   * RPC 出参过滤脚本。
   *
   * 脚本接收 RPC 返回值，返回过滤/转换后的选项数组。
   * 示例：`return $$result.map(item => ({ label: item.name, value: item.id }))`
   */
  serviceOutputsScript: string;
}

/**
 * 查询栏控件逻辑配置。
 *
 * 包含数据源、校验、联动、事件四大逻辑维度，
 * 控制查询栏控件在运行时的数据获取、输入校验、字段联动和事件响应行为。
 */
export interface SearchBarFieldLogic {
  /**
   * 数据源配置。
   *
   * 决定可选项控件（select / radio / checkbox / cascader）的选项数据来源。
   * 根据 type 不同，dataMaker 的结构不同。
   */
  dataSource: SBDataSource;

  /**
   * 校验规则列表。
   *
   * 当前搜索栏的校验功能尚未开放配置，配置面板无入口，运行时逻辑已注释。
   * 所有控件 struct 中均初始化为空数组 `[]`。
   * 目前仅通过控件 config 上的 `required` 字段做简单必填校验。
   */
  validate: unknown[];

  /**
   * 联动配置（可选）。
   *
   * 定义当前控件与其他控件之间的响应式联动关系。
   * 当依赖字段的值发生变化时，根据配置的动作自动修改目标控件的属性。
   */
  interaction?: SBInteraction;
}

/**
 * 查询栏生命周期。
 */
export interface SearchBarLifeCycle {
  /**
   * created 钩子脚本。
   */
  created: string;

  /**
   * mounted 钩子脚本。
   */
  mounted: string;

  /**
   * beforeDestroy 钩子脚本。
   */
  beforeDestroy: string;

  /**
   * destroyed 钩子脚本。
   */
  destroyed: string;
}

/**
 * 查询栏布局配置。
 */
export interface SearchBarLayout {
  /**
   * 组件逻辑配置。
   */
  componentLogic: SearchBarComponentLogic;

  /**
   * 表单尺寸。
   * 值枚举：
   * - `'small'`：小
   * - `'medium'`：中
   * - `'large'`：大
   */
  formSize: string;

  /**
   * 总高度。
   */
  height: string;

  /**
   * 标签位置。
   * 值枚举：
   * - `'left'`：左侧
   * - `'top'`：上方
   * - `'right'`：右侧
   */
  labelPosition: string;

  /**
   * 标签宽度。
   */
  labelWidth: string;

  /**
   * 布局模式编码。
   * 固定值：`'1'`
   */
  layoutMode: string;

  /**
   * 点击查询前不显示报表内容。
   */
  noDataWithoutSearch: boolean;

  /**
   * 内边距配置。
   */
  padding: SearchBarPadding;

  /**
   * 总宽度。
   */
  width: string;

  /**
   * 宽度模式编码。
   * 固定值：`'0'`
   */
  widthMode: string;

  /**
   * 是否显示边框。
   */
  withBorder: boolean;
}

/**
 * 查询栏组件逻辑配置。
 */
export interface SearchBarComponentLogic {
  /**
   * 固定值：0
   */
  fromDic: string;
}

/**
 * 查询栏内边距。
 */
export interface SearchBarPadding {
  /**
   * 上内边距。
   */
  top: number;

  /**
   * 右内边距。
   */
  right: number;

  /**
   * 下内边距。
   */
  bottom: number;

  /**
   * 左内边距。
   */
  left: number;
}

/**
 * 事件配置项。
 */
export interface EventConfigItem {
  /**
   * 事件名。
   * 可用事件名：beforeload / afterload / beforerender / afterrender / beforeprint / afterprint / childReportMsg
   */
  eventName: string;

  /**
   * 事件脚本。
   */
  expressionStatement: string;
}

/**
 * 数据服务配置。
 */
export interface ServiceConfig {
  /**
   * 数据源类型编码。
   * 项目中已知：
   * - 0：RPC
   * - 1：HTTP
   * - 2：服务中心
   * - 3：数据库查询
   */
  datasourceType: number | string;

  /**
   * 数据库查询配置列表。
   */
  dbConfig: DbConfigItem[];
  
  /**
   * 入参定义。
   */
  inputs: ServiceInputConfig[];

  /**
   * 入参模式编码。
   * 值枚举：
   * - `'0'`：数组类型
   * - `'1'`：json类型
   * - `'2'`：基础类型
   */
  inputsType: number;

  /**
   * 出参定义。
   */
  outputs: OutputConfigItem[];

  /**
   * 出参过滤脚本。
   * 示例：return $$result.body
   */
  outputsFilterScript: string;

  /**
   * 请求头脚本。
   * 示例：
   * return {
   *  "Content-Type": "application/json"
   * }
   */
  requestHeaderScript: string;

  /**
   * HTTP 模式请求方法。
   * 常见：GET / POST。
   */
  requestMethod?: string;

  /**
   * HTTP 模式请求地址。
   * datasourceType = 1 时常用。
   */
  requestUrl?: string;

  /**
   * RPC 方法名。
   * datasourceType = 0 时常用。
   */
  rpcMethod?: string;

  /**
   * RPC 服务名。
   * datasourceType = 0 时常用。
   */
  rpcService?: string;

  /**
   * 服务端数据库配置（全局数据集映射）。
   *
   * 存储报表引用的全局数据集（服务器数据集）的映射信息。
   * 每个元素仅包含 `dsName` 和 `reportId`，运行时通过 `reportId` 向服务端请求完整的数据库配置，
   */
  serverDbConfig: ServerDbConfigItem[];

  /**
   * 服务中心应用域。
   * datasourceType = 2 时常用。
   */
  bizDomain?: string;

  /**
   * 服务中心服务名。
   */
  bizService?: string;

  /**
   * 服务中心方法名。
   */
  bizMethod?: string;

  /**
   * 服务中心服务名的另一套字段。
   */
  bizServiceName?: string;

  /**
   * 服务中心方法名的另一套字段。
   */
  bizMethodName?: string;

  /**
   * 服务中心分类编码。
   */
  bizCategoryCode?: string;
}

/**
 * 服务端数据库配置项（全局数据集映射条目）。
 *
 * 作为 `serverDbConfig` 数组的元素，仅存储数据集名到报表 ID 的映射。
 * 运行时通过 `reportId` 调用 `reportDataFindListAPI` 获取完整的 SQL、参数等配置。
 */
export interface ServerDbConfigItem {
  /**
   * 数据集名称。
   */
  dsName: string;

  /**
   * 全局数据集编码。
   */
  reportId: string;
}

/**
 * 数据库配置项。
 */
export interface DbConfigItem {
  /**
   * 数据库编码。
   */
  dbCd: string;

  /**
   * 数据源 ID。
   */
  dbId: string;

  /**
   * 数据集名称。
   */
  dsName: string;

  /**
   * SQL 参数列表。
   * 当前样例为空数组。
   */
  params: SqlParam[];

  /**
   * SQL 语句。
   */
  sql: string;

  /**
   * SQL 超时时间。
   */
  timeout?: number;

  /**
   * SQL 查询限制数量。
   */
  limit?: number;

  /**
   * 数据集类型。
   * 项目中已知：
   * - normaldb
   * - uniondb
   * - treedb
   */
  type?: "normaldb" | "uniondb" | "treedb" | string;

  /**
   * 数据集补充配置。
   *
   * 根据 type 不同，结构不同：
   * - `type = 'normaldb'`：无此字段
   * - `type = 'uniondb'`：`DbUnionConfigItem[]`，关联数据集列表
   * - `type = 'treedb'`：`DbTreeConfig`，树数据集配置
   */
  config?: DbUnionConfigItem[] | DbTreeConfig;
}

/**
 * 关联数据集配置项（DbConfigItem.type = 'uniondb' 时的 config 数组元素）。
 *
 * 描述一个参与合并的子数据集及其合并条件。
 */
export interface DbUnionConfigItem {
  /**
   * 合并条件表达式。
   *
   * 脚本表达式，运行时求值决定是否合并该子数据集。
   * 示例：`$$option == "ds1"`
   * 为空字符串时表示无条件合并。
   */
  condition: string;

  /**
   * 子数据集名称。
   */
  dsName: string;

  /**
   * 报表 ID（仅 type = 'serverdb' 时有值）。
   */
  reportId: string;

  /**
   * 子数据集类型。
   *
   * 值枚举：
   * - `'normaldb'`：普通数据集
   * - `'serverdb'`：服务器数据集
   */
  type: string;
}

/**
 * 树数据集配置（DbConfigItem.type = 'treedb' 时的 config）。
 *
 * 描述如何将扁平数据转换为树形结构。
 */
export interface DbTreeConfig {
  /**
   * 原始标记字段名。
   *
   * 扁平数据中每条记录的唯一标识字段（如 `'id'`）。
   */
  idField: string;

  /**
   * 父标记字段名。
   *
   * 扁平数据中指向父记录标识的字段（如 `'parentId'`）。
   * 运行时通过 `idField` 和 `parentIdField` 构建树形层级关系。
   */
  parentIdField: string;

  /**
   * 报表 ID（仅 sourceDBType = 'serverdb' 时有值）。
   */
  reportId: string;

  /**
   * 源数据集类型。
   *
   * 值枚举：
   * - `'normaldb'`：普通数据集
   * - `'serverdb'`：服务器数据集
   */
  sourceDBType: string;

  /**
   * 源数据集名称。
   *
   * 树数据基于该数据集的查询结果构建。
   */
  sourceDSName: string;
}

/**
 * 单元格超链接配置项。
 */
export interface HyperlinkConfig {
  /**
   * 链接项唯一标识。
   * 原生表格点击时通常依赖它区分当前点中了哪一个链接动作。
   */
  id: string;

  /**
   * 链接项名称。
   */
  name: string;

  /**
   * 超链接类型。
   *
   * 值枚举：
   * - `webLink`
   * - `javascriptConf`
   * - `dynamicParams`
   * - `internetReport`
   */
  type: string;

  /**
   * 类型对应的配置对象。
   */
  data:
    | WebLinkHyperlinkData
    | JavascriptHyperlinkData
    | DynamicParamsHyperlinkData
    | InternetReportHyperlinkData
}

/**
 * 网页链接配置。
 */
export interface WebLinkHyperlinkData {
  /**
   * 目标 URL。
   * 运行时会校验是否为合法 URL，并把 `params` 拼到查询串里。
   */
  url: string;

  /**
   * 打开方式。
   *
   * 值枚举：
   * - `_blank`：新窗口/新标签打开
   * - `_self`：当前窗口打开
   * - `_dialog`：在当前报表的弹窗 iframe 中预览网页
   */
  target?: string;

  /**
   * 弹窗标题。
   * `target = '_dialog'` 时常用。
   */
  title?: string;

  /**
   * 弹窗宽度。
   * `target = '_dialog'` 时常用。
   */
  width?: number;

  /**
   * 弹窗高度。
   * `target = '_dialog'` 时常用。
   */
  height?: number;

  /**
   * URL 查询参数列表。
   *
   * 每一项的解析规则：
   * - `parameterName`：最终 query key
   * - `parameterScope` 有值：从当前报表 `reportScope` 取值
   * - `parameterType = 'formula'`：把 `parameterDesc` 当公式/表达式执行
   * - 其他情况：直接把 `parameterDesc` 作为常量值
   *
   * 解析完成后，运行时会把结果写入 `value`，再拼接到 URL 上。
   */
  params: ServiceInputConfig[];
}

/**
 * JS 脚本超链接配置。
 */
export interface JavascriptHyperlinkData {
  /**
   * 要执行的脚本正文（js脚本）。
   * 点击时会以字符串形式送入运行时脚本执行器。
   * 示例：console.log('输出')
   */
  scriptData: string;
}

/**
 * 动态参数超链接配置。
 *
 * 点击后会把参数值回写到当前报表 `reportScope`，然后触发重新渲染。
 */
export type DynamicParamsHyperlinkData = ServiceInputConfig[];

/**
 * 网络报表超链接配置。
 */
export interface InternetReportHyperlinkData {
  /**
   * 子报表编码 / 网络报表编码。
   */
  code: string;

  /**
   * 对话框标题。
   */
  title?: string;

  /**
   * 对话框宽度。
   */
  width?: number;

  /**
   * 对话框高度。
   */
  height?: number;

  /**
   * 打开目标。
   *
   * 值枚举：
   * - `0`：新窗口：拼接查询参数后，新窗口打开网络报表地址
   * - `1`：对话框：在当前页面弹窗内挂载子报表预览
   */
  target?: string;

  /**
   * 是否继承当前报表作用域。
   * 为 `true` 时，会先把当前 `reportScope` 整体注入子报表，再叠加 `params`。
   */
  integration?: boolean;

  /**
   * 子报表版本号。
   * 未传时运行时常回退到 `1.0.1`。
   */
  version?: string;

  /**
   * 值枚举：
   * - `1`：打印预览
   * - `2`：普通预览
   */
  reviewMode?: string;

  /**
   * 传给子报表的输入参数列表。
   */
  params: ServiceInputConfig[];
}

/**
 * 服务输入参数定义。
 */
export interface ServiceInputConfig {
  /**
   * 参数值或字段说明。
   *
   * 在超链接场景里常见几种含义：
   * - 常量模式：直接作为固定值
   * - 作用域模式：作为 `reportScope` 的字段名使用
   * - 公式模式：作为待执行表达式脚本
   * - 对象/数组模式：可继续嵌套子参数结构
   */
  parameterDesc?: unknown;

  /**
   * 参数名。
   * 场景1：数据源是http或rpc，并且是Array类型的入参，保存的时候没有参数名，这个字段不存在。
   */
  parameterName?: string;

  /**
   * 参数类型。
   *
   * 值枚举：
   * - `string` / `number` / `boolean`
   * - `formula`：把 `parameterDesc` 当表达式执行 (充当数据源入参的时候没有公式类型)
   * - `array`：表示参数值是数组
   * - `object`：表示参数值是对象
   */
  parameterType?: string;

  /**
   * 注入到全局作用域时使用的变量名。
   * 例如 `orgId`、`reportDate`。
   * 写法:$$reportScope.y (表示将全局作用域的变量注入当前变量)
   */
  parameterScope?: string;
}

/**
 * SQL 参数定义。
 */
export interface SqlParam {
  /**
   * 参数名。
   */
  parameterName: string;

  /**
   * 参数值或子参数描述。
   *
   * 根据 parameterType 不同，值类型不同：
   * - 基础类型（`'string'`、`'number'`、`'boolean'`）：直接存储字面值
   * - `'object'`：`SqlParam[]`，存储对象属性的子参数列表
   * - `'array'`：`SqlParam[]`，存储数组元素的子参数列表
   */
  parameterDesc?: string | number | boolean | SqlParam[];

  /**
   * 参数类型。
   *
   * 值枚举：
   * - `'string'`：字符串
   * - `'number'`：数字
   * - `'boolean'`：布尔
   * - `'object'`：对象（parameterDesc 为 SqlParam[] 子参数列表）
   * - `'array'`：数组（parameterDesc 为 SqlParam[] 子参数列表）
   */
  parameterType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | string;

  /**
   * 注入全局变量名。
   *
   * 格式为 `$$reportScope.{变量名}`，如 `$$reportScope.startDate`。
   * 当此字段不为空时，运行时从 `reportScope` 中取对应变量值作为实际参数值，
   * 覆盖 parameterDesc 中的静态值。
   *
   * 为空字符串时表示不注入，使用 parameterDesc 的静态值。
   */
  parameterScope?: string;
}

/**
 * 出参配置项。
 */
export interface OutputConfigItem {
  /**
   * 出参参数名。
   */
  parameterName: string;

  /**
   * 出参参数类型。
   * 值枚举：
   * - `'string'`：字符串
   * - `'number'`：数字
   * - `'boolean'`：布尔值
   * - `'array'`：数组
   * - `'object'`：对象
   */
  parameterType: string;

  /**
   * 出参默认值。
   */
  parameterDesc: OutputConfigItem[];

  /**
   * 出参备注。
   */
  remark?: string;
}

/**
 * 顶部工具栏配置。
 */
export interface HeaderOptions {
  /**
   * 是否显示“转 Excel”按钮。
   */
  excel?: boolean;

  /**
   * 是否显示分页器。
   */
  pagination?: boolean;

  /**
   * 是否显示“转 PDF”按钮。
   */
  pdf?: boolean;

  /**
   * 是否显示“打印”按钮。
   */
  print?: boolean;

  /**
   * 是否显示“打印当前页”按钮。
   */
  printCurrent?: boolean;

  /**
   * 是否显示整个头部工具栏。
   */
  show?: boolean;

  /**
   * 是否显示打印配置面板。
   */
  showPrintConf?: boolean;
}

/**
 * 服务端分页字段映射。
 */
export interface HeaderServicePagination {
  pageNo?: string;
  pageSize?: string;
  total?: string;
}

/**
 * 打印选项。
 */
export interface PrintOptions {
  /**
   * 极细线条优化是否启用。
   */
  asPDF?: boolean;

    /**
   * 单双面打印模式。
   * 值枚举：
   * - simplex：单面打印
   * - duplex：双面打印
   */
  duplex: string;

  /**
   * 自定义打印页码。
   *
   * 仅在 `pageState = 'custom'` 时生效，支持以下写法（可组合，逗号分隔）：
   * - `1-3`：打印第 1 页到第 3 页
   * - `2`：只打印第 2 页
   * - `odd`：打印所有奇数页
   * - `even`：打印所有偶数页
   * - `1-5,odd`：打印第 1 到 5 页中的奇数页（即第 1、3、5 页）
   * - `1-5,even`：打印第 1 到 5 页中的偶数页（即第 2、4 页）
   * - `1,3,6`：打印第 1、3、6 页
   */
  page: string;

  /**
   * 打印页面范围模式。
   *
   * 值枚举：
   * - `''`：全部页面
   * - `'odd'`：仅奇数页
   * - `'even'`：仅偶数页
   * - `'custom'`：自定义页码（配合 `page` 字段使用）
   */
  pageState?: string;

  /**
   * 打印方向。
   * 值枚举：
   * - `landscape`：横向
   * - `portrait`：纵向
   */
  pl: string;

  /**
   * 打印时显示打印系统配置（打印的时候会弹出系统的打印弹窗）。
   */
  popWindow: boolean;

  /**
   * 打印机名称(空值为默认打印机)。
   */
  printName: string;

  /**
   * 打印程序类型。
   * 值枚举：
   * - `electron`：html 打印
   * - `su` | `gs`：pdf打印（默认是su)
   */
  printType: string;

  /**
   * 缩放策略。
   * 值枚举：
   * - `fit`：适应纸张大小
   * - `noscale`：不缩放
   */
  zoom: string;
}

/**
 * 自定义函数配置项。
 */
export interface FunctionConfigItem {
  /**
   * 函数名称。
   */
  cd?: string;

  /**
   * 函数内容。
   */
  content?: string;
}

/**
 * 引擎配置。
 */
export interface EngineConfig {
  /**
   * 是否启用后台分页。
   */
  enable: boolean;

  /**
   * 每页记录数（引擎分页大小）。
   */
  pageSize: number;

  /**
   * 是否显示总页数。（数据行数汇总）
   */
  showTotalPage: boolean;
}
