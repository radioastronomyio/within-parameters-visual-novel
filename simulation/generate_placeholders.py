"""
generate_placeholders.py
Placeholder image generator and asset manifest tool for Within Parameters.

Reads data/characters.json, generates labeled placeholder images for portraits
and backgrounds, and maintains a CSV manifest (assets/asset-manifest.csv) that
tracks which assets are placeholders vs. replaced with production art.

Usage:
    python simulation/generate_placeholders.py              # generate placeholders + update manifest
    python simulation/generate_placeholders.py --manifest    # update manifest only (no image generation)

Run from the repository root. Requires Pillow (pip install Pillow).

Manifest status values:
    placeholder  - generated grey placeholder, no production art yet
    replaced     - file exists and does not match placeholder (production art in place)
    missing      - expected by engine config but file not found on disk
"""

import json
import csv
import hashlib
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is required: pip install Pillow --break-system-packages")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = REPO_ROOT / "data" / "characters.json"
ASSETS_DIR = REPO_ROOT / "assets"
MANIFEST_FILE = ASSETS_DIR / "asset-manifest.csv"

PORTRAIT_WIDTH = 480
PORTRAIT_HEIGHT = 640
BG_WIDTH = 1280
BG_HEIGHT = 720

BG_COLOR = (64, 64, 64)
TEXT_COLOR = (220, 220, 220)
SUBTEXT_COLOR = (160, 160, 160)

# Marker embedded in placeholder PNGs so we can detect replacements.
PLACEHOLDER_MARKER = b"WP-PLACEHOLDER-V1"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_characters_json() -> dict:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def build_label_for_portrait(key: str, characters: list[dict]) -> tuple[str, str]:
    """Return (character_name, expression) from a portrait key like 'coworker-concerned'."""
    for char in characters:
        for expr, expr_key in char.get("expressions", {}).items():
            if expr_key == key:
                return char["name"] or char["id"].upper(), expr
    return key, ""


def try_load_font(size: int):
    """Try to load a reasonable font. Fall back to Pillow default."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def generate_placeholder(width: int, height: int, lines: list[str], out_path: Path):
    """Generate a grey placeholder PNG with centered text lines."""
    img = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)

    font_large = try_load_font(28)
    font_small = try_load_font(18)

    # Compute vertical centering for all lines.
    total_height = 0
    line_data = []
    for i, text in enumerate(lines):
        font = font_large if i == 0 else font_small
        color = TEXT_COLOR if i == 0 else SUBTEXT_COLOR
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        line_data.append((text, font, color, tw, th))
        total_height += th + 8

    y = (height - total_height) // 2
    for text, font, color, tw, th in line_data:
        x = (width - tw) // 2
        draw.text((x, y), text, fill=color, font=font)
        y += th + 8

    # Draw a thin border so placeholders are visually distinct.
    draw.rectangle([0, 0, width - 1, height - 1], outline=(100, 100, 100), width=2)

    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Embed marker in PNG metadata for detection.
    from PIL.PngImagePlugin import PngInfo
    meta = PngInfo()
    meta.add_text("wp-placeholder", PLACEHOLDER_MARKER.decode())
    img.save(out_path, format="PNG", pnginfo=meta)


def is_placeholder(filepath: Path) -> bool:
    """Check if a file is a generated placeholder by reading its PNG metadata."""
    if not filepath.exists():
        return False
    try:
        img = Image.open(filepath)
        return img.info.get("wp-placeholder") == PLACEHOLDER_MARKER.decode()
    except Exception:
        return False


def file_hash(filepath: Path) -> str:
    """SHA-256 of a file, truncated to 16 chars."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    manifest_only = "--manifest" in sys.argv

    data = load_characters_json()
    characters = data.get("characters", [])
    portraits = data.get("portraits", [])
    backgrounds = data.get("backgrounds", [])
    audio_entries = data.get("audio", [])

    rows = []

    # --- Portraits ---
    for p in portraits:
        key = p["key"]
        rel_path = p["path"]
        abs_path = ASSETS_DIR / rel_path
        char_name, expression = build_label_for_portrait(key, characters)

        if not manifest_only and not abs_path.exists():
            lines = [char_name, expression] if expression else [char_name]
            generate_placeholder(PORTRAIT_WIDTH, PORTRAIT_HEIGHT, lines, abs_path)
            print(f"  generated  {rel_path}")

        status = "missing"
        if abs_path.exists():
            status = "placeholder" if is_placeholder(abs_path) else "replaced"

        rows.append({
            "type": "portrait",
            "key": key,
            "filename": rel_path,
            "dimensions": f"{PORTRAIT_WIDTH}x{PORTRAIT_HEIGHT}",
            "label": f"{char_name} / {expression}" if expression else char_name,
            "status": status,
            "hash": file_hash(abs_path) if abs_path.exists() else "",
        })

    # --- Backgrounds ---
    for bg in backgrounds:
        key = bg["key"]
        rel_path = bg["path"]
        abs_path = ASSETS_DIR / rel_path
        label = bg.get("locationName", key)

        if not manifest_only and not abs_path.exists():
            lines = [label, f"[{key}]"]
            generate_placeholder(BG_WIDTH, BG_HEIGHT, lines, abs_path)
            print(f"  generated  {rel_path}")

        status = "missing"
        if abs_path.exists():
            status = "placeholder" if is_placeholder(abs_path) else "replaced"

        rows.append({
            "type": "background",
            "key": key,
            "filename": rel_path,
            "dimensions": f"{BG_WIDTH}x{BG_HEIGHT}",
            "label": label,
            "status": status,
            "hash": file_hash(abs_path) if abs_path.exists() else "",
        })

    # --- Audio (manifest tracking only, no generation) ---
    for a in audio_entries:
        key = a["key"]
        rel_path = a["path"]
        abs_path = ASSETS_DIR / rel_path

        status = "replaced" if abs_path.exists() else "missing"

        rows.append({
            "type": "audio",
            "key": key,
            "filename": rel_path,
            "dimensions": "",
            "label": key,
            "status": status,
            "hash": file_hash(abs_path) if abs_path.exists() else "",
        })

    # --- Write manifest ---
    fieldnames = ["type", "key", "filename", "dimensions", "label", "status", "hash"]
    MANIFEST_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # --- Summary ---
    by_status = {}
    for r in rows:
        by_status.setdefault(r["status"], []).append(r["key"])

    print(f"\nManifest written to {MANIFEST_FILE.relative_to(REPO_ROOT)}")
    for status in ["placeholder", "replaced", "missing"]:
        keys = by_status.get(status, [])
        if keys:
            print(f"  {status}: {len(keys)}")

    if not manifest_only:
        print("\nPlaceholder images generated. Drop production art into the same paths")
        print("and re-run with --manifest to update status without regenerating.")


if __name__ == "__main__":
    main()
