import {
  filterOfficialSources,
  getOfficialSourceStats,
  uniqueSourceValues,
} from "./source-engine.js";
import { getSourceBrand } from "./source-brands.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  sources: [],
  query: "",
  topic: "",
  publisherScope: "",
  resourceType: "",
  accessStatus: "",
};

const elements = {
  query: $("#source-query"),
  topic: $("#source-topic"),
  publisherScope: $("#source-scope"),
  resourceType: $("#source-type"),
  accessStatus: $("#source-access"),
  summary: $("#source-summary"),
  announcement: $("#source-announcement"),
  results: $("#source-results"),
  empty: $("#source-empty"),
  activeFilters: $("#source-active-filters"),
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "#";
  } catch {
    return "#";
  }
};

const formatDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
};

const sourceHost = (value) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Official source";
  }
};

function setOptions(select, values) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function renderMetrics(asOf) {
  const stats = getOfficialSourceStats(state.sources);
  $("#source-total").textContent = stats.total;
  $("#source-pakistan").textContent = stats.pakistan;
  $("#source-international").textContent = stats.international;
  $("#source-publishers").textContent = stats.publishers;
  $("#source-access-note").textContent = `${stats.limited} access limitation${
    stats.limited === 1 ? "" : "s"
  } flagged`;
  const date = $("#source-as-of");
  date.dateTime = asOf;
  date.textContent = formatDate(asOf);
}

function sourceCard(source) {
  const topics = source.topics
    .map((topic) => `<span class="source-topic">${escapeHtml(topic)}</span>`)
    .join("");
  const accessModes = source.access_modes.map(escapeHtml).join(" · ");
  const brand = getSourceBrand(source.publisher);
  const brandMark = brand
    ? `
      <span class="source-logo${brand.tone === "dark" ? " source-logo--dark" : ""}">
        <img
          src="${escapeHtml(brand.asset)}"
          alt=""
          width="48"
          height="48"
          decoding="async"
        />
      </span>
    `
    : "";
  return `
    <article class="source-card source-card--${source.publisher_scope.toLowerCase()}">
      <header>
        <div>
          <span class="official-badge">${escapeHtml(source.publisher_scope)} official</span>
          <span class="source-status ${
            source.access_status === "Limited" ? "is-limited" : ""
          }"><span aria-hidden="true"></span>${escapeHtml(
            source.access_status,
          )} · checked ${escapeHtml(formatDate(source.last_checked))}</span>
        </div>
        <p>${escapeHtml(source.resource_type)}</p>
      </header>
      <div class="source-card-main">
        <div class="source-brand">
          ${brandMark}
          <p class="source-publisher">${escapeHtml(source.publisher)}</p>
        </div>
        <h3>${escapeHtml(source.title)}</h3>
        <p>${escapeHtml(source.what_it_covers)}</p>
        <div class="source-topics">${topics}</div>
      </div>
      <dl class="source-facts">
        <div><dt>Pakistan coverage</dt><dd>${escapeHtml(source.pakistan_coverage)}</dd></div>
        <div><dt>Update cadence</dt><dd>${escapeHtml(source.cadence)}</dd></div>
        <div><dt>Latest period</dt><dd>${escapeHtml(source.latest_period)}</dd></div>
        <div><dt>Access</dt><dd>${accessModes}</dd></div>
      </dl>
      <div class="source-limitation">
        <strong>Read before comparing</strong>
        <p>${escapeHtml(source.limitations)}</p>
      </div>
      <a class="source-link" href="${safeUrl(source.url)}" target="_blank" rel="noreferrer">
        Open official source <span aria-hidden="true">↗</span>
        <small>${escapeHtml(sourceHost(source.url))}</small>
        <span class="sr-only"> (opens in a new tab)</span>
      </a>
    </article>
  `;
}

let announceTimer;
function announceSummary(message) {
  window.clearTimeout(announceTimer);
  announceTimer = window.setTimeout(() => {
    elements.announcement.textContent = message;
  }, 250);
}

function renderActiveFilters() {
  const entries = [
    ["query", state.query, `Search: “${state.query}”`],
    ["topic", state.topic, state.topic],
    ["publisherScope", state.publisherScope, `${state.publisherScope} official`],
    ["resourceType", state.resourceType, state.resourceType],
    ["accessStatus", state.accessStatus, `${state.accessStatus} access`],
  ].filter(([, value]) => value);

  elements.activeFilters.innerHTML = entries
    .map(
      ([key, , label]) => `
        <button type="button" data-remove-source-filter="${key}">
          ${escapeHtml(label)} <span aria-hidden="true">×</span>
        </button>
      `,
    )
    .join("");
  elements.activeFilters.hidden = entries.length === 0;
}

function syncUrl() {
  const params = new URLSearchParams();
  for (const [key, value] of [
    ["q", state.query],
    ["topic", state.topic],
    ["scope", state.publisherScope],
    ["type", state.resourceType],
    ["access", state.accessStatus],
  ]) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
}

function renderSources({ announce = false } = {}) {
  const matches = filterOfficialSources(state.sources, state);
  const message = `${matches.length} official ${matches.length === 1 ? "resource" : "resources"}`;
  elements.summary.textContent = message;
  elements.results.innerHTML = matches.map(sourceCard).join("");
  elements.empty.hidden = matches.length !== 0;
  renderActiveFilters();
  syncUrl();
  if (announce) announceSummary(message);
}

function syncControls() {
  elements.query.value = state.query;
  elements.topic.value = state.topic;
  elements.publisherScope.value = state.publisherScope;
  elements.resourceType.value = state.resourceType;
  elements.accessStatus.value = state.accessStatus;
  $$("[data-topic-shortcut]").forEach((button) => {
    const selected = button.dataset.topicShortcut === state.topic;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function updateState(next, options = {}) {
  Object.assign(state, next);
  syncControls();
  renderSources({ announce: true });
  if (options.focusResults) {
    elements.results.focus({ preventScroll: true });
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
      ? "auto"
      : "smooth";
    elements.results.scrollIntoView({ behavior, block: "start" });
  }
}

function clearFilters() {
  updateState({
    query: "",
    topic: "",
    publisherScope: "",
    resourceType: "",
    accessStatus: "",
  });
}

function restoreUrlState() {
  const params = new URLSearchParams(location.search);
  state.query = params.get("q") ?? "";
  state.topic = params.get("topic") ?? "";
  state.publisherScope = params.get("scope") ?? "";
  state.resourceType = params.get("type") ?? "";
  state.accessStatus = params.get("access") ?? "";
}

function hasOption(select, value) {
  return [...select.options].some((option) => option.value === value);
}

function sanitizeRestoredState() {
  if (!hasOption(elements.topic, state.topic)) state.topic = "";
  if (!hasOption(elements.publisherScope, state.publisherScope)) {
    state.publisherScope = "";
  }
  if (!hasOption(elements.resourceType, state.resourceType)) {
    state.resourceType = "";
  }
  if (!hasOption(elements.accessStatus, state.accessStatus)) {
    state.accessStatus = "";
  }
}

function bindEvents() {
  $("#source-filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    updateState({ query: elements.query.value }, { focusResults: true });
  });
  elements.query.addEventListener("input", (event) => updateState({ query: event.target.value }));
  elements.topic.addEventListener("change", (event) =>
    updateState({ topic: event.target.value }),
  );
  elements.publisherScope.addEventListener("change", (event) =>
    updateState({ publisherScope: event.target.value }),
  );
  elements.resourceType.addEventListener("change", (event) =>
    updateState({ resourceType: event.target.value }),
  );
  elements.accessStatus.addEventListener("change", (event) =>
    updateState({ accessStatus: event.target.value }),
  );
  $("#clear-source-filters").addEventListener("click", clearFilters);
  $("[data-clear-source-filters]").addEventListener("click", clearFilters);

  document.addEventListener("click", (event) => {
    const shortcut = event.target.closest("[data-topic-shortcut]");
    if (shortcut) {
      updateState({ topic: shortcut.dataset.topicShortcut }, { focusResults: true });
      return;
    }
    const remove = event.target.closest("[data-remove-source-filter]");
    if (remove) {
      const key = remove.dataset.removeSourceFilter;
      updateState({ [key]: "" });
      elements[key]?.focus();
    }
  });
}

async function init() {
  try {
    const response = await fetch("./data/official-sources.json");
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    const payload = await response.json();
    state.sources = payload.sources;
    restoreUrlState();
    setOptions(elements.topic, uniqueSourceValues(state.sources, "topics"));
    setOptions(elements.resourceType, uniqueSourceValues(state.sources, "resource_type"));
    setOptions(elements.accessStatus, uniqueSourceValues(state.sources, "access_status"));
    sanitizeRestoredState();
    renderMetrics(payload.as_of);
    bindEvents();
    syncControls();
    renderSources();
  } catch (error) {
    console.error(error);
    elements.summary.textContent = "The official-source directory could not be loaded.";
    elements.results.innerHTML = `
      <div class="load-error" role="alert">
        <h3>Source directory unavailable</h3>
        <p>Reload the page or use the reviewed JSON download below.</p>
        <a href="./data/official-sources.json">Open official-sources.json</a>
      </div>
    `;
  }
}

init();
