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
