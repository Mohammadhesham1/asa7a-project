// ===== COLOR WHEEL =====
(function () {
  const canvas = document.getElementById('colorWheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SIZE = canvas.width;
  const CX = SIZE / 2, CY = SIZE / 2;
  const OUTER_R = SIZE / 2 - 4;
  const INNER_R = OUTER_R * 0.55;
  const SQ = INNER_R * Math.SQRT2 - 4;

  let hue = 220, sat = 0.8, bri = 0.15;
  let draggingWheel = false, draggingSquare = false;

  function drawWheel() {
    for (let a = 0; a < 360; a++) {
      const start = (a - 1) * Math.PI / 180;
      const end = (a + 1) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, OUTER_R, start, end);
      ctx.closePath();
      ctx.fillStyle = `hsl(${a},100%,50%)`;
      ctx.fill();
    }
    // Punch hole
    ctx.beginPath();
    ctx.arc(CX, CY, INNER_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(13,17,23,0)';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawSquare() {
    const x0 = CX - SQ / 2, y0 = CY - SQ / 2;
    // White → Hue gradient (horizontal)
    const hGrad = ctx.createLinearGradient(x0, y0, x0 + SQ, y0);
    hGrad.addColorStop(0, '#fff');
    hGrad.addColorStop(1, `hsl(${hue},100%,50%)`);
    ctx.fillStyle = hGrad;
    ctx.fillRect(x0, y0, SQ, SQ);
    // Transparent → Black gradient (vertical)
    const bGrad = ctx.createLinearGradient(x0, y0, x0, y0 + SQ);
    bGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bGrad.addColorStop(1, '#000');
    ctx.fillStyle = bGrad;
    ctx.fillRect(x0, y0, SQ, SQ);
  }

  function drawCursors() {
    // Hue cursor on wheel ring
    const angle = hue * Math.PI / 180;
    const r = (INNER_R + OUTER_R) / 2;
    const cx2 = CX + r * Math.cos(angle);
    const cy2 = CY + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(cx2, cy2, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx2, cy2, 6, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue},100%,50%)`;
    ctx.fill();

    // Sat/Bri cursor in square
    const x0 = CX - SQ / 2, y0 = CY - SQ / 2;
    const sx = x0 + sat * SQ;
    const sy = y0 + (1 - bri) * SQ;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function render() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawWheel();
    // Dark bg for square area
    ctx.beginPath();
    ctx.arc(CX, CY, INNER_R - 2, 0, Math.PI * 2);
    const isDark = document.body.getAttribute('data-theme') !== 'light';
    ctx.fillStyle = isDark ? '#0D1117' : '#FDFAF5';
    ctx.fill();
    drawSquare();
    drawCursors();
    emitColor();
  }

  function hsbToHex(h, s, b) {
    const l = b * (1 - s / 2);
    const sl = l === 0 || l === 1 ? 0 : (b - l) / Math.min(l, 1 - l);
    const hsl2rgb = (h, s, l) => {
      const a = s * Math.min(l, 1 - l);
      const f = n => {
        const k = (n + h / 30) % 12;
        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      };
      return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
    };
    const [r, g, bb] = hsl2rgb(h, sl, l);
    return '#' + [r, g, bb].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function emitColor() {
    const hex = hsbToHex(hue, sat, bri);
    const preview = document.getElementById('color-preview');
    const hexIn = document.getElementById('hex-input');
    if (preview) preview.style.background = hex;
    if (hexIn && document.activeElement !== hexIn) hexIn.value = hex;
    window._currentRingColor = hex;
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function onDown(e) {
    e.preventDefault();
    const { x, y } = getPos(e);
    const dx = x - CX, dy = y - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= INNER_R && dist <= OUTER_R) {
      draggingWheel = true;
    } else if (dist < INNER_R) {
      draggingSquare = true;
    }
    onMove(e);
  }

  function onMove(e) {
    e.preventDefault();
    if (!draggingWheel && !draggingSquare) return;
    const { x, y } = getPos(e);
    const dx = x - CX, dy = y - CY;
    if (draggingWheel) {
      hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
    } else {
      const x0 = CX - SQ / 2, y0 = CY - SQ / 2;
      sat = Math.max(0, Math.min(1, (x - x0) / SQ));
      bri = Math.max(0, Math.min(1, 1 - (y - y0) / SQ));
    }
    render();
  }

  function onUp() { draggingWheel = false; draggingSquare = false; }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

  window.onHexInput = function (val) {
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const r = parseInt(val.slice(1, 3), 16) / 255;
      const g = parseInt(val.slice(3, 5), 16) / 255;
      const b = parseInt(val.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      bri = max;
      sat = max === 0 ? 0 : (max - min) / max;
      if (max === min) { hue = 0; }
      else if (max === r) { hue = ((g - b) / (max - min) * 60 + 360) % 360; }
      else if (max === g) { hue = (b - r) / (max - min) * 60 + 120; }
      else { hue = (r - g) / (max - min) * 60 + 240; }
      render();
    }
  };

  window.onBrightnessChange = function (val) {
    bri = val / 100;
    render();
  };

  render();
})();
