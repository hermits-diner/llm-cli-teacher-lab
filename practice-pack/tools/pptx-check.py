"""Find shapes PowerPoint refuses to open, which the pptx skill's validate.py misses.

    python tools/pptx-check.py slides/parents-ai.pptx

A shape with a negative width or height (cx/cy) makes PowerPoint report the whole
file as damaged. pptxgenjs writes one when a line is drawn with a negative w or h.
"""
import json
import re
import sys
import zipfile

for path in sys.argv[1:]:
    problems = []
    with zipfile.ZipFile(path) as z:
        slides = sorted(
            (n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)),
            key=lambda n: int(re.search(r"\d+", n.rsplit("/", 1)[1]).group()),
        )
        for name in slides:
            xml = z.read(name).decode("utf-8")
            for m in re.finditer(r'<a:ext cx="(-?\d+)" cy="(-?\d+)"', xml):
                if int(m.group(1)) < 0 or int(m.group(2)) < 0:
                    problems.append(f"{name}: negative size cx={m.group(1)} cy={m.group(2)}")
    print(json.dumps({"file": path, "count": len(problems), "problems": problems}, ensure_ascii=False))
