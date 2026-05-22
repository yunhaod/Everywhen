function setVibe(el) {
  document.querySelectorAll('.vibe-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function tick() {
  const target = new Date('2024-10-19T00:00:00');
  const now = new Date();
  let diff = Math.max(0, target - now);
  const days = Math.floor(diff / 864e5); diff -= days * 864e5;
  const hrs = Math.floor(diff / 36e5); diff -= hrs * 36e5;
  const mins = Math.floor(diff / 6e4);
  const pad = n => String(n).padStart(2, '0');
  const d = document.getElementById('d');
  const h = document.getElementById('h');
  const m = document.getElementById('m');
  if (d) d.textContent = pad(days);
  if (h) h.textContent = pad(hrs);
  if (m) m.textContent = pad(mins);
}

tick();
setInterval(tick, 30000);
