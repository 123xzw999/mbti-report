"""把抓下来的肖像统一处理为 4:5 轻量 JPEG（构图统一 + 亮度归一化），并生成 data/people.js

处理逻辑：
1. 统一裁成 4:5；竖长图偏上裁（保留头部），横图居中裁
2. gamma 校正把灰度中位数拉到 TARGET_MEDIAN，让白描、油画、照片观感一致
3. 输出 520x650 JPEG q82
"""
import json, os, math
from PIL import Image, ImageOps, ImageStat

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "assets", "people")
TARGET_W, TARGET_H = 520, 650
RATIO = TARGET_W / TARGET_H
TARGET_MEDIAN = 118
QUALITY = 82


def normalize(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)

    # 去透明通道，铺深色底
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (18, 18, 21))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")

    w, h = im.size
    # --- 1. 裁成 4:5 ---
    if w / h > RATIO:                      # 太宽：裁左右
        nw = int(h * RATIO)
        left = (w - nw) // 2
        im = im.crop((left, 0, left + nw, h))
    else:                                   # 太高：偏上裁，保留头部
        nh = int(w / RATIO)
        top = int((h - nh) * 0.20)
        im = im.crop((0, top, w, top + nh))

    im = im.resize((TARGET_W, TARGET_H), Image.LANCZOS)

    # --- 2. 判断图像类型 ---
    gray = im.convert("L")
    st = ImageStat.Stat(gray)
    med, sd = st.median[0], st.stddev[0]
    r, g, b = im.split()
    mr = ImageStat.Stat(r).mean[0]; mg = ImageStat.Stat(g).mean[0]; mb = ImageStat.Stat(b).mean[0]
    chroma = abs(mr - mg) + abs(mg - mb) + abs(mr - mb)

    # 白底单色线描 / 版画 / 拓片 → 反相成「黑底米线」的碑拓效果，
    # 这样在深色卡片上不会变成刺眼的亮块。彩色画像(chroma 高)不反相。
    if med > 195 and sd < 85 and chroma < 65:
        im = ImageOps.autocontrast(im, cutoff=0.8)
        im = ImageOps.invert(im)
        rr, gg, bb = im.split()
        im = Image.merge("RGB", (rr, gg.point(lambda v: int(v * 0.965)),
                                bb.point(lambda v: int(v * 0.875))))
        im.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        return (TARGET_W, TARGET_H), "invert"

    # --- 3. 其余：低对比图先拉伸直方图，再统一亮度中位数 ---
    if sd < 58:
        im = ImageOps.autocontrast(im, cutoff=0.8)
        gray = im.convert("L")
        st = ImageStat.Stat(gray)
        med = st.median[0]

    med = max(8, min(247, med))
    if abs(med - TARGET_MEDIAN) > 8:
        gamma = math.log(TARGET_MEDIAN / 255.0) / math.log(med / 255.0)
        gamma = max(0.5, min(2.1, gamma))
        lut = [min(255, max(0, int(255 * ((i / 255.0) ** gamma)))) for i in range(256)]
        im = im.point(lut * 3)

    im.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return (TARGET_W, TARGET_H), "normal"


def main():
    groups = json.load(open(os.path.join(BASE, "people.json"), encoding="utf-8"))
    log = {}
    try:
        for rec in json.load(open(os.path.join(BASE, "fetch_log.json"), encoding="utf-8")):
            log[rec["slug"]] = rec
    except Exception:
        pass

    people_js, hero_js, total = [], [], 0
    for g in groups:
        code = g["code"]
        items = []
        for p in g["people"]:
            path = os.path.join(SRC, p["slug"] + ".jpg")
            if not os.path.exists(path):
                print("!! missing", p["slug"])
                continue
            try:
                _, med = normalize(path)
            except Exception as e:
                print("!! bad", p["slug"], e)
                continue
            total += os.path.getsize(path) / 1024
            lic = log.get(p["slug"], {}).get("license") or "Public domain / free license"
            items.append({"slug": p["slug"], "name": p["name"], "era": p["era"],
                          "origin": p["origin"], "tag": p["tag"], "note": p["note"], "license": lic})
        if items:
            people_js.append('  %s: %s' % (code, json.dumps(items, ensure_ascii=False, indent=1).replace("\n", "\n  ")))
            hero_js.append('  %s: "%s"' % (code, g["hero"]))

    out = "/* 历史人物对照数据 · 肖像取自 Wikimedia Commons（公有领域或自由许可） */\n"
    out += "window.PEOPLE = {\n" + ",\n".join(people_js) + "\n};\n\n"
    out += "window.HERO = {\n" + ",\n".join(hero_js) + "\n};\n"
    open(os.path.join(BASE, "data", "people.js"), "w", encoding="utf-8").write(out)

    print("images: %.1f KB total, avg %.0f KB" % (total, total / max(1, len(log))))
    print("people.js written, groups:", len(people_js))


if __name__ == "__main__":
    main()
