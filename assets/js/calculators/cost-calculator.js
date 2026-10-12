import { getTodayDate } from '../utils/date-helpers.js';
import { COLLECTION_PASSWORD } from '../config/auth-config.js';
import { loadHistoryData } from '../state/storage.js';

function readHistory() {
  return loadHistoryData();
}

function sumWhere(pred) {
  let total = 0;
  readHistory().forEach(item => {
    if (pred(item) && item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) {
      total += parseFloat(item.testCost);
    }
  });
  return Number(total.toFixed(2));
}

// L1068
export function getTodayTotal() {
  const today = getTodayDate();
  return sumWhere(item => item.reportedDate === today);
}
// L1080
export function getTodayCashTotal() {
  const today = getTodayDate();
  return sumWhere(item => item.reportedDate === today && item.paymentMode === 'Cash');
}
// L1092
export function getTodayOnlineTotal() {
  const today = getTodayDate();
  return sumWhere(item => item.reportedDate === today && item.paymentMode === 'Online');
}

// L1059
export function updateTodayTotal() {
  const totalEl = document.getElementById('todayTotal');
  const dashTotal = document.getElementById('dashTodayTotal');
  if (!totalEl && !dashTotal) return;
  const total = getTodayTotal();
  const cash = getTodayCashTotal();
  const online = getTodayOnlineTotal();
  if (totalEl) totalEl.innerText = `₹${total.toFixed(2)}`;
  const cashEl = document.getElementById('todayCashTotal');
  if (cashEl) cashEl.innerText = `₹${cash.toFixed(2)}`;
  const onlineEl = document.getElementById('todayOnlineTotal');
  if (onlineEl) onlineEl.innerText = `₹${online.toFixed(2)}`;

  if (dashTotal) dashTotal.innerText = `₹${total.toFixed(2)}`;
  const dashCash = document.getElementById('dashTodayCash');
  if (dashCash) dashCash.innerText = `₹${cash.toFixed(2)}`;
  const dashOnline = document.getElementById('dashTodayOnline');
  if (dashOnline) dashOnline.innerText = `₹${online.toFixed(2)}`;
}

// Password modal controls for Today's Collection
export function openCollectionPasswordModal() {
  const modal = document.getElementById('collectionPasswordModal');
  const input = document.getElementById('collectionPasswordInput');
  const error = document.getElementById('collectionPasswordError');
  if (modal) {
    modal.style.display = 'flex';
    if (error) error.style.display = 'none';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }
  }
}

export function closeCollectionPasswordModal() {
  const modal = document.getElementById('collectionPasswordModal');
  const input = document.getElementById('collectionPasswordInput');
  const error = document.getElementById('collectionPasswordError');
  if (modal) modal.style.display = 'none';
  if (input) input.value = '';
  if (error) error.style.display = 'none';
}

export function submitCollectionPassword() {
  const input = document.getElementById('collectionPasswordInput');
  const error = document.getElementById('collectionPasswordError');
  const content = document.getElementById('collectionContent');
  const btn = document.getElementById('toggleBtn');
  
  if (input && input.value === COLLECTION_PASSWORD) {
    if (content) content.classList.remove('blurred');
    if (btn) btn.textContent = '✔ Hide';
    closeCollectionPasswordModal();
  } else {
    if (error) error.style.display = 'block';
    if (input) {
      input.focus();
      input.select();
    }
  }
}

// L1272 — password gate for Today's Collection blur
export function toggleCollection() {
  const content = document.getElementById('collectionContent');
  const btn = document.getElementById('toggleBtn');
  if (content && content.classList.contains('blurred')) {
    openCollectionPasswordModal();
  } else if (content && btn) {
    content.classList.add('blurred');
    btn.textContent = '✖ Show';
  }
}

