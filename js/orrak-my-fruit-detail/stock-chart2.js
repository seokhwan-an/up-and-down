/*!
 * OY Stock-like Chart – grow → compress
 * - 처음엔 오른쪽으로 자라남
 * - 오른쪽 끝에 닿으면 왼쪽은 고정, x축을 재스케일하며 전체가 점점 압축
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

    // elements
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

    // constants
    const W = svg.viewBox.baseVal?.width || 320;
    const H = svg.viewBox.baseVal?.height || 170;
    const TOP = 12, BOTTOM = 12;
    const N = opts.pointsCount ?? 40;           // 오른쪽 끝에 닿기까지 사용할 분할 수
    const TICK_MS = opts.tickMs ?? 1500;
    const MIN = opts.min ?? 6000;
    const MAX = opts.max ?? 9000;

    // 기준(증감 계산용)
    let BASE = 4000;
    if (deltaText?.dataset?.base) BASE = Number(deltaText.dataset.base) || 4000;
    if (typeof opts.base === "number") BASE = opts.base;

    // 값 변환(Y)
    const mapY = (v)=>{
      const t = (v - MIN) / (MAX - MIN);
      return H - BOTTOM - t * (H - TOP - BOTTOM);
    };

    // 초기 데이터: 왼쪽 앵커 1개 + 다음 점 1개(라인 보이도록)
    const start = 7500;
    const randomStep = (prev)=>{
      const step = (Math.random()*220 + 30) * (Math.random()<.6 ? 1 : -1);
      return clamp(prev + step, MIN, MAX);
    };
    const data = [start, randomStep(start)];
    let progress = 2; // 현재 그려진 점 개수(= data.length)

    // 리스트 행 갱신(있을 때만)
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

    // 경로 생성
    function buildPaths(){
      const m = progress;                  // 현재 그려야 할 점 개수
      const isGrowPhase = (progress <= N); // grow 단계 여부
      const dx = isGrowPhase ? (W/(N-1)) : (W/(m-1));
      const lastX = isGrowPhase ? dx*(m-1) : W;

      let d = `M 0 ${mapY(data[0])}`;
      for(let i=1;i<m;i++) d += ` L ${dx*i} ${mapY(data[i])}`;

      const areaTop = d + ` L ${lastX} ${H} L 0 ${H} Z`;
      return { line:d, area:areaTop, lastX, lastIdx:m-1 };
    }

    // 증감 문구
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
      const {line, area, lastX, lastIdx} = buildPaths();
      pLine.setAttribute("d", line);
      pArea.setAttribute("d", area);

      const x = lastX;
      const y = mapY(data[lastIdx]);
      marker.setAttribute("cx", x);
      marker.setAttribute("cy", y);

      // 말풍선/포인트
      hintDate.textContent  = todayLabel();
      hintValue.textContent = fmt(data[lastIdx]);

      const rect = svg.getBoundingClientRect();
      const rx = rect.width / W, ry = rect.height / H;
      const hintW = hint.offsetWidth || 120;
      const hintH = hint.offsetHeight || 40;
      const left = Math.min(Math.max(x*rx, hintW/2+6), rect.width - hintW/2 - 6);
      const top  = Math.min(Math.max(y*ry + 10, 6), rect.height - hintH - 6);
      hint.style.left = `${left}px`;
      hint.style.top  = `${top}px`;

      if (pointText) pointText.textContent = `${fmt((data[lastIdx]/66)|0)}P`;
      updateDelta(data[lastIdx]);
      updateListRows(data[lastIdx]);
    }

    function tick(){
      // 항상 "새 점"을 오른쪽에 추가
      const next = randomStep(data[data.length-1]);
      data.push(next);
      progress = data.length; // 진행도 증가

      // 진행 단계별 렌더:
      // - progress <= N : 오른쪽으로 자라남
      // - progress >  N : x 간격을 재계산하여 전체를 가로폭에 맞게 압축
      render();
    }

    render();
    let timer = setInterval(tick, TICK_MS);

    // 컨트롤 API
    window.OY_STOCK_CHART = {
      start(){ if(!timer) timer = setInterval(tick, TICK_MS); },
      stop(){ clearInterval(timer); timer = null; },
      setSpeed(ms){ clearInterval(timer); timer = setInterval(tick, ms||TICK_MS); },
      setBase(val){ BASE = Number(val)||BASE; render(); },
      reset(){ data.length = 2; data[0]=start; data[1]=randomStep(start); progress=2; render(); }
    };

    document.addEventListener("visibilitychange", ()=>{
      if(document.hidden){ clearInterval(timer); timer = null; }
      else if(!timer){ timer = setInterval(tick, TICK_MS); }
    });
    window.addEventListener("resize", render);
  }

  ready(()=> initOyStockChart(window.OY_STOCK_CHART_OPTIONS || {}));
})();
