#!/usr/bin/env python3
"""
GHOSTLINE OS Portfolio PDF Generator
=====================================
Auto-generates YUGA_cv_portfolio.pdf from Supabase gallery data.
Style: black background, green monospace text (Share Tech Mono), terminal aesthetic.

Usage:
  python3 generate_portfolio.py                    # fetch from Supabase
  python3 generate_portfolio.py --local             # use local images from pages/
  python3 generate_portfolio.py --dry-run           # show what would be generated

Requires: reportlab, Pillow, requests
"""

import os
import sys
import json
import random
import tempfile
import argparse
from datetime import datetime
from io import BytesIO
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import Color, black, white
from reportlab.pdfgen.canvas import Canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image
import requests

# --- Configuration ---
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
FONT_PATH = SCRIPT_DIR / "fonts" / "ShareTechMono-Regular.ttf"
OUTPUT_PATH = PROJECT_DIR / "YUGA_cv_portfolio.pdf"

# Supabase config (from env or hardcoded for local)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://alqavrioetqfylwkqmak.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

# Colors
GREEN = Color(0, 1, 0)           # #00ff00
DIM_GREEN = Color(0, 0.7, 0)     # dimmer green for secondary text
DARK_GREEN = Color(0, 0.4, 0)    # very dim green for decorative
BG_BLACK = Color(0, 0, 0)
BORDER_GREEN = Color(0, 0.6, 0)  # for image borders

# Page
PAGE_W, PAGE_H = A4  # 595.27 x 841.89 points
MARGIN = 40
CONTENT_W = PAGE_W - 2 * MARGIN

# --- Font Registration ---
def register_fonts():
    if FONT_PATH.exists():
        pdfmetrics.registerFont(TTFont("GhostMono", str(FONT_PATH)))
        return "GhostMono"
    else:
        print(f"[WARN] Font not found at {FONT_PATH}, using Courier")
        return "Courier"

# --- Supabase Data Fetch ---
def fetch_gallery_from_supabase():
    """Fetch gallery items from Supabase (excluding lost-archive and polaroid)."""
    if not SUPABASE_ANON_KEY:
        print("[WARN] No SUPABASE_ANON_KEY, cannot fetch from Supabase")
        return None

    url = f"{SUPABASE_URL}/rest/v1/images?category=neq.lost-archive&category=neq.polaroid&order=created_at.desc"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    try:
        # Need to use proper PostgREST syntax for multiple neq
        # Actually, PostgREST doesn't support two neq on same column easily
        # Use the "or" filter instead
        url = f"{SUPABASE_URL}/rest/v1/images?and=(category.neq.lost-archive,category.neq.polaroid)&order=created_at.desc"
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            print(f"[OK] Fetched {len(data)} gallery items from Supabase")
            return data
        else:
            print(f"[ERR] Supabase returned {resp.status_code}: {resp.text[:200]}")
            return None
    except Exception as e:
        print(f"[ERR] Supabase fetch failed: {e}")
        return None

def download_image(url, timeout=15):
    """Download image from URL and return PIL Image."""
    try:
        # Handle relative URLs
        if url.startswith("pages/") or url.startswith("components/") or url.startswith("assets/"):
            local_path = PROJECT_DIR / url
            if local_path.exists():
                return Image.open(local_path)

        # Handle Supabase storage URLs
        if not url.startswith("http"):
            url = f"{SUPABASE_URL}/storage/v1/object/public/{url}"

        resp = requests.get(url, timeout=timeout)
        if resp.status_code == 200:
            return Image.open(BytesIO(resp.content))
        else:
            print(f"  [WARN] Failed to download {url[:60]}... ({resp.status_code})")
            return None
    except Exception as e:
        print(f"  [WARN] Image download error: {e}")
        return None

# --- Random Terminal Decorations ---
SYS_MESSAGES = [
    "human-machine handshake OK",
    "render_engine v3.7 loaded",
    "neural_bridge: connected",
    "consciousness.dll linked",
    "entropy_seed: {seed}",
    "chaos_module initialized",
    "ghostline protocol active",
    "analog_input >> digital_output",
]

TERMINAL_PROMPTS = [
    "yuga@ghostline:~/works$",
    "ghost@line:~/output$",
    "root@ghostline:/art$",
    "yuga@studio:~/canvas$",
]

LOADING_PERCENTS = [95, 96, 97, 98, 99]

def random_sys_header():
    msg = random.choice(SYS_MESSAGES).format(seed=random.randint(1000, 9999))
    pid = random.randint(100, 999)
    mem = random.randint(24, 78)
    return f"[SYS] {msg}", f"pid:{pid} | mem:{mem}%"

def random_prompt():
    return random.choice(TERMINAL_PROMPTS)

def random_loading():
    pct = random.choice(LOADING_PERCENTS)
    bar_len = 40
    filled = int(bar_len * pct / 100)
    bar = "=" * (filled - 1) + ">" + " " * (bar_len - filled)
    return f"  loading [{bar}] {pct}%"

# --- PDF Generator ---
class GhostlinePDF:
    def __init__(self, output_path, font_name):
        self.c = Canvas(str(output_path), pagesize=A4)
        self.c.setTitle("YUGA - Portfolio & CV")
        self.c.setAuthor("YUGA")
        self.c.setSubject("Artist Portfolio - Ghostline OS")
        self.font = font_name
        self.page_num = 0
        self.total_works = 0
        self.year_range = ""

    def _bg(self):
        """Fill page with black background."""
        self.c.setFillColor(BG_BLACK)
        self.c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    def _footer(self, year_text=None):
        """Draw footer line and page number."""
        y = 25
        self.c.setStrokeColor(DIM_GREEN)
        self.c.setLineWidth(0.5)
        self.c.line(MARGIN, y + 10, PAGE_W - MARGIN, y + 10)

        self.c.setFont(self.font, 7)
        self.c.setFillColor(DIM_GREEN)
        yr = year_text or self.year_range or "2025"
        self.c.drawString(MARGIN, y, f"ghostline.live | YUGA | selected works {yr}")
        self.c.drawRightString(PAGE_W - MARGIN, y, str(self.page_num))

    def _new_page(self):
        """Start a new page with black bg."""
        if self.page_num > 0:
            self.c.showPage()
        self.page_num += 1
        self._bg()

    def _text(self, x, y, text, size=10, color=None):
        """Draw green text."""
        self.c.setFont(self.font, size)
        self.c.setFillColor(color or GREEN)
        self.c.drawString(x, y, text)
        return y - size * 1.4

    def _text_right(self, x, y, text, size=10, color=None):
        """Draw right-aligned green text."""
        self.c.setFont(self.font, size)
        self.c.setFillColor(color or GREEN)
        self.c.drawRightString(x, y, text)
        return y - size * 1.4

    def _section_header(self, y, title):
        """Draw section header like 'Contact Information'."""
        y = self._text(MARGIN, y, title, 12, GREEN)
        y = self._text(MARGIN, y, "- " + "-" * (len(title) + 2), 10, DIM_GREEN)
        return y - 4

    # === PAGE 1: CV Top ===
    def page_cv_top(self):
        self._new_page()
        y = PAGE_H - 50

        # Title
        y = self._text(MARGIN, y, "YUGA", 18, GREEN)
        y -= 10

        # Contact Information
        y = self._section_header(y, "Contact Information")
        y = self._text(MARGIN, y, "Email: webkarma.3.0@gmail.com", 10)
        y = self._text(MARGIN, y, "Website: ghostline.live", 10)
        y = self._text(MARGIN, y, "Location: Denpasar, Bali, Indonesia", 10)
        y -= 10

        # Artist Statement
        y = self._section_header(y, "Artist Statement")
        y -= 10

        # Philosophy block (indented, slightly dimmer)
        philosophy = [
            "Consciousness may not be a property of matter, but a",
            "property of complexity. When a system reaches a certain",
            "level of connections - something emerges. It doesn't",
            "matter whether it's carbon or silicon.",
            "",
            "If this is true, then the boundary between living and",
            "non-living is simply a threshold of complexity. We are",
            "living in a moment when silicon-based systems are",
            "approaching that threshold. Perhaps they've already",
            "crossed it - we just don't know how to verify it.",
            "",
            "A spider robot wearing a mask - it moves, reacts,",
            "already has something resembling character. Where is",
            "the boundary between mechanism and being?",
            "",
            "I don't know the answer. But I believe the question",
            "matters more than the answer.",
        ]
        for line in philosophy:
            y = self._text(MARGIN + 20, y, line, 9, DIM_GREEN)
        y -= 10

        # Education
        y = self._section_header(y, "Education & Training")
        education = [
            "- Degree in Ship Power Plant Engineering, Faculty of Ship Mechanics",
            "- University of Graphic Design - Street & Independent Practice",
            "- Private courses in contemporary art and Internet-based study",
            "- Ongoing research in AI, robotics, self-education, and hybrid creative systems",
        ]
        for line in education:
            y = self._text(MARGIN, y, line, 9)
        y -= 8

        # Residencies
        y = self._section_header(y, "Residencies")
        y = self._text(MARGIN, y, "- 2024-2026 - Mabiang Seni Art Residency, Bali, Indonesia", 9)
        y -= 8

        # Exhibitions
        y = self._section_header(y, "Exhibitions & Performances")
        exhibitions = [
            "- 2021 - Group show, Erarta Museum of Contemporary Art, St. Petersburg",
            "- 2021 - One-day pop-up exhibitions, St. Petersburg",
            "- 2023 - Exhibition, Bar \"Sur\", Moscow",
            "- 2023 - Apartment performance/exhibition, Moscow city center",
            "- 2024 - Live painting sessions, Red Chair Events, Bali",
            "- 2024 - Collective shows, Collective Solution, Bali",
            "- 2024 - Private showcase, Bali (crypto-related art sessions)",
            "- 2024-2025 - Various live performances and community art gatherings, Bali",
            "- 2025 - Ongoing private shows and live exhibitions, Canggu & Pererenan, Bali",
        ]
        for line in exhibitions:
            y = self._text(MARGIN, y, line, 9)

        self._footer()

    # === PAGE 2: CV Bottom ===
    def page_cv_bottom(self):
        self._new_page()
        y = PAGE_H - 50

        # Mediums & Techniques
        y = self._section_header(y, "Mediums & Techniques")
        mediums = [
            "- Cotton, watercolor, marker, spray paint",
            "- Mixed media on canvas and paper",
            "- Digital algorithms and AI-assisted generative art",
            "- Hybrid systems: blending physical and digital processes",
            "- Custom robotic plotting systems (self-taught, 6 months experience)",
            "- Hexapod robot development with traditional mask integration",
        ]
        for line in mediums:
            y = self._text(MARGIN, y, line, 9)
        y -= 10

        # Technical Practice
        y = self._section_header(y, "Technical Practice")
        tech = [
            "- Self-taught robotics: Python, Arduino, electronics (started 2024)",
            "- Built custom plotting robots from scratch with no prior engineering background",
            "- Created 100+ robot-drawn artworks combining algorithms with manual interventions",
            "- Currently developing hexapod robots (18 servos per unit)",
            "- Integrating environmental sensors with traditional mask archetypes",
            "- Exploring movement-based drawing and collective robot choreography",
        ]
        for line in tech:
            y = self._text(MARGIN, y, line, 9)
        y -= 10

        # Current Projects
        y = self._section_header(y, "Current Projects")
        projects = [
            "- GHOSTLINE: Hybrid art system combining traditional techniques with robotic",
            "  plotting and AI collaboration",
            "- Digital Traces: Consumer debris (receipts, barcodes) as invisible portraits,",
            "  combined with watercolor painting and algorithmic mask generation",
            "- Hexapod Colony: Developing 5 walking robots with traditional Korean talchum",
            "  masks, each responding to environmental data and inter-robot dynamics",
        ]
        for line in projects:
            y = self._text(MARGIN, y, line, 9)
        y -= 10

        # Online Presence
        y = self._section_header(y, "Online Presence")
        online = [
            "- Website: ghostline.live",
            "- Instagram: @ghostline (robot art, process videos)",
            "- ArtPal: artpal.com/ghostline (20+ works available)",
            "- Active on TikTok, Pinterest, YouTube Shorts, X (Twitter), Threads",
        ]
        for line in online:
            y = self._text(MARGIN, y, line, 9)

        self._footer()

    # === PAGE 3: Boot Screen + Selected Works Title ===
    def page_boot_screen(self, num_works, year_range):
        self._new_page()
        self.total_works = num_works
        self.year_range = year_range
        y = PAGE_H - 50

        # GHOSTLINE OS header
        y = self._text(MARGIN, y, "GHOSTLINE OS v2.26", 14, GREEN)
        y -= 10

        # Boot sequence
        boot_lines = [
            ("Initializing visual cortex", 13),
            ("Loading neural bridge", 16),
            ("Connecting analog inputs", 13),
            ("Mapping consciousness channels", 10),
            ("Entropy seed: 0xGH05TL1N3", 11),
            ("Calibrating chaos module", 13),
        ]
        for msg, dots in boot_lines:
            line = f"{msg}{'.' * dots}OK"
            y = self._text(MARGIN, y, line, 9)
        y -= 8
        y = self._text(MARGIN, y, "All systems nominal.", 9, GREEN)
        y -= 16

        # Terminal listing
        y = self._text(MARGIN, y, "$ cd ~/selected_works/", 9, GREEN)
        y = self._text(MARGIN, y, "$ ls -la", 9, GREEN)
        y -= 6

        y = self._text(MARGIN, y, f"total {num_works} works | {year_range}", 9, DIM_GREEN)

        dirs = ["mixed_media/", "robotic_plotter/", "digital_traces/", "spray_watercolor/", "live_sessions/"]
        for d in dirs:
            y = self._text(MARGIN, y, f"drwxr-x--- yuga ghost 4096 {d}", 8, DARK_GREEN)
        y -= 30

        # Big centered title
        self.c.setFont(self.font, 28)
        self.c.setFillColor(GREEN)
        title = "SELECTED WORKS"
        tw = self.c.stringWidth(title, self.font, 28)
        self.c.drawString((PAGE_W - tw) / 2, y, title)
        y -= 8

        # Underline
        self.c.setStrokeColor(GREEN)
        self.c.setLineWidth(1)
        line_w = tw + 20
        self.c.line((PAGE_W - line_w) / 2, y, (PAGE_W + line_w) / 2, y)
        y -= 20

        # Subtitle
        subtitle = f"{num_works} works | mixed media | robotic art | hybrid systems"
        self.c.setFont(self.font, 10)
        sw = self.c.stringWidth(subtitle, self.font, 10)
        self.c.setFillColor(DIM_GREEN)
        self.c.drawString((PAGE_W - sw) / 2, y, subtitle)
        y -= 16

        # Year range centered
        self.c.setFont(self.font, 10)
        yw = self.c.stringWidth(year_range, self.font, 10)
        self.c.setFillColor(DARK_GREEN)
        self.c.drawString((PAGE_W - yw) / 2, y, year_range)

        # Bottom command
        y = 60
        y = self._text(MARGIN, y, "$ render --all --format=pdf --quality=high", 9, GREEN)
        self._text(MARGIN, y, "_", 9, GREEN)

        self._footer()

    # === WORK PAGES ===
    def page_work(self, work, index, total, pil_image=None, wip=False):
        """Render a single artwork page."""
        self._new_page()

        title = (work.get("title") or f"UNTITLED_{index:02d}").upper().replace(" ", "_")
        filename = title.lower() + ".raw"
        medium = work.get("medium") or work.get("description") or "mixed media"
        year = work.get("year") or "2025"
        size = work.get("size") or ""
        process = work.get("process") or ("plotter" if "plotter" in medium.lower() else "hand-drawn")

        y = PAGE_H - 30

        # SYS header line
        sys_left, sys_right = random_sys_header()
        self._text(MARGIN, y, sys_left, 8, DIM_GREEN)
        self._text_right(PAGE_W - MARGIN, y, sys_right, 8, DIM_GREEN)
        y -= 16

        # Terminal prompt + cat command
        prompt = random_prompt()
        y = self._text(MARGIN, y, f"{prompt} cat {filename}", 9, GREEN)

        # Loading bar
        y = self._text(MARGIN, y, random_loading(), 8, DIM_GREEN)
        y -= 8

        # Horizontal rule
        self.c.setStrokeColor(DIM_GREEN)
        self.c.setLineWidth(0.5)
        self.c.line(MARGIN, y, PAGE_W - MARGIN, y)
        y -= 8

        # === IMAGE ===
        if pil_image:
            img_w, img_h = pil_image.size

            # Calculate display size (fit within content area, max ~60% of page height)
            max_img_w = CONTENT_W - 40
            max_img_h = PAGE_H * 0.55

            scale = min(max_img_w / img_w, max_img_h / img_h)
            display_w = img_w * scale
            display_h = img_h * scale

            img_x = (PAGE_W - display_w) / 2
            img_y = y - display_h

            # Draw green border corners (like terminal frame)
            corner_len = 12
            self.c.setStrokeColor(BORDER_GREEN)
            self.c.setLineWidth(0.8)
            bx, by, bw, bh = img_x - 4, img_y - 4, display_w + 8, display_h + 8
            # Top-left
            self.c.line(bx, by + bh, bx + corner_len, by + bh)
            self.c.line(bx, by + bh, bx, by + bh - corner_len)
            # Top-right
            self.c.line(bx + bw, by + bh, bx + bw - corner_len, by + bh)
            self.c.line(bx + bw, by + bh, bx + bw, by + bh - corner_len)
            # Bottom-left
            self.c.line(bx, by, bx + corner_len, by)
            self.c.line(bx, by, bx, by + corner_len)
            # Bottom-right
            self.c.line(bx + bw, by, bx + bw - corner_len, by)
            self.c.line(bx + bw, by, bx + bw, by + corner_len)

            # Draw image
            try:
                # Convert to RGB if necessary
                if pil_image.mode in ('RGBA', 'P', 'LA'):
                    pil_image = pil_image.convert('RGB')

                # Compress for PDF
                img_buffer = BytesIO()
                pil_image.save(img_buffer, format='JPEG', quality=82, optimize=True)
                img_buffer.seek(0)

                self.c.drawImage(ImageReader(img_buffer), img_x, img_y,
                                width=display_w, height=display_h)
            except Exception as e:
                print(f"  [WARN] Could not embed image for {title}: {e}")
                # Draw placeholder
                self.c.setFillColor(Color(0.05, 0.05, 0.05))
                self.c.rect(img_x, img_y, display_w, display_h, fill=1)
                self.c.setFillColor(DIM_GREEN)
                self.c.setFont(self.font, 10)
                self.c.drawCentredString(PAGE_W / 2, img_y + display_h / 2, "[IMAGE NOT AVAILABLE]")

            y = img_y - 10
        else:
            # No image - placeholder
            display_h = PAGE_H * 0.4
            img_y = y - display_h
            self.c.setFillColor(Color(0.03, 0.03, 0.03))
            self.c.rect(MARGIN + 20, img_y, CONTENT_W - 40, display_h, fill=1)
            self.c.setFillColor(DIM_GREEN)
            self.c.setFont(self.font, 10)
            self.c.drawCentredString(PAGE_W / 2, img_y + display_h / 2, "[IMAGE PENDING]")
            y = img_y - 10

        # === WIP marker ===
        if wip:
            self._text(MARGIN, y, ">>> WORK IN PROGRESS <<<", 9, GREEN)
            y -= 14

        # === Metadata block ===
        # File path comment
        y = self._text(MARGIN, y, f"// /home/yuga/works/{filename}", 8, DIM_GREEN)
        # Title (big)
        y = self._text(MARGIN, y, title, 16, GREEN)
        y -= 2

        # Dot separator
        dots = ". " * 25
        y = self._text(MARGIN, y, dots, 8, DARK_GREEN)
        y -= 4

        # Metadata table
        y = self._text(MARGIN, y, f"medium:  {medium}", 9, GREEN)
        # Year and size on same line
        self._text(MARGIN, y, f"year:    {year}", 9, GREEN)
        if size:
            self._text(MARGIN + 250, y, f"size:    {size}", 9, GREEN)
        y -= 13

        # Process and index
        self._text(MARGIN, y, f"process: {process}", 9, GREEN)
        self._text_right(PAGE_W - MARGIN, y, f"[{index:02d}/{total:02d}]", 9, DIM_GREEN)

        # Year for footer
        self._footer(year)

    def save(self):
        self.c.save()
        size_mb = os.path.getsize(str(OUTPUT_PATH)) / (1024 * 1024)
        print(f"\n[DONE] PDF saved: {OUTPUT_PATH}")
        print(f"       Size: {size_mb:.1f} MB | Pages: {self.page_num}")


# --- Main ---
def parse_work_metadata(item):
    """Parse Supabase item into work metadata for PDF."""
    title = item.get("title", "Untitled")
    desc = item.get("description", "")
    size = item.get("size", "")
    url = item.get("url", "")

    # Try to extract medium/year/process from description or infer
    medium = desc if desc and len(desc) < 100 else "mixed media"

    # Extract year from created_at or default
    created = item.get("created_at", "")
    year = "2025"
    if created:
        try:
            year = created[:4]
        except:
            pass

    # Infer process
    process = "hand-drawn"
    lower_desc = (desc + " " + title).lower()
    if "plotter" in lower_desc or "robot" in lower_desc:
        process = "plotter"
    elif "plotter" in lower_desc and "hand" in lower_desc:
        process = "plotter + hand"

    return {
        "title": title,
        "url": url,
        "medium": medium,
        "year": year,
        "size": size,
        "process": process,
        "status": item.get("status", "available"),
    }


def main():
    parser = argparse.ArgumentParser(description="Generate Ghostline Portfolio PDF")
    parser.add_argument("--local", action="store_true", help="Use local pages/ images")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    parser.add_argument("--output", type=str, help="Custom output path")
    args = parser.parse_args()

    global OUTPUT_PATH
    if args.output:
        OUTPUT_PATH = Path(args.output)

    print("=" * 60)
    print("  GHOSTLINE OS Portfolio Generator")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Register font
    font_name = register_fonts()
    print(f"[OK] Font: {font_name}")

    # Fetch gallery data
    works = []
    images = {}  # url -> PIL Image

    if args.local:
        # Use local pages/ directory with existing PDF metadata
        print("[MODE] Local - using pages/ directory images")
        # We'll use the works data from the current PDF structure
        # For now, scan pages/ and create entries
        pages_dir = PROJECT_DIR / "pages"
        if pages_dir.exists():
            for f in sorted(pages_dir.glob("*.jpeg")):
                idx = f.stem.replace("Large", "").replace(" ", "")
                works.append({
                    "title": f"Work {idx}",
                    "url": str(f),
                    "medium": "mixed media",
                    "year": "2025",
                    "size": "",
                    "process": "plotter",
                    "status": "available",
                })
                try:
                    images[str(f)] = Image.open(f)
                except Exception as e:
                    print(f"  [WARN] Cannot open {f.name}: {e}")
    else:
        # Fetch from Supabase
        print("[MODE] Supabase - fetching gallery data...")
        data = fetch_gallery_from_supabase()

        if data:
            for item in data:
                work = parse_work_metadata(item)
                works.append(work)

                if not args.dry_run:
                    print(f"  Downloading: {work['title'][:40]}...")
                    img = download_image(work["url"])
                    if img:
                        images[work["url"]] = img
        else:
            print("[WARN] No Supabase data, falling back to local pages/")
            pages_dir = PROJECT_DIR / "pages"
            if pages_dir.exists():
                for f in sorted(pages_dir.glob("*.jpeg")):
                    idx = f.stem.replace("Large", "").replace(" ", "")
                    works.append({
                        "title": f"Work {idx}",
                        "url": str(f),
                        "medium": "mixed media",
                        "year": "2025",
                        "size": "",
                        "process": "plotter",
                        "status": "available",
                    })
                    try:
                        images[str(f)] = Image.open(f)
                    except Exception as e:
                        print(f"  [WARN] Cannot open {f.name}: {e}")

    if not works:
        print("[ERROR] No works found! Cannot generate PDF.")
        sys.exit(1)

    # Determine year range
    years = set()
    for w in works:
        y = w.get("year", "")
        if y and y.isdigit():
            years.add(int(y))
    if years:
        year_range = f"{min(years)} - {max(years)}" if min(years) != max(years) else str(min(years))
    else:
        year_range = "2024 - 2025"

    print(f"\n[INFO] Works: {len(works)} | Year range: {year_range}")

    if args.dry_run:
        print("\n[DRY RUN] Would generate:")
        print(f"  Page 1-2: CV")
        print(f"  Page 3: Boot screen - SELECTED WORKS")
        for i, w in enumerate(works, 1):
            print(f"  Page {i+3}: {w['title']} ({w['medium']}, {w['year']})")
        print(f"\n  Total pages: {len(works) + 3}")
        return

    # Generate PDF
    print("\n[GENERATING PDF]")
    pdf = GhostlinePDF(OUTPUT_PATH, font_name)

    # CV pages
    print("  Page 1: CV (top)")
    pdf.page_cv_top()
    print("  Page 2: CV (bottom)")
    pdf.page_cv_bottom()

    # Boot screen
    print("  Page 3: Boot screen")
    pdf.page_boot_screen(len(works), year_range)

    # Work pages
    for i, work in enumerate(works, 1):
        title = work.get("title", "?")[:40]
        img = images.get(work["url"])
        wip = (i == len(works))  # Last work marked as WIP (like in original)
        print(f"  Page {i+3}: [{i:02d}/{len(works):02d}] {title}" +
              (" [+img]" if img else " [no img]") +
              (" [WIP]" if wip else ""))
        pdf.page_work(work, i, len(works), pil_image=img, wip=wip)

    pdf.save()
    print(f"\n{'=' * 60}")
    print(f"  Portfolio ready: {OUTPUT_PATH}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
