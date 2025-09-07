import { closeSellModal } from './modal.js';

// '보유 수량' <strong> 찾기
function getHoldQtyStrong() {
  const kvs = document.querySelectorAll('.panel .kv');
  for (const kv of kvs) {
    const label = kv.querySelector('.label')?.textContent?.trim();
    if (label === '보유 수량') {
      return kv.querySelector('strong');
    }
  }
  return null;
}

export function initSellFeature() {
  const confirmSellBtn = document.querySelector('#sellModal .modal__actions .btn.primary');
  confirmSellBtn?.addEventListener('click', () => {
    const qtyStrong = getHoldQtyStrong();
    if (qtyStrong) {
      const now = parseInt(qtyStrong.textContent.replace(/[^\d]/g, ''), 10) || 0;
      const next = Math.max(0, now - 1);  // 음수 방지
      qtyStrong.textContent = `${next.toLocaleString()} 열매`;
    }
    closeSellModal?.();
  });
}
