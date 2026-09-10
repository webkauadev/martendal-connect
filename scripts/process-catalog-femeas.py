#!/usr/bin/env python3
"""Extract searchable PDF text and link annotations; render with temporary PyMuPDF/Pillow."""

import argparse
import json
import re
import subprocess
from pathlib import Path

import pymupdf
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]


def extract(pdf):
    doc = pymupdf.open(pdf)
    if len(doc) != 35 or any(tuple(p.rect)[2:] != (1080, 1920) for p in doc):
        raise ValueError("Expected 35 pages, each 1080 x 1920")
    lots = []
    owner = None
    for line in doc[1].get_text().splitlines():
        if line.startswith("ݾ "):
            owner = line[2:].strip()
        match = re.match(r"LOTE (\d{2})\s+•\s+(.+?) - .+?\.{2,}\s*(\d+)$", line)
        if not match:
            continue
        number, name, page = match.groups()
        page = int(page)
        if not owner or page != int(number) + 3:
            raise ValueError(f"Invalid index mapping: {line}")
        text = doc[page - 1].get_text()
        # Owner spelling comes from the lot page; the index sometimes spaces hyphens differently.
        page_lines = text.splitlines()
        number_index = page_lines.index(number)
        page_owner = page_lines[number_index - 1]
        if name not in text or re.sub(r"\s", "", owner) != re.sub(
            r"\s", "", page_owner
        ):
            raise ValueError(f"Index/page mismatch for lot {number}: {name} / {owner}")
        official_owner = page_owner
        urls = {
            link["uri"]
            for link in doc[page - 1].get_links()
            if "uri" in link
            and re.match(
                r"https?://(?:www\.)?(?:youtube\.com/|youtu\.be/)", link["uri"]
            )
        }
        if len(urls) != 1:
            raise ValueError(f"Expected one distinct video for lot {number}: {urls}")
        lots.append(
            {
                "lotNumber": number,
                "animalName": name,
                "owner": official_owner,
                "page": page,
                "pages": [f"/catalogo-femeas/p{page:02}.webp"],
                "videoUrl": urls.pop(),
            }
        )
    if [l["lotNumber"] for l in lots] != [f"{n:02}" for n in range(1, 28)]:
        raise ValueError("Expected exactly lots 01–27")
    if lots[0]["animalName"] != "REM1783M FIV GENETICA ADITIVA":
        raise ValueError("Unexpected first animal")
    if len({l["videoUrl"] for l in lots}) != 27:
        raise ValueError("Expected 27 distinct videos")
    return doc, lots


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    args = parser.parse_args()
    doc, lots = extract(args.pdf)
    target = ROOT / "public/catalogo-femeas"
    target.mkdir(parents=True, exist_ok=True)
    for index, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1, 1), alpha=False)
        Image.frombytes("RGB", (pix.width, pix.height), pix.samples).save(
            target / f"p{index:02}.webp", quality=88, method=6
        )
    cover = Image.open(target / "p01.webp")
    og = Image.new("RGB", (1200, 630), "#080b09")
    fitted = ImageOps.contain(cover, (1200, 630))
    og.paste(fitted, ((1200 - fitted.width) // 2, 0))
    og.save(target / "og.webp", quality=90, method=6)
    data = "// Generated from the official PDF by scripts/process-catalog-femeas.py.\n"
    data += (
        "export const FEMEAS_LOTS = "
        + json.dumps(lots, ensure_ascii=False, indent=2)
        + ";\n"
    )
    (ROOT / "src/lib/catalog-femeas-data.ts").write_text(data)
    subprocess.run(
        [
            str(ROOT / "node_modules/.bin/prettier"),
            "--write",
            str(ROOT / "src/lib/catalog-femeas-data.ts"),
        ],
        check=True,
    )
    if (
        len(list(target.glob("p[0-9][0-9].webp"))) != 35
        or len(list(target.glob("*.webp"))) != 36
    ):
        raise ValueError("Unexpected output asset count")
    print("35 pages + OG; 27 animals, owners and annotation video URLs extracted")


if __name__ == "__main__":
    main()
