#!/usr/bin/env python3
"""Create reproducible relative-depth evidence for a visual comparison."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFont
from transformers import AutoImageProcessor, AutoModelForDepthEstimation


MODEL_ID = "depth-anything/Depth-Anything-V2-Small-hf"


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", required=True, type=Path)
    parser.add_argument("--actual", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    return parser.parse_args()


def infer(image_path: Path, processor, model) -> tuple[Image.Image, Image.Image]:
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        prediction = model(**inputs).predicted_depth
    prediction = torch.nn.functional.interpolate(
        prediction.unsqueeze(1), size=(image.height, image.width), mode="bicubic", align_corners=False
    ).squeeze().cpu().numpy()
    low, high = np.percentile(prediction, [2, 98])
    normalized = np.clip((prediction - low) / max(high - low, 1e-8), 0, 1)
    gray = (normalized * 255).astype(np.uint8)
    grayscale = Image.fromarray(gray, mode="L")
    color = Image.fromarray(cv2.cvtColor(cv2.applyColorMap(gray, cv2.COLORMAP_TURBO), cv2.COLOR_BGR2RGB))
    return grayscale, color


def fit_height(image: Image.Image, height: int) -> Image.Image:
    return image.resize((round(image.width * height / image.height), height), Image.Resampling.LANCZOS)


def main() -> None:
    args = arguments()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForDepthEstimation.from_pretrained(MODEL_ID).eval()

    ref_gray, ref_color = infer(args.reference, processor, model)
    actual_gray, actual_color = infer(args.actual, processor, model)
    ref_gray.save(args.output_dir / "reference-grayscale.png")
    actual_gray.save(args.output_dir / "actual-grayscale.png")

    height = 720
    gap = 24
    header = 54
    ref_panel = fit_height(ref_color, height)
    actual_panel = fit_height(actual_color, height)
    comparison = Image.new("RGB", (ref_panel.width + gap + actual_panel.width, height + header), "#09070b")
    comparison.paste(ref_panel, (0, header))
    comparison.paste(actual_panel, (ref_panel.width + gap, header))
    draw = ImageDraw.Draw(comparison)
    font = ImageFont.load_default(size=18)
    draw.text((16, 16), "REFERENCE RELATIVE DEPTH", fill="#f272b5", font=font)
    draw.text((ref_panel.width + gap + 16, 16), "ACTUAL RELATIVE DEPTH", fill="#f272b5", font=font)
    comparison.save(args.output_dir / "reference-vs-actual-depth.png", optimize=True)

    metadata = {
        "model": MODEL_ID,
        "interpretation": "Per-image relative depth only; warm/bright is relatively near and cool/dark is relatively far. Not metric distance.",
        "reference": str(args.reference.resolve()),
        "actual": str(args.actual.resolve()),
        "outputs": ["reference-grayscale.png", "actual-grayscale.png", "reference-vs-actual-depth.png"],
    }
    (args.output_dir / "depth-metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print((args.output_dir / "reference-vs-actual-depth.png").resolve())


if __name__ == "__main__":
    main()
