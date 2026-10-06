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
  document.getElementById('todayTotal').innerText = `₹${getTodayTotal()}`;
  document.getElementById('todayCashTotal').innerText = `₹${getTodayCashTotal()}`;
  document.getElementById('todayOnlineTotal').innerText = `₹${getTodayOnlineTotal()}`;
}

// L1272 — password gate for Today's Collection blur (v1 unmapped, fixed here)
export function toggleCollection() {
  const content = document.getElementById('collectionContent');
  const btn = document.getElementById('toggleBtn');
  if (content.classList.contains('blurred')) {
    const password = prompt('Enter password to view collection:');
    if (password === COLLECTION_PASSWORD) {
      content.classList.remove('blurred');
      btn.textContent = '✔ Hide';
    } else if (password !== null) {
      alert('Incorrect password');
    }
  } else {
    content.classList.add('blurred');
    btn.textContent = '✖ Show';
  }
}
