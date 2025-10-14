const stations = [
  {
    id: 'aurora-drive',
    name: 'Aurora Drive FM',
    location: 'Reykjavík, Iceland',
    genre: 'Downtempo',
    description:
      'Glacial synths and hushed beats for unhurried nights and first-light journaling.',
    tags: ['ambient', 'night', 'focus'],
    schedule: ['00:00 Lunar Echoes', '03:00 Polar Horizons', '06:00 Morning Mist'],
    stream: 'https://file-examples.com/storage/fe9cdd01b2b26738d0fdb104/2017/11/file_example_MP3_1MG.mp3',
    journal: [
      '01:12 — Guest mix from Oslo-based producer Silje Halvorsen.',
      '04:47 — Field recordings captured from Þingvellir National Park.',
      '05:55 — Spotlight: Modular patching tips for shimmering pads.'
    ]
  },
  {
    id: 'seabreeze-sessions',
    name: 'Seabreeze Sessions',
    location: 'Lagos, Portugal',
    genre: 'Balearic',
    description:
      'Sun-soaked guitars and gentle percussion crafted for seaside lounging and golden hour drives.',
    tags: ['daylight', 'guitar', 'uplifting'],
    schedule: ['09:00 Sunrise Stroll', '12:00 Lazy Current', '18:00 Golden Hour'],
    stream: 'https://file-examples.com/storage/fe9cdd01b2b26738d0fdb104/2017/11/file_example_MP3_1MG.mp3',
    journal: [
      '09:32 — Message in a bottle: listener postcard from Mallorca.',
      '14:05 — Interview with analog tape collector Júlia Rodrigues.',
      '19:42 — Premiere: "Mar Azul" live from the Sagres cliffs.'
    ]
  },
  {
    id: 'ember-city',
    name: 'Ember City Broadcast',
    location: 'Kyoto, Japan',
    genre: 'Nu-Jazz',
    description:
      'Electric piano riffs and brass accents that pair with neon-lit ramen bars and sketchbook nights.',
    tags: ['evening', 'jazz', 'city'],
    schedule: ['11:00 Market Grooves', '20:00 Skyline Sessions', '22:30 Ink & Vinyl'],
    stream: 'https://file-examples.com/storage/fe9cdd01b2b26738d0fdb104/2017/11/file_example_MP3_1MG.mp3',
    journal: [
      '11:47 — Fresh press from Kyoto collective Subsurface Trio.',
      '21:15 — Listener spotlight: saxophonist Haru Kameda.',
      '23:05 — Analog archive: cassette diaries from 1989 back alleys.'
    ]
  },
  {
    id: 'mesa-mornings',
    name: 'Mesa Morning Waves',
    location: 'Santa Fe, USA',
    genre: 'Desert Ambient',
    description:
      'Slide guitars, desert winds, and canyon birds that cue open-road optimism.',
    tags: ['daylight', 'acoustic', 'meditative'],
    schedule: ['05:30 Dawn Bloom', '10:00 High Desert Drift', '16:30 Painted Sky'],
    stream: 'https://file-examples.com/storage/fe9cdd01b2b26738d0fdb104/2017/11/file_example_MP3_1MG.mp3',
    journal: [
      '06:18 — Sunrise ritual recorded near Chimayó.',
      '11:32 — Storyteller Ana Tenorio narrates desert folklore.',
      '17:50 — Vinyl dust-off: 1971 resonator guitar session.'
    ]
  },
  {
    id: 'sonar-tides',
    name: 'Sonar Tides',
    location: 'Tulum, Mexico',
    genre: 'Organic House',
    description:
      'Hand drums and oceanic synth sweeps built for tidal breathing exercises.',
    tags: ['night', 'dance', 'organic'],
    schedule: ['15:00 Jungle Bloom', '21:00 Moon Lagoon', '00:30 Cenote Echo'],
    stream: 'https://file-examples.com/storage/fe9cdd01b2b26738d0fdb104/2017/11/file_example_MP3_1MG.mp3',
    journal: [
      '16:42 — Remixed ritual featuring percussionist Amaya Rojas.',
      '22:14 — Live hydrophone feed from nearby cenote caves.',
      '01:05 — Guided deep-dive breathing with resident host Naji.'
    ]
  }
];

const state = {
  selectedTag: 'all',
  nowPlaying: null
};

const elements = {
  tagContainer: document.querySelector('.filter-tags'),
  grid: document.querySelector('.station-grid'),
  journal: document.querySelector('.journal'),
  stationName: document.querySelector('.station-name'),
  stationMeta: document.querySelector('.station-meta'),
  waveform: document.querySelector('.waveform'),
  audio: document.getElementById('radio-player'),
  shuffle: document.querySelector('.shuffle')
};

function renderWaveformBars(node) {
  node.innerHTML = '';
  Array.from({ length: 32 }).forEach(() => {
    const span = document.createElement('span');
    node.appendChild(span);
  });
}

function createTagButtons() {
  const tags = new Set(['all']);
  stations.forEach((station) => station.tags.forEach((tag) => tags.add(tag)));

  tags.forEach((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = tag === 'all' ? 'All Signals' : tag;
    button.dataset.tag = tag;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', tag === state.selectedTag ? 'true' : 'false');
    button.addEventListener('click', () => selectTag(tag));
    elements.tagContainer.appendChild(button);
  });
}

function selectTag(tag) {
  state.selectedTag = tag;
  Array.from(elements.tagContainer.children).forEach((child) => {
    child.setAttribute('aria-checked', child.dataset.tag === tag ? 'true' : 'false');
  });
  renderStations();
}

function renderStations() {
  elements.grid.innerHTML = '';
  const template = document.getElementById('station-card-template');

  const filtered = stations.filter((station) => {
    if (state.selectedTag === 'all') return true;
    return station.tags.includes(state.selectedTag);
  });

  filtered.forEach((station) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.station-card');
    card.dataset.stationId = station.id;

    card.querySelector('.genre').textContent = station.genre;
    card.querySelector('.name').textContent = station.name;
    card.querySelector('.location').textContent = station.location;
    card.querySelector('.description').textContent = station.description;

    const scheduleList = card.querySelector('.schedule');
    station.schedule.forEach((slot) => {
      const li = document.createElement('li');
      li.textContent = slot;
      scheduleList.appendChild(li);
    });

    const tagContainer = card.querySelector('.tags');
    station.tags.forEach((tag) => {
      const tagLabel = document.createElement('span');
      tagLabel.textContent = `#${tag}`;
      tagContainer.appendChild(tagLabel);
    });

    const activate = () => tuneToStation(station.id);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });

    if (state.nowPlaying?.id === station.id) {
      card.classList.add('active');
    }

    elements.grid.appendChild(clone);
  });

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No signals match this vibe yet. Try a different mood!';
    elements.grid.appendChild(empty);
  }
}

function tuneToStation(id) {
  const station = stations.find((item) => item.id === id);
  if (!station) return;

  state.nowPlaying = station;
  elements.stationName.textContent = station.name;
  elements.stationMeta.textContent = `${station.location} • ${station.genre}`;

  elements.journal.innerHTML = '';
  station.journal.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = entry;
    elements.journal.appendChild(li);
  });

  Array.from(document.querySelectorAll('.station-card')).forEach((card) => {
    card.classList.toggle('active', card.dataset.stationId === station.id);
  });

  if (elements.audio.src !== station.stream) {
    elements.audio.src = station.stream;
  }
  elements.audio.play().catch(() => {
    // Autoplay might be blocked; simply allow user to press play.
  });
}

function shuffleStation() {
  const candidates = stations.filter((station) => {
    if (state.selectedTag === 'all') return true;
    return station.tags.includes(state.selectedTag);
  });
  if (!candidates.length) return;

  const randomStation = candidates[Math.floor(Math.random() * candidates.length)];
  tuneToStation(randomStation.id);
  animateShuffleButton();
}

function animateShuffleButton() {
  elements.shuffle.classList.add('active');
  setTimeout(() => elements.shuffle.classList.remove('active'), 300);
}

function init() {
  renderWaveformBars(elements.waveform);
  createTagButtons();
  renderStations();
  elements.shuffle.addEventListener('click', shuffleStation);

  const preferred = stations.find((station) => station.tags.includes('daylight'));
  if (preferred) {
    tuneToStation(preferred.id);
  }
}

init();
