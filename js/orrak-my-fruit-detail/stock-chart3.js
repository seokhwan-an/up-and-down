/*!
 * OY Stock-like Chart – 4초에 오른쪽 끝 도달 → 이후 전체 압축 진행
 * 필수 ID: oyChart, oyAreaPath, oyLinePath, oyMarker
 * 선택 ID: oyHint, oyHintDate, oyHintValue, oyPoint, deltaText
 */
(function () {
  'use strict';

  const onReady = (fn)=>{
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };
  const clamp = (v,a,b)=>Math.min(Math.max(v,a),b);
  const fmt   = (n)=>Math.round(n).toLocaleString('ko-KR');
  const todayLabel = ()=>{
    const d = new Date();
    return `${d.getMonth()+1}월 ${d.getDate()}일`;
  };

  function initOyStockChart(opts = {}) {
    const ids = Object.assign({
      svg:'oyChart', area:'oyAreaPath', line:'oyLinePath', marker:'oyMarker',
      hint:'oyHint', hintDate:'oyHintDate', hintValue:'oyHintValue',
      pointText:'oyPoint', deltaText:'deltaText'
    }, opts.ids || {});

    const svg    = document.getElementById(ids.svg);
    const pArea  = document.getElementById(ids.area);
    const pLine  = document.getElementById(ids.line);
    const marker = document.getElementById(ids.marker);
    if (!svg || !pArea || !pLine || !marker) {
      console.error('[OY] 필수 SVG 요소 누락:', {svg:!!svg, area:!!pArea, line:!!pLine, marker:!!marker});
      return;
    }

    // 선택 요소(없어도 동작)
    const hint      = document.getElementById(ids.hint);
    const hintDate  = document.getElementById(ids.hintDate);
    const hintValue = document.getElementById(ids.hintValue);
    const pointText = document.getElementById(ids.pointText);
    const deltaText = document.getElementById(ids.deltaText);

    // ===== 옵션/상수 =====
    const W = svg.viewBox.baseVal?.width  || 320;
    const H = svg.viewBox.baseVal?.height || 170;
    const TOP = 12, BOTTOM = 12;

    const N           = Number(opts.pointsCount ?? 40);
    const DURATION_MS = Number(opts.durationMs  ?? 4000);  // 4초 고정
    const COMPRESS_MS = Number(opts.compressMs  ?? 120);

    const MIN   = Number(opts.min ?? 6000);
    const MAX   = Number(opts.max ?? 9000);
    const RANGE = MAX - MIN;

    const VOL_PCT = Math.max(0.05, Math.min(Number(opts.volPct ?? 0.7), 1));

    // 증감 기준
    let BASE = 4000;
    if (deltaText && deltaText.dataset && typeof deltaText.dataset.base !== 'undefined') {
      BASE = Number(deltaText.dataset.base) || BASE;
    }
    if (typeof opts.base === 'number') BASE = opts.base;

    // ===== 유틸 =====
    const mapY = (v)=>{
      const t = (v - MIN) / RANGE;
      return H - BOTTOM - t * (H - TOP - BOTTOM);
    };
    const randomStep = (prev)=>{
      const step = (Math.random() - 0.5) * RANGE * VOL_PCT;
      return clamp(prev + step, MIN, MAX);
    };
    // 값 → 포인트(0~1 → 20~220 범위; 중앙값 ~120P)
    const valueToPoints = (v)=>{
      const t = (v - MIN) / RANGE;           // 0~1
      return Math.round(20 + 200 * t);       // 20~220
    };

    // 초기 데이터(왼쪽 앵커 + 다음 점)
    const start = (MIN + MAX) / 2;
    const data = [start, randomStep(start)];
    let progress = data.length; // 2부터 시작

    // ===== UI 보조 =====
    function updateDelta(v){
      if(!deltaText) return;
      const diff = Math.round(v - BASE);
      const pct  = BASE ? (diff/BASE)*100 : 0;
      deltaText.textContent = `${diff>0?'+':''}${fmt(diff)}점 (${pct>0?'+':''}${pct.toFixed(1)}%)`;
      deltaText.classList.toggle('up', diff>=0);
      deltaText.classList.toggle('down', diff<0);
    }

    function updateListRows(v){
      document.querySelectorAll('.js-oy-row').forEach(row=>{
        const base = Number(row.dataset.base || 4000);
        const diff = Math.round(v - base);
        const pct  = base ? (diff/base)*100 : 0;

        const ptsEl  = row.querySelector('.js-pts');
        const diffEl = row.querySelector('.js-diff');
        const pctEl  = row.querySelector('.js-pct');
        const chgEl  = row.querySelector('.chg');

        if (ptsEl)  ptsEl.textContent  = Math.round(v).toLocaleString('ko-KR');
        if (diffEl) diffEl.textContent = `${diff>0?'+':''}${Math.abs(diff).toLocaleString('ko-KR')}점`;
        if (pctEl)  pctEl.textContent  = `(${diff>0?'+':''}${Math.abs(pct).toFixed(1)}%)`;

        if (chgEl){
          chgEl.classList.toggle('up',   diff >= 0);
          chgEl.classList.toggle('down', diff < 0);
        }
      });
    }

    // ===== 경로 생성 (grow → compress) =====
    function buildPaths(){
      const m = progress;
      const grow = (m <= N);
      const dx = grow ? (W/(N-1)) : (W/(m-1));
      const lastX = grow ? dx*(m-1) : W;

      let d = `M 0 ${mapY(data[0])}`;
      for (let i=1;i<m;i++) d += ` L ${dx*i} ${mapY(data[i])}`;
      const area = d + ` L ${lastX} ${H} L 0 ${H} Z`;
      return { line:d, area, lastX, lastIdx:m-1 };
    }

    function render(){
      const {line, area, lastX, lastIdx} = buildPaths();
      pLine.setAttribute('d', line);
      pArea.setAttribute('d', area);

      const x = lastX, y = mapY(data[lastIdx]);
      marker.setAttribute('cx', x);
      marker.setAttribute('cy', y);

      if (hint && hintDate && hintValue){
        hintDate.textContent  = todayLabel();
        hintValue.textContent = fmt(data[lastIdx]);

        const rect = svg.getBoundingClientRect();
        const rx = rect.width / W, ry = rect.height / H;
        const hintW = hint.offsetWidth || 120, hintH = hint.offsetHeight || 40;
        hint.style.left = `${Math.min(Math.max(x*rx, hintW/2+6), rect.width - hintW/2 - 6)}px`;
        hint.style.top  = `${Math.min(Math.max(y*ry + 10, 6), rect.height - hintH - 6)}px`;
      }
      if (pointText){
        const p = valueToPoints(data[lastIdx]);
        pointText.textContent = `${p.toLocaleString('ko-KR')}P`;
      }

      updateDelta(data[lastIdx]);
      updateListRows(data[lastIdx]);
    }

    // ===== 4초 정확히: RAF 기반 grow → 이후 interval 기반 compress =====
    let rafId = null, startTime = null, compressTimer = null;

    function growStep(now){
      if (startTime === null) startTime = now;

      const t = Math.min(1, (now - startTime) / DURATION_MS);  // 0~1
      const targetProgress = 2 + Math.floor((N - 2) * t);      // 2 → N

      while (progress < targetProgress) {
        data.push( randomStep(data[data.length - 1]) );
        progress = data.length;
      }

      render();

      if (t < 1) {
        rafId = requestAnimationFrame(growStep);
      } else {
        // 마지막 프레임 보정
        while (progress < N) {
          data.push(randomStep(data[data.length-1]));
          progress = data.length;
        }
        render();
        startCompress();
      }
    }

    function startCompress(){
      if (compressTimer) return;
      compressTimer = setInterval(()=>{
        data.push( randomStep(data[data.length - 1]) );
        progress = data.length;

        // 너무 길어지면 간단 다운샘플(2개 중 1개 버림)
        if (data.length > 300){
          const keep = [data[0]];
          for (let i=1;i<data.length-1;i+=2) keep.push(data[i]);
          keep.push(data[data.length-1]);
          data.length = 0;
          Array.prototype.push.apply(data, keep);
          progress = data.length;
        }
        render();
      }, COMPRESS_MS);
    }

    // 시작
    render();
    rafId = requestAnimationFrame(growStep);

    // 공개 API(선택)
    window.OY_STOCK_CHART = {
      start(){
        if (progress < N && !rafId) {
          rafId = requestAnimationFrame(growStep);
        }
        if (progress >= N && !compressTimer) {
          startCompress();
        }
      },
      stop(){
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        if (compressTimer) {
          clearInterval(compressTimer);
          compressTimer = null;
        }
      },
      setBase(v){ BASE = Number(v)||BASE; render(); },
      setSpeed(ms){
        if (compressTimer) {
          clearInterval(compressTimer);
          compressTimer = null;
        }
        const m = Math.max(16, Number(ms)||COMPRESS_MS);
        compressTimer = setInterval(()=>{
          data.push(randomStep(data[data.length-1]));
          progress = data.length;
          render();
        }, m);
      },
      reset(){
        if (rafId) { cancelAnimationFrame(rafId); rafId=null; }
        if (compressTimer) { clearInterval(compressTimer); compressTimer=null; }
        data.length=0; data.push(start, randomStep(start)); progress=2; startTime=null; render();
        rafId = requestAnimationFrame(growStep);
      }
    };

    // 탭 전환 안정화
    document.addEventListener('visibilitychange', ()=>{
      if (document.hidden){
        if (rafId) { cancelAnimationFrame(rafId); rafId=null; }
        if (compressTimer) { clearInterval(compressTimer); compressTimer=null; }
      } else {
        if (progress < N && !rafId) {
          rafId = requestAnimationFrame(growStep);
        } else if (progress >= N && !compressTimer) {
          startCompress();
        }
      }
    });

    window.addEventListener('resize', render);

    // 진단: 300ms 후에도 진행 안 하면 경고
    setTimeout(()=>{
      if (progress === 2) {
        console.warn('[OY] 그래프가 진행되지 않습니다. (ID 또는 콘솔 오류 확인)');
      }
    }, 300);
  }

  onReady(()=> {
    try { initOyStockChart(window.OY_STOCK_CHART_OPTIONS || {}); }
    catch (e) { console.error('[OY] init error:', e); }
  });
  window.addEventListener('load', ()=>{
    if (!window.OY_STOCK_CHART) {
      try { initOyStockChart(window.OY_STOCK_CHART_OPTIONS || {}); }
      catch (e) { console.error('[OY] late init error:', e); }
    }
  });
})();
