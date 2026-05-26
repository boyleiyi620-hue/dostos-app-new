"""Generate PWA icons for Konuşuyorum app - cute child theme with rainbow."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT_DIR, exist_ok=True)

# Required PWA icon sizes
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Safe area for maskable (inner 80%)
    pad = int(size * 0.1) if maskable else 0
    inner = size - 2 * pad

    # Rounded background — soft pink-to-blue gradient
    # Make gradient by drawing horizontal lines
    bg = Image.new("RGB", (inner, inner), (255, 245, 225))
    bg_draw = ImageDraw.Draw(bg)
    for y in range(inner):
        t = y / max(1, inner - 1)
        # from #ffe4f1 (pink) → #e1f0ff (blue)
        r = int(255 * (1 - t) + 225 * t)
        g = int(228 * (1 - t) + 240 * t)
        b = int(241 * (1 - t) + 255 * t)
        bg_draw.line([(0, y), (inner, y)], fill=(r, g, b))

    # Rounded mask
    mask = Image.new("L", (inner, inner), 0)
    mdraw = ImageDraw.Draw(mask)
    radius = int(inner * (0.22 if not maskable else 0.5))
    mdraw.rounded_rectangle([0, 0, inner, inner], radius=radius, fill=255)

    img.paste(bg, (pad, pad), mask)

    # Draw rainbow arc 🌈
    cx = size // 2
    cy = int(size * 0.62)
    rainbow_colors = [
        (255, 105, 140),   # pink-red
        (255, 165, 100),   # orange
        (255, 215, 120),   # yellow
        (140, 220, 150),   # green
        (130, 190, 240),   # blue
        (190, 150, 230),   # purple
    ]
    band_width = max(2, int(size * 0.035))
    outer_r = int(size * 0.34)
    for i, color in enumerate(rainbow_colors):
        r_out = outer_r - i * band_width
        r_in = r_out - band_width
        if r_in <= 0:
            break
        draw.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], fill=color)
        draw.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], fill=(0, 0, 0, 0))
    # cover bottom half of rainbow with bg color to make arc
    draw.rectangle([0, cy, size, size], fill=(255, 255, 255, 0))
    # Need to re-mask bottom half to bg pattern — easier: paint bottom half with pinkish bg
    # Actually we want clean arc, so paint the bottom half transparent and re-add bg below
    # Easier approach: redraw bg gradient over bottom half
    bg2 = Image.new("RGB", (inner, inner // 2 + 10), (255, 245, 225))
    bg2_draw = ImageDraw.Draw(bg2)
    for y in range(bg2.height):
        # continue gradient
        actual_y = (inner // 2) + y
        t = actual_y / max(1, inner - 1)
        t = min(max(t, 0), 1)
        r = int(255 * (1 - t) + 225 * t)
        g = int(228 * (1 - t) + 240 * t)
        b = int(241 * (1 - t) + 255 * t)
        bg2_draw.line([(0, y), (inner, y)], fill=(r, g, b))
    mask2 = Image.new("L", (inner, bg2.height), 0)
    m2draw = ImageDraw.Draw(mask2)
    # only inside rounded bg
    # build a sub-mask by cropping original mask
    sub_mask = mask.crop((0, inner // 2, inner, inner))
    # paste bg2 onto img using sub_mask
    img.paste(bg2.crop((0, 0, inner, sub_mask.height)),
              (pad, pad + inner // 2),
              sub_mask)

    # Cloud (white circles) at base of rainbow
    cloud_color = (255, 255, 255, 235)
    cw = int(size * 0.10)
    cy2 = cy + int(size * 0.005)
    # left cloud
    draw.ellipse([cx - int(size*0.32), cy2 - cw//2, cx - int(size*0.18), cy2 + cw//2], fill=cloud_color)
    draw.ellipse([cx - int(size*0.28), cy2 - int(cw*0.7), cx - int(size*0.14), cy2 + int(cw*0.7)], fill=cloud_color)
    # right cloud
    draw.ellipse([cx + int(size*0.18), cy2 - cw//2, cx + int(size*0.32), cy2 + cw//2], fill=cloud_color)
    draw.ellipse([cx + int(size*0.14), cy2 - int(cw*0.7), cx + int(size*0.28), cy2 + int(cw*0.7)], fill=cloud_color)

    # Speech bubble in top area with heart
    bx1 = int(size * 0.28)
    by1 = int(size * 0.14)
    bx2 = int(size * 0.72)
    by2 = int(size * 0.42)
    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=int(size*0.08),
                            fill=(255, 255, 255, 240), outline=(255, 158, 199), width=max(2, size//80))
    # bubble tail
    tail = [
        (int(size*0.42), by2 - 2),
        (int(size*0.40), int(size*0.50)),
        (int(size*0.50), by2 - 2),
    ]
    draw.polygon(tail, fill=(255, 255, 255, 240), outline=(255, 158, 199))

    # Heart inside bubble
    hx = cx
    hy = (by1 + by2) // 2
    hs = int(size * 0.11)
    heart_color = (255, 105, 140)
    # two circles + triangle
    draw.ellipse([hx - hs, hy - hs//2, hx, hy + hs//2], fill=heart_color)
    draw.ellipse([hx, hy - hs//2, hx + hs, hy + hs//2], fill=heart_color)
    draw.polygon([
        (hx - hs + 2, hy + hs//4),
        (hx + hs - 2, hy + hs//4),
        (hx, hy + hs + 2)
    ], fill=heart_color)

    # Small sparkles
    sparkle_color = (255, 215, 120)
    for (sx, sy, ss) in [
        (int(size*0.18), int(size*0.20), int(size*0.025)),
        (int(size*0.82), int(size*0.22), int(size*0.022)),
        (int(size*0.15), int(size*0.55), int(size*0.020)),
        (int(size*0.85), int(size*0.58), int(size*0.025)),
    ]:
        draw.ellipse([sx-ss, sy-ss, sx+ss, sy+ss], fill=sparkle_color)

    return img


for s in SIZES:
    icon = make_icon(s, maskable=False)
    icon.save(os.path.join(OUT_DIR, f"icon-{s}.png"), "PNG")
    print(f"Created icon-{s}.png")

# Maskable versions (192, 512)
for s in [192, 512]:
    icon = make_icon(s, maskable=True)
    icon.save(os.path.join(OUT_DIR, f"icon-maskable-{s}.png"), "PNG")
    print(f"Created icon-maskable-{s}.png")

# Apple touch icon
apple = make_icon(180, maskable=False)
apple.save(os.path.join(OUT_DIR, "apple-touch-icon.png"), "PNG")
print("Created apple-touch-icon.png")

# Favicon
fav = make_icon(64, maskable=False)
fav.save(os.path.join(OUT_DIR, "favicon-64.png"), "PNG")
print("Created favicon-64.png")

print("\nAll icons generated!")
