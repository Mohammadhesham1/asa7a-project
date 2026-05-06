// ===== STAR FIELD =====
(function () {
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');

  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / 4000);
    for (let i = 0; i < count; i++) {
      const size = Math.random() < 0.15 ? 1.5 :
                   Math.random() < 0.5  ? 1.0 : 0.5;
      const twinkle = Math.random() < 0.15;
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: size,
        baseAlpha: 0.3 + Math.random() * 0.6,
        alpha: 0,
        twinkle,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
      });
    }
  }

  function drawMilkyWay() {
    const grad = ctx.createLinearGradient(0, H * 0.2, W, H * 0.8);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.3, 'rgba(140,150,255,0.025)');
    grad.addColorStop(0.5, 'rgba(160,170,255,0.04)');
    grad.addColorStop(0.7, 'rgba(140,150,255,0.025)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Simple constellation hints (faint lines)
  const constellationPairs = [
    [0.1, 0.15, 0.18, 0.22], [0.18, 0.22, 0.14, 0.3], [0.14, 0.3, 0.08, 0.28],
    [0.82, 0.1, 0.88, 0.18], [0.88, 0.18, 0.85, 0.25],
    [0.6, 0.75, 0.65, 0.82], [0.65, 0.82, 0.72, 0.78],
  ];

  function drawConstellations() {
    ctx.strokeStyle = 'rgba(201,168,76,0.06)';
    ctx.lineWidth = 0.8;
    constellationPairs.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1 * W, y1 * H);
      ctx.lineTo(x2 * W, y2 * H);
      ctx.stroke();
    });
  }

  let t = 0;
  function animate() {
    ctx.clearRect(0, 0, W, H);

    const isLight = document.body.getAttribute('data-theme') === 'light';
    if (isLight) {
      // Dawn gradient instead of stars
      const dawn = ctx.createLinearGradient(0, 0, 0, H);
      dawn.addColorStop(0, '#D4C4A0');
      dawn.addColorStop(1, '#F0EDE6');
      ctx.fillStyle = dawn;
      ctx.fillRect(0, 0, W, H);
    } else {
      drawMilkyWay();
      drawConstellations();
      t += 0.008;
      stars.forEach(s => {
        if (s.twinkle) {
          s.alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        } else {
          s.alpha = s.baseAlpha;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fill();
      });
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  animate();
})();
