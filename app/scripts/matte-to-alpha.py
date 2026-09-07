#!/usr/bin/env python3
"""Turn Flux's pink extraction matte into a transparent PNG.

Flux can soften a requested flat matte into a gradient. Keying one exact RGB
value leaves a halo, so this extractor measures magenta dominance instead.
That keeps neutral steel, brass, green light, and red paint while removing the
whole family of pink background values.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--opaque-score", type=int, default=8)
    parser.add_argument("--transparent-score", type=int, default=32)
    return parser.parse_args()


def alpha_for_score(score: int, opaque_score: int, transparent_score: int) -> int:
    if score <= opaque_score:
        return 255
    if score >= transparent_score:
        return 0
    return round(255 * (transparent_score - score) / (transparent_score - opaque_score))


def main() -> None:
    args = parse_args()
    if args.transparent_score <= args.opaque_score:
        raise SystemExit("--transparent-score must be greater than --opaque-score")

    source = Image.open(args.input).convert("RGBA")
    result = Image.new("RGBA", source.size)
    pixels = []
    transparent = 0
    partial = 0
    opaque = 0

    source_pixels = source.get_flattened_data() if hasattr(source, "get_flattened_data") else source.getdata()
    for red, green, blue, source_alpha in source_pixels:
        # A genuine magenta matte has both red and blue above green. Using the
        # weaker of those two differences protects brass and red accents.
        score = min(red - green, blue - green)
        extracted_alpha = alpha_for_score(score, args.opaque_score, args.transparent_score)
        alpha = min(source_alpha, extracted_alpha)
        if alpha == 0:
            transparent += 1
        elif alpha == 255:
            opaque += 1
        else:
            partial += 1
        pixels.append((red, green, blue, alpha))

    result.putdata(pixels)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output, format="PNG", optimize=True)
    total = source.width * source.height
    print(json.dumps({
        "width": source.width,
        "height": source.height,
        "transparentFraction": round(transparent / total, 6),
        "partialFraction": round(partial / total, 6),
        "opaqueFraction": round(opaque / total, 6),
        "opaqueScore": args.opaque_score,
        "transparentScore": args.transparent_score,
    }))


if __name__ == "__main__":
    main()
