import {
  DOMAIN_TAXONOMY,
  aggregateByDomain,
  aggregateByYear,
  countActiveFilters,
  filterPolicies,
  getIndexStats,
  uniqueValues,
} from "./policy-engine.js";
import {
  decodePolicyIdHash,
  formatIndicatorValue,
  formatPolicyDate,
  getLatestObservation,
  getSparklinePoints,
  isIndicatorPayload,
} from "./ui-utils.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  policies: [],
  indicators: [],
  filtered: [],
  query: "",
  domain: "",
  status: "",
  issuingBody: "",
  year: "",
  verification: "",
  sort: "newest",
  view: "directory",
};

const elements = {
  heroForm: $("#hero-search-form"),
  heroQuery: $("#hero-query"),
  filterQuery: $("#filter-query"),
  domain: $("#domain-filter"),
  status: $("#status-filter"),
  verification: $("#verification-filter"),
  body: $("#body-filter"),
  year: $("#year-filter"),
  sort: $("#sort-control"),
  results: $("#policy-results"),
  empty: $("#empty-state"),
  summary: $("#results-summary"),
  announcement: $("#results-announcement"),
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

const dateLabel = formatPolicyDate;
const preferredScrollBehavior = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";

const verificationLabel = (value) =>
  value === "Verified" ? "Source checked" : value === "Unverified" ? "Needs review" : value;

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
        <button class="domain-row${state.domain === domain ? " is-selected" : ""}"
          type="button"
          data-domain="${escapeHtml(domain)}"
          aria-pressed="${state.domain === domain}"
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
        <button class="year-column${state.year === year ? " is-selected" : ""}"
          type="button"
          data-year="${year}"
          aria-pressed="${state.year === year}"
          aria-label="Filter by ${year}, ${count} records">
          <span class="year-count">${count}</span>
          <span class="year-bar" style="--bar-size:${Math.max((count / max) * 100, 4)}%"></span>
          <span class="year-label">${year}</span>
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
          <div class="card-badge-group">
            <span class="status-badge mobile-status status-${escapeHtml(
              policy.status.toLocaleLowerCase().replaceAll(/\s+/g, "-"),
            )}">${escapeHtml(policy.status)}</span>
            ${verificationBadge(policy)}
          </div>
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
            { precision: policy.date_precision },
          )}</time>
        </div>
      </div>
      <div class="policy-card-side">
        <span class="status-badge desktop-status status-${escapeHtml(
          policy.status.toLocaleLowerCase().replaceAll(/\s+/g, "-"),
        )}">${escapeHtml(policy.status)}</span>
        <span class="policy-arrow" aria-hidden="true">↗</span>
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
        { precision: policy.date_precision },
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
    ["verification", state.verification, verificationLabel(state.verification)],
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

let resultAnnouncementTimer;
function announceResultSummary(message) {
  window.clearTimeout(resultAnnouncementTimer);
  resultAnnouncementTimer = window.setTimeout(() => {
    elements.announcement.textContent = message;
  }, 250);
}

function renderResults() {
  // The timeline groups records under year headings by comparing each item to
  // its neighbour, which only reads correctly when the list is in date order.
  // A title sort would scatter and repeat those headings, so force a
  // chronological order (honouring newest/oldest) for the timeline view.
  const effectiveSort =
    state.view === "timeline" && state.sort === "title" ? "newest" : state.sort;
  state.filtered = filterPolicies(state.policies, { ...state, sort: effectiveSort });
  const noun = state.filtered.length === 1 ? "instrument" : "instruments";
  const activeCount = countActiveFilters(state);
  const summary = `${state.filtered.length} ${noun}${
    activeCount ? ` · ${activeCount} active filter${activeCount === 1 ? "" : "s"}` : ""
  }`;
  elements.summary.textContent = summary;
  announceResultSummary(summary);

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
  elements.verification.value = state.verification;
  elements.body.value = state.issuingBody;
  elements.year.value = state.year;
  elements.sort.value = state.sort;
  $$("[data-view]").forEach((button) => {
    const selected = button.dataset.view === state.view;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $$("[data-domain], [data-quick-domain]").forEach((button) => {
    const selected =
      (button.dataset.domain ?? button.dataset.quickDomain) === state.domain;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $$("[data-year]").forEach((button) => {
    const selected = button.dataset.year === state.year;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function updateState(next, options = {}) {
  Object.assign(state, next);
  syncControls();
  renderResults();
  if (options.focusResults) {
    elements.results.focus({ preventScroll: true });
    $("#directory").scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
  }
}

function clearFilters() {
  updateState({
    query: "",
    domain: "",
    status: "",
    issuingBody: "",
    year: "",
    verification: "",
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
    ["verification", state.verification],
    ["sort", state.sort === "newest" ? "" : state.sort],
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
  state.verification = params.get("verification") ?? "";
  state.sort = ["newest", "oldest", "title"].includes(params.get("sort"))
    ? params.get("sort")
    : "newest";
  state.view = params.get("view") === "timeline" ? "timeline" : "directory";
}

function hasOption(select, value) {
  return [...select.options].some((option) => option.value === value);
}

function sanitizeRestoredState() {
  if (!hasOption(elements.domain, state.domain)) state.domain = "";
  if (!hasOption(elements.status, state.status)) state.status = "";
  if (!hasOption(elements.verification, state.verification)) {
    state.verification = "";
  }
  if (!hasOption(elements.body, state.issuingBody)) state.issuingBody = "";
  if (!hasOption(elements.year, state.year)) state.year = "";
}

function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Official source";
  }
}

function renderIndicatorSource(source) {
  const url = typeof source === "string" ? source : source?.url;
  if (typeof url !== "string") return "";

  const title =
    typeof source === "object" && source
      ? source.title ?? source.publisher ?? source.label ?? sourceHost(url)
      : sourceHost(url);
  const locator = typeof source === "object" && source ? source.locator : "";
  return `<li><a href="${safeUrl(url)}" target="_blank" rel="noreferrer">${escapeHtml(
    title,
  )}<span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>${
    locator ? `<small>${escapeHtml(locator)}</small>` : ""
  }</li>`;
}

function getIndicatorGroupScale(group) {
  const values = group.series.flatMap((series) =>
    series.observations
      .map(({ value }) => value)
      .filter((value) => typeof value === "number" && Number.isFinite(value)),
  );
  return {
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
}

function renderIndicatorPlot(series, group, scale) {
  const points = getSparklinePoints(series.observations, {
    minValue: scale.min,
    maxValue: scale.max,
  });
  const first = series.observations.find(
    ({ value }) => typeof value === "number" && Number.isFinite(value),
  );
  const latest = getLatestObservation(series.observations);
  const latestValue = latest
    ? formatIndicatorValue(latest.value, group.format)
    : "No current observation";
  const firstValue = first ? formatIndicatorValue(first.value, group.format) : "unavailable";
  const ariaLabel = group.comparison_allowed
    ? `${series.label}, ${group.label}. ${first?.label ?? "First period"}: ${firstValue}. ${
        latest?.label ?? "Latest period"
      }: ${latestValue}. Shared group scale ${formatIndicatorValue(
        scale.min,
        group.format,
      )} to ${formatIndicatorValue(scale.max, group.format)}.`
    : `${series.label}, ${group.label}. Snapshot ${latest?.label ?? "period unavailable"}: ${latestValue}. Values are not directly comparable.`;
  const path = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const markerClass = group.comparison_allowed ? "" : " is-snapshot";

  return `
    <svg class="indicator-plot${markerClass}" viewBox="0 0 280 72" role="img" aria-label="${escapeHtml(
      ariaLabel,
    )}">
      ${
        group.comparison_allowed && points.length > 1
          ? `<polyline class="indicator-line" points="${path}" />`
          : ""
      }
      ${points
        .map(
          (point) =>
            `<circle class="indicator-point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(
              2,
            )}" r="3" />`,
        )
        .join("")}
    </svg>
  `;
}

function renderIndicatorGroup(group) {
  const scale = getIndicatorGroupScale(group);
  const comparability = group.comparison_allowed
    ? `<p class="indicator-scale-note">Shared scale: ${escapeHtml(
        formatIndicatorValue(scale.min, group.format),
      )}–${escapeHtml(formatIndicatorValue(scale.max, group.format))}</p>`
    : '<p class="indicator-comparability">Not directly comparable</p>';
  const currentValues = group.series
    .map((series) => {
      const latest = getLatestObservation(series.observations);
      return `
        <article class="indicator-series">
          <div class="indicator-series-copy">
            <h5>${escapeHtml(series.label)}</h5>
            <p class="indicator-current-value">${escapeHtml(
              latest ? formatIndicatorValue(latest.value, group.format) : "No current observation",
            )}</p>
            <p class="indicator-current-period">${escapeHtml(latest?.label ?? "Period unavailable")}</p>
          </div>
          ${renderIndicatorPlot(series, group, scale)}
        </article>
      `;
    })
    .join("");
  const rows = group.series
    .flatMap((series) =>
      series.observations.map((observation) => {
        const marker = observation.provisional
          ? "Provisional"
          : observation.revised
            ? "Revised"
            : "Reported";
        return `<tr>
          <th scope="row">${escapeHtml(series.label)}</th>
          <td>${escapeHtml(observation.label || observation.period)}</td>
          <td>${escapeHtml(formatIndicatorValue(observation.value, group.format))}</td>
          <td>${escapeHtml(marker)}</td>
          <td>${escapeHtml(observation.note ?? "—")}</td>
        </tr>`;
      }),
    )
    .join("");

  return `
    <article class="indicator-group">
      <div class="indicator-group-heading">
        <div><h4>${escapeHtml(group.label)}</h4><p>${escapeHtml(group.unit)}</p></div>
        ${comparability}
      </div>
      <div class="indicator-series-list">${currentValues}</div>
      <details class="indicator-raw-data">
        <summary>View raw data</summary>
        <div class="indicator-table-wrap">
          <table>
            <caption>${escapeHtml(group.label)} raw observations</caption>
            <thead><tr><th scope="col">Series</th><th scope="col">Period</th><th scope="col">Value</th><th scope="col">Status</th><th scope="col">Notes</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>
    </article>
  `;
}

function renderEvidenceOverview() {
  const container = $("#evidence-overview");
  if (!state.indicators.length) {
    container.innerHTML = `
      <div class="load-error" role="alert">
        <h3>Indicator layer unavailable</h3>
        <p>The policy directory is available, but its contextual metrics could not be loaded.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.indicators
    .map((indicator) => {
      const latestValues = indicator.groups
        .flatMap((group) =>
          group.series.map((series) => {
            const latest = getLatestObservation(series.observations);
            return latest
              ? {
                  label:
                    indicator.groups.length > 1
                      ? `${group.label}: ${series.label}`
                      : series.label,
                  value: formatIndicatorValue(latest.value, group.format),
                  period: latest.label,
                }
              : null;
          }),
        )
        .filter(Boolean)
        .slice(0, 3);
      const source = indicator.sources[0];
      const firstPolicy = indicator.policy_ids[0];
      return `
        <article class="evidence-card">
          <header>
            <span>${escapeHtml(indicator.confidence)} confidence</span>
            <span>Latest: ${escapeHtml(indicator.latest_period)}</span>
          </header>
          <h3>${escapeHtml(indicator.title)}</h3>
          <p>${escapeHtml(indicator.summary)}</p>
          <dl>
            ${latestValues
              .map(
                ({ label, value, period }) =>
                  `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(
                    value,
                  )}<small>${escapeHtml(period)}</small></dd></div>`,
              )
              .join("")}
          </dl>
          <p class="evidence-caveat">${escapeHtml(indicator.risks)}</p>
          <div class="evidence-card-links">
            <a href="#policy=${escapeHtml(firstPolicy)}">See linked policy</a>
            <a href="${safeUrl(source.url)}" target="_blank" rel="noreferrer">
              Official source <span aria-hidden="true">↗</span>
              <span class="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPolicyIndicators(policyId) {
  const indicators = state.indicators.filter((indicator) => indicator.policy_ids.includes(policyId));
  if (!indicators.length) return "";

  return `
    <section class="indicator-section" aria-labelledby="on-the-ground-heading">
      <div class="indicator-section-heading">
        <h3 id="on-the-ground-heading">On the ground</h3>
        <p>These sourced measurements sit alongside this instrument; they do not establish that it caused a change.</p>
      </div>
      ${indicators
        .map(
          (indicator) => `
            <article class="indicator-card">
              <header>
                <h4>${escapeHtml(indicator.title)}</h4>
                <p>${escapeHtml(indicator.summary)}</p>
              </header>
              <dl class="indicator-meta">
                <div><dt>Cadence</dt><dd>${escapeHtml(indicator.cadence)}</dd></div>
                <div><dt>Lag</dt><dd>${escapeHtml(indicator.lag)}</dd></div>
                <div><dt>Confidence</dt><dd>${escapeHtml(indicator.confidence)}</dd></div>
                <div><dt>Latest period</dt><dd>${escapeHtml(indicator.latest_period)}</dd></div>
              </dl>
              <div class="indicator-groups">${indicator.groups.map(renderIndicatorGroup).join("")}</div>
              <div class="indicator-notes">
                ${
                  indicator.methodology_note
                    ? `<p><strong>Methodology:</strong> ${escapeHtml(indicator.methodology_note)}</p>`
                    : ""
                }
                ${
                  indicator.risks
                    ? `<p><strong>Interpretation notes:</strong> ${escapeHtml(indicator.risks)}</p>`
                    : ""
                }
              </div>
              ${
                indicator.sources.length
                  ? `<div class="indicator-sources"><h5>Official sources</h5><ul class="source-list indicator-source-list">${indicator.sources
                      .map(renderIndicatorSource)
                      .join("")}</ul></div>`
                  : ""
              }
            </article>
          `,
        )
        .join("")}
    </section>
  `;
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
      <h2 id="dialog-title" tabindex="-1">${escapeHtml(policy.title)}</h2>
      <p class="dialog-summary">${escapeHtml(policy.summary)}</p>
      <a class="primary-source-link" href="${safeUrl(
        policy.primary_source_url,
      )}" target="_blank" rel="noreferrer">
        Open official source
        <span aria-hidden="true">↗</span>
        <small>${escapeHtml(sourceHost(policy.primary_source_url))}</small>
        <span class="sr-only"> (opens in a new tab)</span>
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
          <div><dt>Date</dt><dd>${dateLabel(policy.date_enacted, {
            precision: policy.date_precision,
          })}</dd></div>
          <div><dt>Last amended</dt><dd>${
            policy.last_amended
              ? dateLabel(policy.last_amended, {
                  precision: policy.last_amended_precision,
                })
              : "Not recorded"
          }</dd></div>
          <div><dt>Last verified</dt><dd>${dateLabel(policy.last_verified)}</dd></div>
        </dl>
        ${
          policy.verification_note
            ? `<div class="record-verification-note"><strong>Verification note</strong><p>${escapeHtml(
                policy.verification_note,
              )}</p></div>`
            : ""
        }
      </aside>
      ${renderPolicyIndicators(policy.id)}
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
                  )} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></li>`,
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
  requestAnimationFrame(() => $("#dialog-title", elements.dialogContent)?.focus());
  if (updateHash) {
    history.pushState(null, "", `${location.pathname}${location.search}#policy=${id}`);
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
  elements.verification.addEventListener("change", (event) =>
    updateState({ verification: event.target.value }),
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
      const view = viewButton.dataset.view;
      const next = { view };
      // A title sort is meaningless for a timeline; reset it so the sort
      // control reflects the chronological order the timeline actually uses.
      if (view === "timeline" && state.sort === "title") next.sort = "newest";
      updateState(next);
      return;
    }
    const removeButton = event.target.closest("[data-remove-filter]");
    if (removeButton) {
      updateState({ [removeButton.dataset.removeFilter]: "" });
      elements.results.focus({ preventScroll: true });
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
    const id = decodePolicyIdHash(location.hash);
    if (id) openPolicy(id, false);
    else if (elements.dialog.open) elements.dialog.close();
  });
}

async function init() {
  try {
    const policyRequest = fetch("./data/policies.json");
    const indicatorRequest = fetch("./data/policy-indicators.json")
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
    const [response, indicatorPayload] = await Promise.all([policyRequest, indicatorRequest]);
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    state.policies = await response.json();
    state.indicators = isIndicatorPayload(indicatorPayload) ? indicatorPayload.indicators : [];
    if (!state.indicators.length) {
      const alert = $("#data-alert");
      alert.hidden = false;
      alert.textContent =
        "The policy directory loaded, but contextual technology indicators are unavailable or invalid.";
    }
    restoreUrlState();
    populateFilters();
    sanitizeRestoredState();
    renderMetrics();
    renderEvidenceOverview();
    renderDomainChart();
    renderYearChart();
    bindEvents();
    syncControls();
    renderResults();

    const policyId = decodePolicyIdHash(location.hash);
    if (policyId) openPolicy(policyId, false);
  } catch (error) {
    console.error(error);
    elements.summary.textContent = "The policy dataset could not be loaded.";
    elements.results.innerHTML = `
      <div class="load-error" role="alert">
        <h3>Data unavailable</h3>
        <p>Reload the page or verify that <code>data/policies.json</code> exists.</p>
      </div>
    `;
  }
}

init();
