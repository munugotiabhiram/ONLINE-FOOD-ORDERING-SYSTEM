/**
 * FoodVerse 3D - Three-Dimensional Particle Canvas & Card Parallax Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  init3DBackground();
  init3DTiltCards();
});

function init3DBackground() {
  const canvas = document.getElementById('bg-3d-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Food emojis and particle spheres
  const particles = [];
  const particleCount = 28;
  const foodSymbols = ['🍕', '🍔', '🥟', '🍰', '🍜', '🥑', '🍹', '🌮', '🥞', '🌶️', '✨'];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 800 + 100, // 3D depth layer
      size: Math.random() * 18 + 14,
      symbol: foodSymbols[Math.floor(Math.random() * foodSymbols.length)],
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.015,
      opacity: Math.random() * 0.35 + 0.12
    });
  }

  // Mouse Parallax
  let mouseX = width / 2;
  let mouseY = height / 2;
  let targetMouseX = width / 2;
  let targetMouseY = height / 2;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Smooth mouse lerp
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    const offsetX = (mouseX - width / 2) * 0.05;
    const offsetY = (mouseY - height / 2) * 0.05;

    // Render 3D glowing particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      if (p.x < -50) p.x = width + 50;
      if (p.x > width + 50) p.x = -50;
      if (p.y < -50) p.y = height + 50;
      if (p.y > height + 50) p.y = -50;

      // 3D perspective projection
      const depthFactor = 600 / p.z;
      const projX = p.x + offsetX * depthFactor;
      const projY = p.y + offsetY * depthFactor;
      const projSize = p.size * depthFactor;

      ctx.save();
      ctx.translate(projX, projY);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity * Math.min(1, depthFactor);

      // Render glowing food emoji or sparkle
      ctx.font = `${Math.max(10, projSize)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255, 94, 58, 0.4)';
      ctx.shadowBlur = 12 * depthFactor;
      ctx.fillText(p.symbol, 0, 0);

      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  render();
}

function init3DTiltCards() {
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.tilt-card-3d, .food-card-3d, .category-card-3d');
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const inX = e.clientX >= rect.left && e.clientX <= rect.right;
      const inY = e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (inX && inY) {
        const cardX = e.clientX - rect.left;
        const cardY = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((cardY - centerY) / centerY) * -10;
        const rotateY = ((cardX - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.025)`;
      }
    });
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.tilt-card-3d, .food-card-3d, .category-card-3d')) {
      const card = e.target.closest('.tilt-card-3d, .food-card-3d, .category-card-3d');
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  });
}
