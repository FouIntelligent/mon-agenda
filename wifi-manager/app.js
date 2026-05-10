const clientsKey = "wifi-manager-clients";
const settingsKey = "wifi-manager-settings";

const tabs = document.querySelectorAll(".tab");
const views = {
  manager: document.querySelector("#manager-view"),
  client: document.querySelector("#client-view"),
};

const form = document.querySelector("#client-form");
const nameInput = document.querySelector("#client-name");
const phoneInput = document.querySelector("#client-phone");
const planInput = document.querySelector("#client-plan");
const priceInput = document.querySelector("#client-price");
const wifiNameInput = document.querySelector("#wifi-name");
const wifiPasswordInput = document.querySelector("#wifi-password");
const searchInput = document.querySelector("#search-client");
const clientList = document.querySelector("#client-list");
const emptyManager = document.querySelector("#empty-manager");
const activeCount = document.querySelector("#active-count");
const blockedCount = document.querySelector("#blocked-count");
const revenueTotal = document.querySelector("#revenue-total");

const accessCodeInput = document.querySelector("#access-code");
const checkCodeButton = document.querySelector("#check-code");
const resultStatus = document.querySelector("#result-status");
const resultName = document.querySelector("#result-name");
const resultPlan = document.querySelector("#result-plan");
const resultWifi = document.querySelector("#result-wifi");
const resultPassword = document.querySelector("#result-password");

let clients = load(clientsKey, []);
let settings = load(settingsKey, {
  wifiName: "Mon WiFi",
  wifiPassword: "wifi-2026",
});

wifiNameInput.value = settings.wifiName;
wifiPasswordInput.value = settings.wifiPassword;

renderManager();

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  clients = [
    ...clients,
    {
      id: crypto.randomUUID(),
      code: createCode(),
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      plan: planInput.value,
      price: Number(priceInput.value || 0),
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ];

  save(clientsKey, clients);
  form.reset();
  priceInput.value = 500;
  renderManager();
});

wifiNameInput.addEventListener("input", saveSettings);
wifiPasswordInput.addEventListener("input", saveSettings);
searchInput.addEventListener("input", renderManager);
checkCodeButton.addEventListener("click", showClientAccess);

clientList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const client = clients.find((item) => item.id === button.dataset.id);
  if (!client) return;

  if (button.dataset.action === "toggle") {
    client.status = client.status === "active" ? "blocked" : "active";
  }

  if (button.dataset.action === "delete") {
    if (!confirm(`Supprimer ${client.name} ?`)) return;
    clients = clients.filter((item) => item.id !== client.id);
  }

  save(clientsKey, clients);
  renderManager();
});

function switchView(viewName) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  Object.entries(views).forEach(([name, view]) => {
    view.classList.toggle("active", name === viewName);
  });
}

function renderManager() {
  const search = searchInput.value.trim().toLowerCase();
  const filtered = clients.filter((client) => {
    const text = `${client.name} ${client.phone} ${client.code} ${client.plan}`.toLowerCase();
    return text.includes(search);
  });

  activeCount.textContent = clients.filter((client) => client.status === "active").length;
  blockedCount.textContent = clients.filter((client) => client.status === "blocked").length;
  revenueTotal.textContent = clients.reduce((sum, client) => sum + Number(client.price || 0), 0).toLocaleString("fr-FR");

  clientList.innerHTML = filtered.map(createClientRow).join("");
  emptyManager.hidden = filtered.length > 0;
}

function createClientRow(client) {
  const createdAt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(client.createdAt));

  return `
    <article class="client-row ${client.status}">
      <div>
        <div class="client-name">${escapeHtml(client.name)}</div>
        <div class="meta">
          <span class="code">${client.code}</span>
          <span>${escapeHtml(client.plan)}</span>
          <span>${Number(client.price || 0).toLocaleString("fr-FR")} FCFA</span>
          <span>${createdAt}</span>
          ${client.phone ? `<span>${escapeHtml(client.phone)}</span>` : ""}
        </div>
      </div>
      <div class="actions">
        <button class="small-button" data-action="toggle" data-id="${client.id}" type="button">
          ${client.status === "active" ? "Bloquer" : "Activer"}
        </button>
        <button class="small-button danger" data-action="delete" data-id="${client.id}" type="button">Supprimer</button>
      </div>
    </article>
  `;
}

function showClientAccess() {
  const code = accessCodeInput.value.trim().toUpperCase();
  const client = clients.find((item) => item.code === code);

  if (!client) {
    resultStatus.textContent = "Code invalide";
    resultStatus.className = "status bad";
    resultName.textContent = "Accès introuvable";
    resultPlan.textContent = "Vérifie ton code ou contacte le gérant.";
    resultWifi.textContent = "-";
    resultPassword.textContent = "-";
    return;
  }

  const isActive = client.status === "active";
  resultStatus.textContent = isActive ? "Actif" : "Bloqué";
  resultStatus.className = `status ${isActive ? "ok" : "bad"}`;
  resultName.textContent = client.name;
  resultPlan.textContent = `${client.plan} - ${Number(client.price || 0).toLocaleString("fr-FR")} FCFA`;
  resultWifi.textContent = isActive ? settings.wifiName : "-";
  resultPassword.textContent = isActive ? settings.wifiPassword : "Demande au gérant";
}

function saveSettings() {
  settings = {
    wifiName: wifiNameInput.value.trim() || "Mon WiFi",
    wifiPassword: wifiPasswordInput.value.trim() || "wifi-2026",
  };
  save(settingsKey, settings);
}

function createCode() {
  return `WF-${Math.floor(1000 + Math.random() * 9000)}`;
}

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
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
