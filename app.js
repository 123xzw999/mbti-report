/* ===== 人格档案 · 应用逻辑 ===== */
(function () {
  'use strict';

  var Q = window.QUESTIONS, TYPES = window.TYPES, GROUPS = window.GROUPS;
  var DIMS = window.DIMENSIONS, PEOPLE = window.PEOPLE || {}, HERO = window.HERO || {};
  var view = document.getElementById('view');
  var PER_PAGE = 8;
  var STORE_KEY = 'mbti_archive_v1';

  /* ---------- 工具 ---------- */
  function h(s) { var d = document.createElement('div'); d.innerHTML = s.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function groupColor(code) {
    var g = TYPES[code] && TYPES[code].group;
    return g === 'NT' ? 'var(--nt)' : g === 'NF' ? 'var(--nf)' : g === 'SJ' ? 'var(--sj)' : 'var(--sp)';
  }
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }
  function store(k, v) {
    try {
      var o = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (v === undefined) return o[k] === undefined ? null : o[k];
      o[k] = v;
      localStorage.setItem(STORE_KEY, JSON.stringify(o));
    } catch (e) { return null; }
  }

  /* ---------- 计分 ---------- */
  function computeScore(answers) {
    var acc = { EI: 0, SN: 0, TF: 0, JP: 0 };
    Q.forEach(function (q) {
      var v = answers[q.id];
      if (!v) v = 3;
      /* v=1 表示选了左端。若左端就是该维度第一个字母，则得分反向取 6-v，
         使「选左端」在两种题目里都映射为「更偏第一个字母」。 */
      acc[q.dim] += (q.left === DIMS[q.dim].first) ? (6 - v) : v;
    });
    var out = {}, code = '';
    ['EI', 'SN', 'TF', 'JP'].forEach(function (d) {
      var pct = Math.round((acc[d] - 8) / 32 * 100);
      pct = Math.max(0, Math.min(100, pct));
      out[d] = pct;
      code += pct >= 50 ? DIMS[d].first : (DIMS[d].first === 'E' ? 'I' : DIMS[d].first === 'S' ? 'N' : DIMS[d].first === 'T' ? 'F' : 'P');
    });
    return { code: code, pct: out };
  }
  function strength(p) {
    var d = Math.abs(p - 50);
    if (d < 7) return '几乎持平';
    if (d < 18) return '轻微偏好';
    if (d < 32) return '明显偏好';
    return '强烈偏好';
  }
  /* 由四个维度百分比反推类型代码，保证分享链接里的分数与类型永远一致 */
  function codeFromPct(pct) {
    var c = '';
    ['EI', 'SN', 'TF', 'JP'].forEach(function (d) {
      var f = DIMS[d].first;
      c += pct[d] >= 50 ? f : (f === 'E' ? 'I' : f === 'S' ? 'N' : f === 'T' ? 'F' : 'P');
    });
    return c;
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    var order = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
    view.innerHTML = '';
    var idx = order.map(function (c) {
      return '<a href="#/type/' + c + '"><b>' + c + '</b><span>' + TYPES[c].name + '</span></a>';
    }).join('');
    view.appendChild(h(
      '<section class="hero"><div class="wrap">' +
        '<div class="hero-grid">' +
        '<div>' +
          '<div class="eyebrow">Personality Archive · Vol. 01</div>' +
          '<h1>人格档案</h1>' +
          '<div class="en">Thirty-two questions · Four dimensions</div>' +
          '<p class="hero-lead">你不需要被归进某个格子，但你需要一面<em>足够清楚的镜子</em>。' +
            '32 道词对题，测四个维度的偏好强度，生成一份属于你的完整档案——' +
            '包括优势、盲点、成长建议，以及和你同类型的六位历史人物。</p>' +
          '<div class="hero-cta">' +
            '<a class="btn btn-solid" href="#/test">开始测试 →</a>' +
            '<a class="btn btn-ghost" href="#/types">先看十六型</a>' +
          '</div>' +
        '</div>' +
        '<aside class="hero-index">' +
          '<div class="hi-h">Index · 十六型索引</div>' +
          '<div class="hi-list">' + idx + '</div>' +
        '</aside>' +
        '</div>' +
        '<div class="hero-meta">' +
          '<div><span>题目数量</span><strong>32 题</strong></div>' +
          '<div><span>预计用时</span><strong>5–7 分钟</strong></div>' +
          '<div><span>量表来源</span><strong>OEJTS 1.2</strong></div>' +
          '<div><span>费用</span><strong>免费 · 无需注册</strong></div>' +
        '</div>' +
      '</div></section>'
    ));

    /* 四维度 */
    var dsec = h('<section class="block"><div class="wrap">' +
      '<div class="sec-head"><div class="eyebrow">Four Dimensions</div>' +
      '<h2>四个维度，决定你如何取用能量、处理信息、做出决定</h2>' +
      '<p>每个维度是一段连续的谱，而不是非此即彼的开关。报告给出的是你的偏好强度，不是一个标签。</p></div>' +
      '<div class="dims" id="dims"></div></div></section>');
    view.appendChild(dsec);
    var dm = dsec.querySelector('#dims');
    ['EI', 'SN', 'TF', 'JP'].forEach(function (k) {
      var d = DIMS[k];
      dm.appendChild(h('<div class="dim"><div class="k">' + k + '</div><h3>' + d.name + '</h3>' +
        '<p>' + d.desc + '</p><div class="poles"><span>' + d.an + '</span><span>' + d.bn + '</span></div></div>'));
    });

    /* 16 型 */
    var gsec = h('<section class="block"><div class="wrap">' +
      '<div class="sec-head"><div class="eyebrow">Sixteen Types</div>' +
      '<h2>十六种人格，四种底色</h2>' +
      '<p>分析家重系统，外交家重人心，守护者重秩序，探险家重现场。点击任意一格查看完整档案。</p></div>' +
      '<div class="grid16" id="g16"></div></div></section>');
    view.appendChild(gsec);
    var g16 = gsec.querySelector('#g16');
    order.forEach(function (c) {
      var t = TYPES[c];
      var el = h('<a class="tcard" href="#/type/' + c + '" style="--c:' + groupColor(c) + '">' +
        '<div class="code">' + c + '</div><div class="nm">' + t.name + '</div>' +
        '<div class="tg">' + esc(t.tagline) + '</div></a>');
      g16.appendChild(el);
    });

    observe();
  }

  /* ---------- 测试 ---------- */
  var state = { page: 0, answers: {} };

  function saveDraft() { store('draft', { page: state.page, answers: state.answers, at: Date.now() }); }

  function renderTest(resume) {
    if (resume) {
      var d = store('draft');
      if (d && d.answers && Object.keys(d.answers).length > 0 && Object.keys(d.answers).length < Q.length) {
        state = { page: d.page || 0, answers: d.answers };
        setTimeout(function () { toast('已恢复上次未完成的作答'); }, 400);
      } else { state = { page: 0, answers: {} }; }
    } else { state = { page: 0, answers: {} }; }
    var total = Math.ceil(Q.length / PER_PAGE);
    view.innerHTML = '';
    var sec = h('<section class="block"><div class="wrap">' +
      '<div class="test-top"><div><div class="eyebrow">Questionnaire</div>' +
      '<h2 style="margin-top:12px">选出更接近你的那一端</h2></div>' +
      '<div class="test-hint" id="cnt"></div></div>' +
      '<div class="progress"><i id="pbar"></i></div>' +
      '<div id="qbox"></div>' +
      '<div class="test-foot">' +
        '<button class="btn btn-ghost" id="prev">← 上一组</button>' +
        '<div class="test-hint">没有对错，只有更像 / 更不像</div>' +
        '<button class="btn btn-solid" id="next">下一组 →</button>' +
      '</div></div></section>');
    view.appendChild(sec);

    var box = sec.querySelector('#qbox');
    var prev = sec.querySelector('#prev');
    var next = sec.querySelector('#next');

    function draw() {
      box.innerHTML = '';
      var g = h('<div class="qgroup"></div>');
      var start = state.page * PER_PAGE;
      Q.slice(start, start + PER_PAGE).forEach(function (q, i) {
        var row = h('<div class="q" data-id="' + q.id + '">' +
          '<span class="num">' + String(q.id).padStart(2, '0') + '</span>' +
          '<div class="lt">' + esc(q.cn[0]) + '</div>' +
          '<div class="scale"></div>' +
          '<div class="rt">' + esc(q.cn[1]) + '</div></div>');
        var sc = row.querySelector('.scale');
        for (var v = 1; v <= 5; v++) {
          (function (val) {
            var d = h('<button class="dot" data-v="' + val + '" aria-label="' + val + '"></button>');
            if (state.answers[q.id] === val) d.classList.add('on');
            d.addEventListener('click', function () {
              state.answers[q.id] = val;
              row.querySelectorAll('.dot').forEach(function (x) { x.classList.remove('on'); });
              d.classList.add('on');
              row.setAttribute('data-pick', val <= 2 ? 'a' : val >= 4 ? 'b' : '');
              updateCount();
              saveDraft();
            });
            sc.appendChild(d);
          })(v);
        }
        if (state.answers[q.id]) row.setAttribute('data-pick', state.answers[q.id] <= 2 ? 'a' : state.answers[q.id] >= 4 ? 'b' : '');
        g.appendChild(row);
      });
      box.appendChild(g);
      updateCount();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateCount() {
      var done = Object.keys(state.answers).length;
      sec.querySelector('#cnt').innerHTML = '第 <b>' + (state.page + 1) + '</b> / ' + total +
        ' 组　已答 <b>' + done + '</b> / ' + Q.length;
      sec.querySelector('#pbar').style.width = (done / Q.length * 100) + '%';
      prev.disabled = state.page === 0;
      next.textContent = state.page === total - 1 ? '生成报告 →' : '下一组 →';
    }

    prev.addEventListener('click', function () {
      if (state.page > 0) { state.page--; draw(); saveDraft(); }
    });

    next.addEventListener('click', function () {
      var start = state.page * PER_PAGE;
      var need = Q.slice(start, start + PER_PAGE);
      var missing = need.filter(function (q) { return !state.answers[q.id]; });
      if (missing.length) {
        toast('还有 ' + missing.length + ' 题没有作答');
        var first = box.querySelector('.q[data-id="' + missing[0].id + '"]');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (state.page < total - 1) { state.page++; draw(); saveDraft(); }
      else finish();
    });

    draw();
  }

  function finish() {
    if (Object.keys(state.answers).length < Q.length) { toast('还有题目没有作答'); return; }
    var r = computeScore(state.answers);
    store('last', { answers: state.answers, code: r.code, pct: r.pct, at: Date.now() });
    store('draft', null);
    location.hash = '#/result/' + r.code + '?s=' + [r.pct.EI, r.pct.SN, r.pct.TF, r.pct.JP].join(',');
  }

  /* ---------- 报告 ---------- */
  function renderReport(code, pct) {
    /* 有分数时以分数为准重算类型，避免 URL 里 code 与 s 参数打架 */
    if (pct) code = codeFromPct(pct);
    if (!TYPES[code]) { location.hash = '#/types'; return; }
    if (pct) {
      var expect = '#/result/' + code + '?s=' + [pct.EI, pct.SN, pct.TF, pct.JP].join(',');
      if (location.hash !== expect) { try { history.replaceState(null, '', expect); } catch (e) {} }
    }
    var t = TYPES[code], g = GROUPS[t.group];
    var color = groupColor(code);
    var hasScore = !!pct;
    var ppl = (PEOPLE[code] || []).slice();
    var heroSlug = HERO[code] || (ppl[0] && ppl[0].slug);
    var heroPerson = ppl.filter(function (p) { return p.slug === heroSlug; })[0] || ppl[0];

    view.innerHTML = '';
    var html = '';

    /* Hero */
    html += '<section class="res-hero"><div class="wrap"><div class="res-hero-in" style="--c:' + color + '">';
    html += '<div>';
    html += '<div class="eyebrow">' + g.name + ' · ' + g.en + '</div>';
    html += '<div class="res-code" style="margin-top:18px">' + code + '</div>';
    html += '<div class="res-name">' + t.name + '</div>';
    html += '<div class="res-en">' + t.en + '</div>';
    html += '<div class="res-tag">' + esc(t.tagline) + '</div>';
    html += '<div class="kw">' + t.keywords.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>';
    html += '<div style="margin-top:26px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--paper3)">全球约 ' + t.pop + ' 的人口属于此类型 · 美国样本估计</div>';
    html += '</div>';
    if (heroPerson) {
      html += '<div class="portrait"><div class="portrait-no">FIG. ' + code + '</div>' +
        '<img src="assets/people/' + heroPerson.slug + '.jpg" alt="' + esc(heroPerson.name) + '" loading="eager">' +
        '<div class="portrait-cap">' + esc(heroPerson.name) + '<small>' + esc(heroPerson.era) + ' · ' + esc(heroPerson.tag) + '</small></div></div>';
    }
    html += '</div></section>';

    /* 分数 */
    if (hasScore) {
      html += '<section class="scores"><div class="wrap" style="--c:' + color + '">';
      ['EI', 'SN', 'TF', 'JP'].forEach(function (d) {
        var D = DIMS[d], p = pct[d];
        var leftOn = p >= 50;
        html += '<div class="score-row">' +
          '<div class="lbl' + (leftOn ? ' on' : '') + '">' + D.an + ' ' + p + '%</div>' +
          '<div class="score-bar"><div class="score-track"></div><div class="score-mid"></div>' +
            '<div class="score-fill ' + (leftOn ? 'left' : '') + '" data-w="' + Math.abs(p - 50) * 2 + '"></div>' +
          '</div>' +
          '<div class="lbl' + (!leftOn ? ' on' : '') + '">' + (100 - p) + '% ' + D.bn + '</div>' +
        '</div>';
      });
      html += '<div class="score-note">' + ['EI', 'SN', 'TF', 'JP'].map(function (d) {
        var p = pct[d]; return DIMS[d].name + ' ' + strength(p);
      }).join(' · ') + '</div>';
      html += '</div></section>';
    }

    /* 概述 */
    html += '<section class="block"><div class="wrap">' +
      '<div class="sec-head"><div class="eyebrow">Overview</div><h2>你的运作方式</h2></div>' +
      '<p class="prose">' + esc(t.summary) + '</p></div></section>';

    /* 优势 / 盲点 */
    html += '<section class="block"><div class="wrap" style="--c:' + color + '">' +
      '<div class="two">' +
      '<div class="panel"><h4>优势 <span class="badge">STRENGTHS</span></h4><ul>' +
        t.strengths.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="panel"><h4>盲点 <span class="badge">BLIND SPOTS</span></h4><ul>' +
        t.blindspots.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' +
      '</div></div></section>';

    /* 名人 */
    if (ppl.length) {
      html += '<section class="block"><div class="wrap" style="--c:' + color + '">' +
        '<div class="sec-head"><div class="eyebrow">Kindred Spirits</div>' +
        '<h2>和你同类型的六个人</h2>' +
        '<p>人物与类型的对应基于公开传记与行为模式的推断，属于对照参考，不是实证结论。悬停可查看原色。</p></div>' +
        '<div class="people">';
      ppl.forEach(function (p) {
        html += '<article class="person"><div class="ph">' +
          '<img src="assets/people/' + p.slug + '.jpg" alt="' + esc(p.name) + '" loading="lazy">' +
          '<span class="flag">' + (p.origin === 'cn' ? '中国' : '西方') + '</span></div>' +
          '<div class="info"><h5>' + esc(p.name) + '</h5>' +
          '<div class="era">' + esc(p.era) + '</div>' +
          '<div class="role">' + esc(p.tag) + '</div>' +
          '<div class="note">' + esc(p.note) + '</div></div></article>';
      });
      html += '</div></div></section>';
    }

    /* 职业 */
    html += '<section class="block"><div class="wrap" style="--c:' + color + '">' +
      '<div class="sec-head"><div class="eyebrow">Vocation</div><h2>容易发力的领域</h2>' +
      '<p>不是限制，只是说这些环境更少消耗你。</p></div>' +
      '<div class="kw" style="margin-top:0">' +
      t.careers.map(function (c) { return '<span style="font-size:13px;padding:7px 15px">' + esc(c) + '</span>'; }).join('') +
      '</div></div></section>';

    /* 关系 */
    html += '<section class="block"><div class="wrap" style="--c:' + color + '">' +
      '<div class="sec-head"><div class="eyebrow">Relationships</div><h2>在关系里的你</h2></div>' +
      '<div class="three">' +
      '<div class="rel"><div class="k">LOVE</div><h4>亲密关系</h4><p>' + esc(t.love) + '</p></div>' +
      '<div class="rel"><div class="k">FRIENDSHIP</div><h4>朋友之间</h4><p>' + esc(t.friendship) + '</p></div>' +
      '<div class="rel"><div class="k">WORK</div><h4>工作场景</h4><p>' + esc(t.work) + '</p></div>' +
      '</div></div></section>';

    /* 成长 */
    html += '<section class="block"><div class="wrap" style="--c:' + color + '">' +
      '<div class="sec-head"><div class="eyebrow">Growth</div><h2>三条具体的练习</h2>' +
      '<p>不谈「多沟通、多理解」这种空话，只给能明天就开始做的动作。</p></div>' +
      '<ol class="growth">' + t.growth.map(function (s) { return '<li><p>' + esc(s) + '</p></li>'; }).join('') +
      '</ol></div></section>';

    /* 搭档 */
    var pt = TYPES[t.pair];
    html += '<section class="block"><div class="wrap" style="--c:' + color + '">' +
      '<div class="sec-head"><div class="eyebrow">Complement</div><h2>最容易被你忽略的那一半</h2></div>' +
      '<div class="pair"><div><div class="l">常见互补类型</div><div class="v">' + t.pair + ' · ' + pt.name + '</div></div>' +
      '<div class="d">' + esc(pt.tagline) + '。你们看世界的方式几乎相反，这正是彼此能补上的地方——前提是双方都愿意把差异当成信息，而不是错误。</div>' +
      '<a class="btn btn-ghost" href="#/type/' + t.pair + '">查看 ' + t.pair + '</a></div>' +
      '</div></section>';

    /* 底部 CTA */
    html += '<section class="block"><div class="wrap" style="text-align:center;padding:20px 0 8px">' +
      '<div class="eyebrow" style="justify-content:center">End of File</div>' +
      '<h2 style="font-family:var(--serif);font-size:clamp(22px,3.2vw,30px);font-weight:600;margin:16px 0 14px;letter-spacing:.05em">档案到此为止，人不止于此</h2>' +
      '<p style="color:var(--paper3);font-size:14.5px;max-width:52ch;margin:0 auto 28px;line-height:1.9">' +
      '这份报告描述的是偏好，不是能力上限。真正决定你成为谁的，是你在偏好之外做出的那些选择。</p>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
      '<button class="btn btn-ghost" id="share">复制分享链接</button>' +
      '<a class="btn btn-solid" href="#/test?new=1">重新测一次</a>' +
      '<a class="btn btn-ghost" href="#/types">看其他类型</a>' +
      '</div></div></section>';

    view.innerHTML = html;

    /* 动画 */
    requestAnimationFrame(function () {
      view.querySelectorAll('.score-fill').forEach(function (el) {
        el.style.width = (el.getAttribute('data-w') / 2) + '%';
      });
    });

    var share = view.querySelector('#share');
    if (share) share.addEventListener('click', function () {
      var url = location.origin + location.pathname + location.hash;
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('链接已复制'); });
      else toast(url);
    });

    /* 移动端布局修正 */
    window.scrollTo(0, 0);
    observe();
  }

  /* ---------- 十六型总览 ---------- */
  function renderTypes() {
    var order = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
    view.innerHTML = '';
    var sec = h('<section class="block"><div class="wrap">' +
      '<div class="sec-head"><div class="eyebrow">Sixteen Types</div><h2>十六型人格总览</h2>' +
      '<p>按四种气质分组。每一种都不是「更好」或「更差」，只是取用能量的方式不同。</p></div>' +
      '<div id="groups"></div></div></section>');
    view.appendChild(sec);
    var gbox = sec.querySelector('#groups');
    ['NT', 'NF', 'SJ', 'SP'].forEach(function (gk) {
      var g = GROUPS[gk];
      var block = h('<div style="margin-bottom:44px">' +
        '<div style="display:flex;align-items:baseline;gap:14px;margin-bottom:18px;border-bottom:1px solid var(--line);padding-bottom:12px">' +
        '<h3 style="font-family:var(--serif);font-size:20px;letter-spacing:.08em;color:' + (gk === 'NT' ? 'var(--nt)' : gk === 'NF' ? 'var(--nf)' : gk === 'SJ' ? 'var(--sj)' : 'var(--sp)') + '">' + g.name + '</h3>' +
        '<span style="font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--paper3)">' + g.en.toUpperCase() + '</span>' +
        '<span style="font-size:13px;color:var(--paper3);margin-left:auto">' + g.desc + '</span></div>' +
        '<div class="grid16" data-g="' + gk + '"></div></div>');
      gbox.appendChild(block);
      var grid = block.querySelector('.grid16');
      order.filter(function (c) { return TYPES[c].group === gk; }).forEach(function (c) {
        var t = TYPES[c];
        grid.appendChild(h('<a class="tcard" href="#/type/' + c + '" style="--c:' + groupColor(c) + '">' +
          '<div class="code">' + c + '</div><div class="nm">' + t.name + '</div>' +
          '<div class="tg">' + esc(t.tagline) + '</div></a>'));
      });
    });
    observe();
  }

  /* ---------- 量表说明 ---------- */
  function renderAbout() {
    view.innerHTML = '';
    view.appendChild(h('<section class="block"><div class="wrap">' +
      '<div class="sec-head"><div class="eyebrow">Methodology</div><h2>这份测试是怎么来的</h2></div>' +
      '<div class="prose">' +
      '<p><strong>题目来源。</strong>本测试使用 Open Extended Jungian Type Scales 1.2（OEJTS）第一部分的 32 道语义差异题。' +
      '该量表由 Eric Jorgenson 于 2014 年发表，是作为 Myers-Briggs Type Indicator 的开源替代量表设计的，' +
      '完整量表与开发文档公开在 Open-Source Psychometrics Project（openpsychometrics.org）。</p>' +
      '<p style="margin-top:18px"><strong>为什么不用 16personalities 的题。</strong>16personalities 使用的是 NERIS 模型，' +
      '其题目与文案受版权保护，不能直接复制分发。OEJTS 是公开发表、可复现的学术量表，' +
      '并且在 Open-Source Psychometrics Project 做的对照研究中，与另外三个在线 MBTI 替代量表相比准确度最高。</p>' +
      '<p style="margin-top:18px"><strong>计分方式。</strong>每个维度 8 道题，每题 5 点计分（1–5），' +
      '维度原始分区间 8–40，中位数 24。报告中的百分比是原始分线性映射到 0–100 的结果，50% 代表没有明显偏好。' +
      '例如「内向 62%」的意思是：在这个维度上，你的答案有 62% 的权重落在内向一侧。</p>' +
      '<p style="margin-top:18px"><strong>结果怎么读。</strong>分数接近 50% 的维度说明你没有明显偏好，' +
      '这完全正常——很多人在一到两个维度上处于中间地带。四个字母只是把你落在的那个区间标出来，' +
      '不代表你在另一端毫无能力。</p>' +
      '<p style="margin-top:18px"><strong>历史人物对照。</strong>每型列出的六位人物（中国古代三位、西方三位）' +
      '是基于公开传记、书信、作品与行为记录做的推断性对应，属于通俗类型学的常见做法，' +
      '没有任何一位做过本量表。请当作观察人格多样性的一种视角，而不是史料结论。</p>' +
      '<p style="margin-top:18px"><strong>图像。</strong>历史人物肖像来自 Wikimedia Commons 的公有领域或自由许可文件，' +
      '经统一灰度处理后用于人物卡片。鼠标悬停可查看原图色彩。</p>' +
      '<p style="margin-top:26px;padding-top:22px;border-top:1px solid var(--line);color:var(--paper3);font-size:14px">' +
      '参考：Jorgenson, E. (2014). <em>Development of the Open Extended Jungian Type Scales</em>. ' +
      'Open-Source Psychometrics Project. · Reynierse, J. H. (2012). Toward an Empirically Sound and Radically Revised Type Theory. ' +
      '<em>Journal of Psychological Type</em>, 72(1).</p>' +
      '</div>' +
      '<div style="margin-top:38px"><a class="btn btn-solid" href="#/test">开始测试 →</a></div>' +
      '</div></section>'));
    observe();
  }

  /* ---------- 滚动显现 ---------- */
  var io = null;
  function observe() {
    var cards = view.querySelectorAll('.grid16');

    /* 不支持 IO 时直接全部显示，不能留白 */
    if (!('IntersectionObserver' in window)) {
      view.querySelectorAll('.tcard').forEach(function (el) { el.classList.add('anim', 'in'); });
      return;
    }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        /* 动画播完摘掉 anim，让 hover 的 transform 正常接管 */
        if (el.classList.contains('anim')) {
          var delay = 1080 + (parseInt(el.style.getPropertyValue('--i') || '0', 10) * 100);
          setTimeout(function () { el.classList.remove('anim', 'in'); }, delay);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });

    view.querySelectorAll('.block, .person').forEach(function (el) {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
      io.observe(el);
    });

    /* 十六型：按列交错，从上往下依次滑落 */
    cards.forEach(function (grid) {
      var cols = 4;
      try { cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 4; } catch (e) {}
      Array.prototype.forEach.call(grid.children, function (el, i) {
        el.style.setProperty('--i', i % cols);
        el.classList.add('anim');
        io.observe(el);
      });
    });
  }

  /* ---------- 路由 ---------- */
  function parseHash() {
    var hash = location.hash.replace(/^#/, '') || '/';
    var qi = hash.indexOf('?');
    var query = '';
    if (qi >= 0) { query = hash.slice(qi + 1); hash = hash.slice(0, qi); }
    return { path: hash.split('/').filter(Boolean), query: query };
  }

  function route() {
    var r = parseHash(), p = r.path;
    if (!p.length) { renderHome(); return; }
    if (p[0] === 'test') { renderTest(!/new=1/.test(r.query)); return; }
    if (p[0] === 'types') { renderTypes(); return; }
    if (p[0] === 'about') { renderAbout(); return; }
    if (p[0] === 'type' && p[1]) { renderReport(p[1].toUpperCase(), null); return; }
    if (p[0] === 'result' && p[1]) {
      var pct = null;
      var m = /s=([\d,]+)/.exec(r.query);
      if (m) {
        var arr = m[1].split(',').map(Number);
        if (arr.length === 4 && arr.every(function (n) { return n >= 0 && n <= 100; })) {
          pct = { EI: arr[0], SN: arr[1], TF: arr[2], JP: arr[3] };
        }
      }
      if (!pct) {
        var last = store('last');
        if (last && last.code === p[1].toUpperCase()) pct = last.pct;
      }
      renderReport(p[1].toUpperCase(), pct);
      return;
    }
    renderHome();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') route();
})();
