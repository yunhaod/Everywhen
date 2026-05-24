function setVibe(el) {
  document.querySelectorAll('.vibe-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function tick() {
  const target = new Date('2026-10-19T00:00:00');
  const now = new Date();
  let diff = Math.max(0, target - now);
  const days = Math.floor(diff / 864e5); diff -= days * 864e5;
  const hrs  = Math.floor(diff / 36e5);  diff -= hrs  * 36e5;
  const mins = Math.floor(diff / 6e4);
  const pad  = n => String(n).padStart(2, '0');
  const d = document.getElementById('d');
  const h = document.getElementById('h');
  const m = document.getElementById('m');
  if (d) d.textContent = pad(days);
  if (h) h.textContent = pad(hrs);
  if (m) m.textContent = pad(mins);
}


// ── NAVIGATION ─────────────────────────────────────────────────────────────

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

document.getElementById('upcoming-toggle')?.addEventListener('click', () => {
  const toggle = document.getElementById('upcoming-toggle');
  const items  = document.getElementById('upcoming-items');
  toggle.classList.toggle('open');
  items.classList.toggle('open');
});

// ── EXPLORE FILTERS ─────────────────────────────────────────────────────────

function filterDestinations() {
  const regionChip = document.querySelector('#region-filter .filter-chip.active');
  const activeRegion = regionChip ? regionChip.textContent.trim().toLowerCase() : 'all';
  const activePrices = [...document.querySelectorAll('.fp-chip[data-filter="price"].active')].map(c => c.dataset.value);
  const activeVibes  = [...document.querySelectorAll('.fp-chip[data-filter="vibe"].active')].map(c => c.dataset.value);

  document.querySelectorAll('.dest-card').forEach(card => {
    const regionMatch = activeRegion === 'all' || card.dataset.region === activeRegion;
    const priceMatch  = activePrices.length === 0 || activePrices.includes(card.dataset.price);
    const vibeMatch   = activeVibes.length  === 0 || activeVibes.includes(card.dataset.vibe);
    card.style.display = (regionMatch && priceMatch && vibeMatch) ? '' : 'none';
  });
}

function updateFilterBtn() {
  const count = document.querySelectorAll('.fp-chip.active').length;
  const btn   = document.getElementById('filter-toggle');
  if (!btn) return;
  const badge = btn.querySelector('.filter-count');
  if (count > 0) {
    if (badge) badge.textContent = count;
    else btn.insertAdjacentHTML('beforeend', `<span class="filter-count">${count}</span>`);
    btn.classList.add('active');
  } else {
    badge?.remove();
    btn.classList.remove('active');
  }
}

const filterToggle = document.getElementById('filter-toggle');
const filterPanel  = document.getElementById('filter-panel');

filterToggle?.addEventListener('click', e => {
  e.stopPropagation();
  const opening = filterPanel.hidden;
  filterPanel.hidden = !opening;
  filterToggle.classList.toggle('active', opening);
});

document.addEventListener('click', e => {
  if (filterPanel && !filterPanel.hidden && !filterPanel.contains(e.target) && e.target !== filterToggle) {
    filterPanel.hidden = true;
    if (document.querySelectorAll('.fp-chip.active').length === 0) filterToggle.classList.remove('active');
  }
});

document.querySelectorAll('.fp-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');
    updateFilterBtn();
    filterDestinations();
  });
});

document.getElementById('filter-clear')?.addEventListener('click', () => {
  document.querySelectorAll('.fp-chip').forEach(c => c.classList.remove('active'));
  updateFilterBtn();
  filterDestinations();
});

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.closest('.filter-row').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filterDestinations();
  });
});

// ── MAP FILTERS ─────────────────────────────────────────────────────────────

document.querySelector('.see-all')?.addEventListener('click', () => navigate('saved'));

// ── TOOL TABS ─────────────────────────────────────────────────────────────

document.querySelectorAll('.tool-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tool-' + tab.dataset.tool).classList.add('active');
  });
});

// ── PACKING ──────────────────────────────────────────────────────────────

function updatePackProgress() {
  const items = document.querySelectorAll('.pack-item');
  const done  = document.querySelectorAll('.pack-item.done');
  const bar   = document.querySelector('.pack-progress-bar');
  const label = document.querySelector('.pack-progress-label');
  if (bar)   bar.style.width = (items.length ? (done.length / items.length) * 100 : 0) + '%';
  if (label) label.textContent = `${done.length} of ${items.length} packed`;
  document.querySelectorAll('.pack-section').forEach(sec => {
    const total  = sec.querySelectorAll('.pack-item').length;
    const packed = sec.querySelectorAll('.pack-item.done').length;
    const el = sec.querySelector('.pack-section-count');
    if (el) el.textContent = `${packed}/${total}`;
  });
}

document.querySelectorAll('.pack-check-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.pack-item').classList.toggle('done');
    updatePackProgress();
  });
});

// ── COUNTDOWN ─────────────────────────────────────────────────────────────

tick();
setInterval(tick, 30000);
