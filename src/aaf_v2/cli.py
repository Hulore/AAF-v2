from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Sequence

from .api import generate_active_icon, preview_active_icon
from .models import AafIconRequest, AafIconResult


def load_request(path: Path) -> AafIconRequest:
    return AafIconRequest.from_dict(json.loads(path.read_text(encoding="utf-8")))


def print_result(result: AafIconResult) -> None:
    print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="AAF v2 active ability icon renderer")
    subparsers = parser.add_subparsers(dest="command", required=True)

    preview_parser = subparsers.add_parser("preview", help="Return generated SVG in JSON output")
    preview_parser.add_argument("input", type=Path)

    generate_parser = subparsers.add_parser("generate", help="Write generated SVG to output path")
    generate_parser.add_argument("input", type=Path)
    generate_parser.add_argument("output", type=Path)

    args = parser.parse_args(argv)

    try:
        request = load_request(args.input)
        if args.command == "preview":
            result = preview_active_icon(request)
        else:
            result = generate_active_icon(request, args.output)
    except Exception as exc:
        result = AafIconResult(ok=False, errors=[str(exc)])

    print_result(result)
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

