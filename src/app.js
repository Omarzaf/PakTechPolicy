import {
  DOMAIN_TAXONOMY,
  aggregateByDomain,
  aggregateByYear,
  countActiveFilters,
  filterPolicies,
  getIndexStats,
  uniqueValues,
} from "./policy-engine.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  policies: [],
  filtered: [],
  query: "",
  domain: "",
  status: "",
  issuingBody: "",
  year: "",
  sort: "newest",
  view: "directory",
};

const elements = {
  heroForm: $("#hero-search-form"),
  heroQuery: $("#hero-query"),
  filterQuery: $("#filter-query"),
  domain: $("#domain-filter"),
  status: $("#status-filter"),
  body: $("#body-filter"),
  year: $("#year-filter"),
  sort: $("#sort-control"),
  results: $("#policy-results"),
  empty: $("#empty-state"),
  summary: $("#results-summary"),
  activeFilters: $("#active-filters"),
  dialog: $("#policy-dialog"),
  dialogContent: $("#dialog-content"),
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
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
};

const dateLabel = (value, options = {}) => {
  if (!value) return "Date unavailable";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: options.yearOnly ? undefined : "numeric",
    month: options.yearOnly ? undefined : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const domainLabel = (domain) =>
  domain
    .replace(" & online speech", "")
    .replace(" & digital payments", "")
    .replace(" & emerging tech", "")
    .replace(" & data localisation", "")
    .replace(" & access", "");

function setSelectOptions(select, values) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function populateFilters() {
  setSelectOptions(elements.domain, DOMAIN_TAXONOMY);
  setSelectOptions(elements.status, uniqueValues(state.policies, "status"));
  setSelectOptions(elements.body, uniqueValues(state.policies, "issuing_body"));

  const years = [
    ...new Set(
      state.policies
        .map((policy) => String(policy.date_enacted ?? "").slice(0, 4))
        .filter((year) => /^\d{4}$/.test(year)),
    ),
  ].toSorted((a, b) => b.localeCompare(a));
  setSelectOptions(elements.year, years);
}

function renderMetrics() {
  const stats = getIndexStats(state.policies);
  $("#metric-total").textContent = stats.total;
  $("#metric-verified").textContent = stats.verified;
  $("#metric-verified-note").textContent = `${Math.round(
    (stats.verified / Math.max(stats.total, 1)) * 100,
  )}% of current records`;
  $("#metric-domains").textContent = stats.domains || DOMAIN_TAXONOMY.length;
  $("#metric-bodies").textContent = stats.issuingBodies;

  if (stats.latestVerification) {
    const snapshot = $("#snapshot-date");
    snapshot.dateTime = stats.latestVerification;
    snapshot.textContent = dateLabel(stats.latestVerification);
  }
}

function renderDomainChart() {
  const data = aggregateByDomain(state.policies);
  const max = Math.max(...data.map(({ count }) => count), 1);
  $("#domain-chart").innerHTML = data
    .map(
      ({ domain, count }) => `
        <button class="domain-row" type="button" data-domain="${escapeHtml(domain)}"
          aria-label="Filter by ${escapeHtml(domain)}, ${count} records">
          <span class="domain-name">${escapeHtml(domainLabel(domain))}</span>
          <span class="domain-track" aria-hidden="true">
            <span style="--bar-size:${Math.max((count / max) * 100, count ? 6 : 0)}%"></span>
          </span>
          <strong>${count}</strong>
        </button>
      `,
    )
    .join("");
}

function renderYearChart() {
  const allYears = aggregateByYear(state.policies);
  const data = allYears.slice(Math.max(allYears.length - 14, 0));
  const max = Math.max(...data.map(({ count }) => count), 1);
  $("#year-chart").innerHTML = data
    .map(
      ({ year, count }) => `
        <button class="year-column" type="button" data-year="${year}"
          aria-label="Filter by ${year}, ${count} records">
          <span class="year-count">${count}</span>
          <span class="year-bar" style="--bar-size:${Math.max((count / max) * 100, 4)}%"></span>
          <span class="year-label">${year.slice(2)}</span>
        </button>
      `,
    )
    .join("");
}

function verificationBadge(policy) {
  const verified = policy.verification === "Verified";
  return `
    <span class="verification-badge ${verified ? "is-verified" : "is-unverified"}">
      <span aria-hidden="true">${verified ? "✓" : "!"}</span>
      ${verified ? "Source checked" : "Needs review"}
    </span>
  `;
}

function policyCard(policy, index) {
  const domains = (policy.domains ?? [])
    .slice(0, 2)
    .map((domain) => `<span>${escapeHtml(domainLabel(domain))}</span>`)
    .join("");
  const number = String(index + 1).padStart(2, "0");
  return `
    <article class="policy-card" data-policy-id="${escapeHtml(policy.id)}">
      <div class="policy-sequence">${number}</div>
      <div class="policy-card-main">
        <div class="policy-card-topline">
          <div class="domain-pills">${domains}</div>
          ${verificationBadge(policy)}
        </div>
        <h3>
          <button type="button" data-open-policy="${escapeHtml(policy.id)}">
            ${escapeHtml(policy.title)}
          </button>
        </h3>
        <p>${escapeHtml(policy.summary)}</p>
        <div class="policy-meta">
          <span>${escapeHtml(policy.type)}</span>
          <span>${escapeHtml(policy.issuing_body)}</span>
          <time datetime="${escapeHtml(policy.date_enacted)}">${dateLabel(
            policy.date_enacted,
          )}</time>
        </div>
      </div>
      <div class="policy-card-side">
        <span class="status-badge status-${escapeHtml(
          policy.status.toLocaleLowerCase().replaceAll(/\s+/g, "-"),
        )}">${escapeHtml(policy.status)}</span>
        <button class="policy-arrow" type="button" data-open-policy="${escapeHtml(
          policy.id,
        )}" aria-label="Open ${escapeHtml(policy.title)}">↗</button>
      </div>
    </article>
  `;
}

function timelineCard(policy, index, policies) {
  const currentYear = String(policy.date_enacted).slice(0, 4);
  const previousYear =
    index > 0 ? String(policies[index - 1].date_enacted).slice(0, 4) : null;
  const yearHeading =
    currentYear !== previousYear
      ? `<div class="timeline-year"><strong>${escapeHtml(currentYear)}</strong><span></span></div>`
      : "";
  return `
    ${yearHeading}
    <article class="timeline-item">
      <div class="timeline-marker" aria-hidden="true"></div>
      <time datetime="${escapeHtml(policy.date_enacted)}">${dateLabel(
        policy.date_enacted,
      )}</time>
      <div>
        <p>${escapeHtml(policy.type)} · ${escapeHtml(policy.issuing_body)}</p>
        <h3>
          <button type="button" data-open-policy="${escapeHtml(policy.id)}">
            ${escapeHtml(policy.title)}
          </button>
        </h3>
        <div class="timeline-badges">
          <span class="status-badge status-${escapeHtml(
            policy.status.toLocaleLowerCase().replaceAll(/\s+/g, "-"),
          )}">${escapeHtml(policy.status)}</span>
          ${verificationBadge(policy)}
        </div>
      </div>
    </article>
  `;
}

function renderActiveFilters() {
  const entries = [
    ["query", state.query, `Search: “${state.query}”`],
    ["domain", state.domain, state.domain],
    ["status", state.status, state.status],
    ["issuingBody", state.issuingBody, state.issuingBody],
    ["year", state.year, state.year],
  ].filter(([, value]) => value);

  elements.activeFilters.innerHTML = entries
    .map(
      ([key, , label]) => `
        <button type="button" data-remove-filter="${key}">
          ${escapeHtml(label)} <span aria-hidden="true">×</span>
        </button>
      `,
    )
    .join("");
  elements.activeFilters.hidden = entries.length === 0;
}

function renderResults() {
  state.filtered = filterPolicies(state.policies, state);
  const noun = state.filtered.length === 1 ? "instrument" : "instruments";
  const activeCount = countActiveFilters(state);
  elements.summary.textContent = `${state.filtered.length} ${noun}${
    activeCount ? ` · ${activeCount} active filter${activeCount === 1 ? "" : "s"}` : ""
  }`;

  elements.results.className = `policy-results view-${state.view}`;
  elements.results.innerHTML =
    state.view === "timeline"
      ? state.filtered
          .map((policy, index, policies) => timelineCard(policy, index, policies))
          .join("")
      : state.filtered.map(policyCard).join("");

  elements.empty.hidden = state.filtered.length !== 0;
  renderActiveFilters();
  syncUrl();
}

function syncControls() {
  elements.heroQuery.value = state.query;
  elements.filterQuery.value = state.query;
  elements.domain.value = state.domain;
  elements.status.value = state.status;
  elements.body.value = state.issuingBody;
  elements.year.value = state.year;
  elements.sort.value = state.sort;
  $$("[data-view]").forEach((button) => {
    const selected = button.dataset.view === state.view;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function updateState(next, options = {}) {
  Object.assign(state, next);
  syncControls();
  renderResults();
  if (options.focusResults) {
    elements.results.focus({ preventScroll: true });
    $("#directory").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function clearFilters() {
  updateState({
    query: "",
    domain: "",
    status: "",
    issuingBody: "",
    year: "",
  });
}

function syncUrl() {
  const params = new URLSearchParams();
  for (const [key, value] of [
    ["q", state.query],
    ["domain", state.domain],
    ["status", state.status],
    ["body", state.issuingBody],
    ["year", state.year],
    ["view", state.view === "timeline" ? state.view : ""],
  ]) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  const hash = location.hash.startsWith("#policy=") ? location.hash : "";
  history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${hash}`);
}

function restoreUrlState() {
  const params = new URLSearchParams(location.search);
  state.query = params.get("q") ?? "";
  state.domain = params.get("domain") ?? "";
  state.status = params.get("status") ?? "";
  state.issuingBody = params.get("body") ?? "";
  state.year = params.get("year") ?? "";
  state.view = params.get("view") === "timeline" ? "timeline" : "directory";
}

function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Official source";
  }
}

function openPolicy(id, updateHash = true) {
  const policy = state.policies.find((entry) => entry.id === id);
  if (!policy) return;

  const related = (policy.related ?? [])
    .map((relatedId) => state.policies.find((entry) => entry.id === relatedId))
    .filter(Boolean);
  const secondary = (policy.secondary_sources ?? []).filter(Boolean);

  elements.dialogContent.innerHTML = `
    <div class="dialog-hero">
      <div class="dialog-kicker">
        <span>${escapeHtml(policy.type)}</span>
        <span>${escapeHtml(policy.status)}</span>
        ${verificationBadge(policy)}
      </div>
      <p class="dialog-short-name">${escapeHtml(policy.short_name || policy.type)}</p>
      <h2 id="dialog-title">${escapeHtml(policy.title)}</h2>
      <p class="dialog-summary">${escapeHtml(policy.summary)}</p>
      <a class="primary-source-link" href="${safeUrl(
        policy.primary_source_url,
      )}" target="_blank" rel="noreferrer">
        Open official source
        <span>↗</span>
        <small>${escapeHtml(sourceHost(policy.primary_source_url))}</small>
      </a>
    </div>
    <div class="dialog-grid">
      <section>
        <h3>Key provisions</h3>
        <ul class="provision-list">
          ${(policy.key_provisions ?? [])
            .map((provision) => `<li>${escapeHtml(provision)}</li>`)
            .join("")}
        </ul>
      </section>
      <aside class="fact-sheet">
        <h3>Instrument record</h3>
        <dl>
          <div><dt>Issuing body</dt><dd>${escapeHtml(policy.issuing_body)}</dd></div>
          <div><dt>Date</dt><dd>${dateLabel(policy.date_enacted)}</dd></div>
          <div><dt>Last amended</dt><dd>${
            policy.last_amended ? dateLabel(policy.last_amended) : "Not recorded"
          }</dd></div>
          <div><dt>Last verified</dt><dd>${dateLabel(policy.last_verified)}</dd></div>
        </dl>
      </aside>
      <section>
        <h3>Who it affects</h3>
        <div class="affects-list">
          ${(policy.affects ?? []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
      </section>
      ${
        policy.controversy
          ? `<section class="caution-note"><h3>Contested points</h3><p>${escapeHtml(
              policy.controversy,
            )}</p></section>`
          : ""
      }
      ${
        related.length
          ? `<section><h3>Related instruments</h3><ul class="related-list">${related
              .map(
                (item) =>
                  `<li><button type="button" data-open-policy="${escapeHtml(
                    item.id,
                  )}">${escapeHtml(item.title)} <span>→</span></button></li>`,
              )
              .join("")}</ul></section>`
          : ""
      }
      ${
        secondary.length
          ? `<section><h3>Supporting material</h3><ul class="source-list">${secondary
              .map(
                (url) =>
                  `<li><a href="${safeUrl(
                    url,
                  )}" target="_blank" rel="noreferrer">${escapeHtml(
                    sourceHost(url),
                  )} <span>↗</span></a></li>`,
              )
              .join("")}</ul></section>`
          : ""
      }
    </div>
    <p class="legal-note">
      This entry is an informational research summary, not legal advice. Check
      the official instrument and later amendments before relying on it.
    </p>
  `;

  if (!elements.dialog.open) elements.dialog.showModal();
  if (updateHash) {
    history.replaceState(null, "", `${location.pathname}${location.search}#policy=${id}`);
  }
}

function closeDialog() {
  elements.dialog.close();
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

function bindEvents() {
  elements.heroForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateState({ query: elements.heroQuery.value }, { focusResults: true });
  });
  elements.filterQuery.addEventListener("input", (event) =>
    updateState({ query: event.target.value }),
  );
  elements.domain.addEventListener("change", (event) =>
    updateState({ domain: event.target.value }),
  );
  elements.status.addEventListener("change", (event) =>
    updateState({ status: event.target.value }),
  );
  elements.body.addEventListener("change", (event) =>
    updateState({ issuingBody: event.target.value }),
  );
  elements.year.addEventListener("change", (event) =>
    updateState({ year: event.target.value }),
  );
  elements.sort.addEventListener("change", (event) =>
    updateState({ sort: event.target.value }),
  );
  $("#clear-filters").addEventListener("click", clearFilters);
  $("[data-clear-all]").addEventListener("click", clearFilters);

  document.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-open-policy]");
    if (openButton) {
      openPolicy(openButton.dataset.openPolicy);
      return;
    }
    const domainButton = event.target.closest("[data-domain], [data-quick-domain]");
    if (domainButton) {
      updateState(
        { domain: domainButton.dataset.domain ?? domainButton.dataset.quickDomain },
        { focusResults: true },
      );
      return;
    }
    const yearButton = event.target.closest("[data-year]");
    if (yearButton) {
      updateState({ year: yearButton.dataset.year }, { focusResults: true });
      return;
    }
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      updateState({ view: viewButton.dataset.view });
      return;
    }
    const removeButton = event.target.closest("[data-remove-filter]");
    if (removeButton) {
      updateState({ [removeButton.dataset.removeFilter]: "" });
    }
  });

  $(".dialog-close").addEventListener("click", closeDialog);
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) closeDialog();
  });
  elements.dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  window.addEventListener("hashchange", () => {
    const id = location.hash.startsWith("#policy=")
      ? decodeURIComponent(location.hash.replace("#policy=", ""))
      : null;
    if (id) openPolicy(id, false);
    else if (elements.dialog.open) elements.dialog.close();
  });
}

async function init() {
  try {
    const response = await fetch("./data/policies.json");
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    state.policies = await response.json();
    restoreUrlState();
    populateFilters();
    renderMetrics();
    renderDomainChart();
    renderYearChart();
    bindEvents();
    syncControls();
    renderResults();

    if (location.hash.startsWith("#policy=")) {
      openPolicy(decodeURIComponent(location.hash.replace("#policy=", "")), false);
    }
  } catch (error) {
    console.error(error);
    elements.summary.textContent = "The policy dataset could not be loaded.";
    elements.results.innerHTML = `
      <div class="load-error">
        <h3>Data unavailable</h3>
        <p>Reload the page or verify that <code>data/policies.json</code> exists.</p>
      </div>
    `;
  }
}

init();
