"""重新下载全部原图（按 people.json 的维基条目名重新解析主图 URL）。"""
import json, os, time, urllib.parse, urllib.request, urllib.error

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "assets", "people")
UA = {"User-Agent": "MBTI-Report-Edu/1.0 (non-commercial study project)"}


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
                time.sleep(7 * (t + 1)); continue
            raise
        except Exception as e:
            last = e; time.sleep(3 * (t + 1))
    raise last


def page_image(lang, title, size=900):
    u = ("https://%s.wikipedia.org/w/api.php?action=query&titles=%s"
         "&prop=pageimages&pithumbsize=%d&format=json&redirects=1"
         % (lang, urllib.parse.quote(title), size))
    d = api(u)
    for pid, v in d.get("query", {}).get("pages", {}).items():
        th = v.get("thumbnail", {})
        return th.get("source")
    return None


def commons_file(fname, size=900):
    """按 Commons 文件名取缩略图 URL（用于手工指定的图）。"""
    u = ("https://commons.wikimedia.org/w/api.php?action=query&titles=%s"
         "&prop=imageinfo&iiprop=url&iiurlwidth=%d&format=json"
         % (urllib.parse.quote(fname), size))
    d = api(u)
    for pid, v in d.get("query", {}).get("pages", {}).items():
        ii = v.get("imageinfo")
        if ii:
            return ii[0].get("thumburl") or ii[0].get("url")
    return None


def download(url, path):
    for t in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if len(data) < 1500:
                raise ValueError("too small")
            open(path, "wb").write(data)
            return len(data)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(6 * (t + 1)); continue
            raise
        except Exception:
            time.sleep(2 * (t + 1))
    raise RuntimeError("fail " + url)


def main():
    groups = json.load(open(os.path.join(BASE, "people.json"), encoding="utf-8"))
    log = []
    ok = fail = 0
    for g in groups:
        for p in g["people"]:
            dest = os.path.join(OUT, p["slug"] + ".jpg")
            try:
                src = commons_file(p["file"]) if p.get("file") else page_image(p["lang"], p["title"])
                if not src:
                    raise RuntimeError("no pageimage")
                size = download(src, dest)
                log.append({"slug": p["slug"], "name": p["name"], "status": "ok",
                            "source_url": src, "bytes": size})
                ok += 1
                print("OK  ", p["slug"], size // 1024, "KB")
            except Exception as e:
                fail += 1
                print("ERR ", p["slug"], e)
            time.sleep(1.5)
    json.dump(log, open(os.path.join(BASE, "fetch_log.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n== refetch-all %d ok, %d fail ==" % (ok, fail))


if __name__ == "__main__":
    main()
