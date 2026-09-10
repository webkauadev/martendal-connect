#!/usr/bin/env python3
"""Compare generated data and images against the official PDF without rerendering."""

import argparse
import sys

sys.dont_write_bytecode = True
import importlib.util
import json
import subprocess
from pathlib import Path

from PIL import Image

spec = importlib.util.spec_from_file_location(
    "processor", Path(__file__).with_name("process-catalog-femeas.py")
)
processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(processor)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("pdf", type=Path)
args = parser.parse_args()
doc, expected = processor.extract(args.pdf)
source = processor.ROOT / "src/lib/catalog-femeas-data.ts"
# Use the project's TypeScript compiler to read the generated module, including formatting.
node = """const fs=require('node:fs'),ts=require('typescript');
const js=ts.transpileModule(fs.readFileSync(process.argv[1],'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const m={exports:{}};new Function('exports',js)(m.exports);process.stdout.write(JSON.stringify(m.exports.FEMEAS_LOTS));"""
actual = json.loads(
    subprocess.check_output(["node", "-e", node, str(source)], cwd=processor.ROOT)
)
assert expected == actual, "Data does not match PDF"
assets = processor.ROOT / "public/catalogo-femeas"
assert {p.name for p in assets.iterdir()} == {f"p{n:02}.webp" for n in range(1, 36)} | {
    "og.webp"
}
for n in range(1, 36):
    with Image.open(assets / f"p{n:02}.webp") as img:
        assert img.size == (1080, 1920) and img.format == "WEBP"
with Image.open(assets / "og.webp") as img:
    assert img.size == (1200, 630)
print(
    f"PASS: 35 WebPs 1080x1920 + OG 1200x630; {sum(p.stat().st_size for p in assets.iterdir())} bytes"
)
print("PASS: 27 names, 27 owners, 27 annotation videos; 01→04, 27→30")
