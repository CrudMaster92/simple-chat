const scenes = [
  {
    id: 'night-console',
    title: 'Night Console Drift — Lofi Relay',
    videoId: '5qap5aO4i9A',
    description:
      'Soft focus boards, evolving vinyl crackle, and a steady console glow for late edits or midnight journaling.',
    mood: 'amber hush with blue undertones',
    gradient: ['#12263a', '#3a7ca5'],
    tempo: 'Lazy 72 bpm sway',
    lighting: 'Desk lamps dimmed to 20%',
    seat: 'Beanbag in the back corner'
  },
  {
    id: 'arena-surges',
    title: 'Arena Surges — Piano & Breakbeats',
    videoId: 'kXYiU_JCYtU',
    description:
      'A piano-lead surge layered with breakbeat grit, built for collective catharsis and bright crowd flashes.',
    mood: 'charged bronze flicker',
    gradient: ['#0b1b33', '#ff9f1c'],
    tempo: '104 bpm march',
    lighting: 'Sequential strobe, warm-to-white',
    seat: 'Center balcony for full wave impact'
  },
  {
    id: 'side-street-carnival',
    title: 'Side Street Carnival — Kinetic Pop Relay',
    videoId: '9bZkp7q19f0',
    description:
      'Spiraling neon choreography with brass bursts and sidewalk humor. Expect laughing floorboards.',
    mood: 'citrus confetti whirlwind',
    gradient: ['#184d47', '#ffbf69'],
    tempo: '132 bpm sprint',
    lighting: 'Ribbon lasers with confetti wash',
    seat: 'Standing rail by the side stage'
  },
  {
    id: 'evergreen-promise',
    title: 'Evergreen Promise — Retro Uplift',
    videoId: 'dQw4w9WgXcQ',
    description:
      'Polished 80s optimism with glittered backbeats, perfect for boosting the control booth morale.',
    mood: 'sunset brass shine',
    gradient: ['#0f4c81', '#f4a259'],
    tempo: '114 bpm strut',
    lighting: 'Reflective floor with light curtain',
    seat: 'Front row walkway to sing along'
  }
];

const sceneSelect = document.getElementById('sceneSelect');
const sceneFrame = document.getElementById('sceneFrame');
const currentScene = document.getElementById('currentScene');
const moodSwatch = document.getElementById('moodSwatch');
const moodText = document.getElementById('moodText');
const playlistItems = document.getElementById('playlistItems');
const sceneNotes = document.getElementById('sceneNotes');
const tempoValue = document.getElementById('tempoValue');
const lightingValue = document.getElementById('lightingValue');
const seatValue = document.getElementById('seatValue');
const noteInput = document.getElementById('noteInput');
const noteList = document.getElementById('noteList');
const addNoteButton = document.getElementById('addNote');

const notes = [];

function setStage(scene) {
  if (!scene) return;

  const embedUrl = `https://www.youtube.com/embed/${scene.videoId}?rel=0`;
  sceneFrame.src = embedUrl;
  sceneFrame.title = `${scene.title} video`;
  currentScene.textContent = scene.title;
  moodText.textContent = scene.mood;
  moodSwatch.style.background = `linear-gradient(135deg, ${scene.gradient[0]}, ${scene.gradient[1]})`;
  document.querySelector('.stage').style.boxShadow = `inset 0 0 0 1px ${scene.gradient[1]}33, 0 18px 40px ${scene.gradient[0]}33`;

  sceneNotes.textContent = scene.description;
  tempoValue.textContent = scene.tempo;
  lightingValue.textContent = scene.lighting;
  seatValue.textContent = scene.seat;

  Array.from(playlistItems.children).forEach((li) => {
    li.classList.toggle('playlist__item--active', li.dataset.sceneId === scene.id);
  });
}

function populateScenes() {
  scenes.forEach((scene, index) => {
    const option = document.createElement('option');
    option.value = scene.id;
    option.textContent = scene.title;
    sceneSelect.append(option);

    const item = document.createElement('li');
    item.className = 'playlist__item';
    item.tabIndex = 0;
    item.dataset.sceneId = scene.id;
    item.innerHTML = `
      <div class="playlist__item-title">${scene.title}</div>
      <p class="playlist__item-desc">${scene.description}</p>
    `;

    const activate = () => {
      sceneSelect.value = scene.id;
      setStage(scene);
    };

    item.addEventListener('click', activate);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });

    playlistItems.append(item);

    if (index === 0) {
      sceneSelect.value = scene.id;
      setStage(scene);
    }
  });
}

sceneSelect.addEventListener('change', (event) => {
  const scene = scenes.find((entry) => entry.id === event.target.value);
  setStage(scene);
});

addNoteButton.addEventListener('click', () => {
  const text = noteInput.value.trim();
  if (!text) {
    noteInput.focus();
    return;
  }

  const entry = {
    id: crypto.randomUUID(),
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  notes.unshift(entry);
  renderNotes();
  noteInput.value = '';
  noteInput.focus();
});

function renderNotes() {
  noteList.innerHTML = '';
  notes.slice(0, 6).forEach((note) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${note.time}</strong> — ${note.text}`;
    noteList.append(li);
  });

  if (notes.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.textContent = 'No notes yet. Archive the room tone you catch.';
    noteList.append(placeholder);
  }
}

renderNotes();
populateScenes();
