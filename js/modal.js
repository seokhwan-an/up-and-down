// 모달 열기/닫기 및 값 채우기
export let closeSellModal = () => {};

export function initSellModal() {
  const sellBtn = document.getElementById('sellBtn');
  const sellModal = document.getElementById('sellModal');
  const sellDateEl = document.getElementById('sellDate');
  const sellScoreEl = document.getElementById('sellScore');
  const hintDate = document.getElementById('hintDate');
  const hintValue = document.getElementById('hintValue');

  function openSellModal() {
    const date = (hintDate?.textContent || '').trim();
    const value = (hintValue?.textContent || '').trim();
    sellDateEl.textContent = date || '—';
    sellScoreEl.textContent = value || '—';
    sellModal.classList.add('show');
    sellModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    sellModal.querySelector('.modal__panel')?.focus();
  }

  closeSellModal = function () {
    sellModal.classList.remove('show');
    sellModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  sellBtn?.addEventListener('click', openSellModal);
  sellModal?.addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') closeSellModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sellModal?.classList.contains('show')) {
      closeSellModal();
    }
  });
}
