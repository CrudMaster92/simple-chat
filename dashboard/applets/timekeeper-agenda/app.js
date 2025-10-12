const scheduleBoard = document.getElementById("schedule-board");
const currentDateLabel = document.getElementById("current-date");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const todayButton = document.getElementById("today-button");
const viewButtons = document.querySelectorAll(".toggle-button");
const clockDisplay = document.getElementById("clock-display");
const clockDate = document.getElementById("clock-date");
const nextEventLabel = document.getElementById("next-event");
const reminderCountLabel = document.getElementById("reminder-count");
const noteCountLabel = document.getElementById("note-count");
const eventForm = document.getElementById("event-form");
const reminderForm = document.getElementById("reminder-form");
const reminderList = document.getElementById("reminder-list");
const noteForm = document.getElementById("note-form");
const noteBoard = document.getElementById("note-board");

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const dayShortFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

let currentView = "day";
let currentDate = startOfDay(new Date());
let eventIdCounter = 0;
let reminderIdCounter = 0;
let noteIdCounter = 0;

const baseDate = startOfDay(new Date());

const events = [
  createSampleEvent("Morning Strategy Sprint", addDays(baseDate, 0), "09:30", 45, "planning"),
  createSampleEvent("Client Call: Horizon Corp", addDays(baseDate, 0), "13:00", 30, "meeting"),
  createSampleEvent("Storyboard Retro Icons", addDays(baseDate, 1), "10:00", 90, "creative"),
  createSampleEvent("Analog Inbox Sweep", addDays(baseDate, -1), "16:00", 40, "personal"),
  createSampleEvent("Weekly Sync", startOfWeek(baseDate), "11:30", 50, "meeting"),
  createSampleEvent("Archivist Office Hours", addDays(startOfWeek(baseDate), 3), "15:00", 60, "planning"),
  createSampleEvent("Soundtrack Sketching", addDays(baseDate, 2), "18:00", 60, "creative"),
  createSampleEvent("Sunday Reset", addDays(startOfWeek(baseDate), 6), "09:00", 75, "personal"),
];

const reminders = [
  createReminder("Replace planner ribbon", addMinutes(addDays(baseDate, 0), 11 * 60 + 45)),
  createReminder("Charge pocket pager", addMinutes(addDays(baseDate, 0), 19 * 60)),
  createReminder("Queue courier pickup", addMinutes(addDays(baseDate, 1), 8 * 60 + 15)),
];

const stickyNotes = [
  createSticky("Mint", "Print fresh timeline overlays"),
  createSticky("Sun", "Sketch weekend grid icons"),
];

function createSampleEvent(title, dateObj, time, duration, tag) {
  return {
    id: `evt-${++eventIdCounter}`,
    title,
    date: toISODate(dateObj),
    time,
    duration,
    tag,
  };
}

function createReminder(text, at) {
  return {
    id: `rem-${++reminderIdCounter}`,
    text,
    at,
  };
}

function createSticky(color, text) {
  const normalized = color.toLowerCase();
  return {
    id: `note-${++noteIdCounter}`,
    text,
    color: normalized,
  };
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMinutes(date, minutes) {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

function toISODate(date) {
  return date.toISOString().split("T")[0];
}

function parseEventDateTime(event) {
  const [year, month, day] = event.date.split("-").map(Number);
  const [hours, minutes] = event.time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function formatTimeRange(event) {
  const start = parseEventDateTime(event);
  const end = addMinutes(start, event.duration);
  return `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
}

function formatHourLabel(hour) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function startOfWeek(date) {
  const result = startOfDay(date);
  const day = result.getDay();
  const mondayOffset = (day + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

function updateClock() {
  const now = new Date();
  clockDisplay.textContent = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  clockDate.textContent = dateFormatter.format(now);
}

function updateCurrentDateLabel() {
  let label = "";
  if (currentView === "day") {
    label = `${dayFormatter.format(currentDate)} – ${dateFormatter.format(currentDate)}`;
  } else if (currentView === "week") {
    const start = startOfWeek(currentDate);
    const end = addDays(start, 6);
    label = `${dateFormatter.format(start)} → ${dateFormatter.format(end)}`;
  } else {
    label = monthFormatter.format(currentDate);
  }
  currentDateLabel.textContent = label;
}

function clearBoard() {
  scheduleBoard.innerHTML = "";
}

function renderSchedule() {
  clearBoard();
  if (currentView === "day") {
    renderDayView(currentDate);
  } else if (currentView === "week") {
    renderWeekView(currentDate);
  } else {
    renderMonthView(currentDate);
  }
}

function renderDayView(date) {
  const container = document.createElement("div");
  container.className = "day-view";

  const header = document.createElement("div");
  header.className = "view-header";
  const title = document.createElement("h3");
  title.textContent = dayFormatter.format(date);
  const subtitle = document.createElement("p");
  subtitle.textContent = dateFormatter.format(date);
  header.append(title, subtitle);
  container.appendChild(header);

  const dayEvents = events
    .filter((event) => event.date === toISODate(date))
    .sort((a, b) => parseEventDateTime(a) - parseEventDateTime(b));

  const grid = document.createElement("div");
  grid.className = "day-grid";
  const hours = Array.from({ length: 16 }, (_, idx) => idx + 6);

  hours.forEach((hour) => {
    const label = document.createElement("div");
    label.className = "hour-label";
    label.textContent = formatHourLabel(hour);

    const cell = document.createElement("div");
    cell.className = "hour-cell";

    const slotEvents = dayEvents.filter((event) => {
      const eventDate = parseEventDateTime(event);
      return eventDate.getHours() === hour;
    });

    slotEvents.forEach((event) => {
      const card = createEventCard(event, { showMeta: false });
      cell.appendChild(card);
    });

    grid.append(label, cell);
  });

  container.appendChild(grid);

  if (!dayEvents.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Your day is wide open. Drop in a new event to begin.";
    container.appendChild(empty);
  }

  scheduleBoard.appendChild(container);
}

function renderWeekView(date) {
  const container = document.createElement("div");
  container.className = "week-view";

  const header = document.createElement("div");
  header.className = "view-header";
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const title = document.createElement("h3");
  title.textContent = "Week Overview";
  const subtitle = document.createElement("p");
  subtitle.textContent = `${dateFormatter.format(start)} → ${dateFormatter.format(end)}`;
  header.append(title, subtitle);
  container.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "week-grid";

  for (let offset = 0; offset < 7; offset += 1) {
    const dayDate = addDays(start, offset);
    const column = document.createElement("div");
    column.className = "week-column";

    const columnHeader = document.createElement("header");
    const label = document.createElement("span");
    label.textContent = dayShortFormatter.format(dayDate);
    const dateValue = document.createElement("span");
    dateValue.textContent = dayDate.getDate();
    columnHeader.append(label, dateValue);

    const eventContainer = document.createElement("div");
    eventContainer.className = "column-events";

    const dayEvents = events
      .filter((event) => event.date === toISODate(dayDate))
      .sort((a, b) => parseEventDateTime(a) - parseEventDateTime(b));

    if (!dayEvents.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "—";
      eventContainer.appendChild(empty);
    } else {
      dayEvents.forEach((event) => {
        const card = createEventCard(event, { compact: true, showMeta: false });
        eventContainer.appendChild(card);
      });
    }

    column.append(columnHeader, eventContainer);
    grid.appendChild(column);
  }

  container.appendChild(grid);
  scheduleBoard.appendChild(container);
}

function renderMonthView(date) {
  const container = document.createElement("div");
  container.className = "month-view";

  const header = document.createElement("div");
  header.className = "view-header";
  const title = document.createElement("h3");
  title.textContent = monthFormatter.format(date);
  header.appendChild(title);
  container.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "month-grid";

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  dayNames.forEach((name) => {
    const cell = document.createElement("div");
    cell.className = "day-name";
    cell.textContent = name;
    grid.appendChild(cell);
  });

  const workingDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOffset = (workingDate.getDay() + 6) % 7;
  for (let i = 0; i < startOffset; i += 1) {
    const pad = document.createElement("div");
    pad.className = "month-cell outside";
    grid.appendChild(pad);
  }

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(date.getFullYear(), date.getMonth(), day);
    const iso = toISODate(cellDate);
    const dayEvents = events
      .filter((event) => event.date === iso)
      .sort((a, b) => parseEventDateTime(a) - parseEventDateTime(b));

    const cell = document.createElement("div");
    cell.className = "month-cell";
    cell.dataset.count = dayEvents.length;

    const number = document.createElement("span");
    number.className = "date-number";
    number.textContent = day;

    const dots = document.createElement("div");
    dots.className = "dot-strip";
    dayEvents.slice(0, 4).forEach((event) => {
      const dot = document.createElement("span");
      dot.dataset.tag = event.tag;
      dots.appendChild(dot);
    });

    const summary = document.createElement("p");
    summary.className = "cell-summary";
    if (dayEvents.length) {
      const [first] = dayEvents;
      if (dayEvents.length > 1) {
        summary.textContent = `${first.title} + ${dayEvents.length - 1} more`;
      } else {
        summary.textContent = `${first.title}`;
      }
    } else {
      summary.textContent = "Available";
    }

    cell.append(number, dots, summary);
    grid.appendChild(cell);
  }

  const remaining = (7 - ((startOffset + daysInMonth) % 7)) % 7;
  for (let i = 0; i < remaining; i += 1) {
    const pad = document.createElement("div");
    pad.className = "month-cell outside";
    grid.appendChild(pad);
  }

  container.appendChild(grid);
  scheduleBoard.appendChild(container);
}

function createEventCard(event, options = {}) {
  const { compact = false, showMeta } = options;
  const displayMeta = showMeta !== undefined ? showMeta : !compact;

  const card = document.createElement("article");
  card.className = "event-card";
  if (compact) {
    card.classList.add("compact");
  }
  card.dataset.tag = event.tag;

  const header = document.createElement("header");
  const time = document.createElement("span");
  time.textContent = formatTimeRange(event);
  header.appendChild(time);

  const tag = document.createElement("span");
  tag.textContent = event.tag.toUpperCase();
  header.appendChild(tag);
  card.appendChild(header);

  const title = document.createElement("p");
  title.className = "event-title";
  title.textContent = event.title;
  card.appendChild(title);

  if (displayMeta) {
    const meta = document.createElement("span");
    meta.className = "event-meta";
    meta.textContent = dateFormatter.format(parseEventDateTime(event));
    card.appendChild(meta);
  }

  return card;
}

function getNextEvent() {
  const now = new Date();
  const upcoming = events
    .map((event) => ({ event, at: parseEventDateTime(event) }))
    .filter((entry) => entry.at >= now)
    .sort((a, b) => a.at - b.at);
  return upcoming.length ? upcoming[0] : null;
}

function updateStatusChips() {
  const nextEvent = getNextEvent();
  if (nextEvent) {
    nextEventLabel.textContent = `${nextEvent.event.title} @ ${timeFormatter.format(nextEvent.at)}`;
  } else {
    nextEventLabel.textContent = "No events queued";
  }

  reminderCountLabel.textContent = `${reminders.length} active`;
  noteCountLabel.textContent = `${stickyNotes.length} pinned`;
}

function renderReminders() {
  reminders.sort((a, b) => a.at - b.at);
  reminderList.innerHTML = "";
  reminders.forEach((reminder) => {
    const item = document.createElement("li");
    item.className = "list-item";

    const description = document.createElement("span");
    description.textContent = reminder.text;

    const time = document.createElement("time");
    time.dateTime = reminder.at.toISOString();
    time.textContent = `${dateFormatter.format(reminder.at)} · ${timeFormatter.format(reminder.at)}`;

    const action = document.createElement("button");
    action.className = "item-action";
    action.type = "button";
    action.textContent = "Done";
    action.addEventListener("click", () => {
      const index = reminders.findIndex((entry) => entry.id === reminder.id);
      if (index >= 0) {
        reminders.splice(index, 1);
        renderReminders();
        updateStatusChips();
      }
    });

    item.append(description, time, action);
    reminderList.appendChild(item);
  });

  if (!reminders.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No reminders pending.";
    reminderList.appendChild(empty);
  }
}

function renderNotes() {
  noteBoard.innerHTML = "";
  stickyNotes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "sticky-note";
    card.dataset.color = note.color;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove note");
    remove.textContent = "✕";
    remove.addEventListener("click", () => {
      const index = stickyNotes.findIndex((entry) => entry.id === note.id);
      if (index >= 0) {
        stickyNotes.splice(index, 1);
        renderNotes();
        updateStatusChips();
      }
    });

    const content = document.createElement("p");
    content.textContent = note.text;

    card.append(remove, content);
    noteBoard.appendChild(card);
  });

  if (!stickyNotes.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No notes pinned yet.";
    noteBoard.appendChild(empty);
  }
}

function handleViewChange(button) {
  currentView = button.dataset.view;
  viewButtons.forEach((btn) => {
    const active = btn === button;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  updateCurrentDateLabel();
  renderSchedule();
}

function bindControls() {
  prevButton.addEventListener("click", () => {
    if (currentView === "day") {
      currentDate = addDays(currentDate, -1);
    } else if (currentView === "week") {
      currentDate = addDays(currentDate, -7);
    } else {
      currentDate = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
    updateCurrentDateLabel();
    renderSchedule();
  });

  nextButton.addEventListener("click", () => {
    if (currentView === "day") {
      currentDate = addDays(currentDate, 1);
    } else if (currentView === "week") {
      currentDate = addDays(currentDate, 7);
    } else {
      currentDate = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
    updateCurrentDateLabel();
    renderSchedule();
  });

  todayButton.addEventListener("click", () => {
    currentDate = startOfDay(new Date());
    updateCurrentDateLabel();
    renderSchedule();
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => handleViewChange(button));
  });

  eventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(eventForm);
    const title = formData.get("title").trim();
    const dateValue = formData.get("date");
    const timeValue = formData.get("time");
    const durationValue = Number(formData.get("duration"));
    const tagValue = formData.get("tag");

    if (!title || !dateValue || !timeValue || Number.isNaN(durationValue)) {
      return;
    }

    events.push({
      id: `evt-${++eventIdCounter}`,
      title,
      date: dateValue,
      time: timeValue,
      duration: durationValue,
      tag: tagValue,
    });

    if (currentView === "day" && toISODate(currentDate) !== dateValue) {
      currentDate = startOfDay(new Date(dateValue));
    }

    updateCurrentDateLabel();
    renderSchedule();
    updateStatusChips();
    eventForm.reset();
  });

  reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(reminderForm);
    const text = formData.get("text").trim();
    const dateValue = formData.get("date");
    const timeValue = formData.get("time");

    if (!text || !dateValue || !timeValue) {
      return;
    }

    const [year, month, day] = dateValue.split("-").map(Number);
    const [hours, minutes] = timeValue.split(":").map(Number);
    const timestamp = new Date(year, month - 1, day, hours, minutes, 0, 0);

    reminders.push({
      id: `rem-${++reminderIdCounter}`,
      text,
      at: timestamp,
    });

    renderReminders();
    updateStatusChips();
    reminderForm.reset();
  });

  noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(noteForm);
    const text = formData.get("text").trim();
    const color = formData.get("color") || "mint";

    if (!text) {
      return;
    }

    stickyNotes.push({
      id: `note-${++noteIdCounter}`,
      text,
      color,
    });

    renderNotes();
    updateStatusChips();
    noteForm.reset();
  });
}

function init() {
  bindControls();
  updateClock();
  updateCurrentDateLabel();
  renderSchedule();
  renderReminders();
  renderNotes();
  updateStatusChips();

  setInterval(updateClock, 1000);
}

init();
