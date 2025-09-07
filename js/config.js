// 상수/설정
export const WIDTH = 320;
export const HEIGHT = 140;
export const N = 32;                // 보이는 포인트 개수
export const Y_MIN = 30;
export const Y_MAX = 110;
export const UPDATE_INTERVAL = 1500; // 1.5초
export let ANIM_MS = 1200;          // 애니메이션 시간(ms) — 라이브 바인딩

// 접근성: 사용자가 '동작 줄이기'를 켜면 애니메이션 시간 단축
export function applyReducedMotion() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ANIM_MS = 300;
  }
}
