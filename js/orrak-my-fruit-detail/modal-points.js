(function(){
  'use strict';

  // 현재 화면의 포인트(#oyPoint "120P")에서 숫자만 추출
  function getCurrentPointTotal(){
    const t = document.getElementById('oyPoint')?.textContent || '0';
    const m = t.match(/([\d,]+)/);
    return m ? parseInt(m[1].replace(/,/g,''), 10) : 0;
  }

  // 총합 total을 3개의 양의 정수로 랜덤 분할 (합 == total)
  function splitInto3(total){
    if (total <= 0) return [0,0,0];
    if (total < 3)  return [total,0,0];
    let r1 = 1 + Math.floor(Math.random()*(total-2));
    let r2 = 1 + Math.floor(Math.random()*(total-2));
    while (r2 === r1) r2 = 1 + Math.floor(Math.random()*(total-2));
    const a = Math.min(r1, r2);
    const b = Math.max(r1, r2);
    return [a, b-a, total-b];
  }

  // 교환 모달의 3개 포인트 <b>에 채우기
  function updateLotPoints(){
    const total = getCurrentPointTotal();
    const parts = splitInto3(total); // [p1,p2,p3]
    const targets = document.querySelectorAll('.oy-lot-list .lot__point b');
    targets.forEach((el, i) => {
      const v = parts[i] ?? 0;
      el.textContent = v.toLocaleString('ko-KR') + 'P';
    });
  }

  // 선택된 라디오의 포인트값 얻기
  function getSelectedLotPoints(){
    const checked = document.querySelector('.oy-lot-list .lot__radio:checked');
    if (!checked) return 0;
    const b = checked.nextElementSibling?.querySelector('.lot__point b');
    if (!b) return 0;
    const m = b.textContent.match(/([\d,]+)/);
    return m ? parseInt(m[1].replace(/,/g,''), 10) : 0;
  }

  // 성공 모달 제목 세팅
  function setSuccessTitle(val){
    const title = document.getElementById('oySuccessTitle');
    if (title) title.textContent = `${(val||0).toLocaleString('ko-KR')}P 획득!`;
  }

  // “OY 포인트 전환” 열 때 3분할 값 채우기
  const openLabel = document.querySelector('label.btn--primary[for="oyModal"]');
  if (openLabel) openLabel.addEventListener('click', updateLotPoints);

  const openChk = document.getElementById('oyModal');
  if (openChk) openChk.addEventListener('change', (e)=>{
    if (e.target.checked) updateLotPoints();
  });

  // “OY 포인트로 바꾸기” 클릭 시 선택된 라디오 포인트를 성공 모달에 반영
  const submitLabel = document.querySelector('label.oy-modal__cta[for="oySuccess"]');
  if (submitLabel) submitLabel.addEventListener('click', ()=>{
    setSuccessTitle(getSelectedLotPoints());
  });

  // 성공 모달이 다른 방법으로 켜져도 값 보정
  const successChk = document.getElementById('oySuccess');
  if (successChk) successChk.addEventListener('change', (e)=>{
    if (e.target.checked) setSuccessTitle(getSelectedLotPoints());
  });
})();
