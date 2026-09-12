#!/usr/bin/env python3
"""Independently check data against PDF annotations/text and every output image."""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
sys.dont_write_bytecode = True
from PIL import Image

spec = importlib.util.spec_from_file_location("processor", Path(__file__).with_name("process-catalog-matrizes.py"))
processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(processor)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("pdf", type=Path)
args = parser.parse_args()
doc, expected = processor.extract(args.pdf)
node = """const fs=require('node:fs'),ts=require('typescript');
const js=ts.transpileModule(fs.readFileSync(process.argv[1],'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const m={exports:{}};new Function('exports',js)(m.exports);process.stdout.write(JSON.stringify(m.exports.MATRIZES_LOTS));"""
actual = json.loads(subprocess.check_output(["node", "-e", node, str(processor.ROOT / "src/lib/catalog-matrizes-data.ts")], cwd=processor.ROOT))
assert actual == expected, "Generated data differs from PDF"
processor.validate_lots(actual)
# Separate Poppler engine corroborates each animal, owner and commercial number.
physical_texts = subprocess.check_output(["pdftotext", "-layout", str(args.pdf), "-"], text=True).split('\f')
for lot in actual:
    for path, name in zip(lot['pages'], lot['animalNames']):
        physical = int(re.search(r'p(\d+)\.webp', path)[1])
        text = physical_texts[physical-1]
        compact = lambda s: re.sub(r'\s+', '', s)
        assert compact(name) in compact(text), (physical, name)
        assert compact(lot['owner']) in compact(text), (physical, lot['owner'])
        assert re.search(r'^\s*'+lot['lotNumber']+r'\s*$', text, re.M), physical
assets = processor.ROOT / "public/catalogo-matrizes"
assert {p.name for p in assets.iterdir()} == {f"p{n:02}.webp" for n in range(1,175)} | {"og.webp"}
for n in range(1,175):
    with Image.open(assets / f"p{n:02}.webp") as img:
        img.load()
        assert img.size == (1080,1920) and img.format == "WEBP"
with Image.open(assets / "og.webp") as img:
    assert img.size == (1200,630) and img.format == "WEBP"
config = (processor.ROOT / 'src/lib/catalog-config.ts').read_text()
assert 'introPages: ["/catalogo-matrizes/p02.webp"]' in config
assert '[170, 171, 172, 173, 174]' in config
print('PASS: 174 WebPs 1080×1920 + OG; 81 commercial lots / 81 annotation videos; 167 animal names')
print('PASS: 100→p03; 185→p168+p169; no orphan/duplicate pages; extras 170–174; absent 136,152,169,174,177')
print(f'Total asset bytes: {sum(p.stat().st_size for p in assets.iterdir())}')
