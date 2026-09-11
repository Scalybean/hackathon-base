"""
Generates the PWA icon set from the design tokens, so the icons are
reproducible rather than binary blobs nobody can regenerate.

    python3 scripts/generate-icons.py

Mark: the wordmark motif, a rule and a full stop, on the clay ground.
"""
from PIL import Image, ImageDraw

CLAY = (180, 69, 31, 255)      # --clay-500
CREAM = (250, 247, 242, 255)   # --stone-50

OUT = "public"

# (filename, size, inset ratio). Maskable icons need their content inside the
# central 80% so a launcher can crop them to any shape without clipping.
TARGETS = [
    ("icon-192.png", 192, 0.18, False),
    ("icon-512.png", 512, 0.18, False),
    ("icon-maskable-512.png", 512, 0.30, True),
    ("apple-touch-icon.png", 180, 0.16, True),
]


def draw_icon(size: int, inset_ratio: float, fill_corners: bool) -> Image.Image:
    # Render at 4x and downsample: PIL has no antialiased primitives.
    scale = 4
    s = size * scale
    image = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = 0 if fill_corners else int(s * 0.22)
    if radius:
        draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=CLAY)
    else:
        draw.rectangle([0, 0, s - 1, s - 1], fill=CLAY)

    inset = int(s * inset_ratio)
    box = s - inset * 2

    bar_h = int(box * 0.175)
    gap = int(box * 0.15)
    long_w = box
    short_w = int(box * 0.44)
    dot_r = bar_h // 2

    total_h = bar_h * 2 + gap
    top = inset + (box - total_h) // 2
    left = inset

    # The rule.
    draw.rounded_rectangle(
        [left, top, left + long_w, top + bar_h], radius=bar_h // 2, fill=CREAM
    )

    # The short second line.
    y2 = top + bar_h + gap
    draw.rounded_rectangle(
        [left, y2, left + short_w, y2 + bar_h], radius=bar_h // 2, fill=CREAM
    )

    # The full stop, set after the short line.
    cx = left + short_w + int(gap * 0.8) + dot_r
    cy = y2 + dot_r
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=CREAM)

    return image.resize((size, size), Image.LANCZOS)


for name, size, inset_ratio, fill_corners in TARGETS:
    draw_icon(size, inset_ratio, fill_corners).save(f"{OUT}/{name}")
    print(f"  + {OUT}/{name}  {size}x{size}")
