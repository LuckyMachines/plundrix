from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
POSTER_DIR = ROOT / "output" / "imagegen" / "plundrix-posters"
SCREENSHOT_DIR = ROOT.parent / "plundrix-marketing" / "public" / "screenshots"
FONT_BLACK = Path(r"C:\Windows\Fonts\BarlowCondensed-Black.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\BarlowCondensed-Bold.ttf")
FONT_MEDIUM = Path(r"C:\Windows\Fonts\BarlowCondensed-Medium.ttf")

INK = (8, 11, 15, 255)
CREAM = (229, 218, 190, 255)
BRONZE = (194, 139, 75, 255)
CYAN = (94, 201, 218, 255)
GREEN = (112, 181, 124, 255)
RED = (240, 95, 74, 255)


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def tracked_text(draw, xy, text, text_font, fill, tracking, stroke_width=0, stroke_fill=None):
    x, y = xy
    for character in text:
        draw.text(
            (x, y),
            character,
            font=text_font,
            fill=fill,
            stroke_width=stroke_width,
            stroke_fill=stroke_fill,
        )
        x += draw.textlength(character, font=text_font) + tracking
    return x


def add_gradient(image, box, color, alpha_start, alpha_end, horizontal=False):
    x0, y0, x1, y1 = box
    width, height = x1 - x0, y1 - y0
    span = width if horizontal else height
    gradient = Image.new("L", (span, 1) if horizontal else (1, span), 0)
    pixels = gradient.load()
    for index in range(span):
        mix = index / max(1, span - 1)
        alpha = round(alpha_start + ((alpha_end - alpha_start) * mix))
        if horizontal:
            pixels[index, 0] = alpha
        else:
            pixels[0, index] = alpha
    gradient = gradient.resize((width, height))
    layer = Image.new("RGBA", (width, height), color)
    layer.putalpha(gradient)
    image.alpha_composite(layer, (x0, y0))


def draw_mark(draw, center, radius):
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline=BRONZE, width=4)
    draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=CREAM)
    for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        draw.line((x + dx * 9, y + dy * 9, x + dx * (radius - 5), y + dy * (radius - 5)), fill=BRONZE, width=3)


def action_line(draw, xy, size, tracking):
    x, y = xy
    action_font = font(FONT_BOLD, size)
    for label, fill in (("PICK", CYAN), (".", CREAM), ("SEARCH", GREEN), (".", CREAM), ("SABOTAGE", RED), (".", CREAM)):
        x = tracked_text(draw, (x, y), label, action_font, fill, tracking)
        x += tracking * 2


def frame(draw, width, height, inset, line_width):
    draw.rectangle((inset, inset, width - inset, height - inset), outline=(194, 139, 75, 180), width=line_width)
    corner = round(inset * 0.72)
    for x, y, sx, sy in (
        (inset, inset, 1, 1),
        (width - inset, inset, -1, 1),
        (inset, height - inset, 1, -1),
        (width - inset, height - inset, -1, -1),
    ):
        draw.line((x, y, x + sx * corner, y), fill=CREAM, width=line_width + 1)
        draw.line((x, y, x, y + sy * corner), fill=CREAM, width=line_width + 1)


def screen_panel(canvas, image_path, box, label, accent=BRONZE):
    x0, y0, x1, y1 = box
    width, height = x1 - x0, y1 - y0
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rectangle((x0 + 13, y0 + 18, x1 + 13, y1 + 18), fill=(0, 0, 0, 205))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))

    screen = Image.open(image_path).convert("RGB")
    screen = ImageOps.fit(screen, (width, height), method=Image.Resampling.LANCZOS)
    canvas.alpha_composite(screen.convert("RGBA"), (x0, y0))

    draw = ImageDraw.Draw(canvas)
    draw.rectangle((x0 - 4, y0 - 4, x1 + 4, y1 + 4), outline=INK, width=8)
    draw.rectangle((x0 - 5, y0 - 5, x1 + 5, y1 + 5), outline=accent, width=3)
    label_font = font(FONT_MEDIUM, max(22, round(height * 0.055)))
    label_width = min(width - 28, round(draw.textlength(label, font=label_font) + 42))
    draw.rectangle((x0 + 15, y0 + 15, x0 + 15 + label_width, y0 + 62), fill=(8, 11, 15, 232), outline=accent, width=2)
    tracked_text(draw, (x0 + 31, y0 + 20), label, label_font, accent, 2)


def build_vertical():
    source = Image.open(POSTER_DIR / "plundrix-poster-vertical-v1-art.jpg").convert("RGBA")
    width, height = source.size
    add_gradient(source, (0, 0, width, 670), INK, 240, 20)
    add_gradient(source, (0, height - 610, width, height), INK, 0, 248)
    veil = Image.new("RGBA", source.size, (6, 9, 12, 22))
    source = Image.alpha_composite(source, veil)
    draw = ImageDraw.Draw(source)

    frame(draw, width, height, 52, 3)
    draw_mark(draw, (113, 127), 27)
    eyebrow = font(FONT_MEDIUM, 34)
    tracked_text(draw, (166, 103), "TACTICAL VAULT HEIST // PUBLIC BETA", eyebrow, BRONZE, 4)

    title_font = font(FONT_BLACK, 245)
    tracked_text(draw, (82, 145), "PLUNDRIX", title_font, CREAM, 5, stroke_width=3, stroke_fill=INK)
    draw.line((86, 420, 1040, 420), fill=BRONZE, width=6)
    action_line(draw, (88, 432), 66, 2)

    footer_label = font(FONT_MEDIUM, 32)
    footer_head = font(FONT_BLACK, 88)
    tracked_text(draw, (86, 2052), "ONE TABLE. EVERY MOVE REVEALS TOGETHER.", footer_label, BRONZE, 3)
    tracked_text(draw, (82, 2092), "CRACK FIVE LOCKS FIRST.", footer_head, CREAM, 1)
    draw.rectangle((84, 2228, 615, 2301), fill=(194, 139, 75, 235))
    button_font = font(FONT_BOLD, 35)
    tracked_text(draw, (111, 2241), "PLAY FREE // PLUNDRIX.COM", button_font, INK, 2)
    tracked_text(draw, (1180, 2251), "SEPOLIA", footer_label, CYAN, 3)

    destination = POSTER_DIR / "plundrix-poster-vertical-v1.png"
    source.convert("RGB").save(destination, "PNG", optimize=True, dpi=(300, 300))
    return destination


def build_landscape():
    source = Image.open(POSTER_DIR / "plundrix-poster-landscape-v1-art.jpg").convert("RGBA")
    width, height = source.size

    # This field intentionally covers any lettering invented by the image model.
    cover = Image.new("RGBA", (790, height), INK[:-1] + (255,))
    source.alpha_composite(cover, (0, 0))
    add_gradient(source, (790, 0, 1320, height), INK, 255, 0, horizontal=True)
    add_gradient(source, (0, height - 310, width, height), INK, 0, 220)
    draw = ImageDraw.Draw(source)

    frame(draw, width, height, 48, 3)
    draw_mark(draw, (137, 132), 27)
    eyebrow = font(FONT_MEDIUM, 34)
    tracked_text(draw, (191, 108), "TACTICAL VAULT HEIST // PUBLIC BETA", eyebrow, BRONZE, 4)

    title_font = font(FONT_BLACK, 250)
    tracked_text(draw, (105, 218), "PLUNDRIX", title_font, CREAM, 4, stroke_width=3, stroke_fill=INK)
    draw.line((112, 505, 930, 505), fill=BRONZE, width=6)
    action_line(draw, (111, 524), 70, 2)

    descriptor = font(FONT_MEDIUM, 38)
    headline = font(FONT_BLACK, 94)
    tracked_text(draw, (112, 722), "OUTTHINK THE TABLE. OUTRACE THE VAULT.", descriptor, BRONZE, 3)
    tracked_text(draw, (107, 775), "CRACK FIVE", headline, CREAM, 1)
    tracked_text(draw, (107, 867), "LOCKS FIRST.", headline, CREAM, 1)

    draw.rectangle((109, 1052, 622, 1126), fill=(194, 139, 75, 238))
    button_font = font(FONT_BOLD, 35)
    tracked_text(draw, (140, 1066), "PLAY FREE // PLUNDRIX.COM", button_font, INK, 2)
    tracked_text(draw, (113, 1187), "NO WALLET NEEDED FOR INSTANT PLAY", eyebrow, CYAN, 3)

    destination = POSTER_DIR / "plundrix-poster-landscape-v1.png"
    source.convert("RGB").save(destination, "PNG", optimize=True, dpi=(300, 300))
    return destination


def build_vertical_gameplay():
    width, height = 1600, 2400
    hero_path = SCREENSHOT_DIR / "hero-gameplay.png"
    background = ImageOps.fit(Image.open(hero_path).convert("RGB"), (width, height), method=Image.Resampling.LANCZOS)
    source = background.filter(ImageFilter.GaussianBlur(24)).convert("RGBA")
    source.alpha_composite(Image.new("RGBA", source.size, (5, 8, 12, 212)))
    draw = ImageDraw.Draw(source)
    frame(draw, width, height, 52, 3)

    draw_mark(draw, (111, 111), 25)
    eyebrow = font(FONT_MEDIUM, 31)
    tracked_text(draw, (160, 88), "REAL GAMEPLAY // CURRENT BETA BUILD", eyebrow, BRONZE, 4)
    title_font = font(FONT_BLACK, 174)
    tracked_text(draw, (76, 132), "PLUNDRIX", title_font, CREAM, 4, stroke_width=3, stroke_fill=INK)
    tracked_text(draw, (80, 330), "THE WHOLE HEIST. ONE SCREEN.", font(FONT_BOLD, 56), CREAM, 2)
    action_line(draw, (81, 397), 55, 1)

    screen_panel(source, hero_path, (82, 512, 1518, 1320), "LIVE DECISION CONSOLE", CYAN)
    screen_panel(source, SCREENSHOT_DIR / "workshop.png", (82, 1450, 774, 1883), "BUILD GADGETS", GREEN)
    screen_panel(source, SCREENSHOT_DIR / "replay.png", (826, 1450, 1518, 1883), "REPLAY THE DAMAGE", RED)

    draw = ImageDraw.Draw(source)
    descriptor = font(FONT_MEDIUM, 31)
    tracked_text(draw, (84, 1361), "PICK, SEARCH, AND SABOTAGE STAY VISIBLE TOGETHER.", descriptor, BRONZE, 3)
    tracked_text(draw, (82, 1950), "PRACTICE LOCALLY. BUILD YOUR KIT. READ EVERY TURN.", descriptor, BRONZE, 3)
    tracked_text(draw, (78, 2010), "CRACK FIVE LOCKS FIRST.", font(FONT_BLACK, 87), CREAM, 1)
    draw.rectangle((80, 2161, 610, 2234), fill=(194, 139, 75, 240))
    tracked_text(draw, (108, 2174), "PLAY FREE // PLUNDRIX.COM", font(FONT_BOLD, 35), INK, 2)
    tracked_text(draw, (80, 2282), "NO WALLET NEEDED FOR INSTANT PLAY", descriptor, CYAN, 3)

    destination = POSTER_DIR / "plundrix-poster-vertical-gameplay-v1.png"
    source.convert("RGB").save(destination, "PNG", optimize=True, dpi=(300, 300))
    return destination


def build_landscape_gameplay():
    width, height = 2560, 1440
    hero_path = SCREENSHOT_DIR / "hero-gameplay.png"
    background = ImageOps.fit(Image.open(hero_path).convert("RGB"), (width, height), method=Image.Resampling.LANCZOS)
    source = background.filter(ImageFilter.GaussianBlur(22)).convert("RGBA")
    source.alpha_composite(Image.new("RGBA", source.size, (5, 8, 12, 218)))
    draw = ImageDraw.Draw(source)
    frame(draw, width, height, 48, 3)

    draw_mark(draw, (118, 112), 24)
    eyebrow = font(FONT_MEDIUM, 29)
    tracked_text(draw, (164, 91), "REAL GAMEPLAY // CURRENT BETA BUILD", eyebrow, BRONZE, 3)
    title_font = font(FONT_BLACK, 142)
    tracked_text(draw, (82, 145), "PLUNDRIX", title_font, CREAM, 3, stroke_width=3, stroke_fill=INK)
    action_line(draw, (87, 315), 46, 1)
    tracked_text(draw, (86, 445), "THE WHOLE HEIST.", font(FONT_BLACK, 72), CREAM, 1)
    tracked_text(draw, (86, 520), "ONE SCREEN.", font(FONT_BLACK, 72), CREAM, 1)
    tracked_text(draw, (89, 626), "MAKE A MOVE. READ THE TABLE.", eyebrow, BRONZE, 3)

    screen_panel(source, hero_path, (760, 126, 2474, 1090), "LIVE DECISION CONSOLE", CYAN)
    screen_panel(source, SCREENSHOT_DIR / "workshop.png", (88, 760, 378, 941), "WORKSHOP", GREEN)
    screen_panel(source, SCREENSHOT_DIR / "replay.png", (418, 760, 708, 941), "REPLAYS", RED)

    draw = ImageDraw.Draw(source)
    draw.rectangle((84, 1027, 594, 1100), fill=(194, 139, 75, 240))
    tracked_text(draw, (113, 1040), "PLAY FREE // PLUNDRIX.COM", font(FONT_BOLD, 34), INK, 2)
    tracked_text(draw, (88, 1155), "NO WALLET NEEDED", eyebrow, CYAN, 3)
    tracked_text(draw, (88, 1195), "FOR INSTANT PLAY", eyebrow, CYAN, 3)
    tracked_text(draw, (760, 1142), "PICK, SEARCH, AND SABOTAGE STAY VISIBLE TOGETHER.", font(FONT_MEDIUM, 34), BRONZE, 3)
    tracked_text(draw, (760, 1200), "CRACK FIVE LOCKS FIRST.", font(FONT_BLACK, 80), CREAM, 1)

    destination = POSTER_DIR / "plundrix-poster-landscape-gameplay-v1.png"
    source.convert("RGB").save(destination, "PNG", optimize=True, dpi=(300, 300))
    return destination


def save_email_copy(poster):
    destination = poster.with_name(f"{poster.stem}-email.jpg")
    image = Image.open(poster).convert("RGB")
    image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
    image.save(destination, "JPEG", quality=82, optimize=True, progressive=True, dpi=(300, 300))
    return destination


if __name__ == "__main__":
    posters = (build_vertical(), build_landscape(), build_vertical_gameplay(), build_landscape_gameplay())
    for poster in posters:
        print(poster)
    for poster in posters:
        print(save_email_copy(poster))
