// ===== MOON PHASE ENGINE =====

const MOON_PHASES_AR = [
  'محاق', 'هلال جديد', 'هلال رايح يكبر', 'تربيع أول',
  'أحدب متزايد', 'بدر', 'أحدب متناقص', 'تربيع أخير',
  'هلال رايح يصغر'
];
const MOON_PHASES_EN = [
  'New Moon', 'Waxing Crescent', 'Waxing Crescent', 'First Quarter',
  'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter',
  'Waning Crescent'
];

function getMoonAge(date) {
  const known = new Date(2000, 0, 6, 18, 14); // known new moon
  const msPerDay = 86400000;
  const synodicMonth = 29.530588853;
  const diff = (date - known) / msPerDay;
  return ((diff % synodicMonth) + synodicMonth) % synodicMonth;
}

function getMoonPhaseInfo(date) {
  const age = getMoonAge(date);
  const illum = (1 - Math.cos((age / 29.530588853) * 2 * Math.PI)) / 2;
  let idx;
  if (age < 1.85) idx = 0;
  else if (age < 7.38) idx = 2;
  else if (age < 9.22) idx = 3;
  else if (age < 14.77) idx = 4;
  else if (age < 16.61) idx = 5;
  else if (age < 22.15) idx = 6;
  else if (age < 23.99) idx = 7;
  else if (age < 29.53) idx = 8;
  else idx = 0;

  const isWaxing = age < 14.765;
  return { age, illum, idx, isWaxing, nameAr: MOON_PHASES_AR[idx], nameEn: MOON_PHASES_EN[idx] };
}

function drawMoon(canvas, date, size) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r = (size || Math.min(W, H) / 2) - 4;
  ctx.clearRect(0, 0, W, H);

  const info = getMoonPhaseInfo(date);
  const { age, illum, isWaxing } = info;

  // Dark side of moon (full circle)
  const darkGrad = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, r * 0.1, cx, cy, r);
  darkGrad.addColorStop(0, '#1a1e2e');
  darkGrad.addColorStop(1, '#0a0c14');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = darkGrad;
  ctx.fill();

  // Blue rim light on dark side
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(70,120,220,0.12)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Lit portion
  if (illum > 0.005) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const litGrad = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.05, cx, cy, r);
    litGrad.addColorStop(0, '#FFF8DC');
    litGrad.addColorStop(0.5, '#E8C96A');
    litGrad.addColorStop(0.85, '#C9A84C');
    litGrad.addColorStop(1, '#7a5a10');

    // Draw lit ellipse
    const phase = (age / 29.530588853) * Math.PI * 2;
    const limbX = Math.cos(phase);

    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r, 0, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = litGrad;
    ctx.fill();

    // Inner terminator ellipse
    const termW = Math.abs(limbX) * r;
    if (termW > 1) {
      ctx.beginPath();
      if (isWaxing) {
        ctx.ellipse(cx, cy, termW, r, 0, -Math.PI / 2, Math.PI / 2, true);
        ctx.fillStyle = '#0a0c14';
      } else {
        ctx.ellipse(cx, cy, termW, r, 0, -Math.PI / 2, Math.PI / 2);
        ctx.fillStyle = '#0a0c14';
      }
      ctx.fill();
    }

    // Craters
    const craters = [
      { x: cx - r * 0.25, y: cy - r * 0.1, rr: r * 0.07 },
      { x: cx + r * 0.15, y: cy + r * 0.3, rr: r * 0.05 },
      { x: cx - r * 0.1,  y: cy + r * 0.15, rr: r * 0.04 },
      { x: cx + r * 0.3,  y: cy - r * 0.25, rr: r * 0.06 },
    ];
    craters.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.rr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x - c.rr * 0.3, c.y - c.rr * 0.3, c.rr * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
    });

    ctx.restore();
  }

  return info;
}

window.drawMoon = drawMoon;
window.getMoonPhaseInfo = getMoonPhaseInfo;
