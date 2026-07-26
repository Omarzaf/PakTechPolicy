const SUPPORTED_FORMATS = new Set([
  "integer",
  "decimal",
  "percent",
  "usd",
  "pkr-billion",
]);
const SUPPORTED_CONFIDENCE = new Set(["low", "medium", "high"]);

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

export function collectIndicatorDatasetFailures(dataset, knownPolicyIds = new Set()) {
  const failures = [];
  const policyIds =
    knownPolicyIds instanceof Set ? knownPolicyIds : new Set(knownPolicyIds ?? []);

  if (!isObject(dataset)) {
    return ["data/policy-indicators.json must contain an object"];
  }
  if (dataset.version !== 1) failures.push("indicator dataset version must be 1");
  if (!isIsoDate(dataset.as_of)) failures.push("indicator dataset as_of must be YYYY-MM-DD");
  if (!Array.isArray(dataset.indicators) || dataset.indicators.length === 0) {
    failures.push("indicator dataset must contain a non-empty indicators array");
    return failures;
  }

  const indicatorIds = new Set();
  for (const [indicatorIndex, indicator] of dataset.indicators.entries()) {
    const fallback = `indicator ${indicatorIndex + 1}`;
    const label = indicator?.id || fallback;
    if (!isObject(indicator)) {
      failures.push(`${fallback} must be an object`);
      continue;
    }
    if (!isSlug(indicator.id)) failures.push(`${label}: id must be a lowercase slug`);
    if (indicatorIds.has(indicator.id)) failures.push(`${label}: duplicate indicator id`);
    indicatorIds.add(indicator.id);

    for (const key of [
      "title",
      "summary",
      "cadence",
      "lag",
      "latest_period",
      "methodology_note",
      "risks",
    ]) {
      requireText(failures, indicator[key], `${label}: ${key}`);
    }
    if (!SUPPORTED_CONFIDENCE.has(indicator.confidence)) {
      failures.push(`${label}: confidence must be low, medium, or high`);
    }

    if (!Array.isArray(indicator.policy_ids) || indicator.policy_ids.length === 0) {
      failures.push(`${label}: policy_ids must be a non-empty array`);
    } else {
      const seenPolicyIds = new Set();
      for (const policyId of indicator.policy_ids) {
        if (seenPolicyIds.has(policyId)) {
          failures.push(`${label}: duplicate policy id ${policyId}`);
        }
        seenPolicyIds.add(policyId);
        if (policyIds.size > 0 && !policyIds.has(policyId)) {
          failures.push(`${label}: unknown policy id ${policyId}`);
        }
      }
    }

    if (!Array.isArray(indicator.sources) || indicator.sources.length === 0) {
      failures.push(`${label}: sources must be a non-empty array`);
    } else {
      for (const [sourceIndex, source] of indicator.sources.entries()) {
        const sourceLabel = `${label}: source ${sourceIndex + 1}`;
        if (!isObject(source)) {
          failures.push(`${sourceLabel} must be an object`);
          continue;
        }
        for (const key of ["title", "publisher", "locator"]) {
          requireText(failures, source[key], `${sourceLabel} ${key}`);
        }
        if (!isIsoDate(source.accessed)) {
          failures.push(`${sourceLabel} accessed must be YYYY-MM-DD`);
        }
        try {
          const url = new URL(source.url);
          if (url.protocol !== "https:") throw new Error("not HTTPS");
        } catch {
          failures.push(`${sourceLabel} url must be valid HTTPS`);
        }
      }
    }

    if (!Array.isArray(indicator.groups) || indicator.groups.length === 0) {
      failures.push(`${label}: groups must be a non-empty array`);
      continue;
    }

    const groupIds = new Set();
    for (const [groupIndex, group] of indicator.groups.entries()) {
      const groupLabel = `${label}: group ${group?.id || groupIndex + 1}`;
      if (!isObject(group)) {
        failures.push(`${groupLabel} must be an object`);
        continue;
      }
      if (!isSlug(group.id)) failures.push(`${groupLabel}: id must be a lowercase slug`);
      if (groupIds.has(group.id)) failures.push(`${groupLabel}: duplicate group id`);
      groupIds.add(group.id);
      requireText(failures, group.label, `${groupLabel} label`);
      requireText(failures, group.unit, `${groupLabel} unit`);
      if (!SUPPORTED_FORMATS.has(group.format)) {
        failures.push(`${groupLabel}: unsupported format ${group.format}`);
      }
      if (typeof group.comparison_allowed !== "boolean") {
        failures.push(`${groupLabel}: comparison_allowed must be boolean`);
      }
      if (!Array.isArray(group.series) || group.series.length === 0) {
        failures.push(`${groupLabel}: series must be a non-empty array`);
        continue;
      }

      const seriesIds = new Set();
      for (const [seriesIndex, series] of group.series.entries()) {
        const seriesLabel = `${groupLabel}: series ${series?.id || seriesIndex + 1}`;
        if (!isObject(series)) {
          failures.push(`${seriesLabel} must be an object`);
          continue;
        }
        if (!isSlug(series.id)) failures.push(`${seriesLabel}: id must be a lowercase slug`);
        if (seriesIds.has(series.id)) failures.push(`${seriesLabel}: duplicate series id`);
        seriesIds.add(series.id);
        requireText(failures, series.label, `${seriesLabel} label`);
        if (!Array.isArray(series.observations) || series.observations.length === 0) {
          failures.push(`${seriesLabel}: observations must be a non-empty array`);
          continue;
        }

        const periods = new Set();
        let previousPeriod = "";
        for (const [observationIndex, observation] of series.observations.entries()) {
          const observationLabel = `${seriesLabel}: observation ${observationIndex + 1}`;
          if (!isObject(observation)) {
            failures.push(`${observationLabel} must be an object`);
            continue;
          }
          requireText(failures, observation.period, `${observationLabel} period`);
          requireText(failures, observation.label, `${observationLabel} label`);
          if (!Number.isFinite(observation.value)) {
            failures.push(`${observationLabel} value must be a finite number`);
          }
          if (typeof observation.provisional !== "boolean") {
            failures.push(`${observationLabel} provisional must be boolean`);
          }
          if (typeof observation.revised !== "boolean") {
            failures.push(`${observationLabel} revised must be boolean`);
          }
          if (observation.provisional === true && observation.revised === true) {
            failures.push(`${observationLabel} cannot be both provisional and revised`);
          }
          if (
            "note" in observation &&
            observation.note !== null &&
            typeof observation.note !== "string"
          ) {
            failures.push(`${observationLabel} note must be text or null`);
          }
          if (periods.has(observation.period)) {
            failures.push(`${seriesLabel}: duplicate period ${observation.period}`);
          }
          periods.add(observation.period);
          if (
            previousPeriod &&
            String(observation.period).localeCompare(previousPeriod) <= 0
          ) {
            failures.push(`${seriesLabel}: periods must be strictly ascending`);
          }
          previousPeriod = String(observation.period);
        }
      }
    }
  }

  return failures;
}

export function assertIndicatorDataset(dataset, knownPolicyIds = new Set()) {
  const failures = collectIndicatorDatasetFailures(dataset, knownPolicyIds);
  if (failures.length) {
    throw new TypeError(failures.join("\n"));
  }
}
