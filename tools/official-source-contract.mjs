export const OFFICIAL_SOURCE_TOPICS = Object.freeze([
  "Connectivity & affordability",
  "Digital economy & payments",
  "Digital government",
  "Cybersecurity & regulation",
  "Innovation & skills",
  "Laws, policies & standards",
]);

const PUBLISHER_SCOPES = new Set(["Pakistan", "International"]);
const ACCESS_STATUSES = new Set(["Reachable", "Limited"]);

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

const isSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value ?? ""));

const requireText = (failures, value, label) => {
  if (!String(value ?? "").trim()) failures.push(`${label} must be non-empty text`);
};

export function collectOfficialSourceFailures(dataset) {
  const failures = [];
  if (!isObject(dataset)) return ["data/official-sources.json must contain an object"];
  if (dataset.version !== 1) failures.push("official sources version must be 1");
  if (!isIsoDate(dataset.as_of)) failures.push("official sources as_of must be YYYY-MM-DD");
  requireText(failures, dataset.scope_note, "official sources scope_note");

  if (!Array.isArray(dataset.sources) || dataset.sources.length === 0) {
    failures.push("official sources must contain a non-empty sources array");
    return failures;
  }

  const ids = new Set();
  const urls = new Set();
  for (const [index, source] of dataset.sources.entries()) {
    const fallback = `source ${index + 1}`;
    const label = source?.id || fallback;
    if (!isObject(source)) {
      failures.push(`${fallback} must be an object`);
      continue;
    }

    if (!isSlug(source.id)) failures.push(`${label}: id must be a lowercase slug`);
    if (ids.has(source.id)) failures.push(`${label}: duplicate id`);
    ids.add(source.id);

    for (const field of [
      "title",
      "publisher",
      "resource_type",
      "what_it_covers",
      "pakistan_coverage",
      "cadence",
      "latest_period",
      "limitations",
    ]) {
      requireText(failures, source[field], `${label}: ${field}`);
    }

    if (!PUBLISHER_SCOPES.has(source.publisher_scope)) {
      failures.push(`${label}: publisher_scope must be Pakistan or International`);
    }
    if (!ACCESS_STATUSES.has(source.access_status)) {
      failures.push(`${label}: access_status must be Reachable or Limited`);
    }
    if (!isIsoDate(source.last_checked)) {
      failures.push(`${label}: last_checked must be YYYY-MM-DD`);
    }
    if (!Array.isArray(source.topics) || source.topics.length === 0) {
      failures.push(`${label}: topics must be a non-empty array`);
    } else {
      const seenTopics = new Set();
      for (const topic of source.topics) {
        if (!OFFICIAL_SOURCE_TOPICS.includes(topic)) {
          failures.push(`${label}: unsupported topic ${topic}`);
        }
        if (seenTopics.has(topic)) failures.push(`${label}: duplicate topic ${topic}`);
        seenTopics.add(topic);
      }
    }
    if (!Array.isArray(source.access_modes) || source.access_modes.length === 0) {
      failures.push(`${label}: access_modes must be a non-empty array`);
    } else {
      for (const mode of source.access_modes) {
        requireText(failures, mode, `${label}: access mode`);
      }
    }

    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:") throw new Error("not HTTPS");
      if (urls.has(url.href)) failures.push(`${label}: duplicate URL`);
      urls.add(url.href);
    } catch {
      failures.push(`${label}: url must be valid HTTPS`);
    }
  }

  return failures;
}

export function assertOfficialSources(dataset) {
  const failures = collectOfficialSourceFailures(dataset);
  if (failures.length) throw new TypeError(failures.join("\n"));
}
