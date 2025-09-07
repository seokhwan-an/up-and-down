import { applyReducedMotion } from './config.js';
import { startTrendUpdates } from './chart.js';
import { initSellModal } from './modal.js';
import { initSellFeature } from './sell.js';
import { initStatusClock } from './status.js';

window.addEventListener('DOMContentLoaded', () => {
  applyReducedMotion();
  startTrendUpdates();
  initSellModal();
  initSellFeature();
  initStatusClock();
});