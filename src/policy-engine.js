export const DOMAIN_TAXONOMY = [
  "Cybercrime & online speech",
  "Data protection & privacy",
  "Telecom regulation",
  "Internet governance & access",
  "National digital strategy",
  "Cybersecurity",
  "Cloud & data localisation",
  "AI & emerging tech",
  "Fintech & digital payments",
  "IT industry & exports",
  "E-commerce",
  "Access to information",
];

const searchableText = (policy) =>
  [
    policy.title,
    policy.short_name,
    policy.summary,
    policy.type,
    policy.issuing_body,
    ...(policy.domains ?? []),
    ...(policy.key_provisions ?? []),
    ...(policy.affects ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

const policyYear = (policy) => String(policy.date_enacted ?? "").slice(0, 4);

export function filterPolicies(policies, filters = {}) {
  const queryTokens = String(filters.query ?? "")
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const filtered = policies.filter((policy) => {
    const haystack = searchableText(policy);
    const matchesQuery = queryTokens.every((token) => haystack.includes(token));
    const matchesDomain =
      !filters.domain || (policy.domains ?? []).includes(filters.domain);
    const matchesStatus = !filters.status || policy.status === filters.status;
    const matchesBody =
      !filters.issuingBody || policy.issuing_body === filters.issuingBody;
    const matchesYear = !filters.year || policyYear(policy) === filters.year;
    const matchesVerification =
      !filters.verification || policy.verification === filters.verification;
    return (
      matchesQuery &&
      matchesDomain &&
      matchesStatus &&
      matchesBody &&
      matchesYear &&
      matchesVerification
    );
  });

  return filtered.toSorted((a, b) => {
    if (filters.sort === "title") {
      return a.title.localeCompare(b.title);
    }
    const direction = filters.sort === "oldest" ? 1 : -1;
    return String(a.date_enacted).localeCompare(String(b.date_enacted)) * direction;
  });
}

export function uniqueValues(policies, key) {
  return [...new Set(policies.map((policy) => policy[key]).filter(Boolean))].toSorted(
    (a, b) => String(a).localeCompare(String(b)),
  );
}

export function aggregateByDomain(policies) {
  const counts = new Map(DOMAIN_TAXONOMY.map((domain) => [domain, 0]));
  for (const policy of policies) {
    for (const domain of policy.domains ?? []) {
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .toSorted((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

export function aggregateByYear(policies) {
  const counts = new Map();
  for (const policy of policies) {
    const year = policyYear(policy);
    if (/^\d{4}$/.test(year)) {
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .toSorted((a, b) => a.year.localeCompare(b.year));
}

export function getIndexStats(policies) {
  const verified = policies.filter((policy) => policy.verification === "Verified").length;
  const domains = new Set(policies.flatMap((policy) => policy.domains ?? []));
  const issuingBodies = new Set(policies.map((policy) => policy.issuing_body).filter(Boolean));
  const dates = policies
    .map((policy) => policy.last_verified)
    .filter(Boolean)
    .toSorted();

  return {
    total: policies.length,
    verified,
    domains: domains.size,
    issuingBodies: issuingBodies.size,
    latestVerification: dates.at(-1) ?? null,
  };
}

export function countActiveFilters(filters) {
  return ["query", "domain", "status", "issuingBody", "year", "verification"].filter(
    (key) => Boolean(filters[key]),
  ).length;
}
