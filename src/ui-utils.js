export function formatPolicyDate(value, options = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return "Date unavailable";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    return "Date unavailable";
  }
  const precision = options.precision ?? "day";
  if (precision === "year") return String(date.getUTCFullYear());
  return new Intl.DateTimeFormat("en-GB", {
    day: precision === "month" ? undefined : "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function decodePolicyIdHash(hash) {
  if (!String(hash).startsWith("#policy=")) return null;
  try {
    const value = decodeURIComponent(String(hash).slice("#policy=".length));
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function formatIndicatorValue(value, format = "decimal") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  const numericValue = value;

  const number = new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: format === "integer" ? 0 : 2,
  }).format(numericValue);

  switch (format) {
    case "integer":
    case "decimal":
      return number;
    case "percent":
      return `${number}%`;
    case "usd":
      return `US$${number}`;
    case "pkr-billion":
      return `PKR ${number} bn`;
    default:
      return number;
  }
}

export function getLatestObservation(observations) {
  if (!Array.isArray(observations)) return null;

  for (let index = observations.length - 1; index >= 0; index -= 1) {
    const observation = observations[index];
    if (observation && typeof observation.value === "number" && Number.isFinite(observation.value)) {
      return observation;
    }
  }
  return null;
}

export function getSparklinePoints(observations, options = {}) {
  const width = Number(options.width) || 280;
  const height = Number(options.height) || 72;
  const padding = Number(options.padding) || 6;
  const values = Array.isArray(observations)
    ? observations
        .map((observation) => observation?.value)
        .filter((value) => typeof value === "number" && Number.isFinite(value))
    : [];

  if (!values.length) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const xRange = Math.max(width - padding * 2, 0);
  const yRange = Math.max(height - padding * 2, 0);

  return values.map((value, index) => ({
    value,
    x: values.length === 1 ? width / 2 : padding + (xRange * index) / (values.length - 1),
    y: max === min ? height / 2 : padding + ((max - value) / (max - min)) * yRange,
  }));
}

export function isIndicatorPayload(payload) {
  const formats = new Set(["integer", "decimal", "percent", "usd", "pkr-billion"]);
  const confidenceLevels = new Set(["low", "medium", "high"]);
  const hasText = (value) => typeof value === "string" && Boolean(value.trim());
  const isIsoDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  };
  const isHttpsUrl = (value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  };
  if (
    !payload ||
    typeof payload !== "object" ||
    payload.version !== 1 ||
    !isIsoDate(payload.as_of) ||
    !Array.isArray(payload.indicators) ||
    !payload.indicators.length
  ) {
    return false;
  }

  return payload.indicators.every(
    (indicator) =>
      indicator &&
      hasText(indicator.id) &&
      hasText(indicator.title) &&
      hasText(indicator.summary) &&
      hasText(indicator.cadence) &&
      hasText(indicator.lag) &&
      hasText(indicator.latest_period) &&
      hasText(indicator.methodology_note) &&
      hasText(indicator.risks) &&
      confidenceLevels.has(indicator.confidence) &&
      Array.isArray(indicator.policy_ids) &&
      indicator.policy_ids.length &&
      indicator.policy_ids.every(hasText) &&
      Array.isArray(indicator.sources) &&
      indicator.sources.length &&
      indicator.sources.every(
        (source) =>
          source &&
          typeof source === "object" &&
          hasText(source.title) &&
          hasText(source.publisher) &&
          hasText(source.locator) &&
          isIsoDate(source.accessed) &&
          isHttpsUrl(source.url),
      ) &&
      Array.isArray(indicator.groups) &&
      indicator.groups.length &&
      indicator.groups.every(
        (group) =>
          group &&
          hasText(group.id) &&
          hasText(group.label) &&
          hasText(group.unit) &&
          formats.has(group.format) &&
          typeof group.comparison_allowed === "boolean" &&
          Array.isArray(group.series) &&
          group.series.length &&
          group.series.every(
            (series) =>
              series &&
              hasText(series.id) &&
              hasText(series.label) &&
              Array.isArray(series.observations) &&
              series.observations.length &&
              series.observations.every(
                (observation) =>
                  observation &&
                  hasText(observation.period) &&
                  hasText(observation.label) &&
                  typeof observation.value === "number" &&
                  Number.isFinite(observation.value) &&
                  typeof observation.provisional === "boolean" &&
                  typeof observation.revised === "boolean" &&
                  !(observation.provisional && observation.revised),
              ),
          ),
      ),
  );
}
