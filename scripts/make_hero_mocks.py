from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
hero = root / "assets" / "img" / "hero"


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


# --- mock-web: company profile website ---
web_src = Image.open(root / "assets/img/projects/nahwaalsikha/1.png").convert("RGB")
w, h = web_src.size
crop_h = min(h, int(w * 10 / 16))
web = web_src.crop((0, 0, w, crop_h)).resize((640, 400), Image.Resampling.LANCZOS)
web.save(hero / "mock-web.jpg", "JPEG", quality=88, optimize=True)

# --- mock-app: travel catalog phone UI ---
W, H = 420, 760
phone = Image.new("RGBA", (W, H), (15, 47, 44, 255))

travel = Image.open(hero / "travel.jpg").convert("RGB")
tw, th = travel.size
header_h = 290
scale = max(W / tw, header_h / th)
nw, nh = int(tw * scale), int(th * scale)
travel = travel.resize((nw, nh), Image.Resampling.LANCZOS)
left = (nw - W) // 2
top = max(0, (nh - header_h) // 2)
header = travel.crop((left, top, left + W, top + header_h)).convert("RGBA")

overlay = Image.new("RGBA", (W, header_h), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
for y in range(header_h):
    a = int(50 + (y / header_h) * 170)
    od.line([(0, y), (W, y)], fill=(8, 50, 46, a))
header = Image.alpha_composite(header, overlay)
phone.paste(header, (0, 0))

draw = ImageDraw.Draw(phone)
f_md = font(22, True)
f_lg = font(28, True)
f_xs = font(15)

draw.text((24, 200), "Mbarep Tour", font=f_md, fill="#ffffff")
draw.text((24, 232), "Katalog Wisata", font=f_lg, fill="#ffffff")

sheet_y = 270
draw.rounded_rectangle((0, sheet_y, W, H), radius=28, fill="#f7faf9")
draw.rectangle((0, H - 40, W, H), fill="#f7faf9")
draw.text((24, sheet_y + 22), "Pilih paket", font=f_md, fill="#14201f")

items = [
    ("Wisata", "Rombongan siap jalan", "#0b5c56"),
    ("Studi Tour", "Sekolah & kampus", "#147a70"),
    ("Kunjungan Industri", "Kunjungan institusi", "#1a8a7e"),
    ("Family Gathering", "Keluarga & komunitas", "#c45c26"),
    ("Outbound", "Team building", "#e07a2f"),
]

y = sheet_y + 60
for title, sub, accent in items:
    draw.rounded_rectangle((18, y, W - 18, y + 72), radius=16, fill="#ffffff", outline="#d7e6e3", width=1)
    draw.ellipse((32, y + 22, 52, y + 42), fill=accent)
    draw.text((66, y + 14), title, font=f_md, fill="#14201f")
    draw.text((66, y + 42), sub, font=f_xs, fill="#5b6b69")
    draw.text((W - 42, y + 20), ">", font=f_lg, fill="#0b5c56")
    y += 84

draw.rounded_rectangle((18, H - 70, W - 18, H - 22), radius=18, fill="#0b5c56")
bbox = draw.textbbox((0, 0), "Chat WhatsApp", font=f_md)
tw_txt = bbox[2] - bbox[0]
draw.text(((W - tw_txt) / 2, H - 58), "Chat WhatsApp", font=f_md, fill="#ffffff")

phone.convert("RGB").save(hero / "mock-app.jpg", "JPEG", quality=90, optimize=True)
print("ok", (hero / "mock-web.jpg").stat().st_size, (hero / "mock-app.jpg").stat().st_size)
