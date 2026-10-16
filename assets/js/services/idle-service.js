/**
 * assets/js/services/idle-service.js
 *
 * Inactivity Detection & Operational Privacy Lock Service.
 * - Monitors user movement (mouse, keyboard, touch, scroll) across all application pages.
 * - If inactive for 5 minutes (300,000 ms) on any non-dashboard page, redirects to dashboard.html with screen lock.
 * - In dashboard.html, displays full-screen privacy blur over the entire screen until user moves/types/touches.
 * - On interaction, triggers an immediate hard refresh (cache-busting reload) while keeping the 4 collection cards blurred until clicked.
 */

export const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const IDLE_LOCK_STORAGE_KEY = 'shc_idle_locked';
export const COLLECTION_BLUR_KEY = 'shc_collection_blurred';

let idleTimer = null;
let isFullBlurActive = false;

function isDashboardPage() {
  return !!document.getElementById('dashboardOverview');
}

export function blurCollectionCards() {
  const cards = document.querySelectorAll('.dashboard-cards-grid .dash-card');
  cards.forEach(card => card.classList.add('cards-privacy-blurred'));
}

export function unblurCollectionCards() {
  const cards = document.querySelectorAll('.dashboard-cards-grid .dash-card');
  cards.forEach(card => card.classList.remove('cards-privacy-blurred'));
  try {
    sessionStorage.removeItem(COLLECTION_BLUR_KEY);
  } catch (e) {}
}

export function showScreenPrivacyOverlay() {
  if (document.getElementById('screenPrivacyOverlay')) return;
  isFullBlurActive = true;
  blurCollectionCards();

  // Directly apply full-screen blur class to body
  document.body.classList.add('screen-idle-locked');

  const overlay = document.createElement('div');
  overlay.id = 'screenPrivacyOverlay';
  overlay.className = 'screen-privacy-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="screen-privacy-card">
      <div class="privacy-lock-icon">🔒</div>
      <h3>Screen Inactivity Privacy Lock</h3>
      <p>Laboratory counter privacy engaged due to 5 minutes of inactivity.</p>
      <div class="privacy-hint">Move mouse, press any key, or touch screen to resume</div>
    </div>
  `;
  document.body.appendChild(overlay);

  let startX = null;
  let startY = null;

  const onMouseMove = (e) => {
    if (startX === null || startY === null) {
      startX = e.clientX;
      startY = e.clientY;
      return;
    }
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    if (dist > 15) {
      dismissFullscreenBlur();
    }
  };

  const dismissFullscreenBlur = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('keydown', dismissFullscreenBlur);
    window.removeEventListener('touchstart', dismissFullscreenBlur);
    window.removeEventListener('click', dismissFullscreenBlur);

    // Persist collection privacy blur across the hard refresh
    try {
      sessionStorage.setItem(COLLECTION_BLUR_KEY, 'true');
      sessionStorage.removeItem(IDLE_LOCK_STORAGE_KEY);
    } catch (e) {}

    // Immediate hard refresh (cache-busting reload)
    window.location.replace('dashboard.html?_t=' + Date.now());
  };

  // Attach dismiss listeners after slight delay to ignore synthetic initial events
  setTimeout(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('keydown', dismissFullscreenBlur, { passive: true, once: true });
    window.addEventListener('touchstart', dismissFullscreenBlur, { passive: true, once: true });
    window.addEventListener('click', dismissFullscreenBlur, { passive: true, once: true });
  }, 400);
}

function handleInactivityTimeout() {
  if (isDashboardPage()) {
    showScreenPrivacyOverlay();
  } else {
    try {
      sessionStorage.setItem(IDLE_LOCK_STORAGE_KEY, 'true');
    } catch (e) {}
    window.location.href = 'dashboard.html?idle_lock=true';
  }
}

export function resetInactivityTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(handleInactivityTimeout, INACTIVITY_TIMEOUT_MS);
}

export function initInactivityWatcher() {
  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'input'];
  events.forEach(eventName => {
    window.addEventListener(eventName, () => {
      if (!isFullBlurActive) {
        resetInactivityTimer();
      }
    }, { passive: true });
  });

  resetInactivityTimer();

  // If on Dashboard, check if we arrived via idle lock or reload with cards privacy
  if (isDashboardPage()) {
    let wasIdle = false;
    let keepCardsBlurred = false;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      wasIdle = urlParams.get('idle_lock') === 'true' || sessionStorage.getItem(IDLE_LOCK_STORAGE_KEY) === 'true';
      keepCardsBlurred = sessionStorage.getItem(COLLECTION_BLUR_KEY) === 'true';
    } catch (e) {}

    if (wasIdle) {
      showScreenPrivacyOverlay();
    } else if (keepCardsBlurred) {
      blurCollectionCards();
    }

    // Attach click listener to collection cards to unblur them when clicked
    const cards = document.querySelectorAll('.dashboard-cards-grid .dash-card');
    cards.forEach(card => {
      card.addEventListener('click', function () {
        unblurCollectionCards();
      });
    });
  }
}
