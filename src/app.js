// ===== APP STATE =====
window.appState = {
  tab: 'wake',        // 'wake' | 'sleep'
  ampm: 'am',
  hour: 7,
  minute: 0,
  calculatedCycles: [],
  alarmSettings: {
    vibration: true,
    overrideSilent: true,
    toneType: 'default',
    customToneUri: null,
    startCycleIdx: 2,
    selectedRingScreenId: 'default',
  },
  ringScreens: [
    { id: 'default', name: 'الشاشة الافتراضية', color: '#050810', message: 'اصحى يا نجم', isDefault: true }
  ],
  selectedRingScreen: null,
  theme: 'auto',
  lang: 'ar',
  msgLang: 'ar',
};

const FALL_ASLEEP = 14;
const CYCLE = 90;

// ===== SCREEN NAVIGATION =====
function navigateTo(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(`screen-${id}`);
  if (target) {
    target.style.display = 'flex';
    requestAnimationFrame(() => target.classList.add('active'));
  }
}

function goBack(id) { navigateTo(id); }

// ===== DATE & TIME =====
function formatArabicDate(date) {
  const days = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]}`;
}

function toArabicNums(str) {
  return String(str).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function updateDateDisplay() {
  const el = document.getElementById('home-date');
  if (el) el.textContent = formatArabicDate(new Date());
}

// ===== MOON =====
function initHomeMoon() {
  const canvas = document.getElementById('moonCanvas');
  const info = drawMoon(canvas, new Date(), 64);
  const label = document.getElementById('moon-phase-label');
  if (label) {
    label.textContent = `${info.nameAr} · ${info.nameEn}`;
  }
}

// ===== THEME =====
function applyTheme(theme) {
  appState.theme = theme;
  const hour = new Date().getHours();
  const isDark = theme === 'dark' || (theme === 'auto' && (hour >= 19 || hour < 6));
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('asa7a_theme', theme);
}

function setTheme(val, btn) {
  document.querySelectorAll('#screen-settings .three-way .three-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyTheme(val);
}

function setLang(val, btn) {
  appState.lang = val;
  document.querySelectorAll('#screen-settings .setting-row:nth-child(2) .three-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  localStorage.setItem('asa7a_lang', val);
}

// ===== SCROLL PICKER =====
function buildPicker(containerId, count, pad, initial, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const inner = document.createElement('div');
  inner.className = 'scroll-picker-inner';

  // Sentinel items for scroll wrap
  for (let i = -2; i < count + 2; i++) {
    const item = document.createElement('div');
    const val = ((i % count) + count) % count;
    item.className = 'scroll-picker-item';
    item.textContent = pad ? String(val).padStart(2, '0') : String(val);
    item.dataset.val = val;
    inner.appendChild(item);
  }

  const lineTop = document.createElement('div');
  lineTop.className = 'picker-line-top';
  const lineBot = document.createElement('div');
  lineBot.className = 'picker-line-bottom';

  container.appendChild(lineTop);
  container.appendChild(lineBot);
  container.appendChild(inner);

  let currentVal = initial;
  let startY = 0, lastY = 0, velocity = 0, rafId = null;
  let offsetY = 0;

  function getItemH() { return 46; }

  function render(off) {
    const items = inner.querySelectorAll('.scroll-picker-item');
    const centerOffset = Math.round(off / getItemH());
    items.forEach((item, i) => {
      const relIdx = i - 2 - centerOffset;
      item.classList.remove('selected', 'near');
      if (relIdx === 0) item.classList.add('selected');
      else if (Math.abs(relIdx) === 1) item.classList.add('near');
    });
  }

  function snapTo(val) {
    currentVal = ((val % count) + count) % count;
    offsetY = currentVal * getItemH();
    inner.style.transform = `translateY(${46 - offsetY}px)`;
    render(offsetY);
    onChange(currentVal);
  }

  function onTouchStart(e) {
    startY = lastY = e.touches[0].clientY;
    velocity = 0;
    cancelAnimationFrame(rafId);
  }

  function onTouchMove(e) {
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = lastY - y;
    velocity = dy;
    lastY = y;
    offsetY = Math.max(0, Math.min((count - 1) * getItemH(), offsetY + dy));
    inner.style.transform = `translateY(${46 - offsetY}px)`;
    render(offsetY);
  }

  function onTouchEnd() {
    let v = velocity;
    const friction = () => {
      v *= 0.88;
      offsetY = Math.max(0, Math.min((count - 1) * getItemH(), offsetY + v));
      inner.style.transform = `translateY(${46 - offsetY}px)`;
      render(offsetY);
      if (Math.abs(v) > 0.5) {
        rafId = requestAnimationFrame(friction);
      } else {
        const snapped = Math.round(offsetY / getItemH());
        snapTo(snapped);
      }
    };
    rafId = requestAnimationFrame(friction);
  }

  function onWheel(e) {
    e.preventDefault();
    offsetY = Math.max(0, Math.min((count - 1) * getItemH(), offsetY + e.deltaY * 0.5));
    inner.style.transform = `translateY(${46 - offsetY}px)`;
    render(offsetY);
    clearTimeout(container._wheelTimer);
    container._wheelTimer = setTimeout(() => {
      const snapped = Math.round(offsetY / getItemH());
      snapTo(snapped);
    }, 150);
  }

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd);
  container.addEventListener('wheel', onWheel, { passive: false });

  snapTo(initial);
}

function initPickers() {
  buildPicker('picker-hour', 12, true, (appState.hour % 12) || 11, val => {
    appState.hour = val === 0 ? 12 : val;
  });
  buildPicker('picker-min', 60, true, appState.minute, val => {
    appState.minute = val;
  });
}

// ===== TAB =====
function setTab(tab) {
  appState.tab = tab;
  document.getElementById('tab-wake').classList.toggle('active', tab === 'wake');
  document.getElementById('tab-sleep').classList.toggle('active', tab === 'sleep');
  const label = document.getElementById('input-label');
  if (label) label.textContent = tab === 'wake' ? 'امتى عايز تصحى؟' : 'امتى هتنام؟';
}

// ===== AM/PM =====
function setAmPm(v) {
  appState.ampm = v;
  document.getElementById('ampm-am').classList.toggle('active', v === 'am');
  document.getElementById('ampm-pm').classList.toggle('active', v === 'pm');
}

// ===== CURRENT TIME =====
function setNow() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  appState.hour = h;
  appState.minute = m;
  appState.ampm = ap;
  initPickers();
  setAmPm(ap);
}

// ===== CALCULATE =====
function getInputMinutes() {
  let h = appState.hour;
  if (appState.ampm === 'pm' && h !== 12) h += 12;
  if (appState.ampm === 'am' && h === 12) h = 0;
  return h * 60 + appState.minute;
}

function minToTimeStr(totalMin) {
  totalMin = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minToAmPmAr(totalMin) {
  totalMin = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(totalMin / 60);
  return h >= 12 ? 'م' : 'ص';
}

function minToDate(totalMin) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setTime(base.getTime() + ((totalMin % 1440) + 1440) % 1440 * 60000);
  // If in the past, add a day
  if (base < new Date()) base.setDate(base.getDate() + 1);
  return base;
}

function calculate() {
  const inputMin = getInputMinutes();
  const cycles = [];

  if (appState.tab === 'wake') {
    // User wakes at X → calculate sleep times
    for (let c = 2; c <= 6; c++) {
      const sleepDur = c * CYCLE;
      const sleepMin = inputMin - sleepDur - FALL_ASLEEP;
      cycles.push({ cycles: c, targetMin: ((sleepMin % 1440) + 1440) % 1440, durationMin: sleepDur });
    }
  } else {
    // User sleeps at X → calculate wake times
    for (let c = 2; c <= 6; c++) {
      const wakeMin = inputMin + FALL_ASLEEP + c * CYCLE;
      cycles.push({ cycles: c, targetMin: ((wakeMin % 1440) + 1440) % 1440, durationMin: c * CYCLE });
    }
  }

  appState.calculatedCycles = cycles;

  // Build results header
  const timeStr = minToTimeStr(inputMin);
  const ampmStr = minToAmPmAr(inputMin);
  const header = document.getElementById('results-header');
  const subtitle = document.getElementById('results-subtitle');

  if (appState.tab === 'wake') {
    header.innerHTML = `لو عايز تصحى الساعة <strong>${timeStr} ${ampmStr}</strong>`;
    subtitle.textContent = 'دول أحسن أوقات تنام فيهم';
  } else {
    header.innerHTML = `لو هتنام الساعة <strong>${timeStr} ${ampmStr}</strong>`;
    subtitle.textContent = 'دول أحسن أوقات تصحى فيهم';
  }

  // Build results list
  const list = document.getElementById('results-list');
  list.innerHTML = '';

  cycles.slice().reverse().forEach((c, i) => {
    const realIdx = cycles.length - 1 - i;
    const recommended = c.cycles >= 5;
    const low = c.cycles <= 3;
    const tStr = minToTimeStr(c.targetMin);
    const tAp = minToAmPmAr(c.targetMin);
    const hours = (c.durationMin / 60).toFixed(1).replace('.0', '');

    const card = document.createElement('div');
    card.className = `result-card${recommended ? ' recommended' : ''}${low ? ' low' : ''}`;
    card.innerHTML = `
      <div class="result-card-left">
        <div class="result-cycle-badge">${toArabicNums(c.cycles)} دورات</div>
        <div class="result-time">${tStr} <span style="font-size:1rem;color:var(--muted)">${tAp}</span></div>
        <div class="result-duration">${toArabicNums(hours)} ساعة نوم</div>
        ${recommended ? '<div class="result-tag good">ده الأنسب ليك</div>' : ''}
        ${low ? '<div class="result-tag bad">ده قليل أوي</div>' : ''}
      </div>
      <div class="result-card-right">
        <button class="alarm-bell-btn" onclick="toggleSingleAlarm(${realIdx}, this)" title="ضبط منبه">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        ${recommended ? '<div class="star-icon">★</div>' : ''}
      </div>
    `;
    list.appendChild(card);
  });

  buildCyclesPillsSetup();
  navigateTo('results');
}

function toggleSingleAlarm(cycleIdx, btn) {
  btn.classList.toggle('active-alarm');
  const cycle = appState.calculatedCycles[cycleIdx];
  if (!cycle) return;
  const d = minToDate(cycle.targetMin);
  AlarmEngine.scheduleNativeAlarm(cycleIdx, d.getTime(),
    'اصحى', `الدورة ${cycleIdx + 1} — حان وقت الاستيقاظ`);
}

// ===== ALARM SETUP =====
function buildCyclesPillsSetup() {
  const container = document.getElementById('cycles-scroll');
  if (!container) return;
  container.innerHTML = '';

  const cycles = appState.calculatedCycles;
  const cycleNames = ['الأولى', 'التانية', 'التالتة', 'الرابعة', 'الخامسة', 'السادسة'];

  cycles.forEach((c, i) => {
    const pill = document.createElement('button');
    pill.className = `cycle-pill${i === appState.alarmSettings.startCycleIdx ? ' active' : ''}`;
    const tStr = minToTimeStr(c.targetMin);
    const tAp = minToAmPmAr(c.targetMin);
    pill.innerHTML = `الدورة ${cycleNames[i] || i + 1}<br><small>${tStr} ${tAp}</small>`;
    pill.onclick = () => {
      document.querySelectorAll('.cycle-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.alarmSettings.startCycleIdx = i;
    };
    container.appendChild(pill);
  });
}

function goToAlarmSetup() {
  buildRingScreenSelector();
  navigateTo('alarm-setup');
}

// ===== TONE =====
function setTone(type) {
  appState.alarmSettings.toneType = type;
  document.getElementById('tone-default').classList.toggle('active', type === 'default');
  document.getElementById('tone-custom').classList.toggle('active', type === 'custom');
  document.getElementById('custom-tone-row').style.display = type === 'custom' ? 'flex' : 'none';

  if (type === 'custom') pickAudioFile();
}

function pickAudioFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const uri = URL.createObjectURL(file);
    appState.alarmSettings.customToneUri = uri;
    document.getElementById('custom-tone-name').textContent = file.name;
  };
  input.click();
}

// ===== RING SCREEN SELECTOR =====
function buildRingScreenSelector() {
  const container = document.getElementById('ring-screen-selector');
  if (!container) return;
  container.innerHTML = '';

  appState.ringScreens.forEach(rs => {
    const opt = document.createElement('div');
    const isActive = rs.id === appState.alarmSettings.selectedRingScreenId;
    opt.className = `ring-screen-option${isActive ? ' active' : ''}`;
    opt.innerHTML = `
      <div class="ring-screen-preview" style="background:${rs.color}"></div>
      <div class="ring-screen-option-label">${rs.name}</div>
    `;
    opt.onclick = () => {
      document.querySelectorAll('.ring-screen-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      appState.alarmSettings.selectedRingScreenId = rs.id;
      appState.selectedRingScreen = rs;
    };
    container.appendChild(opt);
  });
}

// ===== SAVE ALARMS =====
async function saveAndActivate() {
  const cycles = appState.calculatedCycles;
  const startIdx = appState.alarmSettings.startCycleIdx;

  await AlarmEngine.cancelAll();
  await AlarmEngine.requestPermissions();

  const toSchedule = cycles.slice(startIdx);
  AlarmEngine.allAlarmTimes = toSchedule;

  const rsId = appState.alarmSettings.selectedRingScreenId;
  appState.selectedRingScreen = appState.ringScreens.find(r => r.id === rsId) || appState.ringScreens[0];

  for (let i = 0; i < toSchedule.length; i++) {
    const c = toSchedule[i];
    const d = minToDate(c.targetMin);
    await AlarmEngine.scheduleNativeAlarm(i, d.getTime(), 'اصحى', `الدورة ${startIdx + i + 1} — وقت الصحيان`);
  }

  // Save to localStorage
  localStorage.setItem('asa7a_state', JSON.stringify({
    alarmSettings: appState.alarmSettings,
    ringScreens: appState.ringScreens,
    calculatedCycles: appState.calculatedCycles,
  }));

  // Go home with confirmation
  navigateTo('home');
  setTimeout(() => {
    const tagline = document.querySelector('.app-tagline');
    if (tagline) {
      const orig = tagline.textContent;
      tagline.textContent = 'المنبه اتضبط!';
      tagline.style.color = 'var(--green)';
      setTimeout(() => { tagline.textContent = orig; tagline.style.color = ''; }, 2500);
    }
  }, 300);
}

// ===== RING SCREEN ACTIONS =====
function confirmAwake() {
  AlarmEngine.stopAlarmSound();
  // Wait 10 min then ask again
  clearTimeout(AlarmEngine.confirmTimeout);
  AlarmEngine.confirmTimeout = setTimeout(() => {
    document.getElementById('modal-confirm-awake').classList.add('open');
  }, 10 * 60 * 1000);
  // For demo: 10 seconds
  // AlarmEngine.confirmTimeout = setTimeout(() => {
  //   document.getElementById('modal-confirm-awake').classList.add('open');
  // }, 10000);
  navigateTo('home');
}

function finallyAwake() {
  closeModal('modal-confirm-awake');
  AlarmEngine.stopAlarmSound();
  AlarmEngine.cancelAll();
}

function nextCycle() {
  closeModal('modal-confirm-awake');
  AlarmEngine.stopAlarmSound();
  const nextIdx = AlarmEngine.currentCycleIdx + 1;
  const allTimes = AlarmEngine.allAlarmTimes;
  if (nextIdx < allTimes.length) {
    const c = allTimes[nextIdx];
    const d = minToDate(c.targetMin);
    AlarmEngine.scheduleNativeAlarm(nextIdx, d.getTime(), 'اصحى', `الدورة ${nextIdx + 1}`);
  }
  navigateTo('home');
}

function dimScreen() {
  try {
    if (window.Capacitor?.isNativePlatform()) {
      // Would use Screen plugin in real native
    }
    document.getElementById('ring-bg').style.filter = 'brightness(0.4)';
    document.querySelector('.ring-content').style.opacity = '0.85';
  } catch (e) {}
}

// ===== SETTINGS =====
function openSettings() {
  buildRingScreensList();
  navigateTo('settings');
}

function buildRingScreensList() {
  const list = document.getElementById('ring-screens-list');
  if (!list) return;
  list.innerHTML = '';

  appState.ringScreens.forEach((rs, i) => {
    const row = document.createElement('div');
    row.className = 'ring-screen-row';
    row.innerHTML = `
      <div class="ring-color-circle" style="background:${rs.color}"></div>
      <div class="ring-screen-name">${rs.name}</div>
      <div class="ring-screen-actions">
        <div class="radio-dot${rs.isDefault ? ' active' : ''}" onclick="setDefaultRingScreen('${rs.id}', this)"></div>
        <button class="icon-btn" onclick="editRingScreen('${rs.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    `;
    list.appendChild(row);
  });
}

function setDefaultRingScreen(id) {
  appState.ringScreens.forEach(rs => rs.isDefault = rs.id === id);
  appState.alarmSettings.selectedRingScreenId = id;
  buildRingScreensList();
}

function editRingScreen(id) {
  const rs = appState.ringScreens.find(r => r.id === id);
  if (!rs) return;
  document.getElementById('ring-message-input').value = rs.message || '';
  document.getElementById('ring-screen-name-input').value = rs.name || '';
  document.getElementById('hex-input').value = rs.color || '#050810';
  window._editingRingScreenId = id;
  showAddRingScreen();
}

// ===== MODAL =====
function showAddRingScreen() {
  document.getElementById('modal-ring-screen').classList.add('open');
  // Re-init color wheel
  const hexEl = document.getElementById('hex-input');
  if (hexEl) window.onHexInput && window.onHexInput(hexEl.value);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function saveRingScreen() {
  const color = window._currentRingColor || '#050810';
  const message = document.getElementById('ring-message-input').value || 'اصحى يا نجم';
  const name = document.getElementById('ring-screen-name-input').value || 'شاشة جديدة';

  if (window._editingRingScreenId) {
    const rs = appState.ringScreens.find(r => r.id === window._editingRingScreenId);
    if (rs) { rs.color = color; rs.message = message; rs.name = name; }
    window._editingRingScreenId = null;
  } else {
    appState.ringScreens.push({
      id: 'rs_' + Date.now(),
      name, color, message, isDefault: false
    });
  }

  closeModal('modal-ring-screen');
  buildRingScreensList();
  buildRingScreenSelector();
  localStorage.setItem('asa7a_screens', JSON.stringify(appState.ringScreens));
}

function setMsgLang(lang, btn) {
  appState.msgLang = lang;
  document.getElementById('msg-lang-ar').classList.toggle('active', lang === 'ar');
  document.getElementById('msg-lang-en').classList.toggle('active', lang === 'en');
  const input = document.getElementById('ring-message-input');
  if (input) input.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

// ===== INIT =====
function loadSavedState() {
  try {
    const saved = localStorage.getItem('asa7a_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(appState.alarmSettings, parsed.alarmSettings || {});
      if (parsed.ringScreens) appState.ringScreens = parsed.ringScreens;
    }
    const savedScreens = localStorage.getItem('asa7a_screens');
    if (savedScreens) appState.ringScreens = JSON.parse(savedScreens);

    const savedTheme = localStorage.getItem('asa7a_theme') || 'auto';
    appState.theme = savedTheme;
    applyTheme(savedTheme);
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  updateDateDisplay();
  initHomeMoon();
  initPickers();

  // Set current time as default
  setNow();

  // Auto-theme check every minute
  setInterval(() => applyTheme(appState.theme), 60000);

  // Settings button
  document.getElementById('btn-settings')?.addEventListener('click', openSettings);

  // Sync toggles with state
  document.getElementById('toggle-vibration')?.addEventListener('change', e => {
    appState.alarmSettings.vibration = e.target.checked;
  });
  document.getElementById('toggle-override')?.addEventListener('change', e => {
    appState.alarmSettings.overrideSilent = e.target.checked;
  });
  document.getElementById('settings-vibration')?.addEventListener('change', e => {
    appState.alarmSettings.vibration = e.target.checked;
  });
  document.getElementById('settings-override')?.addEventListener('change', e => {
    appState.alarmSettings.overrideSilent = e.target.checked;
  });

  // Start on home
  navigateTo('home');
});
