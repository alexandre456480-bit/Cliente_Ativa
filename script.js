document.addEventListener("DOMContentLoaded", () => {

  // === TILT 3D no Header ===
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      card.style.transform = `perspective(800px) rotateX(${-(y / r.height) * 5}deg) rotateY(${(x / r.width) * 5}deg) scale3d(1.01,1.01,1.01)`;
      card.style.transition = 'transform .08s ease-out';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
      card.style.transition = 'transform .5s cubic-bezier(.25,1,.5,1)';
    });
  });

  // === SIDEBAR ATIVA ===
  const path = window.location.pathname;
  const page = path.split('/').pop().toLowerCase() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(i => {
    const h = i.getAttribute('href').toLowerCase();
    if (h === page || (page === '' && h === 'index.html')) {
        i.classList.add('active');
    } else {
        i.classList.remove('active');
    }
  });

  // === MAGNETIC HOVER nos KPI cards ===
  document.querySelectorAll('.card-kpi, .chart-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      card.style.transform = `perspective(1000px) rotateX(${-(y / r.height) * 3}deg) rotateY(${(x / r.width) * 3}deg) translateY(-5px)`;
      card.style.filter = 'brightness(1.1)';
      card.style.transition = 'transform .1s ease-out, filter 0.3s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.filter = '';
      card.style.transition = 'transform .5s cubic-bezier(.25,1,.5,1), filter 0.5s ease';
    });
  });
});
