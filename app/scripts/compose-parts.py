#!/usr/bin/env python3
"""Place one transparent art part repeatedly into a generated scene base."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("base", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--part", required=True, type=Path)
    parser.add_argument("--size", required=True, type=int)
    parser.add_argument("--positions", required=True, help="Semicolon-separated top-left x,y pairs")
    parser.add_argument("--brightness", type=float, default=1.08)
    parser.add_argument("--clone", action="append", default=[], help="source-x,source-y,width,height,destination-x,destination-y")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    canvas = Image.open(args.base).convert("RGBA")
    for clone in args.clone:
        source_x, source_y, width, height, destination_x, destination_y = map(int, clone.split(","))
        patch = canvas.crop((source_x, source_y, source_x + width, source_y + height))
        canvas.alpha_composite(patch, (destination_x, destination_y))
    part = Image.open(args.part).convert("RGBA")
    part = part.resize((args.size, args.size), Image.Resampling.LANCZOS)
    if args.brightness != 1:
        rgb = ImageEnhance.Brightness(part.convert("RGB")).enhance(args.brightness)
        part = Image.merge("RGBA", (*rgb.split(), part.getchannel("A")))

    positions = []
    for value in args.positions.split(";"):
        x_text, y_text = value.split(",", 1)
        position = (int(x_text), int(y_text))
        positions.append(position)

    if not positions:
        raise SystemExit("At least one placement is required")

    alpha = part.getchannel("A")
    shadow_alpha = alpha.filter(ImageFilter.GaussianBlur(max(2, args.size // 28)))
    shadow = Image.new("RGBA", part.size, (0, 0, 0, 0))
    shadow.putalpha(shadow_alpha.point(lambda value: round(value * 0.48)))
    for x, y in positions:
        canvas.alpha_composite(shadow, (x + 3, y + 5))
        canvas.alpha_composite(part, (x, y))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(args.output, format="PNG", optimize=True)
    print(json.dumps({
        "width": canvas.width,
        "height": canvas.height,
        "part": str(args.part),
        "placements": len(positions),
        "positions": positions,
        "clonedBasePatches": len(args.clone),
        "size": args.size,
    }))


if __name__ == "__main__":
    main()
