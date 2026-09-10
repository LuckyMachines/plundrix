"""Generate repeatable grayscale and color-vision review evidence."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = Path(__file__).resolve().parents[4]
SOURCE = REPO_ROOT / "app/reports/ui-review/latest/actual/instant-active-desktop.png"
MATRICES = {
    "GRAYSCALE": np.array(
        [[0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722]],
        dtype=np.float32,
    ),
    "PROTANOPIA": np.array(
        [[0.567, 0.433, 0.000], [0.558, 0.442, 0.000], [0.000, 0.242, 0.758]],
        dtype=np.float32,
    ),
    "DEUTERANOPIA": np.array(
        [[0.625, 0.375, 0.000], [0.700, 0.300, 0.000], [0.000, 0.300, 0.700]],
        dtype=np.float32,
    ),
    "TRITANOPIA": np.array(
        [[0.950, 0.050, 0.000], [0.000, 0.433, 0.567], [0.000, 0.475, 0.525]],
        dtype=np.float32,
    ),
}


def simulate(source: np.ndarray, matrix: np.ndarray) -> Image.Image:
    transformed = source @ matrix.T
    return Image.fromarray(np.uint8(np.clip(transformed, 0, 255)), mode="RGB")


def main() -> None:
    source_image = Image.open(SOURCE).convert("RGB")
    source = np.asarray(source_image, dtype=np.float32)
    width = 720
    height = round(source_image.height * width / source_image.width)
    header = 48
    gap = 6
    canvas = Image.new("RGB", (width * 2 + gap, (height + header) * 2 + gap), "#090b10")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)

    for index, (label, matrix) in enumerate(MATRICES.items()):
        view = simulate(source, matrix)
        view.save(SCRIPT_DIR / f"color-{label.lower()}.png", optimize=True)
        view = view.resize((width, height), Image.Resampling.LANCZOS)
        x = (index % 2) * (width + gap)
        y = (index // 2) * (height + header + gap)
        draw.text((x + 16, y + 13), label, fill="#eee9df", font=font)
        canvas.paste(view, (x, y + header))

    canvas.save(SCRIPT_DIR / "color-vision-contact-sheet.png", optimize=True)


if __name__ == "__main__":
    main()
