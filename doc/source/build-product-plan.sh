#!/usr/bin/env bash
# Rebuild product-plan-v2.docx and product-plan-v2.odt from product-plan-v2.md
cd "$(dirname "$0")" || exit 1
TMP=$(mktemp -d)
PROFILE="file://$TMP/lo-profile"
python3 build-md2html.py product-plan-v2.md "$TMP/product-plan-v2.html" || exit 1
for FMT in 'docx:MS Word 2007 XML' odt; do
  timeout 180 soffice -env:UserInstallation="$PROFILE" --headless --convert-to "$FMT" "$TMP/product-plan-v2.html" --outdir "$TMP" >/dev/null 2>&1
  echo "convert ${FMT%%:*} rc=$?"
done
cp "$TMP/product-plan-v2.docx" "$TMP/product-plan-v2.odt" . && ls -l product-plan-v2.docx product-plan-v2.odt
rm -rf "$TMP"
