/*!
 * OY Stock-like Chart (vanilla JS)
 * - 흐르는 선형 차트 + 말풍선/증감 문구 자동 업데이트
 */
(function () {
  const ready = (fn)=> document.readyState!=="loading" ? fn() : document.addEventListener("DOMContentLoaded", fn);
  const clamp = (v,a,b)=>Math.min(Math.max(v,a),b);
  const fmt   = (n)=>Math.round(n).toLocaleString("ko-KR");
  const todayLabel = ()=>{ const d=new Date(); return `${d.getMonth()+1}월 ${d.getDate()}일`; };

  function initOyStockChart(opts = {}){
    const ids = Object.assign({
      root:"oyStockChart", svg:"oyChart", area:"oyAreaPath", line:"oyLinePath",
      marker:"oyMarker", hint:"oyHint", hintDate:"oyHintDate", hintValue:"oyHintValue",
      pointText:"oyPoint", deltaText:"deltaText"
    }, opts.ids || {});

    // 엘리먼트
    const root = document.getElementById(ids.root);
    const svg  = document.getElementById(ids.svg);
    const pArea = document.getElementById(ids.area);
    const pLine = document.getElementById(ids.line);
    const marker = document.getElementById(ids.marker);
    const hint = document.getElementById(ids.hint);
    const hintDate = document.getElementById(ids.hintDate);
    const hintValue = document.getElementById(ids.hintValue);
    const pointText = document.getElementById(ids.pointText);
    const deltaText = document.getElementById(ids.deltaText);
    if(!root || !svg || !pArea || !pLine || !marker || !hint || !hintDate || !hintValue) return;

    // 옵션/상수
    const W = svg.viewBox.baseVal?.width || 320;
    const H = svg.viewBox.baseVal?.height || 170;
    const TOP = 12, BOTTOM = 12;
    const N = opts.pointsCount ?? 40;           // 보이는 포인트 개수
    const TICK_MS = opts.tickMs ?? 1500;        // 갱신 주기
    const MIN = opts.min ?? 6000;
    const MAX = opts.max ?? 9000;

    // 기준점(기본 4000) — data-base 또는 옵션으로 설정 가능
    let BASE = 4000;
    if (deltaText?.dataset?.base) BASE = Number(deltaText.dataset.base) || 4000;
    if (typeof opts.base === "number") BASE = opts.base;

    // 날짜
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (N - 1));
    const dates = Array.from({length:N}, (_,i)=>{ const d=new Date(baseDate); d.setDate(baseDate.getDate()+i); return d; });

    // ★ 리스트 행들 갱신
    function updateListRows(currentVal){
    document.querySelectorAll('.js-oy-row').forEach(row=>{
    const base = Number(row.dataset.base || 4000);
    const diff = Math.round(currentVal - base);
    const pct  = base ? (diff / base) * 100 : 0;

    const ptsEl  = row.querySelector('.js-pts');
    const diffEl = row.querySelector('.js-diff');
    const pctEl  = row.querySelector('.js-pct');
    const chgEl  = row.querySelector('.chg');

    if (ptsEl)  ptsEl.textContent  = Math.round(currentVal).toLocaleString('ko-KR');
    if (diffEl) diffEl.textContent = `${diff>0?'+':''}${Math.abs(diff).toLocaleString('ko-KR')}점`;
    if (pctEl)  pctEl.textContent  = `(${diff>0?'+':''}${Math.abs(pct).toFixed(1)}%)`;

    if (chgEl){
      chgEl.classList.toggle('up',   diff >= 0);
      chgEl.classList.toggle('down', diff < 0);
    }
    });
    }


    // 초기 데이터(랜덤 워크) — 자기참조 없이 순차 생성
    const data = [];
    for(let i=0;i<N;i++){
      const prev = i ? data[i-1] : 7500;
      const drift = (Math.random()-0.5)*250;   // -125 ~ +125
      data.push(clamp(prev + drift, MIN, MAX));
    }

    // 좌표 변환
    const mapY = (v)=>{
      const t = (v - MIN) / (MAX - MIN);
      return H - BOTTOM - t * (H - TOP - BOTTOM);
    };

    const buildPaths = (values)=>{
      const dx = W / (values.length - 1);
      let d = `M 0 ${mapY(values[0])}`;
      for(let i=1;i<values.length;i++) d += ` L ${dx*i} ${mapY(values[i])}`;
      const areaTop = d + ` L ${W} ${H} L 0 ${H} Z`;
      return { line:d, area:areaTop };
    };

    // 증감 문구 업데이트
    function updateDelta(currentVal){
      if(!deltaText) return;
      const diff = Math.round(currentVal - BASE);
      const pct  = BASE ? (diff / BASE) * 100 : 0;
      const diffStr = `${diff>0?'+':''}${fmt(diff)}점`;
      const pctStr  = `${pct>0?'+':''}${pct.toFixed(1)}%`;
      deltaText.textContent = `${diffStr} (${pctStr})`;
      deltaText.classList.toggle("up", diff >= 0);
      deltaText.classList.toggle("down", diff < 0);
    }

    function render(){
      const {line, area} = buildPaths(data);
      pLine.setAttribute("d", line);
      pArea.setAttribute("d", area);

      const lastIdx = data.length - 1;
      const x = W, y = mapY(data[lastIdx]);
      marker.setAttribute("cx", x);
      marker.setAttribute("cy", y);

      // 말풍선 내용/위치
      hintDate.textContent  = todayLabel();               // ← 오늘 날짜 고정
      hintValue.textContent = fmt(data[lastIdx]);

      const rect = svg.getBoundingClientRect();
      const rx = rect.width / W, ry = rect.height / H;

      const hintW = hint.offsetWidth || 120;
      const hintH = hint.offsetHeight || 40;
      const left = Math.min(Math.max(x*rx, hintW/2+6), rect.width - hintW/2 - 6);
      const top  = Math.min(Math.max(y*ry, 6), rect.height - hintH - 6);  // 아래 배치 대비 클램프
      hint.style.left = `${left}px`;
      hint.style.top  = `${top}px`;

      // 상단 포인트(선택)
      if (pointText) pointText.textContent = `${fmt((data[lastIdx]/66)|0)}P`;

      // 증감 문구 동기화
      updateDelta(data[lastIdx]);
      // 마지막 값으로 리스트 갱신
      updateListRows(data[lastIdx]);
    }

    function tick(){
      const last = data[data.length-1];
      const trend = Math.random()<.6 ? 1 : -1;
      const step = (Math.random()*220 + 30) * trend;
      const next = clamp(last + step, MIN, MAX);

      data.shift(); data.push(next);

      dates.shift();
      const d = new Date(dates[dates.length-1]); d.setDate(d.getDate()+1);
      dates.push(d);

      render();
    }

    render();
    let timer = setInterval(tick, TICK_MS);

    // API/보호
    window.OY_STOCK_CHART = {
      start(){ if(!timer) timer = setInterval(tick, TICK_MS); },
      stop(){ clearInterval(timer); timer = null; },
      setSpeed(ms){ clearInterval(timer); timer = setInterval(tick, ms||TICK_MS); },
      setBase(val){ BASE = Number(val)||BASE; render(); }   // 기준점 동적 변경
    };
    document.addEventListener("visibilitychange", ()=>{
      if(document.hidden){ clearInterval(timer); timer = null; }
      else if(!timer){ timer = setInterval(tick, TICK_MS); }
    });
    window.addEventListener("resize", render);
  }

  ready(()=> initOyStockChart(window.OY_STOCK_CHART_OPTIONS || {}));
})();
