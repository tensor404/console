// 共享状态 · 跨页面通过 localStorage 同步
const STORAGE_KEY = 'console-state-v3';
const defaultState = {
  'dim-count': 9, 'kw-thresh': 70, 'behav-weight': 150, 'bias-detect': true,
  'urgent-thresh': 7, 'delib-days': 21, 'route-strict': 2, 'stakeholder': true,
  'fake-sens': 2, 'probe-count': 3, 'binary-break': true, 'hidden-probe': true, 'value-conflict': true,
  'top1-weight': 150, 'top23-weight': 120, 'score-dims': 6, 'sens-level': 2,
  'check-intuition': true, 'check-fear': true, 'check-conform': true,
  'check-sunk': true, 'check-script': true, 'check-thresh': 2,
  'action-spec': 3, 'callback-int': 2, 'future-snap': true, 'auto-archive': true, 'feedback-loop': true
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

document.addEventListener('DOMContentLoaded', () => {
  highlightNav();
  syncControls();
  attachListeners();
  renderRadar();
  refresh();
});
