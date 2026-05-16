// 共享状态 · 跨页面通过 localStorage 同步
const STORAGE_KEY = 'console-state-v3';
const defaultState = {
  'dim-count': 9, 'kw-thresh': 70, 'behav-weight': 150, 'bias-detect': true,
  'urgent-thresh': 7, 'delib-days': 21, 'route-strict': 2, 'stakeholder': true,
  'fake-sens': 2, 'probe-count': 3, 'binary-break': true, 'hidden-probe': true, 'value-conflict': true,
  'top1-weight': 150, 'top23-weight': 120, 'score-dims': 6, 'sens-level': 2,
  'check-intuition': true, 'check-fear': true, 'check-conform': true,
  'check-sunk': true, 'check-script': true, 'check-thresh': 2,
  'action-spec': 3, 'callback-int': 2, 'future-snap': true, 'auto-archive': true, 'feedback-loop': true,
  // typology (null = 未测)
  'typo-name': '林叙',
  'mbti-ie': null, 'mbti-sn': null, 'mbti-tf': null, 'mbti-jp': null,
  'ideal-ie': null, 'ideal-sn': null, 'ideal-tf': null, 'ideal-jp': null,
  'enn-main': null, 'enn-instinct': null, 'enn-wing': 'auto',
  'phil': null,
  'rom-obj': null, 'rom-rhy': null,
  'attach': null,
  'dnd': null,
  'soc': null, 'soc-manual': false,
  'humor': null,
  'jung-dom': null, 'jung-aux': null,
  'lvef-order': ['L','V','E','F'], 'lvef-touched': false,
  'big-o': null, 'big-c': null, 'big-e': null, 'big-a': null, 'big-n': null,
  'hol-scores': { R:0, I:0, A:0, S:0, E:0, C:0 },
  'disc-d': null, 'disc-i': null, 'disc-s': null, 'disc-c': null
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultState, ...JSON.parse(saved) };
  } catch (e) {}
  return { ...defaultState };
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

const baseA = { d1: 4.5, d2: 3.5, d3: 5.0, d4: 8.8 };
const baseB = { d1: 9.2, d2: 9.5, d3: 8.0, d4: 3.8 };
const levelMap = { 1: '低', 2: '中', 3: '高' };

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function computeScore(base, top1Mult, dimsMult, behavMult) {
  const dims = {
    d1: clamp(base.d1 * top1Mult * 0.7 + base.d1 * 0.3, 0, 10),
    d2: clamp(base.d2 * behavMult * 0.5 + base.d2 * 0.5, 0, 10),
    d3: clamp(base.d3 * dimsMult * 0.4 + base.d3 * 0.6, 0, 10),
    d4: clamp(base.d4, 0, 10)
  };
  const total = (dims.d1 * 0.35 + dims.d2 * 0.25 + dims.d3 * 0.20 + dims.d4 * 0.20);
  return { dims, total };
}

function countTriggered() {
  let n = 0;
  if (state['check-fear']) n++;
  if (state['check-conform']) n++;
  return n;
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setWidth(id, val) { const el = document.getElementById(id); if (el) el.style.width = val; }

function syncControls() {
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const key = slider.dataset.target;
    if (key && state[key] !== undefined) slider.value = state[key];
  });
  document.querySelectorAll('.toggle').forEach(t => {
    const key = t.dataset.toggle;
    if (key && state[key] !== undefined) t.classList.toggle('on', state[key]);
  });
}

function attachListeners() {
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    if (slider.dataset.bound) return;
    slider.dataset.bound = '1';
    slider.addEventListener('input', () => {
      state[slider.dataset.target] = parseFloat(slider.value);
      saveState();
      refresh();
    });
  });
  document.querySelectorAll('.toggle').forEach(t => {
    if (t.dataset.bound) return;
    t.dataset.bound = '1';
    t.addEventListener('click', () => {
      const key = t.dataset.toggle;
      state[key] = !state[key];
      t.classList.toggle('on', state[key]);
      saveState();
      refresh();
    });
  });
}

function highlightNav() {
  const file = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(n => {
    const href = n.getAttribute('href');
    if (!href) return;
    n.classList.toggle('active', href === file || (file === '' && href === 'index.html'));
  });
}

function refresh() {
  setText('dim-count-val', state['dim-count']);
  setText('kw-thresh-val', (state['kw-thresh'] / 100).toFixed(2));
  setText('behav-weight-val', (state['behav-weight'] / 100).toFixed(2) + '×');
  setText('urgent-thresh-val', state['urgent-thresh'] + 'd');
  setText('delib-days-val', state['delib-days'] + 'd');
  setText('route-strict-val', levelMap[state['route-strict']]);
  setText('fake-sens-val', levelMap[state['fake-sens']]);
  setText('probe-count-val', state['probe-count']);
  setText('top1-weight-val', (state['top1-weight'] / 100).toFixed(2) + '×');
  setText('top23-weight-val', (state['top23-weight'] / 100).toFixed(2) + '×');
  setText('score-dims-val', state['score-dims']);
  setText('sens-level-val', levelMap[state['sens-level']]);
  setText('check-thresh-val', levelMap[state['check-thresh']]);
  setText('action-spec-val', levelMap[state['action-spec']]);
  setText('callback-int-val', state['callback-int'] === 1 ? '30/90' : state['callback-int'] === 2 ? '30/90/180' : '7/30/90/180');

  const top1Mult = state['top1-weight'] / 150;
  const dimsMult = state['score-dims'] / 6;
  const behavMult = state['behav-weight'] / 150;
  const sA = computeScore(baseA, top1Mult, dimsMult, behavMult);
  const sB = computeScore(baseB, top1Mult, dimsMult, behavMult);
  const gap = sB.total - sA.total;
  const gapStr = (gap >= 0 ? '+' : '') + gap.toFixed(1);
  const stability = Math.abs(gap) > 1.5 ? '高' : Math.abs(gap) > 0.6 ? '中' : '低';
  const triggered = countTriggered();

  ['dash-a', 'r4-score-a', 'sim-score-a', 'sim-final-a'].forEach(id => setText(id, sA.total.toFixed(1)));
  ['dash-b', 'r4-score-b', 'sim-score-b', 'sim-final-b'].forEach(id => setText(id, sB.total.toFixed(1)));
  ['dash-gap', 'sim-final-gap'].forEach(id => setText(id, gapStr));
  setText('sim-final-stab', stability);

  ['d1','d2','d3','d4'].forEach((d, i) => {
    const n = i + 1;
    ['r4-val-a-','sim-val-a-'].forEach(p => setText(p + n, sA.dims[d].toFixed(1)));
    ['r4-val-b-','sim-val-b-'].forEach(p => setText(p + n, sB.dims[d].toFixed(1)));
    ['r4-bar-a-','sim-bar-a-'].forEach(p => setWidth(p + n, (sA.dims[d] * 10) + '%'));
    ['r4-bar-b-','sim-bar-b-'].forEach(p => setWidth(p + n, (sB.dims[d] * 10) + '%'));
  });
  setText('r4-conf', '稳健度 · ' + stability);
  setText('r4-out', 'A: ' + sA.total.toFixed(1) + ' · B: ' + sB.total.toFixed(1));

  ['r4-opt-a','sim-opt-a'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('winner', sA.total > sB.total); });
  ['r4-opt-b','sim-opt-b'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('winner', sB.total > sA.total); });

  setText('r5-out', triggered + ' 项偏差识别 · ' + (5 - triggered) + ' 项通过');
  ['r5-check-1','r5-check-2','r5-check-3','r5-check-4','r5-check-5'].forEach((id, i) => {
    const keys = ['check-fear','check-conform','check-sunk','check-intuition','check-script'];
    const row = document.getElementById(id);
    if (row) {
      const enabled = state[keys[i]];
      row.style.opacity = enabled ? '1' : '0.35';
      row.style.filter = enabled ? 'none' : 'grayscale(1)';
    }
  });

  const simConc = document.getElementById('sim-conclusion');
  if (simConc) {
    const winner = sB.total > sA.total ? 'B' : 'A';
    const lead = winner === 'B' ? '价值与特质上全方位领先 A' : '短期稳定性远超 B';
    simConc.innerHTML = winner + ' 在你的核心 ' + lead + '，差距 <strong style="font-family: \'Inter\', sans-serif; color: var(--gold-darkest);">' + gapStr + '</strong>。' +
      (triggered > 0 ? '有 ' + triggered + ' 道校验被触发，部分倾向可能来自偏差——最终选择由你做。' : '所有校验通过，决策路径清晰。');
  }

  let conf = 7.2 + (Math.abs(gap) - 2.4) * 0.3 - triggered * 0.15;
  conf = Math.max(1, Math.min(10, conf));
  setText('kpi-conf', conf.toFixed(1));
  setText('dash-conf', conf.toFixed(1));
  setWidth('kpi-conf-bar', (conf * 10) + '%');

  let ready = 87;
  if (!state['bias-detect']) ready -= 4;
  if (!state['binary-break']) ready -= 3;
  if (!state['future-snap']) ready -= 2;
  if (!state['auto-archive']) ready -= 2;
  ready = Math.max(60, Math.min(100, ready));
  setText('kpi-ready', ready);
  setWidth('kpi-ready-bar', ready + '%');

  let label = '深度探索者 · 独处充电型 · 慢决策者';
  let r1conf = 0.82;
  if (state['kw-thresh'] > 80) { label = '深度探索者'; r1conf = 0.71; }
  else if (state['kw-thresh'] < 60) { label = '深度探索者 · 独处充电型 · 慢决策者 · 高自主性'; r1conf = 0.90; }
  if (!state['bias-detect']) { label += ' (未校验)'; r1conf -= 0.15; }
  setText('r1-out', label);
  const sample = state['dim-count'] * 270;
  setText('r1-conf', '关键词置信 ' + r1conf.toFixed(2) + ' · 数据样本 ' + sample + ' · 偏差检测 ' + (state['bias-detect'] ? '通过' : '关闭'));

  let period = '7-14 天';
  if (state['urgent-thresh'] < 4) period = '3-7 天 · 加速决策';
  else if (state['delib-days'] > 30) period = '14-21 天 · 延长酝酿';
  setText('r2-period', period);
  setText('r2-out', '推荐酝酿期 ' + period + ' · ' + (state['stakeholder'] ? '启用' : '关闭') + '利益相关方权重');
}

function renderRadar() {
  const el = document.getElementById('r1-radar');
  if (!el || el.innerHTML) return;
  const cx = 160, cy = 160, maxR = 110;
  const dims = [
    { name: '开放性', val: 78 }, { name: '尽责性', val: 62 }, { name: '外向性', val: 28 },
    { name: '宜人性', val: 54 }, { name: '稳定性', val: 45 }, { name: '思维', val: 82 },
    { name: '决策', val: 72 }, { name: '能量', val: 22 }, { name: '不确定', val: 75 }
  ];
  let svg = '';
  [0.25, 0.5, 0.75, 1.0].forEach(s => {
    const points = dims.map((d, i) => {
      const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
      return (cx + Math.cos(a) * maxR * s) + ',' + (cy + Math.sin(a) * maxR * s);
    }).join(' ');
    svg += '<polygon points="' + points + '" fill="none" stroke="rgba(27,42,61,0.10)" stroke-width="0.5"/>';
  });
  dims.forEach((d, i) => {
    const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
    svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(a) * maxR) + '" y2="' + (cy + Math.sin(a) * maxR) + '" stroke="rgba(27,42,61,0.10)" stroke-width="0.5"/>';
    const lx = cx + Math.cos(a) * (maxR + 22);
    const ly = cy + Math.sin(a) * (maxR + 22) + 3;
    svg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" font-size="10" fill="#1B2A3D" font-family="Noto Serif SC">' + d.name + '</text>';
  });
  const userPts = dims.map((d, i) => {
    const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
    const r = (d.val / 100) * maxR;
    return (cx + Math.cos(a) * r) + ',' + (cy + Math.sin(a) * r);
  }).join(' ');
  svg += '<polygon points="' + userPts + '" fill="rgba(200,148,91,0.20)" stroke="#A8773F" stroke-width="1.5"/>';
  dims.forEach((d, i) => {
    const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
    const r = (d.val / 100) * maxR;
    svg += '<circle cx="' + (cx + Math.cos(a) * r) + '" cy="' + (cy + Math.sin(a) * r) + '" r="2.5" fill="#6E4A20"/>';
  });
  el.innerHTML = svg;
}

function resetAll() {
  state = { ...defaultState };
  saveState();
  syncControls();
  refresh();
}
function randomize() {
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = parseFloat(slider.step) || 1;
    const range = (max - min) / step;
    const newVal = min + Math.floor(Math.random() * (range + 1)) * step;
    slider.value = newVal;
    state[slider.dataset.target] = newVal;
  });
  saveState();
  refresh();
}
function exportConfig() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'console-config-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    state = loadState();
    syncControls();
    refresh();
  }
});

// ========== TYPOLOGY ID CARD ==========
const SOC_MAP = {
  ENTP:'ILE', ISFP:'SEI', ESFJ:'ESE', INTJ:'LII',
  ENFJ:'EIE', ISTJ:'LSI', ESTP:'SLE', INFP:'IEI',
  ESFP:'SEE', INTP:'ILI', ENTJ:'LIE', ISFJ:'ESI',
  ESTJ:'LSE', INFJ:'EII', ENFP:'IEE', ISTP:'SLI'
};
const LVEF_LABELS = { L:'逻辑', V:'意志', E:'情感', F:'肉身' };
const HOL_ZH = { R:'现实', I:'研究', A:'艺术', S:'社会', E:'企业', C:'事务' };
const DISC_ZH = { D:'支配', I:'影响', S:'稳健', C:'谨慎' };

function mbtiType(prefix) {
  const ie = state[prefix + '-ie'], sn = state[prefix + '-sn'], tf = state[prefix + '-tf'], jp = state[prefix + '-jp'];
  if (ie == null || sn == null || tf == null || jp == null) return null;
  return (ie >= 0 ? 'I' : 'E') + (sn >= 0 ? 'N' : 'S') + (tf >= 0 ? 'F' : 'T') + (jp >= 0 ? 'P' : 'J');
}

function tritypeFromMain(m) {
  if (m == null) return '';
  const heart = [2,3,4], head = [5,6,7], gut = [8,9,1];
  const horney = { withdrawn:[4,5,9], compliant:[1,2,6], assertive:[3,7,8] };
  const styleOf = (n) => Object.keys(horney).find(k => horney[k].includes(n));
  const home = [heart, head, gut].find(t => t.includes(m));
  if (!home) return '';
  const others = [heart, head, gut].filter(t => t !== home);
  const s = styleOf(m);
  const picks = [m, ...others.map(t => t.find(n => horney[s].includes(n))).filter(Boolean)];
  return picks.sort((a,b)=>a-b).join('');
}

function wingFromMain(m, choice) {
  if (m == null) return '';
  const wrap = (x) => x === 0 ? 9 : x === 10 ? 1 : x;
  if (choice && choice !== 'auto') return 'w' + choice;
  return 'w' + wrap(m + 1);
}

function renderEnnWingChips() {
  const host = document.getElementById('enn-wing-chips');
  if (!host) return;
  const m = state['enn-main'];
  const wrap = (x) => x === 0 ? 9 : x === 10 ? 1 : x;
  const opts = m == null ? [] : [wrap(m - 1), wrap(m + 1)];
  host.innerHTML = '<div class="chip" data-val="auto">自动</div>' +
    opts.map(w => '<div class="chip" data-val="' + w + '">w' + w + '</div>').join('');
  if (host.dataset.bound) delete host.dataset.bound;
  bindChipPicks();
  syncChipGroup(host);
}

function sloanCode() {
  const o = state['big-o'], c = state['big-c'], e = state['big-e'], a = state['big-a'], n = state['big-n'];
  if (o == null || c == null || e == null || a == null || n == null) return null;
  return (e >= 50 ? 'S' : 'R') + (n >= 50 ? 'L' : 'C') + (c >= 50 ? 'O' : 'U') + (a >= 50 ? 'A' : 'E') + (o >= 50 ? 'I' : 'N');
}

function hollandCode() {
  const sc = state['hol-scores'] || {};
  const total = Object.values(sc).reduce((a,b)=>a+b, 0);
  if (total === 0) return null;
  const sorted = Object.entries(sc).sort((a,b) => b[1] - a[1]);
  if (sorted[1][1] === 0) return sorted[0][0];
  return sorted[0][0] + sorted[1][0];
}

function discCode() {
  const d = state['disc-d'], i = state['disc-i'], s = state['disc-s'], c = state['disc-c'];
  if (d == null || i == null || s == null || c == null) return null;
  const arr = [['D',d],['I',i],['S',s],['C',c]].sort((a,b)=>b[1]-a[1]);
  return arr[0][0];
}

function typologySummary() {
  const out = {};
  out.mbti = mbtiType('mbti');
  out.ideal = mbtiType('ideal');
  if (state['enn-main'] != null) {
    const parts = [state['enn-main'] + wingFromMain(state['enn-main'], state['enn-wing']), tritypeFromMain(state['enn-main'])];
    if (state['enn-instinct']) parts.push(state['enn-instinct']);
    out.enn = parts.join(' ');
  }
  out.phil = state['phil'];
  if (state['rom-obj'] || state['rom-rhy']) {
    out.romantic = [state['rom-obj'] || '—', state['rom-rhy'] || '—'].join('·');
  }
  out.attach = state['attach'];
  out.dnd = state['dnd'];
  if (state['soc-manual'] && state['soc']) out.soc = state['soc'];
  else if (out.mbti && SOC_MAP[out.mbti]) out.soc = SOC_MAP[out.mbti];
  else out.soc = state['soc'];
  out.humor = state['humor'];
  if (state['jung-dom']) {
    const dom = state['jung-dom'];
    const dir = dom[1] === 'e' ? 'E' : 'I';
    const fn = dom[0];
    out.jung = dir + fn + (state['jung-aux'] ? '(' + state['jung-aux'] + ')' : '');
  }
  out.lvef = state['lvef-touched'] ? state['lvef-order'].join('') : null;
  out.big5 = sloanCode();
  out.hol = hollandCode();
  out.disc = discCode();
  return out;
}

function setCardItem(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  const valEl = el.querySelector('.typo-id-item-val');
  if (val) {
    valEl.textContent = val;
    valEl.classList.remove('pending');
    el.classList.add('locked');
  } else {
    valEl.textContent = '未测';
    valEl.classList.add('pending');
    el.classList.remove('locked');
  }
}

function setResult(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (val) {
    el.textContent = val;
    el.classList.remove('empty');
  } else {
    el.textContent = '未测';
    el.classList.add('empty');
  }
}

function refreshTypology() {
  const t = typologySummary();
  const mapping = [
    ['card-mbti', 'res-mbti', t.mbti, 'mbti'],
    ['card-enn', 'res-enn', t.enn, 'enn'],
    ['card-phil', 'res-phil', t.phil, 'phil'],
    ['card-romantic', 'res-romantic', t.romantic, 'romantic'],
    ['card-attach', 'res-attach', t.attach, 'attach'],
    ['card-ideal', 'res-ideal', t.ideal, 'ideal'],
    ['card-dnd', 'res-dnd', t.dnd, 'dnd'],
    ['card-soc', 'res-soc', t.soc, 'soc'],
    ['card-humor', 'res-humor', t.humor, 'humor'],
    ['card-jung', 'res-jung', t.jung, 'jung'],
    ['card-lvef', 'res-lvef', t.lvef, 'lvef'],
    ['card-big5', 'res-big5', t.big5, 'big5'],
    ['card-hol', 'res-hol', t.hol, 'hol'],
    ['card-disc', 'res-disc', t.disc, 'disc']
  ];
  let filled = 0;
  mapping.forEach(([cid, rid, v, key]) => {
    setCardItem(cid, v);
    setResult(rid, v);
    if (v) filled++;
    const block = document.querySelector('.typo-test[data-test="' + key + '"]');
    if (block) block.classList.toggle('answered', !!v);
  });
  setWidth('typo-fill', (filled / 14 * 100) + '%');
  setText('typo-bar-val', filled + ' / 14');
  setWidth('typo-bar', (filled / 14 * 100) + '%');

  const nameInput = document.getElementById('typo-name');
  if (nameInput && nameInput.value !== state['typo-name']) nameInput.value = state['typo-name'];
  const badge = document.querySelector('.typo-id-badge');
  if (badge && state['typo-name']) badge.textContent = state['typo-name'].slice(-1);

  // ID card → 仪表盘 KPI 加分
  const kpiBoost = Math.round(filled / 14 * 13);
  const baseReady = 87;
  let ready = baseReady + kpiBoost - 13;
  if (!state['bias-detect']) ready -= 4;
  ready = Math.max(60, Math.min(100, ready));
  setText('kpi-ready', ready);
  setWidth('kpi-ready-bar', ready + '%');
}

// === Axis slider (custom, divergent from center) ===
function valueToThumbPct(v) { return 50 + (v / 100) * 50; }
function thumbPctToValue(p) { return Math.round(((p - 50) / 50) * 100); }

function renderAxisRow(row) {
  const key = row.dataset.axis;
  const v = state[key];
  const fillL = row.querySelector('.axis-fill-l');
  const fillR = row.querySelector('.axis-fill-r');
  const thumb = row.querySelector('.axis-thumb');
  const pct = row.querySelector('.axis-pct');
  const letters = row.querySelectorAll('.axis-letter');
  if (v == null) {
    fillL.style.width = '0%';
    fillR.style.width = '0%';
    thumb.style.left = '50%';
    thumb.style.opacity = '0.35';
    pct.textContent = '—';
    letters.forEach(l => l.classList.remove('active'));
  } else {
    thumb.style.opacity = '1';
    const tp = valueToThumbPct(v);
    thumb.style.left = tp + '%';
    if (v < 0) { fillL.style.width = (-v / 2) + '%'; fillR.style.width = '0%'; }
    else { fillR.style.width = (v / 2) + '%'; fillL.style.width = '0%'; }
    pct.textContent = Math.abs(v) + '%';
    letters.forEach(l => {
      const side = l.dataset.side;
      l.classList.toggle('active', (side === 'L' && v < 0) || (side === 'R' && v >= 0));
    });
  }
}

function bindAxisRow(row) {
  if (row.dataset.bound) return;
  row.dataset.bound = '1';
  const key = row.dataset.axis;
  const track = row.querySelector('.axis-track');
  const handle = (clientX) => {
    const rect = track.getBoundingClientRect();
    let p = ((clientX - rect.left) / rect.width) * 100;
    p = Math.max(0, Math.min(100, p));
    state[key] = thumbPctToValue(p);
    saveState();
    renderAxisRow(row);
    refreshTypology();
  };
  const onMove = (e) => { e.preventDefault(); handle(e.touches ? e.touches[0].clientX : e.clientX); };
  const onDown = (e) => {
    e.preventDefault();
    handle(e.touches ? e.touches[0].clientX : e.clientX);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  };
  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchend', onUp);
  };
  track.addEventListener('mousedown', onDown);
  track.addEventListener('touchstart', onDown, { passive: false });
}

// === chip pick-single ===
function bindChipPicks() {
  document.querySelectorAll('[data-pick-single]').forEach(group => {
    if (group.dataset.bound) return;
    group.dataset.bound = '1';
    const key = group.dataset.pickSingle;
    group.querySelectorAll('.chip, .align-cell').forEach(chip => {
      chip.addEventListener('click', () => {
        const v = chip.dataset.val;
        const isNum = key === 'enn-main';
        state[key] = isNum ? parseInt(v, 10) : v;
        if (key === 'soc') state['soc-manual'] = true;
        if (key === 'enn-main') { state['enn-wing'] = 'auto'; }
        saveState();
        syncChipGroup(group);
        if (key === 'enn-main') renderEnnWingChips();
        refreshTypology();
      });
    });
  });
}

function syncChipGroup(group) {
  const key = group.dataset.pickSingle;
  const v = state[key];
  group.querySelectorAll('.chip, .align-cell').forEach(chip => {
    const cv = chip.dataset.val;
    const match = v != null && String(v) === String(cv);
    chip.classList.toggle('selected', match);
  });
}

// === quad bars (Big5, DISC) ===
function bindQuadBars() {
  document.querySelectorAll('[data-quad]').forEach(row => {
    if (row.dataset.bound) return;
    row.dataset.bound = '1';
    const key = row.dataset.quad;
    const track = row.querySelector('.quad-bar-track');
    const handle = (clientX) => {
      const rect = track.getBoundingClientRect();
      let p = ((clientX - rect.left) / rect.width) * 100;
      p = Math.max(0, Math.min(100, p));
      state[key] = Math.round(p);
      saveState();
      renderQuadBar(row);
      refreshTypology();
    };
    const onMove = (e) => { e.preventDefault(); handle(e.touches ? e.touches[0].clientX : e.clientX); };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
    track.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handle(e.clientX);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
    track.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handle(e.touches[0].clientX);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }, { passive: false });
  });
}

function renderQuadBar(row) {
  const key = row.dataset.quad;
  const v = state[key];
  const fill = row.querySelector('.quad-bar-fill');
  const valEl = row.querySelector('.quad-bar-val');
  if (v == null) {
    fill.style.width = '0%';
    valEl.textContent = '—';
    fill.classList.remove('high');
  } else {
    fill.style.width = v + '%';
    valEl.textContent = v;
    fill.classList.toggle('high', v >= 70);
  }
}

// === Holland hex (click to increment) ===
function bindHex() {
  document.querySelectorAll('[data-hex]').forEach(grid => {
    if (grid.dataset.bound) return;
    grid.dataset.bound = '1';
    grid.querySelectorAll('.hex-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const letter = cell.dataset.val;
        const scores = { ...(state['hol-scores'] || {}) };
        scores[letter] = (scores[letter] || 0) + 1;
        state['hol-scores'] = scores;
        saveState();
        renderHex(grid);
        refreshTypology();
      });
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const letter = cell.dataset.val;
        const scores = { ...(state['hol-scores'] || {}) };
        scores[letter] = Math.max(0, (scores[letter] || 0) - 1);
        state['hol-scores'] = scores;
        saveState();
        renderHex(grid);
        refreshTypology();
      });
    });
  });
}

function renderHex(grid) {
  const scores = state['hol-scores'] || {};
  const sorted = Object.entries(scores).filter(([,v]) => v > 0).sort((a,b)=>b[1]-a[1]);
  grid.querySelectorAll('.hex-cell').forEach(cell => {
    const letter = cell.dataset.val;
    const score = scores[letter] || 0;
    const badge = cell.querySelector('.hex-rank-badge');
    cell.classList.remove('rank-1', 'rank-2');
    let rankLabel = score > 0 ? '+' + score : '';
    if (sorted[0] && sorted[0][0] === letter) { cell.classList.add('rank-1'); rankLabel = '#1 · ' + score; }
    else if (sorted[1] && sorted[1][0] === letter && sorted[1][1] > 0) { cell.classList.add('rank-2'); rankLabel = '#2 · ' + score; }
    badge.textContent = rankLabel;
  });
}

// === LVEF rank list ===
function renderLvef() {
  const list = document.getElementById('lvef-list');
  if (!list) return;
  list.innerHTML = '';
  const order = state['lvef-order'] || ['L','V','E','F'];
  order.forEach((letter, idx) => {
    const item = document.createElement('div');
    item.className = 'rank-item';
    item.innerHTML =
      '<span class="rank-num">' + (idx + 1) + '</span>' +
      '<span><span class="rank-letter">' + letter + '</span><span class="rank-label">' + LVEF_LABELS[letter] + '</span></span>' +
      '<button class="rank-btn" data-dir="up" ' + (idx === 0 ? 'disabled' : '') + '>↑</button>' +
      '<button class="rank-btn" data-dir="down" ' + (idx === order.length - 1 ? 'disabled' : '') + '>↓</button>';
    list.appendChild(item);
    item.querySelectorAll('.rank-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        const arr = [...state['lvef-order']];
        const swapWith = dir === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= arr.length) return;
        [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
        state['lvef-order'] = arr;
        state['lvef-touched'] = true;
        saveState();
        renderLvef();
        refreshTypology();
      });
    });
  });
}

function syncTypologyControls() {
  renderEnnWingChips();
  document.querySelectorAll('.axis-row').forEach(renderAxisRow);
  document.querySelectorAll('[data-pick-single]').forEach(syncChipGroup);
  document.querySelectorAll('[data-quad]').forEach(renderQuadBar);
  document.querySelectorAll('[data-hex]').forEach(renderHex);
  renderLvef();
}

function attachTypologyListeners() {
  document.querySelectorAll('.axis-row').forEach(bindAxisRow);
  bindChipPicks();
  bindQuadBars();
  bindHex();

  const nameInput = document.getElementById('typo-name');
  if (nameInput && !nameInput.dataset.bound) {
    nameInput.dataset.bound = '1';
    nameInput.addEventListener('input', () => {
      state['typo-name'] = nameInput.value.trim() || '匿名';
      saveState();
      const badge = document.querySelector('.typo-id-badge');
      if (badge) badge.textContent = state['typo-name'].slice(-1);
    });
  }
  const resetBtn = document.getElementById('typo-reset-btn');
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.addEventListener('click', () => {
      ['mbti-ie','mbti-sn','mbti-tf','mbti-jp','ideal-ie','ideal-sn','ideal-tf','ideal-jp',
       'enn-main','enn-instinct','phil','rom-obj','rom-rhy','attach','dnd','soc','humor',
       'jung-dom','jung-aux','big-o','big-c','big-e','big-a','big-n','disc-d','disc-i','disc-s','disc-c']
        .forEach(k => state[k] = null);
      state['soc-manual'] = false;
      state['enn-wing'] = 'auto';
      state['lvef-order'] = ['L','V','E','F'];
      state['lvef-touched'] = false;
      state['hol-scores'] = { R:0, I:0, A:0, S:0, E:0, C:0 };
      saveState();
      syncTypologyControls();
      refreshTypology();
    });
  }
  const randomBtn = document.getElementById('typo-random-btn');
  if (randomBtn && !randomBtn.dataset.bound) {
    randomBtn.dataset.bound = '1';
    randomBtn.addEventListener('click', () => randomFillTypology());
  }
  const exportBtn = document.getElementById('typo-export-btn');
  if (exportBtn && !exportBtn.dataset.bound) {
    exportBtn.dataset.bound = '1';
    exportBtn.addEventListener('click', () => exportTypology());
  }
}

function pickRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function randomFillTypology() {
  ['mbti-ie','mbti-sn','mbti-tf','mbti-jp','ideal-ie','ideal-sn','ideal-tf','ideal-jp']
    .forEach(k => state[k] = randInt(-90, 90));
  state['enn-main'] = randInt(1, 9);
  state['enn-instinct'] = pickRand(['SX/SO','SX/SP','SO/SX','SO/SP','SP/SX','SP/SO']);
  state['phil'] = pickRand(['存在主义者','虚无主义者','斯多葛主义者','享乐主义者','理性主义者','经验主义者','实用主义者','浪漫主义者']);
  state['rom-obj'] = pickRand(['异性','同性','泛性','无性']);
  state['rom-rhy'] = pickRand(['稳定','波动','燃烧','冷感']);
  state['attach'] = pickRand(['安全型','焦虑型','回避型','恐惧型']);
  state['dnd'] = pickRand(['守序善良','中立善良','混乱善良','守序中立','绝对中立','混乱中立','守序邪恶','中立邪恶','混乱邪恶']);
  state['humor'] = pickRand(['多血质','胆汁质','粘液质','抑郁质']);
  state['jung-dom'] = pickRand(['Te','Ti','Fe','Fi','Se','Si','Ne','Ni']);
  state['jung-aux'] = pickRand(['T','F','S','N']);
  state['lvef-order'] = ['L','V','E','F'].sort(() => Math.random() - 0.5);
  state['lvef-touched'] = true;
  ['big-o','big-c','big-e','big-a','big-n','disc-d','disc-i','disc-s','disc-c']
    .forEach(k => state[k] = randInt(15, 90));
  const sc = { R:0, I:0, A:0, S:0, E:0, C:0 };
  for (let i = 0; i < 12; i++) sc[pickRand(Object.keys(sc))]++;
  state['hol-scores'] = sc;
  state['soc-manual'] = false;
  state['soc'] = null;
  saveState();
  syncTypologyControls();
  refreshTypology();
}

function exportTypology() {
  const t = typologySummary();
  const payload = { name: state['typo-name'], typology: t, raw: {
    mbti_axes: { ie: state['mbti-ie'], sn: state['mbti-sn'], tf: state['mbti-tf'], jp: state['mbti-jp'] },
    ideal_axes: { ie: state['ideal-ie'], sn: state['ideal-sn'], tf: state['ideal-tf'], jp: state['ideal-jp'] },
    enn_main: state['enn-main'], enn_instinct: state['enn-instinct'],
    big5: { O: state['big-o'], C: state['big-c'], E: state['big-e'], A: state['big-a'], N: state['big-n'] },
    holland_scores: state['hol-scores'],
    disc: { D: state['disc-d'], I: state['disc-i'], S: state['disc-s'], C: state['disc-c'] },
    lvef_order: state['lvef-order']
  }, generated_at: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'typology-' + (state['typo-name'] || 'anon') + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  highlightNav();
  syncControls();
  attachListeners();
  renderRadar();
  syncTypologyControls();
  attachTypologyListeners();
  refresh();
  refreshTypology();
});
