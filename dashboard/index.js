const grid = document.querySelector('[data-role="applet-grid"]');
const status = document.querySelector('[data-role="status"]');

function updateStatus(message) {
  if (status) {
    status.textContent = message;
  }
}

function createFallbackTile(title, description) {
  const tile = document.createElement('article');
  tile.className = 'tile tile--fallback';
  tile.innerHTML = `
    <div class="tile__icon tile__icon--fallback" aria-hidden="true">
      <span>⚠️</span>
    </div>
    <h2 class="tile__heading">${title}</h2>
    <p class="tile__description">${description}</p>
  `;
  return tile;
}

function applyFallbackIcon(wrapper) {
  wrapper.classList.add('tile__icon--fallback');
  wrapper.replaceChildren();
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = '🧩';
  wrapper.appendChild(span);
}

function createTile(metadata, resolvedEntryUrl, metadataUrl) {
  const tile = document.createElement('article');
  tile.className = 'tile';
  tile.setAttribute('tabindex', '-1');

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'tile__icon';

  const heading = document.createElement('h2');
  heading.className = 'tile__heading';
  heading.textContent = metadata.name;

  const description = document.createElement('p');
  description.className = 'tile__description';
  description.textContent = metadata.description;

  let iconLoaded = false;
  if (typeof metadata.icon === 'string' && metadata.icon.trim()) {
    const iconUrl = new URL(metadata.icon, metadataUrl).href;
    const img = document.createElement('img');
    img.alt = `${metadata.name} icon`;
    img.src = iconUrl;
    img.addEventListener('error', () => {
      console.error(`Failed to load icon for applet "${metadata.slug ?? metadata.name}" from ${iconUrl}`);
      applyFallbackIcon(iconWrapper);
    });
    iconWrapper.appendChild(img);
    iconLoaded = true;
  }

  if (!iconLoaded) {
    applyFallbackIcon(iconWrapper);
  }

  const openLink = document.createElement('a');
  openLink.className = 'tile__action';
  openLink.href = resolvedEntryUrl;
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  openLink.setAttribute('aria-label', `Open ${metadata.name}`);
  openLink.textContent = 'Open';

  tile.append(iconWrapper, heading, description);

  if (Array.isArray(metadata.tags) && metadata.tags.length) {
    const tagList = document.createElement('ul');
    tagList.className = 'tile__tags';
    for (const tag of metadata.tags) {
      if (typeof tag !== 'string' || !tag.trim()) continue;
      const li = document.createElement('li');
      li.className = 'tile__tag';
      li.textContent = tag;
      tagList.appendChild(li);
    }
    if (tagList.childElementCount) {
      tile.appendChild(tagList);
    }
  }

  tile.appendChild(openLink);
  return tile;
}

async function loadApplet(slug, metadataPath) {
  let response;
  try {
    response = await fetch(metadataPath);
  } catch (error) {
    console.error(`Network error while fetching metadata for "${slug}":`, error);
    return createFallbackTile(
      `${slug} unavailable`,
      'We could not contact the metadata endpoint for this applet. Please try again later.'
    );
  }

  if (!response.ok) {
    console.error(`Failed to fetch metadata for "${slug}". HTTP status ${response.status}`);
    return createFallbackTile(
      `${slug} unavailable`,
      'The metadata file could not be retrieved. Check the registry configuration.'
    );
  }

  let metadata;
  try {
    metadata = await response.json();
  } catch (error) {
    console.error(`Invalid JSON in metadata for "${slug}":`, error);
    return createFallbackTile(
      `${slug} unavailable`,
      'The metadata file is not valid JSON. Contact the applet maintainer.'
    );
  }

  const resolvedEntryUrl = (() => {
    if (typeof metadata.entry !== 'string' || !metadata.entry.trim()) {
      console.error(`Missing entry URL in metadata for "${slug}"`);
      return null;
    }
    try {
      return new URL(metadata.entry, response.url).href;
    } catch (error) {
      console.error(`Could not resolve entry URL for "${slug}":`, error);
      return null;
    }
  })();

  if (!resolvedEntryUrl || typeof metadata.name !== 'string' || typeof metadata.description !== 'string') {
    return createFallbackTile(
      `${metadata.name ?? slug} unavailable`,
      'Required metadata fields are missing. Please update the applet configuration.'
    );
  }

  return createTile(metadata, resolvedEntryUrl, response.url);
}

async function init() {
  updateStatus('Loading applets…');
  let registry;
  try {
    const res = await fetch('./applets.json');
    if (!res.ok) {
      throw new Error(`Failed to load registry. HTTP status ${res.status}`);
    }
    registry = await res.json();
  } catch (error) {
    console.error('Unable to load applet registry:', error);
    grid.appendChild(
      createFallbackTile(
        'No applets available',
        'The dashboard could not load the registry configuration. Refresh to retry or contact support.'
      )
    );
    updateStatus('Unable to load applets.');
    return;
  }

  const entries = Object.entries(registry || {});
  if (!entries.length) {
    grid.appendChild(
      createFallbackTile(
        'No applets registered',
        'There are currently no applets in the registry. Add entries to dashboard/applets.json to get started.'
      )
    );
    updateStatus('No applets registered.');
    return;
  }

  for (const [slug, metadataPath] of entries) {
    const tile = await loadApplet(slug, metadataPath);
    grid.appendChild(tile);
  }

  updateStatus('Applet list loaded.');
}

init();
