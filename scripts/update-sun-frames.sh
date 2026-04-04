#!/bin/bash
# Fetches last 7 days of sun frames (AIA 304, 512px) from NASA SDO
# Takes every Nth frame to get ~200 frames covering a full week
# Run via GitHub Actions daily
# Output: data/sun-frames.json

set -e
cd "$(dirname "$0")/.."

BASE="https://sdo.gsfc.nasa.gov/assets/img/browse"
DAYS_BACK=7
TARGET_FRAMES=200
TMPFILE=$(mktemp)

# Fetch last 7 days of frame listings
for i in $(seq $((DAYS_BACK - 1)) -1 0); do
  # macOS vs Linux date compatibility
  DAY=$(date -u -v-${i}d +%Y/%m/%d 2>/dev/null || date -u -d "${i} days ago" +%Y/%m/%d)
  echo "Fetching $DAY..." >&2
  curl -sf "${BASE}/${DAY}/" 2>/dev/null | \
    grep -o '[0-9]\{8\}_[0-9]\{6\}_512_0304\.jpg' | sort -u >> "$TMPFILE" || true
done

# Count total frames
TOTAL=$(wc -l < "$TMPFILE" | tr -d ' ')
echo "Total frames found: $TOTAL" >&2

if [ "$TOTAL" -eq 0 ]; then
  echo "No frames found, keeping existing JSON" >&2
  rm -f "$TMPFILE"
  exit 0
fi

# Calculate step: every Nth frame to get ~TARGET_FRAMES
STEP=$(( TOTAL / TARGET_FRAMES ))
[ "$STEP" -lt 1 ] && STEP=1

echo "Taking every ${STEP}th frame → ~$(( TOTAL / STEP )) frames" >&2

# Build JSON array with every Nth frame
echo -n '[' > data/sun-frames.json
FIRST=1
COUNT=0
LINE=0
while IFS= read -r fn; do
  [ -z "$fn" ] && continue
  LINE=$((LINE + 1))

  # Take every Nth frame
  if [ $(( (LINE - 1) % STEP )) -ne 0 ]; then
    continue
  fi

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
  COUNT=$((COUNT + 1))
done < "$TMPFILE"
echo ']' >> data/sun-frames.json

rm -f "$TMPFILE"
echo "Updated sun-frames.json: ${COUNT} frames from ${TOTAL} total (every ${STEP}th)" >&2
