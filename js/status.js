// js/status.js
function formatKSTNow() {
  // KST 기준 HH:mm:ss
  const parts = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).formatToParts(new Date());
  const get = (t) => parts.find(p => p.type === t)?.value || '00';
  return `${get('hour')}:${get('minute')}`;
}

function updateOnce() {
  // 우선 #statusTime, 없으면 .status > div:first-child
  const el = document.getElementById('statusTime')
          || document.querySelector('.status > div:first-child');
  if (el) el.textContent = formatKSTNow();
}

export function initStatusClock() {
  updateOnce(); // 즉시 1회
  // 다음 "초" 경계에 맞춰 시작 → 매초 갱신
  const msToNextSecond = 1000 - (Date.now() % 1000);
  setTimeout(() => {
    updateOnce();
    setInterval(updateOnce, 1000);
  }, msToNextSecond);
}
