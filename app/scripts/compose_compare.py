import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main():
    parser = argparse.ArgumentParser(description='Compose two screenshots at a shared display height.')
    parser.add_argument('--reference', required=True)
    parser.add_argument('--actual', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--reference-label', default='REFERENCE')
    parser.add_argument('--actual-label', default='ACTUAL')
    args = parser.parse_args()

    reference = Image.open(args.reference).convert('RGB')
    actual = Image.open(args.actual).convert('RGB')
    target_height = min(reference.height, actual.height, 1400)

    def fit(image):
        width = max(1, round(image.width * target_height / image.height))
        return image.resize((width, target_height), Image.Resampling.LANCZOS)

    reference = fit(reference)
    actual = fit(actual)
    gap = 24
    label_height = 48
    canvas = Image.new('RGB', (reference.width + actual.width + gap, target_height + label_height), '#0A0A0F')
    canvas.paste(reference, (0, label_height))
    canvas.paste(actual, (reference.width + gap, label_height))
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default(size=18)
    draw.text((14, 14), args.reference_label, fill='#C8C8D4', font=font)
    draw.text((reference.width + gap + 14, 14), args.actual_label, fill='#E8B078', font=font)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, optimize=True)


if __name__ == '__main__':
    main()

