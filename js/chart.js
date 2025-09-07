import { WIDTH, HEIGHT, N, Y_MIN, Y_MAX, UPDATE_INTERVAL, ANIM_MS } from './config.js';
import { clamp, easeInOut, formatScore } from './utils.js';

// 내부값 → SVG y
const toY = (v) => {
  const t = (v - Y_MIN) / (Y_MAX - Y_MIN);
  return HEIGHT - t * HEIGHT;
};
const toPointsAttr = (arr) => {
  const dx = WIDTH / (arr.length - 1);
  return arr.map((v, i) => `${(i*dx).toFixed(2)},${toY(v).toFixed(2)}`).join(' ');
};
const randomSeries = (n, start = 80) => {
  const a = [start];
  for (let i = 1; i < n; i++) {
    const step = (Math.random()*2 - 1) * 10;    // -10 ~ 10
    a.push(clamp(a[i-1] + step, Y_MIN, Y_MAX));
  }
  return a;
};
const renderMiniBars = (wrapEl, arr) => {
  if (!wrapEl) return;
  wrapEl.innerHTML = '';
  const k = 0.5;
  const count = Math.min(16, arr.length);
  for (let i = 0; i < count; i++) {
    const h = Math.round(6 + Math.abs(arr[i] - 70) * k);
    const el = document.createElement('span');
    el.style.height = `${clamp(h, 6, 30)}px`;
    wrapEl.appendChild(el);
  }
};

export function startTrendUpdates() {
  const line = document.getElementById('trendLine');
  const miniBars = document.getElementById('miniBars');
  const hintValue = document.getElementById('hintValue');
  if (!line) return;

  const draw = (data) => {
    line.setAttribute('points', toPointsAttr(data));
    const last = data[data.length - 1];
    const score = Math.round(1600 + (last - Y_MIN) * 30);
    if (hintValue) hintValue.textContent = formatScore(score);
  };

  const tween = (oldData, newData, ms = ANIM_MS) => {
    let start = null;
    function frame(ts) {
      if (!start) start = ts;
      const t = clamp((ts - start) / ms, 0, 1);
      const k = easeInOut(t);
      const cur = oldData.map((v, i) => v + (newData[i] - v) * k);
      draw(cur);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  const nextPoint = (prev) => {
    const step = (Math.random()*2 - 1) * 12;
    return clamp(prev + step, Y_MIN, Y_MAX);
  };

  // 초기 렌더 & 주기 갱신
  let data = randomSeries(N);
  draw(data);
  renderMiniBars(miniBars, data);

  setInterval(() => {
    const old = data.slice();
    const newVal = nextPoint(data[data.length - 1]);
    data = old.slice(1).concat(newVal);
    tween(old, data);
    renderMiniBars(miniBars, data);
  }, UPDATE_INTERVAL);

  // 외부 수동 갱신 API
  window.pushTrendValue = (value) => {
    const pts = line.getAttribute('points');
    if (!pts) return;
    const ys = pts.split(' ').map(p => parseFloat(p.split(',')[1]));
    const current = ys.map(y => {
      const t = (HEIGHT - y) / HEIGHT;
      return Y_MIN + t * (Y_MAX - Y_MIN);
    });
    const old = current.slice();
    const newVal = clamp(value, Y_MIN, Y_MAX);
    const newData = old.slice(1).concat(newVal);
    tween(old, newData);
  };
}
