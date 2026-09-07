#!/usr/bin/env python3
"""Fit and render a one-point perspective hypothesis from supplied line segments."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--segment", action="append", required=True, help="x1,y1,x2,y2")
    return parser.parse_args()


def main() -> None:
    args = arguments()
    segments = []
    rows = []
    values = []
    for encoded in args.segment:
        x1, y1, x2, y2 = (float(value) for value in encoded.split(","))
        segments.append(((x1, y1), (x2, y2)))
        a, b, c = y1 - y2, x2 - x1, x1 * y2 - x2 * y1
        scale = math.hypot(a, b)
        rows.append([a / scale, b / scale])
        values.append(-c / scale)

    matrix = np.asarray(rows)
    target = np.asarray(values)
    point, _, _, _ = np.linalg.lstsq(matrix, target, rcond=None)
    residual = float(np.sqrt(np.mean(np.square(matrix @ point - target))))

    source = Image.open(args.image).convert("RGB")
    overlay = source.copy()
    overlay_draw = ImageDraw.Draw(overlay)
    guide = Image.new("RGB", source.size, "#09070b")
    guide_draw = ImageDraw.Draw(guide)
    colors = ["#ff4fa3", "#57d6ff", "#ffb454", "#69df9b"]
    for index, ((x1, y1), (x2, y2)) in enumerate(segments):
        color = colors[index % len(colors)]
        for draw in (overlay_draw, guide_draw):
            draw.line((x1, y1, point[0], point[1]), fill=color, width=3)
            draw.ellipse((x1 - 5, y1 - 5, x1 + 5, y1 + 5), fill=color)
    horizon_y = float(point[1])
    overlay_draw.line((0, horizon_y, source.width, horizon_y), fill="#ffffff", width=2)
    overlay_draw.ellipse((point[0] - 9, point[1] - 9, point[0] + 9, point[1] + 9), fill="#ffffff")
    guide_draw.line((0, horizon_y, source.width, horizon_y), fill="#ffffff", width=2)
    guide_draw.ellipse((point[0] - 9, point[1] - 9, point[0] + 9, point[1] + 9), fill="#ffffff")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    overlay.save(args.output_dir / "instant-scene-perspective-overlay.png", optimize=True)
    guide.save(args.output_dir / "instant-scene-perspective-guide.png", optimize=True)
    record = {
        "source": str(args.image.resolve()),
        "segments": [{"p1": list(p1), "p2": list(p2)} for p1, p2 in segments],
        "vanishingPointPixels": [round(float(point[0]), 3), round(float(point[1]), 3)],
        "vanishingPointNormalized": [round(float(point[0]) / source.width, 5), round(float(point[1]) / source.height, 5)],
        "horizonAssumption": "horizontal line through the fitted vanishing point",
        "fitResidualRmsPixels": round(residual, 3),
    }
    (args.output_dir / "instant-scene-perspective.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
