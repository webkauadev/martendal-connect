#!/usr/bin/env python3
"""Official Matrizes PDF → commercial lots and native-size WebPs.

Dependencies (install in /tmp venv): pymupdf==1.26.7 pillow==11.3.0.
No OCR, external services, spelling corrections or inferred lot numbers.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import parse_qs, urlparse

import pymupdf
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ABSENT = {136, 152, 169, 174, 177}
GROUP_SIZES = {"INDIVIDUAL": 1, "DUPLO": 2, "TRIPLO": 3, "QUÁDRUPLO": 4, "QUÍNTUPLO": 5}


def page_path(number):
    return f"/catalogo-matrizes/p{number:02}.webp"


def one(values, label):
    if len(values) != 1:
        raise ValueError(f"Expected one {label}: {values}")
    return values[0]


def video_uri(uri):
    parsed = urlparse(uri)
    if parsed.hostname not in {"youtube.com", "www.youtube.com", "youtu.be"}:
        raise ValueError(f"Unexpected annotation URI: {uri}")
    video = parsed.path.lstrip("/") if parsed.hostname == "youtu.be" else one(parse_qs(parsed.query).get("v", []), "video id")
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video):
        raise ValueError(f"Invalid annotation video: {uri}")
    return f"https://youtube.com/watch?v={video}"


def extract(pdf):
    doc = pymupdf.open(pdf)
    if len(doc) != 174 or any(tuple(p.rect) != (0, 0, 1080, 1920) or p.rotation for p in doc):
        raise ValueError("Expected 174 physical pages at 1080 × 1920, unrotated")
    groups = {}
    for physical, page in enumerate(doc, 1):
        text = page.get_text()
        links = page.get_links()
        if physical in {1, 174}:
            if text.strip() or not page.get_images():
                raise ValueError(f"Expected image-only institutional page {physical}")
            continue
        if f"PÁGINA {physical}" not in text:
            raise ValueError(f"Physical/printed page mismatch: {physical}")
        if not 3 <= physical <= 169:
            continue
        lines = [("".join(s["text"] for s in line["spans"]).strip(), line["bbox"])
                 for block in page.get_text("dict")["blocks"] for line in block.get("lines", [])]
        # Use entire typographic lines by vertical position, not clipped glyphs.
        name = one([t for t, box in lines if 280 < box[1] < 350], f"animal on page {physical}")
        owner = one([t for t, box in lines if box[1] < 30], f"owner on page {physical}")
        header = [t for t, box in lines if 90 < box[1] < 270]
        number = one([t for t in header if re.fullmatch(r"\d{3}", t)], f"lot on page {physical}")
        kind = one([re.sub(r"\s", "", t) for t in header if re.sub(r"\s", "", t) in GROUP_SIZES], "group type")
        letters = [t for t in header if re.fullmatch(r"[A-Z]", t)]
        letter = one(letters, "page letter") if GROUP_SIZES[kind] > 1 else ""
        urls = {video_uri(link["uri"]) for link in links if "uri" in link and urlparse(link["uri"]).hostname in {"youtube.com", "www.youtube.com", "youtu.be"}}
        video = one(sorted(urls), f"annotation video on page {physical}")
        if number not in groups:
            groups[number] = {"lotNumber": number, "animalNames": [], "owner": owner,
                              "pages": [], "videoUrl": video, "kind": kind, "letters": []}
        lot = groups[number]
        if (lot["owner"], lot["videoUrl"], lot["kind"]) != (owner, video, kind):
            raise ValueError(f"Inconsistent commercial lot {number}")
        lot["animalNames"].append(name)
        lot["pages"].append(page_path(physical))
        lot["letters"].append(letter)
    lots = list(groups.values())
    for lot in lots:
        size = GROUP_SIZES[lot.pop("kind")]
        letters = lot.pop("letters")
        if len(lot["pages"]) != size or letters != ([""] if size == 1 else list("ABCDE"[:size])):
            raise ValueError(f"Incomplete grouping: {lot['lotNumber']}")
        # Compact, stable text stays below the existing 120-character tracking limit.
        lot["animalName"] = lot["animalNames"][0] + (f" + {size - 1} {'animal' if size == 2 else 'animais'}" if size > 1 else "")
    validate_lots(lots)
    if "CONDIÇÃO DE PAGAMENTO" not in doc[1].get_text() or "CONDIÇÃO DE FRETE" not in doc[1].get_text():
        raise ValueError("Missing commercial conditions")
    if "REGULAMENTO DO LEILÃO" not in doc[169].get_text() or "12. FORO" not in doc[172].get_text():
        raise ValueError("Missing regulation boundaries")
    return doc, lots


def validate_lots(lots):
    numbers = [int(lot["lotNumber"]) for lot in lots]
    if len(numbers) != 81 or len(set(numbers)) != 81 or numbers != sorted(numbers):
        raise ValueError("Expected 81 ordered unique commercial lots")
    if set(range(min(numbers), max(numbers) + 1)) - set(numbers) != ABSENT:
        raise ValueError("Absent lot numbers changed")
    if lots[0]["lotNumber"] != "100" or lots[0]["pages"] != [page_path(3)]:
        raise ValueError("First lot must be 100 → p03")
    if lots[-1]["lotNumber"] != "185" or lots[-1]["pages"] != [page_path(168), page_path(169)]:
        raise ValueError("Last lot must be 185 → p168/p169")
    if [p for lot in lots for p in lot["pages"]] != [page_path(p) for p in range(3, 170)]:
        raise ValueError("Orphan, duplicate or reordered lot pages")
    if len({lot["videoUrl"] for lot in lots}) != 81:
        raise ValueError("Expected 81 distinct videos for 81 lots")
    for lot in lots:
        if len(lot["pages"]) != len(lot["animalNames"]) or not all(lot["animalNames"]) or not lot["owner"]:
            raise ValueError("Missing animal or owner")
        if len(lot["animalName"]) > 120:
            raise ValueError("Tracking label exceeds contract")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    args = parser.parse_args()
    subprocess.run(["pdfinfo", str(args.pdf)], check=True)
    doc, lots = extract(args.pdf)
    target = ROOT / "public/catalogo-matrizes"
    target.mkdir(parents=True, exist_ok=True)
    for index, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1, 1), alpha=False)
        Image.frombytes("RGB", (pix.width, pix.height), pix.samples).save(
            target / f"p{index:02}.webp", quality=88, method=6)
        if index % 20 == 0:
            print(f"Rendered {index}/174", flush=True)
    cover = Image.open(target / "p01.webp")
    og = Image.new("RGB", (1200, 630), "#080b09")
    fitted = ImageOps.contain(cover, (1200, 630))
    og.paste(fitted, ((1200 - fitted.width) // 2, 0))
    og.save(target / "og.webp", quality=90, method=6)
    source = ROOT / "src/lib/catalog-matrizes-data.ts"
    source.write_text("// Generated from the official PDF by scripts/process-catalog-matrizes.py.\n"
                      + "export const MATRIZES_LOTS = " + json.dumps(lots, ensure_ascii=False, indent=2) + ";\n")
    subprocess.run([str(ROOT / "node_modules/.bin/prettier"), "--write", str(source)], check=True)
    print(f"174 pages + OG; 81 lots/videos; grouping {dict(Counter(len(l['pages']) for l in lots))}")


if __name__ == "__main__":
    main()
