"""Reproduce the relative-depth evidence for the Plundrix synthesis review."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFont
from transformers import pipeline


MODEL_ID = "depth-anything/Depth-Anything-V2-Small-hf"
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = Path(__file__).resolve().parents[4]
STUDY_DIR = SCRIPT_DIR.parent
INPUTS = {
    "SYNTHESIS REFERENCE": STUDY_DIR / "05-recommended-synthesis.png",
    "CURRENT PRODUCT": REPO_ROOT
    / "app/reports/ui-review/latest/actual/instant-active-desktop.png",
}


def normalize_depth(depth: torch.Tensor, size: tuple[int, int]) -> np.ndarray:
    if depth.ndim == 3:
        depth = depth.unsqueeze(1)
    elif depth.ndim == 2:
        depth = depth.unsqueeze(0).unsqueeze(0)
    depth = torch.nn.functional.interpolate(
        depth,
        size=size,
        mode="bicubic",
        align_corners=False,
    )[0, 0]
    values = depth.detach().cpu().numpy().astype(np.float32)
    low, high = np.percentile(values, (2, 98))
    return np.clip((values - low) / max(high - low, 1e-6), 0, 1)


def colorize(norm: np.ndarray) -> Image.Image:
    red = np.clip(1.7 * norm, 0, 1)
    green = np.clip(1.6 - np.abs(norm - 0.55) * 2.4, 0, 1)
    blue = np.clip(1.7 * (1 - norm), 0, 1)
    rgb = np.uint8(np.stack([red, green, blue], axis=-1) * 255)
    return Image.fromarray(rgb, mode="RGB")


def main() -> None:
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    estimator = pipeline("depth-estimation", model=MODEL_ID, device=-1)
    colored: list[tuple[str, Image.Image]] = []

    for label, path in INPUTS.items():
        source = Image.open(path).convert("RGB")
        result = estimator(source)
        norm = normalize_depth(
            result["predicted_depth"],
            size=(source.height, source.width),
        )
        slug = "synthesis" if label.startswith("SYNTHESIS") else "current"
        Image.fromarray(np.uint8(norm * 255), mode="L").save(
            SCRIPT_DIR / f"depth-{slug}-gray.png"
        )
        colored.append((label, colorize(norm)))

    panel_width, panel_height = 1280, 853
    header_height, footer_height, divider = 74, 60, 6
    canvas = Image.new(
        "RGB",
        (panel_width * 2 + divider, header_height + panel_height + footer_height),
        "#0b0c10",
    )
    draw = ImageDraw.Draw(canvas)
    bold = "C:/Windows/Fonts/arialbd.ttf"
    label_font = ImageFont.truetype(bold, 28)
    small_font = ImageFont.truetype(bold, 18)

    for index, (label, image) in enumerate(colored):
        x = index * (panel_width + divider)
        image = image.resize((panel_width, panel_height), Image.Resampling.LANCZOS)
        canvas.paste(image, (x, header_height))
        draw.text((x + 22, 20), label, fill="#eee9df", font=label_font)

    draw.rectangle(
        (panel_width, 0, panel_width + divider, canvas.height),
        fill="#303542",
    )
    footer_y = header_height + panel_height + 18
    draw.text((22, footer_y), "COOL = RELATIVELY FAR", fill="#6da7ff", font=small_font)
    draw.text(
        (canvas.width - 268, footer_y),
        "WARM = RELATIVELY NEAR",
        fill="#ff9c64",
        font=small_font,
    )
    draw.text(
        (canvas.width // 2 - 214, footer_y),
        f"MODEL: {MODEL_ID}",
        fill="#9da3b1",
        font=small_font,
    )
    canvas.save(SCRIPT_DIR / "depth-comparison.png", optimize=True)


if __name__ == "__main__":
    main()
