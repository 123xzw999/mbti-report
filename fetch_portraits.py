"""从维基百科/Wikimedia Commons 抓取 96 位历史人物的公开肖像图。
输出: assets/people/<slug>.jpg  以及 fetch_log.json（含授权信息）
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "assets", "people")
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "MBTI-Report-Edu/1.0 (non-commercial study project; contact: local)"}


def api(url, tries=4):
    last = None
    for t in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (429, 503):
                time.sleep(8 * (t + 1))
                continue
            raise
        except Exception as e:
            last = e
            time.sleep(3 * (t + 1))
    raise last


def page_image(lang, title, size=520):
    """返回 (thumb_url, canonical_title, pageid)"""
    u = ("https://%s.wikipedia.org/w/api.php?action=query&titles=%s"
         "&prop=pageimages&pithumbsize=%d&format=json&redirects=1"
         % (lang, urllib.parse.quote(title), size))
    d = api(u)
    pages = d.get("query", {}).get("pages", {})
    for pid, v in pages.items():
        th = v.get("thumbnail", {})
        return th.get("source"), v.get("title"), pid
    return None, None, None


def image_license(url):
    """查询文件页的许可信息（best effort）"""
    try:
        fname = url.split("/")[-1].split("?")[0]
        fname = urllib.parse.unquote(fname)
        # 去掉缩略图前缀 e.g. 520px-xxx.jpg
        if fname.lower().startswith(tuple("%dpx-" % n for n in range(100, 900))):
            fname = fname.split("-", 1)[1]
        u = ("https://commons.wikimedia.org/w/api.php?action=query&titles=File:%s"
             "&prop=imageinfo&iiprop=extmetadata&format=json" % urllib.parse.quote(fname))
        d = api(u)
        for pid, v in d.get("query", {}).get("pages", {}).items():
            ii = v.get("imageinfo")
            if not ii:
                continue
            em = ii[0].get("extmetadata", {})
            return {
                "license": em.get("LicenseShortName", {}).get("value"),
                "artist": em.get("Artist", {}).get("value", "")[:200],
                "credit": em.get("Credit", {}).get("value", "")[:200],
            }
    except Exception as e:
        return {"license": None, "err": str(e)}
    return {"license": None}


def download(url, path):
    last = None
    for t in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            if len(data) < 1500:
                raise ValueError("too small: %d bytes" % len(data))
            with open(path, "wb") as f:
                f.write(data)
            return len(data)
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (429, 503):
                time.sleep(8 * (t + 1))
                continue
            raise
        except Exception as e:
            last = e
            time.sleep(2 * (t + 1))
    raise last


def main():
    groups = json.load(open(os.path.join(BASE, "people.json"), encoding="utf-8"))
    log, fails = [], []
    for g in groups:
        for p in g["people"]:
            slug = p["slug"]
            dest = os.path.join(OUT, slug + ".jpg")
            rec = {"code": g["code"], "slug": slug, "name": p["name"]}
            if os.path.exists(dest) and os.path.getsize(dest) > 3000:
                rec["status"] = "cached"
                log.append(rec)
                print("SKIP", slug)
                continue
            try:
                src, canon, pid = page_image(p["lang"], p["title"])
                if not src:
                    fails.append((slug, p["name"], "no pageimage"))
                    print("FAIL", slug, "no image")
                    continue
                size = download(src, dest)
                lic = image_license(src)
                rec.update({"status": "ok", "bytes": size, "wiki_title": canon,
                            "source_url": src, "pageid": pid, **lic})
                log.append(rec)
                print("OK  ", slug, size, "|", lic.get("license"))
            except Exception as e:
                fails.append((slug, p["name"], str(e)))
                print("ERR ", slug, e)
            time.sleep(1.6)
    json.dump(log, open(os.path.join(BASE, "fetch_log.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n== done: %d ok, %d fail ==" % (len(log), len(fails)))
    for f in fails:
        print("  MISSING:", f)


if __name__ == "__main__":
    main()
