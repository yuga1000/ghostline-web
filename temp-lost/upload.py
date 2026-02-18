#!/usr/bin/env python3
"""Bulk upload lost archive images to Supabase Storage + insert into images table.
Run: SUPABASE_SERVICE_KEY="your_key_here" python3 upload.py
"""

import os
import sys

# pip install supabase if not installed
try:
    from supabase import create_client
except ImportError:
    os.system("pip install supabase httpx[socks]")
    from supabase import create_client

SUPABASE_URL = "https://alqavrioetqfylwkqmak.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_SERVICE_KEY environment variable first!")
    print('Run: export SUPABASE_SERVICE_KEY="your_service_role_key_here"')
    sys.exit(1)

BUCKET = "lost-archive"
FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lost archive ")
CATEGORY = "lost-archive"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Step 1: check/create bucket
print("=== Setting up storage bucket ===")
try:
    buckets = supabase.storage.list_buckets()
    bucket_names = [b.name for b in buckets]
    if BUCKET not in bucket_names:
        print(f"Creating bucket '{BUCKET}'...")
        supabase.storage.create_bucket(BUCKET, options={"public": True})
        print("Bucket created!")
    else:
        print(f"Bucket '{BUCKET}' exists")
except Exception as e:
    print(f"Bucket error: {e}")
    sys.exit(1)

# Step 2: get all image files
extensions = ('.jpg', '.jpeg', '.png', '.gif', '.webp')
files = []
for f in os.listdir(FOLDER):
    if f.lower().endswith(extensions) and not f.startswith('.'):
        files.append(f)

files.sort()
print(f"\n=== Found {len(files)} images ===\n")

# Step 3: upload each file
uploaded = 0
errors = 0

for i, filename in enumerate(files):
    filepath = os.path.join(FOLDER, filename)
    clean_name = filename.replace(' ', '_').lower()
    storage_path = f"images/{clean_name}"

    print(f"[{i+1}/{len(files)}] {filename}...", end=" ", flush=True)

    try:
        with open(filepath, 'rb') as f:
            file_data = f.read()

        ext = os.path.splitext(filename)[1].lower()
        content_type = "image/jpeg" if ext in ('.jpg', '.jpeg') else "image/png"

        # upload to storage
        supabase.storage.from_(BUCKET).upload(
            storage_path, file_data,
            file_options={"content-type": content_type, "upsert": "true"}
        )

        # get public URL
        public_url = supabase.storage.from_(BUCKET).get_public_url(storage_path)

        # insert into images table (columns: title, url, category, status, description)
        supabase.table("images").insert({
            "title": f"LOST_{i+1:03d}",
            "url": public_url,
            "category": CATEGORY,
            "status": "available",
            "description": ""
        }).execute()

        uploaded += 1
        print("OK")
    except Exception as e:
        errors += 1
        print(f"ERROR: {e}")

print(f"\n=== DONE: {uploaded} uploaded, {errors} errors ===")
print("You can delete this script and temp-lost folder now.")
