const accentPalette = [
  { label: "Coral Ember", value: "#F87060" },
  { label: "Saffron Glow", value: "#F9C784" },
  { label: "Spruce Pulse", value: "#4F9D69" },
  { label: "Marina Ink", value: "#1C6E8C" },
  { label: "Slate Signal", value: "#27323F" }
];

const layouts = [
  {
    id: "title-only",
    name: "Hero headline",
    description: "Bold title with a wide accent underline."
  },
  {
    id: "title-subtitle",
    name: "Title & subtitle",
    description: "Pair the main headline with a supporting statement."
  },
  {
    id: "title-bullets",
    name: "Talking points",
    description: "Highlight up to five bullet points beside the headline."
  },
  {
    id: "split-visual",
    name: "Visual showcase",
    description: "Text on the left with an image or data block on the right."
  }
];

let slideCounter = 1;

const state = {
  presentationTitle: "Launch Playbook",
  themeAccent: accentPalette[0].value,
  slides: [createSlide({
    title: "Strategic Overview",
    subtitle: "Where we are and where we're headed",
    bullets: ["Momentum across core markets", "Three bold initiatives for Q4"],
    layout: "title-bullets"
  })],
  selectedSlideId: null
};

state.selectedSlideId = state.slides[0].id;

const presentationTitleInput = document.getElementById("presentationTitle");
const accentPicker = document.getElementById("accentPicker");
const addSlideButton = document.getElementById("addSlide");
const slidesList = document.getElementById("slidesList");
const editorBody = document.getElementById("editorBody");
const slideActions = document.getElementById("slideActions");
const previewStage = document.getElementById("previewStage");
const exportBtn = document.getElementById("exportPptx");
const notesField = document.getElementById("notesField");

document.documentElement.style.setProperty("--accent", state.themeAccent);

presentationTitleInput.value = state.presentationTitle;
presentationTitleInput.addEventListener("input", (event) => {
  state.presentationTitle = event.target.value;
});

addSlideButton.addEventListener("click", () => {
  const newSlide = createSlide();
  state.slides.push(newSlide);
  selectSlide(newSlide.id);
  render();
});

exportBtn.addEventListener("click", handleExport);

renderAccentPicker();
render();

function createSlide(overrides = {}) {
  const slide = {
    id: `slide-${slideCounter++}`,
    title: "Untitled slide",
    subtitle: "",
    body: "",
    bullets: [],
    layout: "title-only",
    imageUrl: "",
    background: "#ffffff",
    accentColor: state ? state.themeAccent : accentPalette[0].value,
    notes: "",
    callout: ""
  };

  return { ...slide, ...overrides };
}

function selectSlide(id) {
  state.selectedSlideId = id;
  render();
}

function render() {
  renderSlidesList();
  renderSlideActions();
  renderEditor();
  renderPreview();
}

function renderAccentPicker() {
  accentPicker.innerHTML = "";
  accentPalette.forEach((accent) => {
    const swatch = document.createElement("button");
    swatch.className = "accent-swatch";
    swatch.title = accent.label;
    swatch.style.background = accent.value;
    if (accent.value === state.themeAccent) {
      swatch.classList.add("active");
    }
    swatch.addEventListener("click", () => {
      const previousAccent = state.themeAccent;
      state.themeAccent = accent.value;
      document.documentElement.style.setProperty("--accent", accent.value);
      accentPicker.querySelectorAll(".accent-swatch").forEach((btn) => btn.classList.remove("active"));
      swatch.classList.add("active");
      state.slides = state.slides.map((slide) => ({
        ...slide,
        accentColor:
          !slide.accentColor || slide.accentColor === previousAccent ? accent.value : slide.accentColor
      }));
      render();
    });
    accentPicker.appendChild(swatch);
  });
}

function renderSlidesList() {
  slidesList.innerHTML = "";
  if (!state.slides.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Add your first slide to start shaping the story.";
    slidesList.appendChild(empty);
    return;
  }

  state.slides.forEach((slide, index) => {
    const item = document.createElement("li");
    item.className = "slide-card";
    if (slide.id === state.selectedSlideId) {
      item.classList.add("active");
    }

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = index + 1;

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = slide.title || `Slide ${index + 1}`;
    const hint = document.createElement("p");
    const layoutMeta = layouts.find((l) => l.id === slide.layout);
    const summaryParts = [];
    if (slide.subtitle) summaryParts.push(slide.subtitle);
    if (slide.bullets?.length) summaryParts.push(`${slide.bullets.length} bullet${slide.bullets.length > 1 ? "s" : ""}`);
    if (layoutMeta) summaryParts.push(layoutMeta.name);
    hint.textContent = summaryParts.join(" • ");

    content.append(title, hint);

    item.append(badge, content);

    item.addEventListener("click", () => selectSlide(slide.id));

    slidesList.appendChild(item);
  });
}

function renderSlideActions() {
  slideActions.innerHTML = "";
  const slide = currentSlide();
  if (!slide) return;
  const index = state.slides.findIndex((s) => s.id === slide.id);

  const duplicateBtn = document.createElement("button");
  duplicateBtn.className = "ghost";
  duplicateBtn.textContent = "Duplicate";
  duplicateBtn.addEventListener("click", () => {
    const copy = {
      ...slide,
      id: `slide-${slideCounter++}`,
      title: `${slide.title} (copy)`
    };
    state.slides.splice(index + 1, 0, copy);
    selectSlide(copy.id);
  });

  const moveUpBtn = document.createElement("button");
  moveUpBtn.className = "ghost";
  moveUpBtn.textContent = "Move up";
  moveUpBtn.disabled = index === 0;
  moveUpBtn.addEventListener("click", () => {
    if (index === 0) return;
    const [removed] = state.slides.splice(index, 1);
    state.slides.splice(index - 1, 0, removed);
    render();
  });

  const moveDownBtn = document.createElement("button");
  moveDownBtn.className = "ghost";
  moveDownBtn.textContent = "Move down";
  moveDownBtn.disabled = index === state.slides.length - 1;
  moveDownBtn.addEventListener("click", () => {
    if (index === state.slides.length - 1) return;
    const [removed] = state.slides.splice(index, 1);
    state.slides.splice(index + 1, 0, removed);
    render();
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "danger";
  removeBtn.textContent = "Remove";
  removeBtn.disabled = state.slides.length === 1;
  removeBtn.addEventListener("click", () => {
    if (state.slides.length === 1) return;
    state.slides.splice(index, 1);
    const nextSlide = state.slides[Math.max(0, index - 1)] || state.slides[0];
    selectSlide(nextSlide.id);
  });

  slideActions.append(duplicateBtn, moveUpBtn, moveDownBtn, removeBtn);
}

function renderEditor() {
  editorBody.innerHTML = "";
  const slide = currentSlide();
  if (!slide) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No slide selected.";
    editorBody.appendChild(empty);
    return;
  }

  const basicsSection = document.createElement("div");
  basicsSection.className = "editor-section";
  const basicsTitle = document.createElement("h3");
  basicsTitle.textContent = "Slide copy";

  const titleField = buildField("Slide title", "text", slide.title, (value) => updateSlide(slide.id, { title: value }));
  const subtitleField = buildField("Subtitle / tagline", "text", slide.subtitle, (value) => updateSlide(slide.id, { subtitle: value }));
  const calloutField = buildField("Key metric or callout", "text", slide.callout, (value) => updateSlide(slide.id, { callout: value }));

  basicsSection.append(basicsTitle, titleField, subtitleField, calloutField);

  const layoutSection = document.createElement("div");
  layoutSection.className = "editor-section";
  const layoutTitle = document.createElement("h3");
  layoutTitle.textContent = "Layout";
  const layoutGrid = document.createElement("div");
  layoutGrid.className = "layout-picker";

  layouts.forEach((option) => {
    const card = document.createElement("div");
    card.className = "layout-option";
    if (slide.layout === option.id) card.classList.add("active");

    const label = document.createElement("strong");
    label.textContent = option.name;
    const hint = document.createElement("span");
    hint.textContent = option.description;

    card.append(label, hint);
    card.addEventListener("click", () => {
      updateSlide(slide.id, { layout: option.id });
    });

    layoutGrid.appendChild(card);
  });

  layoutSection.append(layoutTitle, layoutGrid);

  const contentSection = document.createElement("div");
  contentSection.className = "editor-section";
  const contentTitle = document.createElement("h3");
  contentTitle.textContent = "Talking points";

  const bodyField = buildField("Body text", "textarea", slide.body, (value) => updateSlide(slide.id, { body: value }));
  const bulletsField = buildField("Bullet points (one per line)", "textarea", slide.bullets.join("\n"), (value) => {
    const bulletItems = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);
    updateSlide(slide.id, { bullets: bulletItems });
  });

  contentSection.append(contentTitle, bodyField, bulletsField);

  const visualSection = document.createElement("div");
  visualSection.className = "editor-section";
  const visualTitle = document.createElement("h3");
  visualTitle.textContent = "Visual direction";

  const imageField = buildField("Image or chart URL", "text", slide.imageUrl, (value) => updateSlide(slide.id, { imageUrl: value }));
  const backgroundField = buildField("Slide background", "color", slide.background, (value) => updateSlide(slide.id, { background: value }));

  const accentFieldWrapper = document.createElement("div");
  accentFieldWrapper.className = "field";
  const accentLabel = document.createElement("span");
  accentLabel.textContent = "Accent highlight";
  const accentSwatchRow = document.createElement("div");
  accentSwatchRow.className = "accent-picker";
  accentPalette.forEach((accent) => {
    const swatch = document.createElement("button");
    swatch.className = "accent-swatch";
    swatch.style.background = accent.value;
    swatch.title = accent.label;
    if (accent.value === (slide.accentColor || state.themeAccent)) {
      swatch.classList.add("active");
    }
    swatch.addEventListener("click", () => {
      updateSlide(slide.id, { accentColor: accent.value });
    });
    accentSwatchRow.appendChild(swatch);
  });
  accentFieldWrapper.append(accentLabel, accentSwatchRow);

  visualSection.append(visualTitle, imageField, backgroundField, accentFieldWrapper);

  editorBody.append(basicsSection, layoutSection, contentSection, visualSection);

  notesField.value = slide.notes || "";
  notesField.oninput = (event) => updateSlide(slide.id, { notes: event.target.value });
}

function renderPreview() {
  previewStage.innerHTML = "";
  const slide = currentSlide();
  if (!slide) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Add a slide to see the preview.";
    previewStage.appendChild(empty);
    return;
  }

  const canvas = document.createElement("div");
  canvas.className = "preview-canvas";
  canvas.style.background = slide.background || "#ffffff";
  canvas.style.borderTop = `12px solid ${slide.accentColor || state.themeAccent}`;

  const title = document.createElement("div");
  title.className = "preview-title";
  title.textContent = slide.title || "Add a title";
  canvas.appendChild(title);

  if (["title-subtitle", "split-visual", "title-bullets"].includes(slide.layout) && slide.subtitle) {
    const subtitle = document.createElement("div");
    subtitle.className = "preview-subtitle";
    subtitle.textContent = slide.subtitle;
    canvas.appendChild(subtitle);
  }

  if (slide.callout) {
    const callout = document.createElement("div");
    callout.textContent = slide.callout;
    callout.style.background = `${slide.accentColor || state.themeAccent}1a`;
    callout.style.color = slide.accentColor || state.themeAccent;
    callout.style.padding = "10px 12px";
    callout.style.borderRadius = "12px";
    callout.style.fontWeight = "600";
    canvas.appendChild(callout);
  }

  if (["title-bullets", "split-visual"].includes(slide.layout) && slide.bullets?.length) {
    const bullets = document.createElement("ul");
    bullets.className = "preview-bullets";
    slide.bullets.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      bullets.appendChild(li);
    });
    canvas.appendChild(bullets);
  }

  if (slide.layout === "title-subtitle" && slide.body) {
    const body = document.createElement("div");
    body.textContent = slide.body;
    body.style.color = "rgba(16, 37, 66, 0.75)";
    body.style.lineHeight = "1.4";
    canvas.appendChild(body);
  }

  if (slide.layout === "title-only" && slide.body) {
    const body = document.createElement("div");
    body.textContent = slide.body;
    body.style.color = "rgba(16, 37, 66, 0.75)";
    body.style.lineHeight = "1.4";
    canvas.appendChild(body);
  }

  if (slide.layout === "split-visual") {
    const visualRow = document.createElement("div");
    visualRow.style.display = "grid";
    visualRow.style.gridTemplateColumns = "1fr 1fr";
    visualRow.style.gap = "16px";
    visualRow.style.flex = "1";
    visualRow.style.alignItems = "stretch";

    const textColumn = document.createElement("div");
    textColumn.style.display = "flex";
    textColumn.style.flexDirection = "column";
    textColumn.style.gap = "12px";

    if (slide.body) {
      const body = document.createElement("div");
      body.textContent = slide.body;
      body.style.color = "rgba(16, 37, 66, 0.75)";
      body.style.lineHeight = "1.4";
      textColumn.appendChild(body);
    }

    if (slide.bullets?.length) {
      const bullets = document.createElement("ul");
      bullets.className = "preview-bullets";
      slide.bullets.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        bullets.appendChild(li);
      });
      textColumn.appendChild(bullets);
    }

    const visual = document.createElement("div");
    visual.className = "preview-image";
    if (slide.imageUrl) {
      visual.style.backgroundImage = `url(${slide.imageUrl})`;
    } else {
      visual.style.background = `linear-gradient(135deg, ${(slide.accentColor || state.themeAccent)}33, ${(slide.accentColor || state.themeAccent)}66)`;
      const placeholder = document.createElement("div");
      placeholder.textContent = "Drop chart or illustration";
      placeholder.style.color = "rgba(16, 37, 66, 0.6)";
      placeholder.style.fontSize = "0.8rem";
      placeholder.style.fontWeight = "500";
      placeholder.style.display = "flex";
      placeholder.style.alignItems = "center";
      placeholder.style.justifyContent = "center";
      placeholder.style.height = "100%";
      visual.appendChild(placeholder);
    }

    visualRow.append(textColumn, visual);
    canvas.appendChild(visualRow);
  }

  previewStage.appendChild(canvas);
}

function updateSlide(id, updates) {
  state.slides = state.slides.map((slide) => (slide.id === id ? { ...slide, ...updates } : slide));
  render();
}

function currentSlide() {
  return state.slides.find((slide) => slide.id === state.selectedSlideId);
}

function buildField(labelText, type, value, onChange) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const label = document.createElement("span");
  label.textContent = labelText;
  wrapper.appendChild(label);

  let input;
  if (type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 4;
    input.value = value || "";
  } else {
    input = document.createElement("input");
    input.type = type;
    if (type === "color" && !value) {
      input.value = "#ffffff";
    } else {
      input.value = value || "";
    }
  }
  input.addEventListener("input", (event) => onChange(event.target.value));
  wrapper.appendChild(input);
  return wrapper;
}

async function handleExport() {
  if (typeof PptxGenJS === "undefined") {
    alert("PPTX exporter is still loading. Please try again in a moment.");
    return;
  }

  const presentation = new PptxGenJS();
  presentation.title = state.presentationTitle || "Slide deck";

  state.slides.forEach((slide) => {
    const pptSlide = presentation.addSlide();
    const accent = slide.accentColor || state.themeAccent;
    pptSlide.background = { fill: slide.background || "FFFFFF" };

    pptSlide.addShape(presentation.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: presentation.width,
      h: 0.3,
      fill: accent,
      line: { color: accent }
    });

    pptSlide.addText(slide.title || "Untitled slide", {
      x: 0.5,
      y: 0.5,
      w: presentation.width - 1,
      h: 1,
      fontSize: 28,
      bold: true,
      color: "102542"
    });

    if (slide.subtitle) {
      pptSlide.addText(slide.subtitle, {
        x: 0.5,
        y: 1.3,
        w: presentation.width - 1,
        fontSize: 16,
        color: "3E566F"
      });
    }

    if (slide.callout) {
      pptSlide.addShape(presentation.shapes.RECTANGLE, {
        x: 0.5,
        y: 1.8,
        w: presentation.width - 1,
        h: 0.6,
        fill: accent,
        line: { color: accent },
        rectRadius: 0.1
      });
      pptSlide.addText(slide.callout, {
        x: 0.6,
        y: 1.9,
        w: presentation.width - 1.2,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: "FFFFFF"
      });
    }

    if (slide.bullets?.length) {
      pptSlide.addText(slide.bullets, {
        x: 0.7,
        y: slide.callout ? 2.6 : 2.2,
        w: (presentation.width / 2) - 0.8,
        h: 3,
        fontSize: 16,
        color: "102542",
        bullet: { type: "number" }
      });
    }

    if (slide.body) {
      pptSlide.addText(slide.body, {
        x: slide.layout === "split-visual" ? presentation.width / 2 : 0.7,
        y: slide.callout ? 2.6 : 2.2,
        w: slide.layout === "split-visual" ? (presentation.width / 2) - 0.8 : presentation.width - 1.4,
        h: 3.5,
        fontSize: 16,
        color: "3E566F"
      });
    }

    if (slide.layout === "split-visual" && slide.imageUrl) {
      pptSlide.addImage({
        path: slide.imageUrl,
        x: presentation.width / 2,
        y: slide.callout ? 2.6 : 2.2,
        w: (presentation.width / 2) - 0.8,
        h: 3,
        sizing: { type: "contain", w: (presentation.width / 2) - 0.8, h: 3 }
      });
    }

    if (slide.notes) {
      pptSlide.addNotes(slide.notes);
    }
  });

  try {
    await presentation.writeFile({ fileName: `${state.presentationTitle || "slide-deck"}.pptx` });
  } catch (error) {
    console.error("Error exporting PPTX", error);
    alert("Something went wrong while exporting the deck. Please try again.");
  }
}
