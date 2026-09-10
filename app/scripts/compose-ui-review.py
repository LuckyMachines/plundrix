#!/usr/bin/env python3
"""Compose Plundrix UI reference comparisons, a contact sheet, and review reports."""

from __future__ import annotations

import argparse
import html
import json
import os
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps


INK = "#c8c8d4"
DIM = "#8b8a9e"
GROUND = "#090a0f"
PANEL = "#14141f"
GOOD = "#40a080"
BAD = "#f06a6a"
ACCENT = "#e8b078"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--actual", required=True, type=Path)
    parser.add_argument("--results", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--status", choices=("pass", "fail"), default="pass")
    parser.add_argument("--surface")
    return parser.parse_args()


def font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default(size=size)


def locate(directory: Path, name: str) -> Path | None:
    direct = directory / name
    if direct.exists():
        return direct
    matches = list(directory.rglob(name)) if directory.exists() else []
    return matches[0] if matches else None


def changed_ratio(reference: Image.Image, actual: Image.Image, tolerance: int = 8) -> float | None:
    if reference.size != actual.size:
        return None
    difference = ImageChops.difference(reference.convert("RGB"), actual.convert("RGB"))
    mask = difference.convert("L").point(lambda value: 255 if value > tolerance else 0)
    changed = mask.histogram()[255]
    return changed / max(1, reference.width * reference.height)


def labeled_pair(reference_path: Path, actual_path: Path, output_path: Path, height: int = 720) -> None:
    reference = Image.open(reference_path).convert("RGB")
    actual = Image.open(actual_path).convert("RGB")

    def resized(image: Image.Image) -> Image.Image:
        target_height = min(height, image.height)
        width = max(1, round(image.width * target_height / image.height))
        return image.resize((width, target_height), Image.Resampling.LANCZOS)

    reference = resized(reference)
    actual = resized(actual)
    header = 54
    gap = 24
    canvas = Image.new("RGB", (reference.width + gap + actual.width, header + max(reference.height, actual.height)), GROUND)
    canvas.paste(reference, (0, header))
    canvas.paste(actual, (reference.width + gap, header))
    draw = ImageDraw.Draw(canvas)
    label_font = font(18)
    draw.text((16, 17), "APPROVED REFERENCE", fill=ACCENT, font=label_font)
    draw.text((reference.width + gap + 16, 17), "CURRENT RENDER", fill=ACCENT, font=label_font)
    draw.line((reference.width + gap // 2, 0, reference.width + gap // 2, canvas.height), fill="#2a2a3e", width=2)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, format="PNG", optimize=True)


def build_contact_sheet(entries: list[dict], output_path: Path, subtitle: str | None = None) -> None:
    columns = 4
    cell_width = 360
    cell_height = 290
    gutter = 18
    header = 96
    rows = max(1, (len(entries) + columns - 1) // columns)
    width = gutter + columns * (cell_width + gutter)
    height = header + rows * (cell_height + gutter)
    canvas = Image.new("RGB", (width, height), GROUND)
    draw = ImageDraw.Draw(canvas)
    draw.text((gutter, 18), "PLUNDRIX UI REVIEW", fill=INK, font=font(30))
    draw.text((gutter, 57), subtitle or f"{len(entries)} canonical renders / approved reference comparison", fill=DIM, font=font(15))

    for index, entry in enumerate(entries):
        row, column = divmod(index, columns)
        x = gutter + column * (cell_width + gutter)
        y = header + row * (cell_height + gutter)
        draw.rounded_rectangle((x, y, x + cell_width, y + cell_height), radius=8, fill=PANEL, outline="#2a2a3e")
        actual_path = entry.get("actualPath")
        if actual_path and Path(actual_path).exists():
            image = Image.open(actual_path).convert("RGB")
            thumb = ImageOps.contain(image, (cell_width - 20, 215), Image.Resampling.LANCZOS)
            canvas.paste(thumb, (x + (cell_width - thumb.width) // 2, y + 10))
        color = GOOD if entry["status"] == "pass" else BAD
        draw.text((x + 12, y + 232), f"{entry['label']} / {entry['viewport']}", fill=INK, font=font(15))
        draw.text((x + 12, y + 258), entry["status"].upper(), fill=color, font=font(13))
        ratio = entry.get("diffRatio")
        ratio_text = "new baseline" if ratio is None else f"diff {ratio * 100:.3f}%"
        draw.text((x + 92, y + 258), ratio_text, fill=DIM, font=font(13))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, format="PNG", optimize=True)


def relative(path: str | None, root: Path) -> str:
    if not path:
        return ""
    return Path(os.path.relpath(Path(path).resolve(), root.resolve())).as_posix()


def main() -> None:
    args = parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    args.output.mkdir(parents=True, exist_ok=True)
    comparisons = args.output / "comparisons"
    comparisons.mkdir(parents=True, exist_ok=True)
    entries: list[dict] = []

    surfaces = [surface for surface in manifest["surfaces"] if not args.surface or surface["id"] == args.surface]
    if not surfaces:
        raise SystemExit(f"Unknown UI review surface: {args.surface}")
    for surface in surfaces:
        for viewport in surface.get("viewports", manifest["defaults"]["viewports"]):
            name = f"{surface['id']}-{viewport}.png"
            reference_path = locate(args.baseline, name)
            actual_path = locate(args.actual, name)
            result_path = locate(args.results, name.replace(".png", ".json"))
            result = json.loads(result_path.read_text(encoding="utf-8")) if result_path else {}
            ratio = None
            comparison_path = None
            if reference_path and actual_path:
                reference = Image.open(reference_path)
                actual = Image.open(actual_path)
                ratio = changed_ratio(reference, actual)
                comparison_path = comparisons / name
                labeled_pair(reference_path, actual_path, comparison_path)
            limit = surface.get("maxDiffPixelRatio", manifest["defaults"]["maxDiffPixelRatio"])
            checks_pass = (
                not result.get("accessibility")
                and result.get("layout", {}).get("overflowPixels", 1) == 0
                and not result.get("layout", {}).get("clippedContainers")
                and not result.get("layout", {}).get("unloadedImages")
                and not result.get("typography", {}).get("undersized")
                and not result.get("typography", {}).get("overflowing")
                and not result.get("typography", {}).get("overlongMeasures")
                and all(font.get("loaded") for font in result.get("typography", {}).get("fonts", []))
            )
            entry_status = "pass" if reference_path and actual_path and ratio is not None and ratio <= limit and checks_pass else "fail"
            entries.append({
                "id": surface["id"],
                "label": surface["label"],
                "priority": surface["priority"],
                "viewport": viewport,
                "path": surface["path"],
                "reviewFocus": surface["reviewFocus"],
                "experimentIds": surface.get("experimentIds", []),
                "status": entry_status,
                "diffRatio": ratio,
                "diffLimit": limit,
                "actualPath": str(actual_path.resolve()) if actual_path else None,
                "referencePath": str(reference_path.resolve()) if reference_path else None,
                "comparisonPath": str(comparison_path.resolve()) if comparison_path else None,
                "accessibility": result.get("accessibility", []),
                "layout": result.get("layout", {}),
                "typography": result.get("typography", {}),
            })

    build_contact_sheet(entries, args.output / "contact-sheet.png")
    stress_entries: list[dict] = []
    stress_manifest_path = args.manifest.with_name("type-layout.json")
    if not args.surface and stress_manifest_path.exists():
        stress_manifest = json.loads(stress_manifest_path.read_text(encoding="utf-8"))
        for viewport, dimensions in stress_manifest["viewports"].items():
            name = f"type-layout-stress-{viewport}.png"
            reference_path = locate(args.baseline, name)
            actual_path = locate(args.actual, name)
            result_path = locate(args.results, name.replace(".png", ".json"))
            result = json.loads(result_path.read_text(encoding="utf-8")) if result_path else {}
            ratio = None
            comparison_path = None
            if reference_path and actual_path:
                reference = Image.open(reference_path)
                actual = Image.open(actual_path)
                ratio = changed_ratio(reference, actual)
                comparison_path = comparisons / name
                labeled_pair(reference_path, actual_path, comparison_path)
            typography = result.get("typography", {})
            checks_pass = (
                result.get("layout", {}).get("overflowPixels", 1) == 0
                and not result.get("accessibility")
                and not typography.get("undersized")
                and not typography.get("overflowing")
                and not typography.get("overlongMeasures")
                and all(font.get("loaded") for font in typography.get("fonts", []))
            )
            limit = manifest["defaults"]["maxDiffPixelRatio"]
            stress_entries.append({
                "id": "type-layout-stress",
                "label": "Type and layout stress",
                "priority": "P1",
                "viewport": viewport,
                "path": stress_manifest["path"],
                "reviewFocus": ["long-copy wrapping", "minimum type size", "responsive rhythm"],
                "experimentIds": [],
                "status": "pass" if reference_path and actual_path and ratio is not None and ratio <= limit and checks_pass else "fail",
                "diffRatio": ratio,
                "diffLimit": limit,
                "actualPath": str(actual_path.resolve()) if actual_path else None,
                "referencePath": str(reference_path.resolve()) if reference_path else None,
                "comparisonPath": str(comparison_path.resolve()) if comparison_path else None,
                "accessibility": result.get("accessibility", []),
                "layout": result.get("layout", {}),
                "typography": typography,
                "dimensions": dimensions,
            })
        build_contact_sheet(
            stress_entries,
            args.output / "type-layout-contact-sheet.png",
            f"{len(stress_entries)} type and layout stress renders / 320px to 1440px",
        )
    passed = sum(1 for entry in entries if entry["status"] == "pass")
    stress_passed = sum(1 for entry in stress_entries if entry["status"] == "pass")
    report = {
        "schemaVersion": 1,
        "name": manifest["name"],
        "status": "pass" if args.status == "pass" and passed == len(entries) and stress_passed == len(stress_entries) else "fail",
        "summary": {"passed": passed, "total": len(entries)},
        "typeLayoutSummary": {"passed": stress_passed, "total": len(stress_entries)},
        "entries": entries,
        "typeLayoutEntries": stress_entries,
    }
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    markdown = [
        "# Plundrix UI Review",
        "",
        f"Status: **{report['status'].upper()}**",
        f"Coverage: **{passed}/{len(entries)} canonical renders**",
        "",
        "## Review order",
        "",
        "Composition -> hierarchy -> geometry -> typography/data -> state behavior -> responsive quality -> accessibility.",
        "",
        "## Canonical states",
        "",
        "| Surface | Viewport | Result | Pixel difference |",
        "| --- | --- | ---: | ---: |",
    ]
    for entry in entries:
        ratio = "missing" if entry["diffRatio"] is None else f"{entry['diffRatio'] * 100:.3f}%"
        markdown.append(f"| {entry['label']} | {entry['viewport']} | {entry['status']} | {ratio} |")
    if stress_entries:
        markdown.extend([
            "",
            "## Type and layout stress states",
            "",
            f"Coverage: **{stress_passed}/{len(stress_entries)} stress renders**",
            "",
            "| Viewport | Result | Pixel difference |",
            "| --- | ---: | ---: |",
        ])
        for entry in stress_entries:
            ratio = "missing" if entry["diffRatio"] is None else f"{entry['diffRatio'] * 100:.3f}%"
            markdown.append(f"| {entry['viewport']} | {entry['status']} | {ratio} |")
        markdown.extend(["", "[Open the type and layout contact sheet](type-layout-contact-sheet.png)"])
    markdown.extend([
        "",
        "## Acceptance checklist",
        "",
        f"- [{'x' if passed == len(entries) else ' '}] Every canonical reference and current render exists.",
        f"- [{'x' if passed == len(entries) else ' '}] Pixel differences stay within the declared per-surface threshold.",
        f"- [{'x' if all(not entry['accessibility'] for entry in entries) else ' '}] No serious or critical Axe findings.",
        f"- [{'x' if all(entry['layout'].get('overflowPixels', 1) == 0 for entry in entries) else ' '}] No horizontal overflow.",
        f"- [{'x' if all(not entry['layout'].get('clippedContainers') for entry in entries) else ' '}] Action controls do not clip their contents.",
        f"- [{'x' if all(not entry['layout'].get('unloadedImages') for entry in entries) else ' '}] All visible images load.",
        "- [ ] A human inspected the contact sheet and largest comparisons at original resolution.",
        "- [ ] Real-player evidence supports any claimed comprehension or joy improvement.",
    ])
    (args.output / "report.md").write_text("\n".join(markdown) + "\n", encoding="utf-8")

    cards = []
    for entry in entries:
        ratio = "missing" if entry["diffRatio"] is None else f"{entry['diffRatio'] * 100:.3f}%"
        comparison = relative(entry["comparisonPath"], args.output)
        actual = relative(entry["actualPath"], args.output)
        reference = relative(entry["referencePath"], args.output)
        focus = "".join(f"<li>{html.escape(item)}</li>" for item in entry["reviewFocus"])
        cards.append(f"""
        <article class="card" data-status="{entry['status']}" data-priority="{entry['priority']}">
          <a href="{html.escape(comparison or actual)}"><img src="{html.escape(comparison or actual)}" alt="Approved reference and current {html.escape(entry['label'])} at {entry['viewport']}" loading="lazy"></a>
          <div class="body"><p class="meta">{entry['priority']} / {entry['viewport']} / {entry['status']}</p><h2>{html.escape(entry['label'])}</h2>
          <p>Pixel difference: {ratio} (limit {entry['diffLimit'] * 100:.3f}%)</p><ul>{focus}</ul>
          <p class="links"><a href="{html.escape(reference)}">Reference</a> <a href="{html.escape(actual)}">Current</a></p></div>
        </article>""")
    stress_cards = []
    for entry in stress_entries:
        ratio = "missing" if entry["diffRatio"] is None else f"{entry['diffRatio'] * 100:.3f}%"
        comparison = relative(entry["comparisonPath"], args.output)
        actual = relative(entry["actualPath"], args.output)
        reference = relative(entry["referencePath"], args.output)
        stress_cards.append(f"""
        <article class="card" data-status="{entry['status']}">
          <a href="{html.escape(comparison or actual)}"><img src="{html.escape(comparison or actual)}" alt="Type and layout stress render at {entry['viewport']}" loading="lazy"></a>
          <div class="body"><p class="meta">STRESS / {entry['viewport']} / {entry['status']}</p><h2>Type and layout</h2>
          <p>Pixel difference: {ratio}</p><p class="links"><a href="{html.escape(reference)}">Reference</a> <a href="{html.escape(actual)}">Current</a></p></div>
        </article>""")
    document = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plundrix UI Review</title><style>
:root{{--ground:#090a0f;--panel:#14141f;--border:#2a2a3e;--text:#c8c8d4;--dim:#8b8a9e;--accent:#e8b078;--good:#40a080;--bad:#f06a6a}}*{{box-sizing:border-box}}body{{margin:0;background:var(--ground);color:var(--text);font:16px/1.5 Arial,sans-serif}}main{{max-width:1600px;margin:auto;padding:32px}}h1,h2{{margin:.2em 0;text-transform:uppercase}}.summary{{border-left:4px solid var(--accent);padding:16px 20px;background:var(--panel)}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;margin-top:24px}}.card{{border:1px solid var(--border);background:var(--panel)}}.card[data-status=fail]{{border-color:var(--bad)}}img{{display:block;width:100%;aspect-ratio:16/10;object-fit:contain;background:#05060a}}.body{{padding:16px}}.meta{{color:var(--accent);font-size:12px;text-transform:uppercase;letter-spacing:.12em}}p,li{{color:var(--dim)}}a{{color:var(--accent)}}.links{{display:flex;gap:18px}}@media(max-width:600px){{main{{padding:16px}}}}
</style></head><body><main><section class="summary"><p class="meta">Solo visual evidence loop</p><h1>Plundrix UI Review</h1><p>{passed}/{len(entries)} canonical renders and {stress_passed}/{len(stress_entries)} type/layout stress renders pass. Approved reference stays on the left; current render stays on the right.</p><p><a href="contact-sheet.png">Open journey contact sheet</a> / <a href="type-layout-contact-sheet.png">Open type/layout contact sheet</a> / <a href="report.md">Open Markdown report</a></p></section><section class="grid">{''.join(cards)}</section><h2>Type and layout stress matrix</h2><section class="grid">{''.join(stress_cards)}</section></main></body></html>"""
    (args.output / "index.html").write_text(document, encoding="utf-8")
    print((args.output / "index.html").resolve())


if __name__ == "__main__":
    main()
