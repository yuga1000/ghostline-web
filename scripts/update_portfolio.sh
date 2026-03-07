#!/bin/bash

# ============================================================
# GHOSTLINE OS - Portfolio PDF Auto-Update
# ============================================================
# Regenerates YUGA_cv_portfolio.pdf and pushes to production.
# Railway auto-deploys on push to main.
#
# Usage:
#   ./scripts/update_portfolio.sh              # Supabase mode (needs SUPABASE_ANON_KEY)
#   ./scripts/update_portfolio.sh --local      # local images from pages/
#   ./scripts/update_portfolio.sh --dry-run    # just show what would happen
# ============================================================

set -e

# Navigate to project root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Config
PDF_FILE="YUGA_cv_portfolio.pdf"
PYTHON="/Users/yuga/Documents/Ghostline_art_module/venv/bin/python3"
GENERATOR="$SCRIPT_DIR/generate_portfolio.py"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${GREEN}${BOLD}[GHOSTLINE OS] Portfolio auto-update${NC}"
echo -e "${DIM}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Check prerequisites
if [ ! -f "$GENERATOR" ]; then
    echo -e "${RED}[ERROR] Generator not found: $GENERATOR${NC}"
    exit 1
fi

if [ ! -f "$PYTHON" ]; then
    echo -e "${RED}[ERROR] Python venv not found: $PYTHON${NC}"
    echo "Install: python3 -m venv /Users/yuga/Documents/Ghostline_art_module/venv"
    exit 1
fi

if [ ! -d ".git" ]; then
    echo -e "${RED}[ERROR] Not a git repository. Run from project root.${NC}"
    exit 1
fi

# Capture old PDF hash (if exists) to detect changes
OLD_HASH=""
if [ -f "$PDF_FILE" ]; then
    OLD_HASH=$(md5 -q "$PDF_FILE" 2>/dev/null || md5sum "$PDF_FILE" | cut -d' ' -f1)
fi

# --- Step 1: Generate PDF ---
echo -e "${GREEN}[1/3] Generating PDF...${NC}"

# Pass through arguments (--local, --dry-run, etc.)
$PYTHON "$GENERATOR" "$@"

GENERATE_EXIT=$?
if [ $GENERATE_EXIT -ne 0 ]; then
    echo -e "${RED}[ERROR] PDF generation failed (exit code $GENERATE_EXIT)${NC}"
    exit 1
fi

# Dry-run mode: stop here
if [[ "$*" == *"--dry-run"* ]]; then
    echo -e "${DIM}[DRY-RUN] No changes made.${NC}"
    exit 0
fi

# --- Step 2: Check if PDF changed ---
echo -e "${GREEN}[2/3] Checking for changes...${NC}"

if [ ! -f "$PDF_FILE" ]; then
    echo -e "${RED}[ERROR] PDF not found after generation: $PDF_FILE${NC}"
    exit 1
fi

NEW_HASH=$(md5 -q "$PDF_FILE" 2>/dev/null || md5sum "$PDF_FILE" | cut -d' ' -f1)
PDF_SIZE=$(ls -lh "$PDF_FILE" | awk '{print $5}')

if [ "$OLD_HASH" = "$NEW_HASH" ]; then
    echo -e "${DIM}[SKIP] PDF unchanged ($PDF_SIZE). Nothing to push.${NC}"
    exit 0
fi

echo -e "${GREEN}  PDF updated: $PDF_SIZE${NC}"

# --- Step 3: Commit & Push ---
echo -e "${GREEN}[3/3] Committing and pushing...${NC}"

WORK_COUNT=$($PYTHON -c "
from pathlib import Path
import subprocess, sys
result = subprocess.run([sys.executable, '$GENERATOR', '--dry-run'], capture_output=True, text=True)
lines = result.stdout.split('\n')
for line in lines:
    if 'work' in line.lower() and ('page' in line.lower() or 'item' in line.lower()):
        # Try to extract number
        import re
        nums = re.findall(r'\d+', line)
        if nums:
            print(nums[0])
            break
else:
    print('?')
" 2>/dev/null || echo "?")

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
COMMIT_MSG="Auto-update portfolio PDF ($WORK_COUNT works, $PDF_SIZE) - $TIMESTAMP"

git add "$PDF_FILE"
git commit -m "$COMMIT_MSG"

echo -e "${GREEN}  Pushing to origin/main...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}${BOLD}[DONE] Portfolio updated and deployed!${NC}"
    echo -e "${DIM}  File: $PDF_FILE ($PDF_SIZE)${NC}"
    echo -e "${DIM}  Commit: $COMMIT_MSG${NC}"
    echo -e "${DIM}  Railway will auto-deploy in ~60 seconds.${NC}"
else
    echo -e "${RED}[ERROR] Push failed. Commit was made locally.${NC}"
    echo -e "${DIM}  Run 'git push origin main' manually to retry.${NC}"
    exit 1
fi
