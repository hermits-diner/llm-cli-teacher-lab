"""List the {{blanks}} in .hwpx files, table cells included.

    python tools/blanks.py mission2/notice-form.hwpx

The hwpx skill's analyze/text_extract miss blanks inside tables, so the
mission checks with this before filling and again after.
"""
import json
import re
import sys
import zipfile

for path in sys.argv[1:]:
    with zipfile.ZipFile(path) as z:
        names = sorted(n for n in z.namelist() if re.fullmatch(r"Contents/section\d+\.xml", n))
        xml = "".join(z.read(n).decode("utf-8") for n in names)
    # Tags removed so a blank split across text runs is still found.
    text = re.sub(r"<[^>]+>", "", xml)
    blanks = sorted(set(re.findall(r"\{\{[^{}]+\}\}", text)))
    print(json.dumps({"file": path, "count": len(blanks), "blanks": blanks}, ensure_ascii=False))
