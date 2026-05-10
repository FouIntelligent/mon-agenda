const storageKey = "agenda-programmes";
const reminderMinutes = 30;

const form = document.querySelector("#program-form");
const programId = document.querySelector("#program-id");
const titleInput = document.querySelector("#title");
const dateInput = document.querySelector("#date");
const timeInput = document.querySelector("#time");
const categoryInput = document.querySelector("#category");
const priorityInput = document.querySelector("#priority");
const notesInput = document.querySelector("#notes");
const cancelEditButton = document.querySelector("#cancel-edit");
const searchInput = document.querySelector("#search");
const filterInput = document.querySelector("#filter");
const programList = document.querySelector("#program-list");
const emptyState = document.querySelector("#empty-state");
const totalCount = document.querySelector("#total-count");
const todayCount = document.querySelector("#today-count");
const doneCount = document.querySelector("#done-count");
const todayLabel = document.querySelector("#today-label");
const notificationButton = document.querySelector("#notification-button");
const notificationStatus = document.querySelector("#notification-status");

let programs = loadPrograms();
const reminderTimers = new Map();

const todayIso = getLocalDateValue(new Date());
dateInput.value = todayIso;
todayLabel.textContent = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

registerServiceWorker();
refreshNotificationStatus();
scheduleReminders();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = {
    id: programId.value || crypto.randomUUID(),
    title: titleInput.value.trim(),
    date: dateInput.value,
    time: timeInput.value,
    category: categoryInput.value,
    priority: priorityInput.value,
    notes: notesInput.value.trim(),
    done: programs.find((item) => item.id === programId.value)?.done || false,
    createdAt: programs.find((item) => item.id === programId.value)?.createdAt || new Date().toISOString(),
  };

  if (programId.value) {
    programs = programs.map((item) => (item.id === programId.value ? data : item));
  } else {
    programs = [...programs, data];
  }

  savePrograms();
  resetForm();
  scheduleReminders();
  render();
});

cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
filterInput.addEventListener("change", render);
notificationButton.addEventListener("click", requestNotifications);

programList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const program = programs.find((item) => item.id === id);
  if (!program) return;

  if (action === "toggle") {
    program.done = !program.done;
  }

  if (action === "edit") {
    fillForm(program);
    return;
  }

  if (action === "delete") {
    if (!confirm(`Supprimer "${program.title}" ?`)) return;
    programs = programs.filter((item) => item.id !== id);
  }

  savePrograms();
  scheduleReminders();
  render();
});

function loadPrograms() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function savePrograms() {
  localStorage.setItem(storageKey, JSON.stringify(programs));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("./service-worker.js").catch(() => {
    notificationStatus.textContent = "Le mode installable n'a pas pu être activé sur ce navigateur.";
  });
}

async function requestNotifications() {
  if (!("Notification" in window)) {
    refreshNotificationStatus();
    return;
  }

  const permission = await Notification.requestPermission();
  refreshNotificationStatus();

  if (permission === "granted") {
    scheduleReminders();
    showTestNotification();
  }
}

function refreshNotificationStatus() {
  if (!("Notification" in window)) {
    notificationButton.disabled = true;
    notificationStatus.textContent = "Ce navigateur ne prend pas en charge les notifications.";
    return;
  }

  if (Notification.permission === "granted") {
    notificationButton.textContent = "Activé";
    notificationButton.disabled = true;
    notificationStatus.textContent = "Rappels activés: notification 30 minutes avant chaque programme.";
    return;
  }

  if (Notification.permission === "denied") {
    notificationButton.textContent = "Bloqué";
    notificationButton.disabled = true;
    notificationStatus.textContent = "Les notifications sont bloquées. Modifie l'autorisation dans les réglages du navigateur.";
    return;
  }

  notificationButton.textContent = "Activer";
  notificationButton.disabled = false;
  notificationStatus.textContent = "Active les notifications pour recevoir un rappel 30 minutes avant.";
}

function scheduleReminders() {
  reminderTimers.forEach((timer) => clearTimeout(timer));
  reminderTimers.clear();

  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = Date.now();

  programs.forEach((program) => {
    if (program.done) return;

    const eventStamp = `${program.date}T${program.time}`;
    const eventTime = new Date(eventStamp).getTime();
    const reminderTime = eventTime - reminderMinutes * 60 * 1000;

    if (!Number.isFinite(eventTime) || program.remindedFor === eventStamp) return;

    if (reminderTime <= now && eventTime > now) {
      sendReminder(program, eventStamp);
      return;
    }

    if (reminderTime > now) {
      const timer = setTimeout(() => sendReminder(program, eventStamp), reminderTime - now);
      reminderTimers.set(program.id, timer);
    }
  });
}

async function sendReminder(program, eventStamp) {
  const current = programs.find((item) => item.id === program.id);
  if (!current || current.done || current.remindedFor === eventStamp) return;

  const title = "Rappel agenda";
  const options = {
    body: `${program.title} commence dans ${reminderMinutes} minutes, à ${program.time}.`,
    badge: "./icons/icon-192.png",
    icon: "./icons/icon-192.png",
    tag: `agenda-${program.id}-${eventStamp}`,
    renotify: true,
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }

    current.remindedFor = eventStamp;
    savePrograms();
    render();
  } catch {
    new Notification(title, options);
  }
}

function showTestNotification() {
  const options = {
    body: "Parfait, les rappels de ton agenda sont activés.",
    icon: "./icons/icon-192.png",
    tag: "agenda-notifications-ready",
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => registration.showNotification("Notifications activées", options));
    return;
  }

  new Notification("Notifications activées", options);
}

function resetForm() {
  form.reset();
  programId.value = "";
  dateInput.value = todayIso;
  cancelEditButton.hidden = true;
  form.querySelector(".primary-button").textContent = "Enregistrer";
}

function fillForm(program) {
  programId.value = program.id;
  titleInput.value = program.title;
  dateInput.value = program.date;
  timeInput.value = program.time;
  categoryInput.value = program.category;
  priorityInput.value = program.priority;
  notesInput.value = program.notes;
  cancelEditButton.hidden = false;
  form.querySelector(".primary-button").textContent = "Modifier";
  titleInput.focus();
}

function render() {
  const search = searchInput.value.trim().toLowerCase();
  const filter = filterInput.value;
  const filtered = programs
    .filter((program) => {
      const text = `${program.title} ${program.category} ${program.notes}`.toLowerCase();
      const isUpcoming = !program.done && program.date >= todayIso;
      const matchesFilter =
        filter === "all" ||
        (filter === "today" && program.date === todayIso) ||
        (filter === "upcoming" && isUpcoming) ||
        (filter === "done" && program.done);

      return text.includes(search) && matchesFilter;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  totalCount.textContent = programs.length;
  todayCount.textContent = programs.filter((program) => program.date === todayIso).length;
  doneCount.textContent = programs.filter((program) => program.done).length;

  programList.innerHTML = filtered.map(createProgramCard).join("");
  emptyState.hidden = filtered.length > 0;
}

function createProgramCard(program) {
  const date = new Date(`${program.date}T${program.time}`);
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `
    <article class="program-card ${program.priority} ${program.done ? "done" : ""}">
      <button class="check-button" data-action="toggle" data-id="${program.id}" aria-label="${program.done ? "Marquer comme non terminé" : "Marquer comme terminé"}">
        ${program.done ? "✓" : ""}
      </button>
      <div>
        <div class="program-title">${escapeHtml(program.title)}</div>
        <div class="meta">
          <span>${formattedDate}</span>
          <span class="pill">${escapeHtml(program.category)}</span>
          <span>${priorityLabel(program.priority)}</span>
        </div>
        ${program.notes ? `<p class="notes">${escapeHtml(program.notes)}</p>` : ""}
      </div>
      <div class="card-actions">
        <button class="icon-button" data-action="edit" data-id="${program.id}" aria-label="Modifier">✎</button>
        <button class="icon-button delete-button" data-action="delete" data-id="${program.id}" aria-label="Supprimer">×</button>
      </div>
    </article>
  `;
}

function getLocalDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function priorityLabel(priority) {
  const labels = {
    low: "Faible",
    normal: "Normale",
    high: "Importante",
  };
  return labels[priority] || "Normale";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
