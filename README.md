# 人格档案 · Personality Archive

一个纯静态的 16 型人格测试报告站。32 道词对题，四个维度，生成一份包含维度分数、优势盲点、历史名人对照与成长建议的完整报告。

**在线访问**：https://123xzw999.github.io/mbti-report/

---

## 特点

- **题目有出处**：使用 Open Extended Jungian Type Scales 1.2（OEJTS）第一部分的 32 道语义差异题，公开学术量表，非自编题。
- **计分可复现**：每维度 8 题、5 点计分，原始分 8–40 线性映射到 0–100%，50% 表示无偏好。代码完全公开，任何人都能核对。
- **历史名人对照**：每型六位——中国古代三位、西方三位，共 96 人。肖像取自 Wikimedia Commons 的公有领域或自由许可文件。
- **零依赖**：纯 HTML + CSS + 原生 JS，双击 `index.html` 即可打开，无需构建、无需联网。
- **可分享**：报告链接携带维度分数，别人打开能看到同一份报告。

## 目录结构

```
mbti-report/
├── index.html              入口
├── app.js                  路由 / 计分 / 渲染
├── assets/
│   ├── style.css           全部样式
│   └── people/*.jpg        96 张历史人物肖像
├── data/
│   ├── questions.js        32 道题（含维度与极性）
│   ├── types.js            16 型人格档案
│   └── people.js           人物对照数据（由脚本生成）
├── people.json             人物清单（含维基条目名）
├── fetch_portraits.py      批量抓取肖像
└── process_images.py       图片压缩 + 生成 people.js
```

## 本地运行

```bash
# 任意静态服务器均可
python -m http.server 8787
# 打开 http://127.0.0.1:8787/
```

直接双击 `index.html` 也能用（`file://` 协议下 localStorage 可能受限，建议用本地服务器）。

## 数据来源

| 内容 | 来源 | 许可 |
|---|---|---|
| 32 道题 | [OEJTS 1.2](https://openpsychometrics.org/tests/OEJTS/)，Eric Jorgenson (2014) | 公开发表量表 |
| 人物肖像 | [Wikimedia Commons](https://commons.wikimedia.org/) | 公有领域 / 自由许可 |
| 类型描述 | 基于 MBTI 与 OEJTS 文献综述整理 | 本项目原创撰写 |

## 重新抓取肖像

```bash
pip install Pillow
python fetch_portraits.py     # 按 people.json 拉取，带限流退避
python process_images.py      # 压缩到 520px 宽 + 生成 data/people.js
```

## 免责声明

MBTI 与 OEJTS 都不是临床诊断工具，结果仅供自我探索与娱乐参考。人格是连续谱而非四个格子，报告描述的是偏好，不是能力上限。历史人物与类型的对应为基于公开传记的推断，属通俗类型学的常见做法，无实证效力。

本项目为个人学习用途，非商业。
