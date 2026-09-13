"""Build lightweight shipping and review derivatives from canonical Blender renders."""

from __future__ import annotations

import argparse
import html
import pathlib

from PIL import Image, ImageDraw, ImageFont


STATES = (
    ("preparing", "PREPARING"),
    ("choose-pick", "CHOOSE / PICK"),
    ("simultaneous-reveal", "SIMULTANEOUS REVEAL"),
    ("sabotage-impact", "SABOTAGE IMPACT"),
    ("vault-breach", "VAULT BREACH"),
)


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--shipping", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--max-bytes", type=int, default=360000)
    return parser.parse_args()


def font(size: int):
    for candidate in ("C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/arial.ttf"):
        if pathlib.Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def main() -> None:
    args = arguments()
    source = pathlib.Path(args.source).resolve()
    shipping = pathlib.Path(args.shipping).resolve()
    report = pathlib.Path(args.report).resolve()
    shipping.parent.mkdir(parents=True, exist_ok=True)
    report.mkdir(parents=True, exist_ok=True)

    images = []
    for state, label in STATES:
        path = source / f"{state}.png"
        image = Image.open(path).convert("RGB")
        images.append((state, label, image))

    preparing = images[0][2]
    preparing.save(shipping, format="WEBP", quality=80, method=6)
    if shipping.stat().st_size > args.max_bytes:
        preparing.save(shipping, format="WEBP", quality=72, method=6)
    if shipping.stat().st_size > args.max_bytes:
        raise RuntimeError(f"Shipping backdrop exceeds {args.max_bytes} bytes: {shipping.stat().st_size}")

    for state, _, image in images:
        state_path = shipping.parent / f"nightfall-vault-{state}.webp"
        image.save(state_path, format="WEBP", quality=78, method=6)

    thumb = preparing.copy()
    thumb.thumbnail((240, 150), Image.Resampling.LANCZOS)
    thumb.save(report / "thumbnail-readability.png", optimize=True)

    tile_width = 640
    tile_height = 400
    label_height = 48
    sheet = Image.new("RGB", (tile_width * 2, (tile_height + label_height) * 3), "#07090D")
    draw = ImageDraw.Draw(sheet)
    title_font = font(19)
    for index, (state, label, image) in enumerate(images):
        x = (index % 2) * tile_width
        y = (index // 2) * (tile_height + label_height)
        tile = image.resize((tile_width, tile_height), Image.Resampling.LANCZOS)
        sheet.paste(tile, (x, y + label_height))
        draw.rectangle((x, y, x + tile_width, y + label_height), fill="#10131B")
        draw.text((x + 18, y + 14), label, fill="#E8B078", font=title_font)
    sheet.save(report / "world-state-contact-sheet.png", optimize=True)

    cards = "\n".join(
        f'<figure><img src="../../../assets/world-source/renders/{state}.png" alt="{html.escape(label.title())} canonical vault render"><figcaption>{html.escape(label)}</figcaption></figure>'
        for state, label in STATES
    )
    (report / "index.html").write_text(
        "<!doctype html><meta charset=\"utf-8\"><title>Plundrix world review</title>"
        "<style>body{margin:0;padding:24px;background:#07090d;color:#d8ccb3;font:14px Consolas,monospace}"
        "h1{color:#e8b078}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:18px}"
        "figure{margin:0;border:1px solid #35404b;background:#10131b}img{display:block;width:100%;height:auto}"
        "figcaption{padding:12px;color:#66c4d2;letter-spacing:.12em}</style>"
        "<h1>NIGHTFALL VAULT / CANONICAL STATES</h1><main>" + cards + "</main>",
        encoding="utf-8",
    )

    print(f"Shipping backdrop: {shipping} ({shipping.stat().st_size} bytes)")
    print(f"World contact sheet: {report / 'world-state-contact-sheet.png'}")


if __name__ == "__main__":
    main()
