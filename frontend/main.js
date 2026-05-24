/* ── CITY DATA ── */
let CITIES = [];

async function loadCities() {
  try {
    const resp = await fetch('city_data.json');
    CITIES = await resp.json();
  } catch (e) {
    console.warn('Could not load city_data.json, using fallback');
    CITIES = [];
  }
}


/* ── VIBE CARDS ── */
function setVibe(el, vibeKey) {
  document.querySelectorAll('.vibe-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  navigate('explore');

  // Set slider values based on vibe
  const vibePresets = {
    beaches:   { beaches: 90, nature: 40, urban: 20, seclusion: 50 },
    urban:     { beaches: 20, nature: 20, urban: 90, seclusion: 10 },
    nature:    { beaches: 20, nature: 90, urban: 20, seclusion: 70 },
    seclusion: { beaches: 30, nature: 60, urban: 20, seclusion: 80 },
  };

  const preset = vibePresets[vibeKey];
  if (preset) {
    Object.entries(preset).forEach(([key, val]) => {
      const slider = document.getElementById('sl-' + key);
      const label  = document.getElementById('val-' + key);
      if (slider) { slider.value = val; }
      if (label)  { label.textContent = val; }
    });
  }

  // Auto run
  setTimeout(runRecommend, 200);
}

/* ── EXPLORE SLIDERS ── */
function updateSlider(key, val) {
  const label = document.getElementById('val-' + key);
  if (label) label.textContent = val;
}

/* ── REGION CHIPS ── */
function toggleChip(el) {
  el.classList.toggle('active');
}

/* ── RECOMMEND ENGINE ── */
const FEATURE_COLS = [
  'unesco_count', 'nature', 'beaches', 'urban', 'seclusion',
  'safety_index', 'cost_of_living_index', 'climate_index',
  'popularity_score', 'pollution_index',
];
const WEIGHTS = [1, 1, 1, 1, 1, 2, 2, 1, 3, 1];

function cosineSim(userVec, cityVec, weights) {
  let dot = 0, magU = 0, magC = 0;
  for (let i = 0; i < userVec.length; i++) {
    if (isNaN(userVec[i]) || isNaN(cityVec[i])) continue;
    const u = userVec[i] * weights[i];
    const c = cityVec[i];
    dot   += u * c;
    magU  += u * u;
    magC  += c * c;
  }
  const mag = Math.sqrt(magU) * Math.sqrt(magC);
  return mag ? dot / mag : 0;
}

function getPrefs() {
  return {
    unesco_count:        +document.getElementById('sl-culture').value,
    nature:              +document.getElementById('sl-nature').value,
    beaches:             +document.getElementById('sl-beaches').value,
    urban:               +document.getElementById('sl-urban').value,
    seclusion:           50,
    safety_index:        +document.getElementById('sl-safety').value,
    cost_of_living_index:+document.getElementById('sl-budget').value,
    climate_index:       +document.getElementById('sl-climate').value,
    popularity_score:    +document.getElementById('sl-popularity').value,
    pollution_index:     50,
  };
}

function runRecommend() {
  if (!CITIES.length) {
    showFallbackResults();
    return;
  }

  const activeChips = document.querySelectorAll('.region-chips .chip.active');
  const regions = activeChips.length
    ? [...activeChips].map(c => c.dataset.region)
    : ['europe','asia','north_america','south_america','africa','oceania','middle_east'];

  const filtered = CITIES.filter(c => regions.includes((c.region || '').toLowerCase()));
  const prefs = getPrefs();
  const userVec = FEATURE_COLS.map(f => prefs[f] !== undefined ? prefs[f] : NaN);

  const scored = filtered.map(city => {
    const cityVec = FEATURE_COLS.map(f => city[f] !== null && city[f] !== undefined ? +city[f] : NaN);
    const score = cosineSim(userVec, cityVec, WEIGHTS);
    return { ...city, match_score: Math.round(score * 100 * 10) / 10 };
  });

  scored.sort((a, b) => b.match_score - a.match_score);
  renderResults(scored.slice(0, 15));
}

const CITY_IMG_SEEDS = {};
function getCityImg(city, country, i) {
  const key = city + country;
  if (!CITY_IMG_SEEDS[key]) CITY_IMG_SEEDS[key] = 100 + (i * 7) % 400;
  return `https://loremflickr.com/300/160/${encodeURIComponent(city)},${encodeURIComponent(country)}?lock=${CITY_IMG_SEEDS[key]}`;
}

function renderResults(cities) {
  document.getElementById('results-placeholder').style.display = 'none';
  const grid = document.getElementById('results-grid');
  grid.style.display = 'grid';
  grid.innerHTML = '';

  cities.forEach((city, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <img src="${getCityImg(city.city, city.country, i)}" alt="${city.city}" loading="lazy" />
      <div class="result-card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p class="result-city">${city.city}</p>
            <p class="result-country">${city.country}</p>
          </div>
          <button class="result-save" title="Save" onclick="toggleResultSave(this)"><i class="ti ti-heart"></i></button>
        </div>
        <div style="margin-top:6px;">
          <span class="result-score"><i class="ti ti-sparkles" style="font-size:10px;"></i> ${city.match_score}% match</span>
        </div>
        ${city.short_description ? `<p style="font-size:11px;color:#888;margin-top:6px;line-height:1.5;">${city.short_description.slice(0, 80)}…</p>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function showFallbackResults() {
  const fallback = [
    { city: 'Barcelona', country: 'Spain',    match_score: 98.2, short_description: 'Vibrant streets, Gaudí architecture, and Mediterranean beaches.' },
    { city: 'Kyoto',     country: 'Japan',    match_score: 96.1, short_description: 'Serene temples, bamboo forests, and traditional culture.' },
    { city: 'Lisbon',    country: 'Portugal', match_score: 94.7, short_description: 'Hillside streets, pastel buildings, and fresh pastries.' },
    { city: 'Seville',   country: 'Spain',    match_score: 93.4, short_description: 'Sun-drenched plazas and the passionate rhythm of flamenco.' },
    { city: 'Venice',    country: 'Italy',    match_score: 92.0, short_description: 'Winding canals and romantic historic architecture.' },
    { city: 'Prague',    country: 'Czech Republic', match_score: 91.5, short_description: 'Gothic architecture and cobblestone streets by the river.' },
  ];
  renderResults(fallback);
}

function toggleResultSave(btn) {
  btn.classList.toggle('saved');
  btn.querySelector('i').style.color = btn.classList.contains('saved') ? '#E24B4A' : '';
}

/* ── TRIPS PAGE ── */
function switchTripsTab(el, tabId) {
  document.querySelectorAll('.trip-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  document.querySelectorAll('.trips-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('trips-' + tabId).classList.remove('hidden');
}

function showNewTripModal() {
  document.getElementById('new-trip-modal').classList.remove('hidden');
}

/* ── MEMOS PAGE ── */
function showNewMemoModal() {
  document.getElementById('new-memo-modal').classList.remove('hidden');
}

/* ── MODAL ── */
function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
}

/* ── SAVED PAGE ── */
function filterSaved(chip, region) {
  document.querySelectorAll('.saved-filter-row .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  document.querySelectorAll('.saved-card').forEach(card => {
    if (region === 'all' || card.dataset.region === region) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

function toggleHeart(btn) {
  btn.classList.toggle('active');
}

/* ── SURPRISE ME ── */
const SURPRISE_REGIONS = ['europe','asia','south_america','africa','middle_east'];
const VIBE_PRESETS = [
  { beaches: 90, nature: 40, urban: 20, culture: 30 },
  { beaches: 10, nature: 90, urban: 10, culture: 40 },
  { beaches: 30, nature: 30, urban: 90, culture: 70 },
  { beaches: 20, nature: 60, urban: 30, culture: 80 },
];

function surpriseMe() {
  navigate('explore');

  const preset = VIBE_PRESETS[Math.floor(Math.random() * VIBE_PRESETS.length)];
  const region = SURPRISE_REGIONS[Math.floor(Math.random() * SURPRISE_REGIONS.length)];

  // Deactivate all region chips then activate one
  document.querySelectorAll('.region-chips .chip').forEach(c => c.classList.remove('active'));
  const chip = document.querySelector(`.region-chips [data-region="${region}"]`);
  if (chip) chip.classList.add('active');

  // Set sliders
  const map = {
    beaches: 'sl-beaches', nature: 'sl-nature',
    urban: 'sl-urban', culture: 'sl-culture',
  };
  Object.entries(preset).forEach(([k, v]) => {
    const el = document.getElementById(map[k]);
    const lb = document.getElementById('val-' + k);
    if (el) el.value = v;
    if (lb) lb.textContent = v;
  });

  setTimeout(runRecommend, 200);
}

/* ── COUNTDOWN ── */
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
