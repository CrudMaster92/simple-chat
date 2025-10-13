const transmissions = [
  {
    id: 'tidal-lanterns',
    title: 'Tidal Lanterns — Slow Motion Field Relay',
    videoId: 'aqz-KE-bpKQ',
    collection: 'Signal Tape · 204B',
    summary:
      'An underwater drift of bioluminescent lamps gliding past coral pylons. Perfect for easing the room into a slow, cinematic cadence.',
    vibe: 'Briny dusk calm with shimmer trails',
    energy: 'Gentle lift with a swell near the midpoint',
    bestUse: 'Late-night research lounges or introspective watch parties',
    instrumentation: 'Analog pads, bowed glass, and tide recordings',
    gradient: ['#051726', '#6bb6c4'],
    lightingCue: 'Lantern sconces at 30% amber with cool rim lights',
    textureCue: 'Mist diffusers plus soft linen banners over the deck',
    postureCue: 'Reclined pods with eyes toward the primary screen',
    cues: [
      'Loop chapter 02 to keep conversation anchored to the rising tide.',
      'Pair with a low sub-bass pulse at -24 dB to give depth to the space.',
      'Invite the room to breathe in sync with the lantern drifts.',
    ],
    chapters: [
      {
        time: '00:14',
        label: 'Signal handshake',
        summary: 'First lanterns crest the reef line and shimmer into frame.',
      },
      {
        time: '02:48',
        label: 'Midwater bloom',
        summary: 'A flock of jelly coils rotate toward the camera in slow arcs.',
      },
      {
        time: '06:35',
        label: 'Tidal echo finale',
        summary: 'Reflections multiply as the current pulls light toward the exit tunnel.',
      },
    ],
  },
  {
    id: 'midnight-operators',
    title: 'Midnight Operators — Lofi Relay Desk',
    videoId: 'hHW1oY26kxQ',
    collection: 'Night Office · Deck 3',
    summary:
      'Soft-focus city lights and cassette crackle for keeping the crew steady during late shifts.',
    vibe: 'Warm tungsten haze with distant neon sparkle',
    energy: 'Consistent lullaby groove',
    bestUse: 'Overnight work blocks and gentle onboarding sessions',
    instrumentation: 'Dusty drum loops, upright bass, layered keys',
    gradient: ['#0b1b33', '#f2c57c'],
    lightingCue: 'Desk lamps dimmed to 25% with a cool rim fill',
    textureCue: 'Felt desk pads, flip notebooks, and warm ceramic mugs',
    postureCue: 'Casual lean-in around the primary console',
    cues: [
      'Use chapter cues to trigger check-in prompts for the crew.',
      'Fade background chatter loop to -18 dB for clarity during announcements.',
      'Offer analog note cards so ideas don’t vanish between tracks.',
    ],
    chapters: [
      {
        time: '00:45',
        label: 'Fader warm-up',
        summary: 'Opening groove settles, a perfect moment to welcome arrivals.',
      },
      {
        time: '13:20',
        label: 'Skyline sweep',
        summary: 'Cityscape pans across, ideal for ambient lighting adjustments.',
      },
      {
        time: '27:05',
        label: 'Notebook close-up',
        summary: 'Use this beat to invite written reflections from the crew.',
      },
    ],
  },
  {
    id: 'orbit-accelerant',
    title: 'Orbit Accelerant — Synthwave Pursuit',
    videoId: 'MVPTGNGiI-4',
    collection: 'Velocity Grid · Issue 19',
    summary:
      'A neon chase reel that keeps the momentum surging for energetic crowd moments.',
    vibe: 'Chrome blue streaks with bronze sparks',
    energy: 'High-voltage climb with punctuated drops',
    bestUse: 'Kickoff hype sessions and sprint retrospectives',
    instrumentation: 'Driving synth arpeggios, punchy drums, and soaring leads',
    gradient: ['#031b3b', '#f9784b'],
    lightingCue: 'Sequential LED bars sweeping in 1.5 second bursts',
    textureCue: 'Glossy floor panels with metallic risers',
    postureCue: 'Standing row with motion room to pulse along',
    cues: [
      'Trigger floor strobes on each chorus downbeat for dramatic contrast.',
      'Keep hydration trays ready near chapter three — the pace spikes.',
      'Layer crowd chants on the final run to land a collective cadence.',
    ],
    chapters: [
      {
        time: '01:10',
        label: 'Launch ignition',
        summary: 'First arpeggio run hits; perfect to cue lighting acceleration.',
      },
      {
        time: '03:42',
        label: 'Overdrive chase',
        summary: 'Bass kicks double-time, ideal for a crowd energy call-out.',
      },
      {
        time: '05:56',
        label: 'Glide cooldown',
        summary: 'Pads take over for a breather before the last ascent.',
      },
    ],
  },
  {
    id: 'sunrise-broadcast',
    title: 'Sunrise Broadcast — Acoustic Bloom',
    videoId: 'cHHLHGNpCSA',
    collection: 'Daybreak Wing · Volume 05',
    summary:
      'Acoustic piano cascades with soft aerial footage to gently energize the room.',
    vibe: 'Fresh dawn hues with golden rim light',
    energy: 'Slow build to a confident, steady stride',
    bestUse: 'Morning kick-offs and reflective wrap sessions',
    instrumentation: 'Grand piano, subtle strings, and analog ambience',
    gradient: ['#08344f', '#f9b468'],
    lightingCue: 'Raise sheer blinds and flood with diffused daylight',
    textureCue: 'Lightwood risers paired with woven throws',
    postureCue: 'Open stance near windows with notebooks ready',
    cues: [
      'Invite the group to share intentions during the first crescendo.',
      'Blend a gentle citrus diffuser to reinforce the sunrise mood.',
      'Capture closing reflections as the melody settles back to quiet.',
    ],
    chapters: [
      {
        time: '00:32',
        label: 'First light',
        summary: 'Camera lifts above the horizon as piano theme blossoms.',
      },
      {
        time: '02:24',
        label: 'Flightpath focus',
        summary: 'Aerial glide offers a natural pause for discussion prompts.',
      },
      {
        time: '04:18',
        label: 'Sunburst finale',
        summary: 'Final chords land while light floods the scene.',
      },
    ],
  },
];

const stageFrame = document.getElementById('stageFrame');
const transmissionSelect = document.getElementById('transmissionSelect');
const stageDescription = document.getElementById('stageDescription');
const vibeValue = document.getElementById('vibeValue');
const energyValue = document.getElementById('energyValue');
const useValue = document.getElementById('useValue');
const instrumentationValue = document.getElementById('instrumentationValue');
const chapterList = document.getElementById('chapterList');
const collectionLabel = document.getElementById('collectionLabel');
const paletteSwatch = document.getElementById('paletteSwatch');
const lightingCue = document.getElementById('lightingCue');
const textureCue = document.getElementById('textureCue');
const postureCue = document.getElementById('postureCue');
const cueList = document.getElementById('cueList');
const focusToggle = document.getElementById('focusToggle');
const studio = document.querySelector('.studio');

const segmentForm = document.getElementById('segmentForm');
const segmentTime = document.getElementById('segmentTime');
const segmentTitle = document.getElementById('segmentTitle');
const segmentTone = document.getElementById('segmentTone');
const segmentNotes = document.getElementById('segmentNotes');
const segmentList = document.getElementById('segmentList');
const clearSegmentsButton = document.getElementById('clearSegments');

const storyboardSegments = [];

function normaliseTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);

  if (seconds > 59) {
    return null;
  }

  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
}

function timeToSeconds(time) {
  const [minutes, seconds] = time.split(':').map(Number);
  return minutes * 60 + seconds;
}

function renderSegments() {
  segmentList.innerHTML = '';

  if (storyboardSegments.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'segment-list__empty';
    empty.textContent = 'No beats pinned yet. Add a timestamp to sketch your run of show.';
    segmentList.append(empty);
    return;
  }

  storyboardSegments
    .slice()
    .sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time))
    .forEach((segment) => {
      const item = document.createElement('li');
      item.className = 'segment-list__item';
      item.innerHTML = `
        <div class="segment-list__header">
          <div>
            <div class="segment-list__time">${segment.time}</div>
            <div class="segment-list__title">${segment.title}</div>
          </div>
          <span class="segment-list__tag">${segment.tone}</span>
        </div>
        ${segment.notes ? `<p class="segment-list__notes">${segment.notes}</p>` : ''}
        <div class="segment-list__actions">
          <button class="segment-list__remove" type="button" data-segment-id="${segment.id}">Remove</button>
        </div>
      `;

      const removeButton = item.querySelector('.segment-list__remove');
      removeButton.addEventListener('click', () => {
        const index = storyboardSegments.findIndex((entry) => entry.id === segment.id);
        if (index >= 0) {
          storyboardSegments.splice(index, 1);
          renderSegments();
        }
      });

      segmentList.append(item);
    });
}

function renderChapters(transmission) {
  chapterList.innerHTML = '';

  if (!transmission.chapters || transmission.chapters.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.className = 'chapters__item';
    placeholder.innerHTML = '<p class="chapters__summary">No suggested chapters for this broadcast yet.</p>';
    chapterList.append(placeholder);
    return;
  }

  transmission.chapters.forEach((chapter) => {
    const li = document.createElement('li');
    li.className = 'chapters__item';
    li.innerHTML = `
      <span class="chapters__time">${chapter.time}</span>
      <span class="chapters__label">${chapter.label}</span>
      <p class="chapters__summary">${chapter.summary}</p>
    `;
    chapterList.append(li);
  });
}

function renderCues(transmission) {
  cueList.innerHTML = '';
  transmission.cues.forEach((cue) => {
    const li = document.createElement('li');
    li.textContent = cue;
    cueList.append(li);
  });
}

function setTransmission(transmission) {
  if (!transmission) {
    return;
  }

  const embedUrl = `https://www.youtube.com/embed/${transmission.videoId}?rel=0&modestbranding=1`;
  stageFrame.src = embedUrl;
  stageFrame.title = `${transmission.title} — YouTube playback`;

  stageDescription.textContent = transmission.summary;
  collectionLabel.textContent = transmission.collection;
  vibeValue.textContent = transmission.vibe;
  energyValue.textContent = transmission.energy;
  useValue.textContent = transmission.bestUse;
  instrumentationValue.textContent = transmission.instrumentation;

  document.documentElement.style.setProperty('--bg-start', transmission.gradient[0]);
  document.documentElement.style.setProperty('--bg-end', transmission.gradient[1]);
  paletteSwatch.style.background = `linear-gradient(135deg, ${transmission.gradient[0]}, ${transmission.gradient[1]})`;

  lightingCue.textContent = transmission.lightingCue;
  textureCue.textContent = transmission.textureCue;
  postureCue.textContent = transmission.postureCue;

  renderCues(transmission);
  renderChapters(transmission);
}

function populateTransmissions() {
  transmissions.forEach((transmission) => {
    const option = document.createElement('option');
    option.value = transmission.id;
    option.textContent = transmission.title;
    transmissionSelect.append(option);
  });

  if (transmissions.length > 0) {
    transmissionSelect.value = transmissions[0].id;
    setTransmission(transmissions[0]);
  }
}

transmissionSelect.addEventListener('change', (event) => {
  const transmission = transmissions.find((entry) => entry.id === event.target.value);
  setTransmission(transmission);
});

focusToggle.addEventListener('click', () => {
  const isFocus = studio.classList.toggle('studio--focus');
  focusToggle.textContent = isFocus ? 'Exit focus mode' : 'Enter focus mode';
  focusToggle.setAttribute('aria-pressed', String(isFocus));
});

segmentTime.addEventListener('input', () => {
  segmentTime.setCustomValidity('');
});

segmentForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const normalizedTime = normaliseTime(segmentTime.value.trim());
  if (!normalizedTime) {
    segmentTime.setCustomValidity('Use the mm:ss format and keep seconds under 60.');
    segmentTime.reportValidity();
    return;
  }

  const title = segmentTitle.value.trim();
  if (!title) {
    segmentTitle.focus();
    return;
  }

  const notes = segmentNotes.value.trim();

  storyboardSegments.push({
    id: crypto.randomUUID(),
    time: normalizedTime,
    title,
    tone: segmentTone.value,
    notes,
  });

  renderSegments();
  segmentForm.reset();
  segmentTone.value = 'Pulse';
  segmentTime.focus();
});

clearSegmentsButton.addEventListener('click', () => {
  storyboardSegments.splice(0, storyboardSegments.length);
  renderSegments();
  segmentTime.focus();
});

renderSegments();
populateTransmissions();
