/* Extracted from index.html L2900-2932 — refactored to clean UI modals. */
import { INVENTORYUPDATE_PASSWORD } from '../config/auth-config.js';
import { getTubeCounts, setTubeCounts, getKitCounts, setKitCounts, updateTubeCountsDisplay, updateKitCountsDisplay } from '../state/inventory-state.js';
import { renderStatistics } from './stats-service.js';

export function openInventoryPasswordModal() {
  const modal = document.getElementById('inventoryPasswordModal');
  const input = document.getElementById('inventoryPasswordInput');
  const error = document.getElementById('inventoryPasswordError');
  if (modal) {
    modal.style.display = 'flex';
    if (error) error.style.display = 'none';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }
  }
}

export function closeInventoryPasswordModal() {
  const modal = document.getElementById('inventoryPasswordModal');
  const input = document.getElementById('inventoryPasswordInput');
  const error = document.getElementById('inventoryPasswordError');
  if (modal) modal.style.display = 'none';
  if (input) input.value = '';
  if (error) error.style.display = 'none';
}

export function submitInventoryPassword() {
  const input = document.getElementById('inventoryPasswordInput');
  const error = document.getElementById('inventoryPasswordError');
  if (input && input.value === INVENTORYUPDATE_PASSWORD) {
    closeInventoryPasswordModal();
    openUpdateInventoryModal();
  } else {
    if (error) error.style.display = 'block';
    if (input) {
      input.focus();
      input.select();
    }
  }
}

export function openUpdateInventoryModal() {
  const modal = document.getElementById('updateInventoryModal');
  const error = document.getElementById('inventoryEditError');
  const tubeCounts = getTubeCounts();
  const kitCounts = getKitCounts();

  const purpleInput = document.getElementById('invPurpleTubes');
  const redInput = document.getElementById('invRedTubes');
  const typhoidInput = document.getElementById('invTyphoidKits');
  const malariaInput = document.getElementById('invMalariaKits');

  if (purpleInput) purpleInput.value = tubeCounts.purple;
  if (redInput) redInput.value = tubeCounts.red;
  if (typhoidInput) typhoidInput.value = kitCounts.typhoid;
  if (malariaInput) malariaInput.value = kitCounts.malaria;

  if (error) error.style.display = 'none';
  if (modal) {
    modal.style.display = 'flex';
    if (purpleInput) setTimeout(() => purpleInput.focus(), 50);
  }
}

export function closeUpdateInventoryModal() {
  const modal = document.getElementById('updateInventoryModal');
  const error = document.getElementById('inventoryEditError');
  if (modal) modal.style.display = 'none';
  if (error) error.style.display = 'none';
}

export function saveInventoryChanges() {
  const error = document.getElementById('inventoryEditError');
  const purpleVal = parseInt(document.getElementById('invPurpleTubes')?.value);
  const redVal = parseInt(document.getElementById('invRedTubes')?.value);
  const typhoidVal = parseInt(document.getElementById('invTyphoidKits')?.value);
  const malariaVal = parseInt(document.getElementById('invMalariaKits')?.value);

  if (isNaN(purpleVal) || purpleVal < 0 ||
      isNaN(redVal) || redVal < 0 ||
      isNaN(typhoidVal) || typhoidVal < 0 ||
      isNaN(malariaVal) || malariaVal < 0) {
    if (error) {
      error.textContent = 'Please enter valid positive numbers for all inventory quantities.';
      error.style.display = 'block';
    }
    return;
  }

  setTubeCounts(purpleVal, redVal);
  setKitCounts(typhoidVal, malariaVal);
  updateTubeCountsDisplay();
  updateKitCountsDisplay();

  const statsModal = document.getElementById('statisticsModal');
  if (statsModal && statsModal.style.display === 'block') {
    renderStatistics();
  }

  closeUpdateInventoryModal();
}

export function updateTubeInventoryWithPassword() {
  openInventoryPasswordModal();
}

