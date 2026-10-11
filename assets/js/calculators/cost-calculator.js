/* Extracted from index.html L1059-1102 + L1272-1288. Totals + collection gate. */
import { getTodayDate } from '../utils/date-helpers.js';
import { COLLECTION_PASSWORD } from '../config/auth-config.js';

function readHistory() {
  return JSON.parse(localStorage.getItem('labReportsHistory')) || [];
}

function sumWhere(pred) {
  let total = 0;
  readHistory().forEach(item => {
    if (pred(item) && item.testCost && item.testCost !== 'Not specified' && !isNaN(parseFloat(item.testCost))) {
      total += parseFloat(item.testCost);
    }
  });
  return total;
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
  if (!document.getElementById('todayTotal')) return;
  document.getElementById('todayTotal').innerText = `₹${getTodayTotal()}`;
  document.getElementById('todayCashTotal').innerText = `₹${getTodayCashTotal()}`;
  document.getElementById('todayOnlineTotal').innerText = `₹${getTodayOnlineTotal()}`;
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

