// ===== ALARM ENGINE =====
// Uses Capacitor LocalNotifications + native plugins when available

const AlarmEngine = (() => {
  let activeAlarms = [];
  let confirmTimeout = null;
  let currentCycleIdx = 0;
  let allAlarmTimes = [];
  let ringingAudio = null;

  async function requestPermissions() {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.requestPermissions();
      }
    } catch (e) { /* web fallback */ }
  }

  async function scheduleNativeAlarm(id, dateMs, title, body) {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
          notifications: [{
            id,
            title,
            body,
            schedule: { at: new Date(dateMs) },
            sound: null, // system default
            channelId: 'asa7a_alarm',
            extra: { cycleIdx: id }
          }]
        });
      } else {
        // Web fallback: setTimeout
        const delay = dateMs - Date.now();
        if (delay > 0) {
          setTimeout(() => triggerRing(id), delay);
        }
      }
    } catch (e) {
      console.warn('Alarm schedule error:', e);
      const delay = dateMs - Date.now();
      if (delay > 0) setTimeout(() => triggerRing(id), delay);
    }
  }

  async function cancelAll() {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const ids = activeAlarms.map(a => ({ id: a.id }));
        if (ids.length) await LocalNotifications.cancel({ notifications: ids });
      }
    } catch (e) {}
    activeAlarms = [];
  }

  function playAlarmSound(customUri) {
    try {
      if (ringingAudio) { ringingAudio.pause(); ringingAudio = null; }
      if (customUri) {
        ringingAudio = new Audio(customUri);
      } else {
        // Generate a simple beep tone via Web Audio
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const actx = new AudioCtx();
        const playBeep = (freq, start, dur) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0, actx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.8, actx.currentTime + start + 0.05);
          gain.gain.linearRampToValueAtTime(0, actx.currentTime + start + dur);
          osc.start(actx.currentTime + start);
          osc.stop(actx.currentTime + start + dur + 0.05);
        };
        // Pattern: beep beep ... (repeating)
        let t = 0;
        const pattern = () => {
          playBeep(880, t, 0.3);
          playBeep(880, t + 0.4, 0.3);
          playBeep(1100, t + 0.8, 0.5);
          t += 1.6;
        };
        for (let i = 0; i < 30; i++) pattern();
        return;
      }
      ringingAudio.loop = true;
      ringingAudio.volume = 1.0;
      ringingAudio.play().catch(() => {});
    } catch (e) {}
  }

  function stopAlarmSound() {
    if (ringingAudio) { ringingAudio.pause(); ringingAudio = null; }
  }

  function triggerRing(cycleId) {
    currentCycleIdx = cycleId;
    const settings = window.appState?.alarmSettings || {};
    playAlarmSound(settings.customToneUri || null);
    showRingScreen(cycleId);
  }

  function showRingScreen(cycleId) {
    const state = window.appState || {};
    const ringScreen = state.selectedRingScreen || { color: '#050810', message: 'اصحى يا نجم', cycleLabel: '' };
    const cycles = state.calculatedCycles || [];
    const cycle = cycles[cycleId] || {};

    document.getElementById('ring-bg').style.background = ringScreen.color || '#050810';

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('ring-time').textContent = `${h}:${m}`;

    const cycleNames = ['الأولى', 'التانية', 'التالتة', 'الرابعة', 'الخامسة', 'السادسة'];
    document.getElementById('ring-cycle').textContent = `الدورة ${cycleNames[cycleId] || ''}`;
    document.getElementById('ring-message').textContent = ringScreen.message || 'اصحى يا نجم';

    // Draw ring moon
    const ringMoon = document.getElementById('ringMoonCanvas');
    drawMoon(ringMoon, new Date(), 90);

    // Ripples
    const rippleWrap = document.getElementById('ring-ripples');
    rippleWrap.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const r = document.createElement('div');
      r.className = 'ripple-ring';
      r.style.animationDelay = `${i * 1}s`;
      rippleWrap.appendChild(r);
    }

    navigateTo('ring');
  }

  return {
    requestPermissions,
    scheduleNativeAlarm,
    cancelAll,
    playAlarmSound,
    stopAlarmSound,
    triggerRing,
    showRingScreen,
    get activeAlarms() { return activeAlarms; },
    set activeAlarms(v) { activeAlarms = v; },
    get confirmTimeout() { return confirmTimeout; },
    set confirmTimeout(v) { confirmTimeout = v; },
    get allAlarmTimes() { return allAlarmTimes; },
    set allAlarmTimes(v) { allAlarmTimes = v; },
    get currentCycleIdx() { return currentCycleIdx; },
    set currentCycleIdx(v) { currentCycleIdx = v; },
  };
})();

window.AlarmEngine = AlarmEngine;
