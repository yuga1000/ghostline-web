#!/bin/bash
# Fetches latest 200 sun frames (AIA 304, 512px) from NASA SDO
# Run via cron or GitHub Actions daily
# Output: data/sun-frames.json

set -e
cd "$(dirname "$0")/.."

TODAY=$(date -u +%Y/%m/%d)
YESTERDAY=$(date -u -v-1d +%Y/%m/%d 2>/dev/null || date -u -d "yesterday" +%Y/%m/%d)
BASE="https://sdo.gsfc.nasa.gov/assets/img/browse"

TMPFILE=$(mktemp)

# Fetch yesterday + today index, extract 512_0304 filenames
for DAY in "$YESTERDAY" "$TODAY"; do
  curl -sf "${BASE}/${DAY}/" 2>/dev/null | \
    grep -o '[0-9]\{8\}_[0-9]\{6\}_512_0304\.jpg' | sort -u >> "$TMPFILE"
done

# Take last 200 unique frames
FRAMES=$(sort -u "$TMPFILE" | tail -200)
rm -f "$TMPFILE"

# Build JSON array
echo -n '[' > data/sun-frames.json
FIRST=1
while IFS= read -r fn; do
  [ -z "$fn" ] && continue
  DATE="${fn:0:8}"
  Y="${DATE:0:4}"
  M="${DATE:4:2}"
  D="${DATE:6:2}"
  URL="${BASE}/${Y}/${M}/${D}/${fn}"
  if [ "$FIRST" = 1 ]; then
    FIRST=0
  else
    echo -n ',' >> data/sun-frames.json
  fi
  echo -n "\"${URL}\"" >> data/sun-frames.json
done <<< "$FRAMES"
echo ']' >> data/sun-frames.json

COUNT=$(echo "$FRAMES" | wc -l | tr -d ' ')
echo "Updated sun-frames.json with ${COUNT} frames"
