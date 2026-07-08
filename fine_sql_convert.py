#!/usr/bin/env python3
import argparse
import json
import sys

from cpt_to_beereport import convert_fine_sql


def read_sql_from_prompt():
    print("请输入需要转换的 FineReport SQL。")
    print("支持多行粘贴，输入单独一行 END 后开始转换：")
    lines = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line.strip().upper() == "END":
            break
        lines.append(line)
    return "\n".join(lines).strip()


def print_result(result):
    print("\n转换后的 SQL：")
    print(result["sql"])
    print("\n推断 params：")
    print(json.dumps(result["params"], ensure_ascii=False, indent=2))
    print("\nfunctionConfig：")
    print(json.dumps(result["functionConfig"], ensure_ascii=False, indent=2))


def main(argv):
    parser = argparse.ArgumentParser(description="Convert FineReport dynamic SQL expressions to BeeReport SQL.")
    parser.add_argument("--sql", help="SQL text to convert. If omitted, the script prompts for multi-line input.")
    args = parser.parse_args(argv)

    sql = args.sql if args.sql is not None else read_sql_from_prompt()
    if not sql:
        print("没有输入 SQL。")
        return 1

    print_result(convert_fine_sql(sql))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
