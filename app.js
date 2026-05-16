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
  'disc-d': null, 'disc-i': null, 'disc-s': null, 'disc-c': null,

  // === Room 2 · DECISION_CONTEXT ===
  'ctx-subject': '',
  'ctx-type': null,
  'ctx-urgency': null,  // days
  'ctx-reversibility': null,
  'ctx-scope': null,
  'ctx-window': null,
  'ctx-stakeholders': null,  // count
  'ctx-time-cost': null,
  'ctx-money-cost': null,
  'ctx-info': null,  // 0-100
  'ctx-emotion': null,
  'ctx-conflict': null,
  'ctx-similar': null,
  'ctx-publicity': null,
  'ctx-regret': null,  // 1-10
  'ctx-explore': null,  // axis -100 to 100

  // === Room 3 · OPTIONS_FORENSICS ===
  'opt-list': [],  // [{letter,name,truth,note}]
  'opt-binary-found': null,  // count
  'opt-frame': null,  // 默认/取消/拖时/拆分/合并
  'opt-stakeholder-info': null,
  'opt-hidden-count': null,
  'opt-hidden-note': '',
  'opt-sunk-severity': null,  // 0-3
  'opt-independence': null,  // 0-100
  'opt-comparable': null,
  'opt-third-found': null,
  'opt-confidence': null,
  'opt-compare-cost': null,

  // === Room 4 · SCORING_MATRIX (extra) ===
  'w-growth': 150, 'w-autonomy': 130, 'w-depth': 120, 'w-create': 110, 'w-real': 100, 'w-stability': 70,
  'sc-normalize': null,
  'sc-threshold': null,
  'sc-prob-weight': null,
  'sc-uncertainty-discount': null,
  'sc-time-discount': null,
  'sc-self-report-weight': null,

  // === Room 5 · BIAS_AUDIT ===
  // each bias: state (null/pass/warn/alert), evidence text
  'bias-intuition-state': null, 'bias-intuition-evidence': '',
  'bias-fear-state': null,      'bias-fear-evidence': '',
  'bias-conform-state': null,   'bias-conform-evidence': '',
  'bias-sunk-state': null,      'bias-sunk-evidence': '',
  'bias-script-state': null,    'bias-script-evidence': '',
  'bias-anchor-state': null,    'bias-anchor-evidence': '',
  'bias-confirm-state': null,   'bias-confirm-evidence': '',
  'bias-loss-state': null,      'bias-loss-evidence': '',
  'bias-frame-state': null,     'bias-frame-evidence': '',

  // === Room 6 · ACTION_BLUEPRINT ===
  'act-first-step': '',
  'act-first-when': null,       // 今天/3天/7天/14天
  'act-owner': null,            // 仅自己/伙伴/委托
  'act-success': '',
  'act-rollback': '',
  'act-callback-mode': 2,       // 1=30/90, 2=30/90/180, 3=7/30/90/180
  'act-30q': '',
  'act-90q': '',
  'act-snap': null,             // 6m/1y/3y/5y multi
  'act-confidant': null,        // 共识对象 multi
  'act-public-commit': null,    // boolean tri
  'act-archive': null,
  'act-feedback': null,
  'act-sig-self': '',
  'act-sig-witness': '',

  // === Simulator (knobs) ===
  'sim-future-tilt': 0,   // axis -100..100
  'sim-risk-tolerance': 50,
  'sim-noise-discount': 50,
  'sim-conf-floor': 50
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

  // The real pipeline overrides any of the placeholder sim values above
  if (typeof paintPipeline === 'function') paintPipeline();
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
    runCardRefresh(row);
    if (typeof refresh === 'function') refresh();
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
        if (typeof runCardRefresh === 'function') runCardRefresh(group);
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
    const max = parseInt(row.dataset.max || '100', 10);
    const track = row.querySelector('.quad-bar-track');
    const handle = (clientX) => {
      const rect = track.getBoundingClientRect();
      let p = ((clientX - rect.left) / rect.width) * 100;
      p = Math.max(0, Math.min(100, p));
      state[key] = Math.round(p / 100 * max);
      saveState();
      renderQuadBar(row);
      refreshTypology();
      runCardRefresh(row);
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
  const max = parseInt(row.dataset.max || '100', 10);
  const v = state[key];
  const fill = row.querySelector('.quad-bar-fill');
  const valEl = row.querySelector('.quad-bar-val');
  if (v == null) {
    fill.style.width = '0%';
    valEl.textContent = '—';
    fill.classList.remove('high');
  } else {
    const pct = (v / max) * 100;
    fill.style.width = pct + '%';
    valEl.textContent = v;
    fill.classList.toggle('high', pct >= 70);
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

// ========== GENERIC CONTROL BINDERS (shared across rooms) ==========

function bindTextInputs() {
  document.querySelectorAll('[data-text-key]').forEach(el => {
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    const key = el.dataset.textKey;
    el.value = state[key] || '';
    el.addEventListener('input', () => {
      state[key] = el.value;
      saveState();
      const card = el.dataset.card;
      if (card && window['refresh' + card]) window['refresh' + card]();
    });
  });
}

function bindCounters() {
  document.querySelectorAll('[data-counter]').forEach(host => {
    if (host.dataset.bound) return;
    host.dataset.bound = '1';
    const key = host.dataset.counter;
    const min = parseInt(host.dataset.min || '0', 10);
    const max = parseInt(host.dataset.max || '99', 10);
    const renderCount = () => {
      const valEl = host.querySelector('.counter-val');
      const v = state[key];
      valEl.textContent = v == null ? '—' : v;
      host.querySelector('[data-act="dec"]').disabled = v == null || v <= min;
      host.querySelector('[data-act="inc"]').disabled = v != null && v >= max;
    };
    renderCount();
    host.querySelector('[data-act="dec"]').addEventListener('click', () => {
      if (state[key] == null) state[key] = min;
      else state[key] = Math.max(min, state[key] - 1);
      saveState();
      renderCount();
      runCardRefresh(host);
    });
    host.querySelector('[data-act="inc"]').addEventListener('click', () => {
      if (state[key] == null) state[key] = Math.max(min, 1);
      else state[key] = Math.min(max, state[key] + 1);
      saveState();
      renderCount();
      runCardRefresh(host);
    });
  });
}

function bindSeverity() {
  document.querySelectorAll('[data-severity]').forEach(host => {
    if (host.dataset.bound) return;
    host.dataset.bound = '1';
    const key = host.dataset.severity;
    const dots = host.querySelectorAll('.severity-dot');
    const sync = () => {
      const v = state[key] == null ? -1 : state[key];
      dots.forEach((d, i) => {
        d.classList.toggle('on', i <= v);
        d.classList.toggle('red', i <= v && v >= 2);
      });
    };
    sync();
    dots.forEach((d, i) => {
      d.addEventListener('click', () => {
        state[key] = (state[key] === i) ? null : i;
        saveState();
        sync();
        runCardRefresh(host);
      });
    });
  });
}

function bindMultiChips() {
  document.querySelectorAll('[data-pick-multi]').forEach(group => {
    if (group.dataset.bound) return;
    group.dataset.bound = '1';
    const key = group.dataset.pickMulti;
    const sync = () => {
      const arr = state[key] || [];
      group.querySelectorAll('.chip').forEach(chip => {
        chip.classList.toggle('selected', arr.includes(chip.dataset.val));
        chip.classList.add('multi');
      });
    };
    sync();
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const arr = state[key] ? [...state[key]] : [];
        const idx = arr.indexOf(chip.dataset.val);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(chip.dataset.val);
        state[key] = arr.length ? arr : null;
        saveState();
        sync();
        runCardRefresh(group);
      });
    });
  });
}

function runCardRefresh(el) {
  const root = el.closest('[data-room-card]');
  if (!root) return;
  const card = root.dataset.roomCard;
  const fn = window['refresh' + card.charAt(0).toUpperCase() + card.slice(1)];
  if (fn) fn();
}

function bindBiasStates() {
  document.querySelectorAll('[data-bias-state]').forEach(group => {
    if (group.dataset.bound) return;
    group.dataset.bound = '1';
    const key = group.dataset.biasState;
    const sync = () => {
      const v = state[key];
      group.querySelectorAll('.bias-state-chip').forEach(chip => {
        chip.classList.remove('pass', 'warn', 'alert');
        if (chip.dataset.val === v) chip.classList.add(v);
      });
    };
    sync();
    group.querySelectorAll('.bias-state-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state[key] = state[key] === chip.dataset.val ? null : chip.dataset.val;
        saveState();
        sync();
        runCardRefresh(group);
      });
    });
  });
}

function bindAllGenericControls() {
  bindTextInputs();
  bindCounters();
  bindSeverity();
  bindMultiChips();
  bindBiasStates();
  bindChipPicks();
  bindQuadBars();
  document.querySelectorAll('.axis-row').forEach(bindAxisRow);
}

function syncAllGenericControls() {
  document.querySelectorAll('[data-bias-state]').forEach(g => {
    const key = g.dataset.biasState;
    const v = state[key];
    g.querySelectorAll('.bias-state-chip').forEach(chip => {
      chip.classList.remove('pass', 'warn', 'alert');
      if (chip.dataset.val === v) chip.classList.add(v);
    });
  });
  document.querySelectorAll('[data-text-key]').forEach(el => { el.value = state[el.dataset.textKey] || ''; });
  document.querySelectorAll('[data-counter]').forEach(host => {
    const valEl = host.querySelector('.counter-val');
    const v = state[host.dataset.counter];
    if (valEl) valEl.textContent = v == null ? '—' : v;
  });
  document.querySelectorAll('[data-pick-single]').forEach(syncChipGroup);
  document.querySelectorAll('[data-pick-multi]').forEach(g => {
    const key = g.dataset.pickMulti;
    const arr = state[key] || [];
    g.querySelectorAll('.chip').forEach(chip => chip.classList.toggle('selected', arr.includes(chip.dataset.val)));
  });
  document.querySelectorAll('[data-quad]').forEach(renderQuadBar);
  document.querySelectorAll('.axis-row').forEach(renderAxisRow);
  document.querySelectorAll('[data-severity]').forEach(host => {
    const key = host.dataset.severity;
    const v = state[key] == null ? -1 : state[key];
    host.querySelectorAll('.severity-dot').forEach((d, i) => {
      d.classList.toggle('on', i <= v);
      d.classList.toggle('red', i <= v && v >= 2);
    });
  });
}

// Helper: set card item label and result chip
function setRoomCardItem(cardId, key, val) {
  const el = document.getElementById(cardId + '-' + key);
  if (!el) return;
  const valEl = el.querySelector('.typo-id-item-val');
  if (val != null && val !== '') {
    valEl.textContent = val;
    valEl.classList.remove('pending');
    el.classList.add('locked');
  } else {
    valEl.textContent = '未录';
    valEl.classList.add('pending');
    el.classList.remove('locked');
  }
}

function updateCardProgress(cardId, items, totalKey, fillKey) {
  let filled = 0;
  items.forEach(v => { if (v != null && v !== '') filled++; });
  const total = items.length;
  const pct = (filled / total) * 100;
  setWidth(fillKey, pct + '%');
  setText(totalKey, filled + ' / ' + total);
  return filled;
}

// ========== ROOM 2 · DECISION_CONTEXT_CARD ==========
const URGENCY_LABEL = (d) => d == null ? null : (d <= 1 ? '24h 内' : d <= 3 ? d + ' 天 · 紧急' : d <= 7 ? d + ' 天 · 较急' : d <= 21 ? d + ' 天 · 中等' : d + ' 天 · 充裕');
const REGRET_LABEL = (v) => v == null ? null : (v <= 3 ? v + ' · 低' : v <= 6 ? v + ' · 中' : v + ' · 高');

function refreshCtx() {
  const items = ['ctx-subject','ctx-type','ctx-urgency','ctx-reversibility','ctx-scope','ctx-window',
    'ctx-stakeholders','ctx-time-cost','ctx-money-cost','ctx-info','ctx-emotion','ctx-conflict',
    'ctx-similar','ctx-publicity','ctx-regret','ctx-explore'];
  setRoomCardItem('ctx', 'subject', state['ctx-subject']);
  setRoomCardItem('ctx', 'type', state['ctx-type']);
  setRoomCardItem('ctx', 'urgency', URGENCY_LABEL(state['ctx-urgency']));
  setRoomCardItem('ctx', 'reversibility', state['ctx-reversibility']);
  setRoomCardItem('ctx', 'scope', state['ctx-scope']);
  setRoomCardItem('ctx', 'window', state['ctx-window']);
  setRoomCardItem('ctx', 'stakeholders', state['ctx-stakeholders'] != null ? state['ctx-stakeholders'] + ' 人' : null);
  setRoomCardItem('ctx', 'cost', costCombo(state['ctx-time-cost'], state['ctx-money-cost']));
  setRoomCardItem('ctx', 'info', state['ctx-info'] != null ? state['ctx-info'] + '%' : null);
  setRoomCardItem('ctx', 'emotion', state['ctx-emotion']);
  setRoomCardItem('ctx', 'conflict', state['ctx-conflict']);
  setRoomCardItem('ctx', 'similar', state['ctx-similar']);
  setRoomCardItem('ctx', 'publicity', state['ctx-publicity']);
  setRoomCardItem('ctx', 'regret', REGRET_LABEL(state['ctx-regret']));
  setRoomCardItem('ctx', 'explore', exploreLabel(state['ctx-explore']));

  const filled = updateCardProgress('ctx', items.map(k => state[k]).map(v => Array.isArray(v) ? (v.length ? v : null) : v), 'ctx-progress-val', 'ctx-progress-fill');

  // route conclusion
  if (state['ctx-urgency'] != null && state['ctx-window'] != null) {
    const u = state['ctx-urgency'];
    const period = u < 4 ? '3-7 天 · 加速决策' : u < 14 ? '7-14 天' : '14-21 天 · 延长酝酿';
    setText('r2-period', period);
    setText('r2-out', '推荐酝酿期 ' + period + ' · ' + (state['stakeholder'] ? '启用' : '关闭') + '利益相关方权重');
  }
  // sync nav status
  setNavStatus('room-2.html', filled >= 12 ? 'green' : filled >= 6 ? 'amber' : 'pending');
  if (typeof paintPipeline === 'function') paintPipeline();
}

function costCombo(t, m) {
  if (!t && !m) return null;
  return (t || '?') + ' / ' + (m || '?');
}
function exploreLabel(v) {
  if (v == null) return null;
  if (v < -50) return '强探索 ' + Math.abs(v) + '%';
  if (v < 0) return '偏探索 ' + Math.abs(v) + '%';
  if (v > 50) return '强收敛 ' + v + '%';
  if (v > 0) return '偏收敛 ' + v + '%';
  return '中位';
}

// ========== ROOM 3 · OPTIONS_FORENSICS_CARD ==========
function refreshOpts() {
  const list = state['opt-list'] || [];
  const truthCount = list.filter(o => o.truth === 'true').length;
  const fakeCount = list.filter(o => o.truth === 'fake').length;
  const undetermined = list.length - truthCount - fakeCount;

  setRoomCardItem('opt', 'count', list.length ? list.length + ' 项' : null);
  setRoomCardItem('opt', 'truth', list.length ? truthCount + ' 真' : null);
  setRoomCardItem('opt', 'fake', list.length ? fakeCount + ' 假' : null);
  setRoomCardItem('opt', 'undet', list.length ? undetermined + ' 待定' : null);
  setRoomCardItem('opt', 'binary', state['opt-binary-found'] != null ? state['opt-binary-found'] + ' 个新框架' : null);
  setRoomCardItem('opt', 'frame', state['opt-frame']);
  setRoomCardItem('opt', 'sh-info', state['opt-stakeholder-info']);
  setRoomCardItem('opt', 'hidden', state['opt-hidden-count'] != null ? state['opt-hidden-count'] + ' 项' : null);
  setRoomCardItem('opt', 'sunk', severityLabel(state['opt-sunk-severity']));
  setRoomCardItem('opt', 'indep', state['opt-independence'] != null ? state['opt-independence'] + '%' : null);
  setRoomCardItem('opt', 'compar', state['opt-comparable'] != null ? state['opt-comparable'] + '%' : null);
  setRoomCardItem('opt', 'third', state['opt-third-found']);
  setRoomCardItem('opt', 'conf', state['opt-confidence'] != null ? state['opt-confidence'] + '%' : null);
  setRoomCardItem('opt', 'cmpcost', state['opt-compare-cost'] != null ? state['opt-compare-cost'] + '%' : null);

  const items = [
    list.length || null,
    truthCount || null,
    fakeCount || null,
    undetermined != null && list.length ? undetermined : null,
    state['opt-binary-found'], state['opt-frame'], state['opt-stakeholder-info'],
    state['opt-hidden-count'], state['opt-sunk-severity'], state['opt-independence'],
    state['opt-comparable'], state['opt-third-found'], state['opt-confidence'], state['opt-compare-cost']
  ];
  const filled = updateCardProgress('opt', items, 'opt-progress-val', 'opt-progress-fill');
  setText('r3-out', list.length ? (truthCount + ' 个真选项 · ' + fakeCount + ' 个待移除' + (state['opt-third-found'] === '已发现' ? ' · 第三选项已浮现' : '')) : '尚未录入选项');
  setNavStatus('room-3.html', list.length === 0 ? 'pending' : (fakeCount > 0 || undetermined > 0) ? 'amber' : 'green');
  if (typeof paintPipeline === 'function') paintPipeline();
}

function severityLabel(v) {
  if (v == null) return null;
  return ['无', '轻度', '中度', '重度'][v];
}

const DIM_NAMES = ['成长','自主','深度','创造','真实','稳定'];
const DIM_KEYS  = ['G','A','D','C','R','S'];

function renderOptList() {
  const host = document.getElementById('opt-list-host');
  if (!host) return;
  const list = state['opt-list'] || [];
  host.innerHTML = '';
  // run pipeline once to know rankings/scores for display
  const pipe = (typeof runPipeline === 'function') ? runPipeline() : null;
  const scoreMap = pipe ? Object.fromEntries(pipe.opts.map(o => [o.letter, o])) : {};

  list.forEach((opt, idx) => {
    const row = document.createElement('div');
    row.className = 'opt-item';
    row.style.gridTemplateColumns = '22px 1fr auto auto';
    const letter = String.fromCharCode(65 + idx);
    const scoreObj = scoreMap[letter];
    const finalScore = scoreObj ? scoreObj.finalScore : null;
    const rank = scoreObj ? (pipe.ranking.findIndex(r => r.letter === letter) + 1) : null;
    const isWinner = rank === 1;

    row.innerHTML =
      '<span class="opt-letter">' + letter + '</span>' +
      '<input type="text" value="' + (opt.name || '').replace(/"/g, '&quot;') + '" placeholder="选项简述...">' +
      '<span class="opt-tag-toggle ' + (opt.truth === 'true' ? 'true' : opt.truth === 'fake' ? 'fake' : '') + '">' +
        (opt.truth === 'true' ? '真选项' : opt.truth === 'fake' ? '假选项' : '未判定') + '</span>' +
      '<button class="opt-remove" title="删除">×</button>' +
      '<div class="opt-scores"></div>' +
      (opt.truth !== 'fake' ? '<div class="opt-final"><span class="opt-final-rank">' +
        (rank ? '排名 #' + rank + ' / ' + pipe.opts.length : '待评分') + '</span>' +
        '<span class="opt-final-score' + (isWinner ? ' winner' : '') + '">' +
        (finalScore != null ? finalScore.toFixed(2) : '—') + '</span></div>' : '');
    host.appendChild(row);

    // 6-dim score bars
    const scoresHost = row.querySelector('.opt-scores');
    const dims = opt.scores || [5,5,5,5,5,5];
    DIM_NAMES.forEach((name, di) => {
      const v = dims[di] || 0;
      const cell = document.createElement('div');
      cell.className = 'opt-score';
      const pct = (v / 10) * 100;
      cell.innerHTML =
        '<span class="opt-score-label">' + DIM_KEYS[di] + ' · ' + name + '</span>' +
        '<div class="opt-score-bar"><div class="opt-score-fill' + (v >= 7 ? ' high' : '') + '" style="width:' + pct + '%"></div></div>' +
        '<span class="opt-score-val">' + v.toFixed(1) + '</span>';
      scoresHost.appendChild(cell);
      const bar = cell.querySelector('.opt-score-bar');
      const handle = (clientX) => {
        const r = bar.getBoundingClientRect();
        let p = ((clientX - r.left) / r.width) * 10;
        p = Math.max(0, Math.min(10, p));
        if (!list[idx].scores) list[idx].scores = [5,5,5,5,5,5];
        list[idx].scores[di] = Math.round(p * 2) / 2;
        state['opt-list'] = list;
        saveState();
        renderOptList();
        refreshOpts();
        if (typeof refresh === 'function') refresh();
      };
      bar.addEventListener('mousedown', (e) => { e.preventDefault(); handle(e.clientX); });
      bar.addEventListener('click', (e) => handle(e.clientX));
    });

    row.querySelector('input').addEventListener('input', (e) => {
      list[idx].name = e.target.value;
      state['opt-list'] = list;
      saveState();
      refreshOpts();
      if (typeof refresh === 'function') refresh();
    });
    row.querySelector('.opt-tag-toggle').addEventListener('click', () => {
      const cur = list[idx].truth;
      list[idx].truth = cur === 'true' ? 'fake' : cur === 'fake' ? null : 'true';
      state['opt-list'] = list;
      saveState();
      renderOptList();
      refreshOpts();
      if (typeof refresh === 'function') refresh();
    });
    row.querySelector('.opt-remove').addEventListener('click', () => {
      list.splice(idx, 1);
      state['opt-list'] = list;
      saveState();
      renderOptList();
      refreshOpts();
      if (typeof refresh === 'function') refresh();
    });
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'opt-add';
  addBtn.textContent = '+ 添加选项';
  addBtn.addEventListener('click', () => {
    list.push({ name: '', truth: null, scores: [5,5,5,5,5,5] });
    state['opt-list'] = list;
    saveState();
    renderOptList();
    refreshOpts();
    if (typeof refresh === 'function') refresh();
  });
  host.appendChild(addBtn);
}

// ========== ROOM 4 · SCORING_MATRIX_CARD ==========
function refreshScore() {
  const weights = ['w-growth','w-autonomy','w-depth','w-create','w-real','w-stability'];
  const labels  = ['成长','自主','深度','创造','真实','稳定'];
  const wsum = weights.reduce((a,k) => a + state[k], 0);
  const top = weights.map((k,i) => ({ k, l: labels[i], v: state[k] })).sort((a,b)=>b.v-a.v);
  setRoomCardItem('sc', 'top1', top[0] ? top[0].l + ' ×' + (top[0].v/100).toFixed(2) : null);
  setRoomCardItem('sc', 'top2', top[1] ? top[1].l + ' ×' + (top[1].v/100).toFixed(2) : null);
  setRoomCardItem('sc', 'top3', top[2] ? top[2].l + ' ×' + (top[2].v/100).toFixed(2) : null);
  setRoomCardItem('sc', 'spread', Math.round(top[0].v - top[5].v) + ' pt 离散');
  setRoomCardItem('sc', 'wsum', (wsum/100).toFixed(2) + ' 倍合');
  setRoomCardItem('sc', 'dims', state['score-dims'] + ' 维');
  setRoomCardItem('sc', 'normalize', state['sc-normalize']);
  setRoomCardItem('sc', 'threshold', state['sc-threshold'] != null ? '差距 ≥ ' + state['sc-threshold'] : null);
  setRoomCardItem('sc', 'prob', state['sc-prob-weight']);
  setRoomCardItem('sc', 'uncertain', state['sc-uncertainty-discount'] != null ? state['sc-uncertainty-discount'] + '% 贴现' : null);
  setRoomCardItem('sc', 'time', state['sc-time-discount'] != null ? state['sc-time-discount'] + '%/年' : null);
  setRoomCardItem('sc', 'self', state['sc-self-report-weight'] != null ? state['sc-self-report-weight'] + '% 自报' : null);
  setRoomCardItem('sc', 'sens', levelMap[state['sens-level']]);

  const items = [top[0].v, top[1].v, top[2].v, 1, 1, state['score-dims'], state['sc-normalize'],
    state['sc-threshold'], state['sc-prob-weight'], state['sc-uncertainty-discount'],
    state['sc-time-discount'], state['sc-self-report-weight'], state['sens-level']];
  updateCardProgress('sc', items, 'sc-progress-val', 'sc-progress-fill');
  renderWeightBars();
  setNavStatus('room-4.html', 'green');
  if (typeof paintPipeline === 'function') paintPipeline();
}

function renderWeightBars() {
  ['w-growth','w-autonomy','w-depth','w-create','w-real','w-stability'].forEach(k => {
    const row = document.querySelector('[data-quad="' + k + '"]');
    if (row) renderQuadBar(row);
  });
}

// ========== ROOM 5 · BIAS_AUDIT_CARD ==========
const BIAS_LABELS = {
  intuition: '直觉', fear: '恐惧驱动', conform: '从众', sunk: '沉没成本', script: '旧脚本',
  anchor: '锚定效应', confirm: '确认偏误', loss: '损失厌恶', frame: '框架效应'
};
const BIAS_STATE_LABELS = { pass: '通过', warn: '注意', alert: '严重' };
function refreshBias() {
  const keys = Object.keys(BIAS_LABELS);
  let pass = 0, warn = 0, alert = 0, totalRated = 0;
  keys.forEach(k => {
    const s = state['bias-' + k + '-state'];
    if (s) { totalRated++; if (s === 'pass') pass++; if (s === 'warn') warn++; if (s === 'alert') alert++; }
  });
  setRoomCardItem('bias', 'rated', totalRated + ' / ' + keys.length);
  setRoomCardItem('bias', 'pass', totalRated ? pass + ' 通过' : null);
  setRoomCardItem('bias', 'warn', totalRated ? warn + ' 注意' : null);
  setRoomCardItem('bias', 'alert', totalRated ? alert + ' 严重' : null);
  // top triggered
  const triggered = keys.filter(k => state['bias-' + k + '-state'] === 'warn' || state['bias-' + k + '-state'] === 'alert');
  setRoomCardItem('bias', 'top', triggered.length ? triggered.slice(0,3).map(k => BIAS_LABELS[k]).join(' / ') : (totalRated > 0 ? '无触发' : null));
  const score = totalRated > 0 ? Math.max(0, 100 - (warn * 10 + alert * 25)) : null;
  setRoomCardItem('bias', 'score', score != null ? score + '/100' : null);
  setRoomCardItem('bias', 'thresh', levelMap[state['check-thresh']]);
  const evidenced = keys.filter(k => state['bias-' + k + '-evidence']).length;
  setRoomCardItem('bias', 'evidence', evidenced + ' 项证据');
  setRoomCardItem('bias', 'conf', totalRated >= 7 ? '高' : totalRated >= 4 ? '中' : '低');
  setRoomCardItem('bias', 'recommend', recommendFromBias(alert, warn, pass, totalRated));
  setRoomCardItem('bias', 'fingerprint', biasFingerprint(keys));

  const items = [totalRated, pass, warn, alert, triggered.length ? 1 : null, score, 1, evidenced ? 1 : null, totalRated, recommendFromBias(alert, warn, pass, totalRated), biasFingerprint(keys)];
  const filled = updateCardProgress('bias', items, 'bias-progress-val', 'bias-progress-fill');
  setText('r5-out', totalRated + ' 项已校验 · ' + (warn + alert) + ' 项触发 · ' + pass + ' 项通过');
  setNavStatus('room-5.html', totalRated < 5 ? 'pending' : (alert > 0 ? 'red' : warn > 0 ? 'amber' : 'green'));
  if (typeof paintPipeline === 'function') paintPipeline();
}

function recommendFromBias(a, w, p, total) {
  if (total === 0) return null;
  if (a >= 2) return '暂停重审';
  if (a === 1) return '复核执行';
  if (w >= 3) return '延期酝酿';
  if (p === total) return '可执行';
  return '继续';
}
function biasFingerprint(keys) {
  const map = { pass: '√', warn: '!', alert: '×', null: '·' };
  return keys.map(k => map[state['bias-' + k + '-state']] || '·').join('');
}

// ========== ROOM 6 · ACTION_BLUEPRINT_CARD ==========
const CALLBACK_MAP = { 1: '30/90', 2: '30/90/180', 3: '7/30/90/180' };
function refreshAct() {
  setRoomCardItem('act', 'step', state['act-first-step'] ? truncate(state['act-first-step'], 22) : null);
  setRoomCardItem('act', 'when', state['act-first-when']);
  setRoomCardItem('act', 'owner', state['act-owner']);
  setRoomCardItem('act', 'success', state['act-success'] ? truncate(state['act-success'], 20) : null);
  setRoomCardItem('act', 'rollback', state['act-rollback'] ? truncate(state['act-rollback'], 20) : null);
  setRoomCardItem('act', 'callback', CALLBACK_MAP[state['act-callback-mode']]);
  setRoomCardItem('act', '30q', state['act-30q'] ? truncate(state['act-30q'], 20) : null);
  setRoomCardItem('act', '90q', state['act-90q'] ? truncate(state['act-90q'], 20) : null);
  setRoomCardItem('act', 'snap', state['act-snap'] && state['act-snap'].length ? state['act-snap'].join(' / ') : null);
  setRoomCardItem('act', 'confidant', state['act-confidant'] && state['act-confidant'].length ? state['act-confidant'].join(' / ') : null);
  setRoomCardItem('act', 'public', state['act-public-commit']);
  setRoomCardItem('act', 'archive', state['act-archive']);
  setRoomCardItem('act', 'feedback', state['act-feedback']);
  setRoomCardItem('act', 'sig', state['act-sig-self'] || null);

  const items = ['act-first-step','act-first-when','act-owner','act-success','act-rollback','act-callback-mode',
    'act-30q','act-90q','act-snap','act-confidant','act-public-commit','act-archive','act-feedback','act-sig-self']
    .map(k => state[k]).map(v => Array.isArray(v) ? (v.length ? v : null) : v);
  const filled = updateCardProgress('act', items, 'act-progress-val', 'act-progress-fill');
  setNavStatus('room-6.html', filled >= 10 ? 'green' : filled >= 5 ? 'amber' : 'pending');
  if (typeof paintPipeline === 'function') paintPipeline();
}
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// nav-status helper
function setNavStatus(href, level) {
  const item = document.querySelector('.nav-item[href="' + href + '"] .nav-status');
  if (!item) return;
  item.classList.remove('amber', 'red', 'pending');
  if (level === 'amber') item.classList.add('amber');
  else if (level === 'red') item.classList.add('amber');
  else if (level === 'pending') item.style.background = 'var(--cream-deep)';
  else item.style.background = 'var(--green)';
}

// ========== ROOM-SPECIFIC INIT WRAPPER ==========
function initRoom(name) {
  syncAllGenericControls();
  bindAllGenericControls();
  if (name === 'opts') { renderOptList(); refreshOpts(); }
  if (name === 'ctx') refreshCtx();
  if (name === 'score') refreshScore();
  if (name === 'bias') refreshBias();
  if (name === 'act') refreshAct();
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
  // also init room-specific cards if present
  if (document.querySelector('[data-room-card="ctx"]')) initRoom('ctx');
  if (document.querySelector('[data-room-card="opts"]')) initRoom('opts');
  if (document.querySelector('[data-room-card="score"]')) initRoom('score');
  if (document.querySelector('[data-room-card="bias"]')) initRoom('bias');
  if (document.querySelector('[data-room-card="act"]')) initRoom('act');
  if (document.getElementById('dash-room-1')) refreshDashboard();
  if (typeof paintPipeline === 'function') paintPipeline();
});

function refreshDashboard() {
  // Room 1 typology completion
  const typoKeys = ['mbti-ie','mbti-sn','mbti-tf','mbti-jp','enn-main','phil','rom-obj','attach','ideal-ie','dnd','soc','humor','jung-dom','big-o','hol-scores','disc-d'];
  // counted via typology card already; recompute simply
  let r1 = 0;
  if (mbtiType('mbti')) r1++;
  if (state['enn-main']) r1++;
  if (state['phil']) r1++;
  if (state['rom-obj'] || state['rom-rhy']) r1++;
  if (state['attach']) r1++;
  if (mbtiType('ideal')) r1++;
  if (state['dnd']) r1++;
  if (state['soc'] || mbtiType('mbti')) r1++;
  if (state['humor']) r1++;
  if (state['jung-dom']) r1++;
  if (state['lvef-touched']) r1++;
  if (sloanCode()) r1++;
  if (hollandCode()) r1++;
  if (discCode()) r1++;
  setDashRoom(1, r1, 14);
  // Room 2 ctx
  const ctxKeys = ['ctx-subject','ctx-type','ctx-urgency','ctx-reversibility','ctx-scope','ctx-window',
    'ctx-stakeholders','ctx-time-cost','ctx-money-cost','ctx-info','ctx-emotion','ctx-conflict',
    'ctx-similar','ctx-publicity','ctx-regret','ctx-explore'];
  let r2 = 0;
  ctxKeys.forEach(k => { const v = state[k]; if (v != null && v !== '') r2++; });
  setDashRoom(2, r2, 15);
  // Room 3 opts
  const list = state['opt-list'] || [];
  let r3 = 0;
  if (list.length) r3 += 4;
  ['opt-binary-found','opt-frame','opt-stakeholder-info','opt-hidden-count','opt-sunk-severity',
    'opt-independence','opt-comparable','opt-third-found','opt-confidence','opt-compare-cost'].forEach(k => {
    if (state[k] != null && state[k] !== '') r3++;
  });
  setDashRoom(3, Math.min(r3, 14), 14);
  // Room 5 bias
  const biasKeys = ['intuition','fear','conform','sunk','script','anchor','confirm','loss','frame'];
  let r5 = 0;
  biasKeys.forEach(k => { if (state['bias-' + k + '-state']) r5++; });
  setDashRoom(5, r5, 9);
  // Room 6 act
  const actKeys = ['act-first-step','act-first-when','act-owner','act-success','act-rollback','act-callback-mode',
    'act-30q','act-90q','act-snap','act-confidant','act-public-commit','act-archive','act-feedback','act-sig-self'];
  let r6 = 0;
  actKeys.forEach(k => { const v = state[k]; if (Array.isArray(v) ? v.length : (v != null && v !== '')) r6++; });
  setDashRoom(6, r6, 14);
  // KPI rollup: average completion
  const overall = Math.round((r1/14 + r2/15 + r3/14 + r5/9 + r6/14) / 5 * 100);
  setText('kpi-ready', overall);
  setWidth('kpi-ready-bar', overall + '%');
}

// ============================================================
// === DECISION MODEL v1.0 · 7-stage pipeline ================
// ============================================================
//
// Stage 1: USER       → value weights (6) + risk + explore bias
// Stage 2: CONTEXT    → 7 multiplicative factors
// Stage 3: OPTIONS    → filter fake + per-option 6-dim scores
// Stage 4: SCORING    → normalize + MAUT + discounts
// Stage 5: BIAS       → penalty + directional pull + guardrail
// Stage 6: SIMULATOR  → future tilt + risk + noise discount
// Stage 7: OUTPUT     → ranking + confidence + recommendation

function computeUserStage() {
  const raw = [
    state['w-growth'], state['w-autonomy'], state['w-depth'],
    state['w-create'], state['w-real'], state['w-stability']
  ].map(v => v == null ? 100 : v);
  const sum = raw.reduce((a,b)=>a+b, 0) || 1;
  let w = raw.map(v => v / sum);
  const sortedIdx = w.map((v, i) => [v, i]).sort((a,b)=>b[0]-a[0]).map(x => x[1]);
  const top1Mult = (state['top1-weight'] || 150) / 100;
  const top23Mult = (state['top23-weight'] || 120) / 100;
  w = [...w];
  w[sortedIdx[0]] *= top1Mult;
  if (sortedIdx[1] != null) w[sortedIdx[1]] *= top23Mult;
  if (sortedIdx[2] != null) w[sortedIdx[2]] *= top23Mult;
  const sum2 = w.reduce((a,b)=>a+b, 0) || 1;
  w = w.map(v => v / sum2);
  return {
    weights: w,
    topIdx: sortedIdx,
    topName: DIM_NAMES[sortedIdx[0]],
    summary: sortedIdx.slice(0,3).map(i => DIM_NAMES[i]).join('/'),
    raw
  };
}

function computeCtxStage() {
  const u = state['ctx-urgency'];
  const urgencyFactor = u == null ? 1 : Math.max(0.7, 1 - (30 - u) / 30 * 0.3);
  const reversibilityMap = { '完全可逆': 1.05, '大部分可逆': 1.02, '部分可逆': 1.0, '几乎不可逆': 0.94, '完全不可逆': 0.85 };
  const reversibilityFactor = reversibilityMap[state['ctx-reversibility']] || 1.0;
  const scopeMap = { '仅自己': 1.0, '小家': 1.03, '团队': 1.06, '社区/行业': 1.10, '社会': 1.15 };
  const scopeFactor = scopeMap[state['ctx-scope']] || 1.0;
  const regret = state['ctx-regret'];
  const regretFactor = regret == null ? 1 : 1 - (regret / 10) * 0.18;
  const emotionMap = { '冷静': 1.0, '兴奋': 0.98, '焦虑': 0.92, '沮丧': 0.93, '愤怒': 0.86, '迷茫': 0.94, '渴望': 0.96, '疲惫': 0.93 };
  const emotionFactor = emotionMap[state['ctx-emotion']] || 1.0;
  const conflictMap = { '无冲突': 1.0, '轻度': 0.98, '中度': 0.93, '重度': 0.85 };
  const conflictFactor = conflictMap[state['ctx-conflict']] || 1.0;
  const info = state['ctx-info'];
  const infoFactor = info == null ? 0.9 : 0.7 + (info / 100) * 0.3;
  const explore = state['ctx-explore'];
  const exploreBias = explore == null ? 0 : explore / 100;
  return {
    urgencyFactor, reversibilityFactor, scopeFactor, regretFactor,
    emotionFactor, conflictFactor, infoFactor, exploreBias,
    composite: urgencyFactor * reversibilityFactor * scopeFactor *
               regretFactor * emotionFactor * conflictFactor * infoFactor
  };
}

function computeOptsStage() {
  const list = (state['opt-list'] || []).map((o, idx) => ({
    ...o,
    letter: String.fromCharCode(65 + idx),
    scores: o.scores || [5,5,5,5,5,5]
  }));
  const valid = list.filter(o => o.truth !== 'fake');
  const fakeCount = list.length - valid.length;
  return { all: list, valid, fakeCount, totalCount: list.length };
}

function computeScoringStage() {
  return {
    normalize: state['sc-normalize'] || '原始',
    threshold: state['sc-threshold'] != null ? state['sc-threshold'] : 1.5,
    probMode: state['sc-prob-weight'] || '期望值',
    uncertaintyDisc: (state['sc-uncertainty-discount'] || 0) / 100,
    timeDisc: (state['sc-time-discount'] || 0) / 100,
    selfReportWeight: (state['sc-self-report-weight'] != null ? state['sc-self-report-weight'] : 50) / 100,
    sensLevel: state['sens-level'] || 2,
    dimCount: state['score-dims'] || 6
  };
}

function computeBiasStage() {
  const keys = ['intuition','fear','conform','sunk','script','anchor','confirm','loss','frame'];
  let warn = 0, alert = 0, pass = 0, rated = 0;
  const flags = {};
  keys.forEach(k => {
    const s = state['bias-' + k + '-state'];
    flags[k] = s;
    if (s) {
      rated++;
      if (s === 'pass') pass++;
      else if (s === 'warn') warn++;
      else if (s === 'alert') alert++;
    }
  });
  const penalty = (warn * 0.04 + alert * 0.10);
  const guardRail = alert >= 2;
  const auditScore = rated > 0 ? Math.max(0, 100 - warn * 10 - alert * 25) / 100 : 0;
  const completionRatio = rated / keys.length;
  return { warn, alert, pass, rated, total: keys.length, penalty, guardRail, auditScore, completionRatio, flags };
}

function computeSimStage() {
  return {
    futureTilt: state['sim-future-tilt'] == null ? 0 : state['sim-future-tilt'] / 100,
    riskTolerance: state['sim-risk-tolerance'] == null ? 0.5 : state['sim-risk-tolerance'] / 100,
    noiseDiscount: state['sim-noise-discount'] == null ? 0.5 : state['sim-noise-discount'] / 100,
    confFloor: state['sim-conf-floor'] == null ? 0.5 : state['sim-conf-floor'] / 100
  };
}

function timeHorizonYears(window) {
  const m = { '1 周': 0.02, '1 月': 0.08, '季度': 0.25, '半年': 0.5, '1 年': 1, '3 年': 3, '5 年+': 5, '一生': 30 };
  return m[window] || 1;
}

function normalizeMatrix(opts, method) {
  const result = opts.map(o => ({ ...o, normScores: [...o.scores] }));
  if (method === '原始' || !method) return result;
  for (let dim = 0; dim < 6; dim++) {
    const vals = result.map(o => o.scores[dim]);
    if (method === 'min-max') {
      const min = Math.min(...vals), max = Math.max(...vals);
      const range = max - min || 1;
      result.forEach(o => o.normScores[dim] = ((o.scores[dim] - min) / range) * 10);
    } else if (method === 'z-score') {
      const mean = vals.reduce((a,b)=>a+b, 0) / vals.length;
      const variance = vals.reduce((a,b)=>a+(b-mean)*(b-mean), 0) / vals.length;
      const std = Math.sqrt(variance) || 1;
      result.forEach(o => o.normScores[dim] = Math.max(0, Math.min(10, 5 + ((o.scores[dim] - mean) / std) * 1.8)));
    } else if (method === 'percentile') {
      const sorted = [...vals].sort((a,b)=>a-b);
      result.forEach(o => {
        const rank = sorted.indexOf(o.scores[dim]);
        o.normScores[dim] = (rank / Math.max(1, vals.length - 1)) * 10;
      });
    }
  }
  return result;
}

function ctxCompletionRatio() {
  const keys = ['ctx-subject','ctx-type','ctx-urgency','ctx-reversibility','ctx-scope','ctx-window',
    'ctx-stakeholders','ctx-time-cost','ctx-money-cost','ctx-info','ctx-emotion','ctx-conflict',
    'ctx-similar','ctx-publicity','ctx-regret','ctx-explore'];
  let n = 0;
  keys.forEach(k => { const v = state[k]; if (v != null && v !== '') n++; });
  return n / keys.length;
}

function actCompletionRatio() {
  const keys = ['act-first-step','act-first-when','act-owner','act-success','act-rollback','act-callback-mode',
    'act-30q','act-90q','act-snap','act-confidant','act-public-commit','act-archive','act-feedback','act-sig-self'];
  let n = 0;
  keys.forEach(k => { const v = state[k]; if (Array.isArray(v) ? v.length : (v != null && v !== '')) n++; });
  return n / keys.length;
}

function runPipeline() {
  const user = computeUserStage();
  const ctx = computeCtxStage();
  const optsStage = computeOptsStage();
  const sp = computeScoringStage();
  const bias = computeBiasStage();
  const sim = computeSimStage();

  if (optsStage.valid.length === 0) {
    return {
      stage: 'no-options', user, ctx, optsStage, sp, bias, sim,
      ranking: [], opts: [], winner: null, runner: null, gap: 0,
      confidence: 0, recommendation: '尚未录入候选选项', recColor: 'amber'
    };
  }

  const normalized = normalizeMatrix(optsStage.valid, sp.normalize);
  const timeYears = timeHorizonYears(state['ctx-window']);
  const lossAlert = bias.flags.loss === 'alert' || bias.flags.loss === 'warn';

  const scored = normalized.map(o => {
    const maut = o.normScores.reduce((acc, s, i) => acc + s * user.weights[i], 0);
    let score = maut;
    // ctx composite
    score *= ctx.composite;
    // discounts
    score *= (1 - sp.uncertaintyDisc * (1 - ctx.infoFactor));
    score *= Math.exp(-sp.timeDisc * timeYears);
    // bias penalty (noise-discount controls how much applies)
    score *= (1 - bias.penalty * (sim.noiseDiscount * 2));
    if (lossAlert) {
      const variance = (o.normScores[0] + o.normScores[3]) - o.normScores[5];
      if (variance > 2) score *= (1 - 0.05 * (bias.flags.loss === 'alert' ? 2 : 1));
    }
    // simulator tilts
    const longTermBonus = (o.normScores[0] + o.normScores[2]) * 0.04 - o.normScores[5] * 0.04;
    score += longTermBonus * sim.futureTilt;
    const riskFlavor = (o.normScores[1] + o.normScores[3]) / 2 - 5;
    score += riskFlavor * (sim.riskTolerance - 0.5) * 0.3;
    // context explore bias
    score += ctx.exploreBias * ((o.normScores[5] - 5) * -0.1);

    return { ...o, maut, finalScore: Math.max(0, score) };
  });

  // Sensitivity test: perturb top1 weight ±sensLevel*5% and see if order changes
  const perturbScale = sp.sensLevel * 0.05;
  const wPlus = [...user.weights];
  const wMinus = [...user.weights];
  wPlus[user.topIdx[0]] *= (1 + perturbScale);
  wMinus[user.topIdx[0]] *= (1 - perturbScale);
  const renorm = (arr) => { const s = arr.reduce((a,b)=>a+b, 0) || 1; return arr.map(v => v/s); };
  const scoreWith = (wts) => normalized
    .map(o => ({ letter: o.letter, s: o.normScores.reduce((a, v, i) => a + v * wts[i], 0) }))
    .sort((a,b) => b.s - a.s);
  const baseRank = scoreWith(user.weights).map(x => x.letter).join('');
  const plusRank = scoreWith(renorm(wPlus)).map(x => x.letter).join('');
  const minusRank = scoreWith(renorm(wMinus)).map(x => x.letter).join('');
  const stable = (baseRank === plusRank && baseRank === minusRank);

  const ranking = [...scored].sort((a,b) => b.finalScore - a.finalScore);
  const winner = ranking[0];
  const runner = ranking[1] || null;
  const gap = runner ? winner.finalScore - runner.finalScore : winner.finalScore;

  const ctxCompletion = ctxCompletionRatio();
  const optsClarity = optsStage.totalCount > 0
    ? optsStage.all.filter(o => o.truth).length / optsStage.totalCount : 0;
  const spreadConf = winner.finalScore > 0 ? Math.min(1, gap / (winner.finalScore * 0.2)) : 0;
  const actionReady = actCompletionRatio();
  const confidence = Math.max(0, Math.min(1,
    ctxCompletion * 0.20 +
    optsClarity * 0.20 +
    spreadConf * 0.20 +
    bias.auditScore * 0.20 +
    actionReady * 0.20
  ));

  let recommendation, recColor = 'green';
  if (bias.guardRail) { recommendation = '暂停重审 · 多项严重偏差'; recColor = 'red'; }
  else if (confidence < sim.confFloor) { recommendation = '再等等 · 置信不足'; recColor = 'amber'; }
  else if (!stable) { recommendation = '差距脆弱 · 排名因权重小扰动而翻转'; recColor = 'amber'; }
  else if (gap < sp.threshold * 0.1) { recommendation = '差距不显著 · 再校验'; recColor = 'amber'; }
  else { recommendation = '执行 · ' + winner.letter + (winner.name ? ' · ' + winner.name : ''); recColor = 'green'; }

  return {
    stage: 'ok', user, ctx, optsStage, sp, bias, sim,
    opts: scored, ranking, winner, runner, gap,
    confidence, recommendation, recColor,
    sensitivity: { stable, baseRank, plusRank, minusRank },
    contrib: { ctxCompletion, optsClarity, spreadConf, biasAudit: bias.auditScore, actionReady }
  };
}

// ============================================================
// === PIPELINE → UI WIRING ===================================
// ============================================================

function paintPipeline() {
  const p = runPipeline();

  // Simulator option cards
  if (p.opts && p.opts.length >= 1) {
    const winner = p.ranking[0];
    const runner = p.ranking[1] || null;
    paintSimCardOption('a', runner || winner);
    paintSimCardOption('b', winner);
    paintSimCardOption('r4-a', runner || winner);
    paintSimCardOption('r4-b', winner);
    setText('sim-final-a', (runner ? runner.finalScore : 0).toFixed(1));
    setText('sim-final-b', winner.finalScore.toFixed(1));
    setText('sim-score-a', (runner ? runner.finalScore : 0).toFixed(1));
    setText('sim-score-b', winner.finalScore.toFixed(1));
    setText('r4-score-a', (runner ? runner.finalScore : 0).toFixed(1));
    setText('r4-score-b', winner.finalScore.toFixed(1));
    const gapStr = (p.gap >= 0 ? '+' : '') + p.gap.toFixed(1);
    setText('sim-final-gap', gapStr);
    setText('dash-gap', gapStr);
    const stab = p.sensitivity.stable ? '稳健' : '脆弱';
    setText('sim-final-stab', stab);
    const aEl = document.getElementById('dash-a');
    const bEl = document.getElementById('dash-b');
    if (aEl) aEl.textContent = (runner ? runner.finalScore : 0).toFixed(1);
    if (bEl) bEl.textContent = winner.finalScore.toFixed(1);
  }

  // Sim live card synth
  setText('sim-card-a', p.ranking[1] ? p.ranking[1].finalScore.toFixed(1) : '—');
  setText('sim-card-b', p.winner ? p.winner.finalScore.toFixed(1) : '—');
  setText('sim-card-gap', p.gap != null ? (p.gap >= 0 ? '+' : '') + p.gap.toFixed(1) : '—');
  setText('sim-card-stab', p.sensitivity ? (p.sensitivity.stable ? '稳健' : '脆弱') : '—');
  setText('sim-card-bias', (p.bias.warn + p.bias.alert) + ' 项');
  setText('sim-card-rec', p.recommendation);
  setText('sim-card-tilt', p.sim.futureTilt > 0.3 ? '偏未来 ' + Math.round(p.sim.futureTilt * 100) + '%' :
                          p.sim.futureTilt < -0.3 ? '偏当下 ' + Math.round(-p.sim.futureTilt * 100) + '%' : '中位');
  setText('sim-card-risk', Math.round(p.sim.riskTolerance * 100) + '%');
  setText('sim-card-winner', p.winner ? (p.winner.letter + ' · ' + (p.winner.name || '未命名')) : '尚无候选');

  // Pipeline trace
  renderPipelineTrace(p);
  // Decision banner
  renderDecisionBanner(p);
  // Confidence kpi
  if (document.getElementById('kpi-conf')) {
    const c10 = (p.confidence * 10).toFixed(1);
    setText('kpi-conf', c10);
    setText('dash-conf', c10);
    setWidth('kpi-conf-bar', (p.confidence * 100) + '%');
  }
}

function paintSimCardOption(prefix, opt) {
  for (let i = 0; i < 4; i++) {
    const v = opt.normScores ? opt.normScores[i] : opt.scores[i];
    setText('sim-val-' + prefix + '-' + (i+1), v.toFixed(1));
    setWidth('sim-bar-' + prefix + '-' + (i+1), (v * 10) + '%');
    setText('r4-val-' + prefix + '-' + (i+1), v.toFixed(1));
    setWidth('r4-bar-' + prefix + '-' + (i+1), (v * 10) + '%');
  }
  // mark winner card
  ['sim-opt-' + prefix, 'r4-opt-' + prefix].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('winner', false);
  });
}

function renderPipelineTrace(p) {
  const host = document.getElementById('pipe-trace-host');
  if (!host) return;
  if (p.stage === 'no-options') {
    host.innerHTML = '<div class="pipe-trace"><div class="pipe-trace-label">还没法算</div><div style="color:rgba(245,240,232,0.55); font-size:11px;">先去 "关于选项" 那里添几个选项并给每个打分，这里就会出结果。</div></div>';
    return;
  }
  const ctxLabel = (p.ctx.composite >= 1 ? '加分' : '扣分');
  const ctxPctText = ((Math.abs(1 - p.ctx.composite)) * 100).toFixed(0);
  const ctxDirection = p.ctx.composite >= 1 ? '+' : '−';

  // human-readable user summary
  const userValueText = p.user.summary; // 例 "成长/自主/深度"
  // bias text
  const biasPct = (p.bias.penalty * p.sim.noiseDiscount * 2 * 100).toFixed(0);
  // sim text
  const simBits = [];
  if (Math.abs(p.sim.futureTilt) > 0.05) simBits.push((p.sim.futureTilt > 0 ? '为未来加分' : '为当下加分') + ' ' + Math.abs(p.sim.futureTilt*100).toFixed(0) + '%');
  if (Math.abs(p.sim.riskTolerance - 0.5) > 0.05) simBits.push((p.sim.riskTolerance > 0.5 ? '能冒险' : '偏稳') + ' ' + Math.round(p.sim.riskTolerance*100) + '%');
  const simText = simBits.length ? simBits.join(' · ') : '没动旋钮（中位）';

  const html =
    '<div class="pipe-trace">' +
      '<div class="pipe-trace-label">这个结论怎么来的 · 七步</div>' +

      '<div class="pipe-stage"><span class="pipe-stage-num">1</span><span class="pipe-stage-name">你最在乎啥</span>' +
        '<span class="pipe-stage-detail">前三：' + userValueText + '</span>' +
        '<span class="pipe-stage-out">权重已分配</span></div>' +

      '<div class="pipe-stage"><span class="pipe-stage-num">2</span><span class="pipe-stage-name">这件事的处境</span>' +
        '<span class="pipe-stage-detail">紧迫 / 可逆 / 范围 / 情绪 / 价值冲突 / 反悔代价 / 了解程度 综合算出一个修正</span>' +
        '<span class="pipe-stage-out">' + ctxDirection + ctxPctText + '% ' + ctxLabel + '</span></div>' +

      '<div class="pipe-stage"><span class="pipe-stage-num">3</span><span class="pipe-stage-name">在选什么</span>' +
        '<span class="pipe-stage-detail">真候选 ' + p.optsStage.valid.length + ' 个 · 凑数的 ' + p.optsStage.fakeCount + ' 个被筛掉</span>' +
        '<span class="pipe-stage-out">' + p.optsStage.valid.length + ' 个进比赛</span></div>' +

      '<div class="pipe-stage"><span class="pipe-stage-num">4</span><span class="pipe-stage-name">原始打分</span>' +
        '<span class="pipe-stage-detail">每个选项的 6 维分数 × 你的权重 = 原始分；按"' + p.sp.normalize + '"方式拉齐</span>' +
        '<span class="pipe-stage-out">第一名原始 ' + (p.winner ? p.winner.maut.toFixed(2) : '—') + '</span></div>' +

      '<div class="pipe-stage"><span class="pipe-stage-num">5</span><span class="pipe-stage-name">自检扣分</span>' +
        '<span class="pipe-stage-detail">' + p.bias.warn + ' 道留意 · ' + p.bias.alert + ' 道警示 → 给最终分扣 ' + biasPct + '%' + (p.bias.guardRail ? ' · 警示太多，强制建议暂停' : '') + '</span>' +
        '<span class="pipe-stage-out">−' + biasPct + '%</span></div>' +

      '<div class="pipe-stage"><span class="pipe-stage-num">6</span><span class="pipe-stage-name">你拖的旋钮</span>' +
        '<span class="pipe-stage-detail">' + simText + '</span>' +
        '<span class="pipe-stage-out dim">' + (p.sensitivity.stable ? '小动一下不会翻' : '小动一下会翻 ⚠') + '</span></div>' +

      '<div class="pipe-stage"><span class="pipe-stage-num">7</span><span class="pipe-stage-name">最终结论</span>' +
        '<span class="pipe-stage-detail">' + p.recommendation + '</span>' +
        '<span class="pipe-stage-out">' + (p.winner ? p.winner.finalScore.toFixed(2) : '—') + ' 分</span></div>' +

      '<div class="pipe-formula">' +
        '一句话说：<span class="v">第一名的最终分 = 你给它的 6 维原始分 × 你的价值权重 × 情境修正 × 信息折扣 × 时间折扣 × (1 − 自检扣分) + 旋钮加成</span>' +
        '<br/>把握 = (情境填得多 ' + (p.contrib.ctxCompletion*100).toFixed(0) +
        '% + 选项分得清 ' + (p.contrib.optsClarity*100).toFixed(0) +
        '% + 头尾差距大 ' + (p.contrib.spreadConf*100).toFixed(0) +
        '% + 自检过得多 ' + (p.contrib.biasAudit*100).toFixed(0) +
        '% + 行动写得全 ' + (p.contrib.actionReady*100).toFixed(0) +
        '%) ÷ 5 = <span class="v">' + (p.confidence*100).toFixed(0) + '%</span>' +
      '</div>' +
    '</div>';
  host.innerHTML = html;
}

function renderDecisionBanner(p) {
  const host = document.getElementById('decision-banner-host');
  if (!host) return;
  if (p.stage === 'no-options') {
    host.innerHTML = '<div class="decision-banner"><div class="decision-sub">还没法给建议——先去"关于选项"那里添几个选项并打分。</div></div>';
    return;
  }
  const stabPill = '<span class="flip-indicator ' + (p.sensitivity.stable ? 'stable' : 'unstable') + '">' + (p.sensitivity.stable ? '小动一下不会翻' : '小动一下会翻 ⚠') + '</span>';
  host.innerHTML =
    '<div class="decision-banner">' +
      '<div style="font-size: 10px; letter-spacing: 0.2em; color: var(--gold); text-transform: uppercase;">系统给你的建议 · ' + new Date().toISOString().slice(0,10) + '</div>' +
      '<div class="decision-winner">看下来，<span class="highlight">' + (p.winner.letter + (p.winner.name ? ' · ' + p.winner.name : '')) + '</span> 更适合你 ' + stabPill + '</div>' +
      '<div class="decision-sub">' + p.recommendation + '</div>' +
      '<div class="decision-actions">' +
        '<div class="decision-stat"><span class="decision-stat-label">' + p.winner.letter + ' 的分</span><span class="decision-stat-val">' + p.winner.finalScore.toFixed(2) + '</span></div>' +
        '<div class="decision-stat"><span class="decision-stat-label">跟第二名差</span><span class="decision-stat-val">' + (p.gap >= 0 ? '+' : '') + p.gap.toFixed(2) + '</span></div>' +
        '<div class="decision-stat"><span class="decision-stat-label">把握有多大</span><span class="decision-stat-val ' + p.recColor + '">' + (p.confidence * 100).toFixed(0) + '%</span></div>' +
        '<div class="decision-stat"><span class="decision-stat-label">自检触发</span><span class="decision-stat-val ' + (p.bias.guardRail ? 'red' : p.bias.alert ? 'amber' : 'green') + '">' + (p.bias.warn + p.bias.alert) + ' / ' + p.bias.rated + '</span></div>' +
        '<div class="decision-stat"><span class="decision-stat-label">现在该</span><span class="decision-stat-val ' + p.recColor + '">' + (p.recColor === 'green' ? '行动' : p.recColor === 'amber' ? '再等等' : '暂停') + '</span></div>' +
      '</div>' +
    '</div>';
}

function setDashRoom(n, filled, total) {
  const barCells = document.querySelectorAll('#dash-r' + n + '-bar span');
  const ratio = filled / total;
  barCells.forEach((c, i) => c.classList.toggle('on', i < Math.round(ratio * barCells.length)));
  setText('dash-r' + n + '-val', filled + ' / ' + total);
  const pill = document.getElementById('dash-r' + n + '-pill');
  if (pill) {
    pill.classList.remove('amber');
    let text = 'PENDING';
    if (ratio >= 0.85) text = 'COMPLETE';
    else if (ratio >= 0.4) { text = 'IN PROGRESS'; pill.classList.add('amber'); }
    pill.innerHTML = '<span class="dot-inline"></span>' + text;
  }
}
