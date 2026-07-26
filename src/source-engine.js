export function uniqueSourceValues(sources, field) {
  return [...new Set(sources.flatMap((source) => source[field] ?? []))].toSorted((a, b) =>
    String(a).localeCompare(String(b)),
  );
}

export function filterOfficialSources(
  sources,
  { query = "", topic = "", publisherScope = "", resourceType = "" } = {},
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return sources.filter((source) => {
    const haystack = [
      source.title,
      source.publisher,
      source.resource_type,
      source.what_it_covers,
      source.pakistan_coverage,
      source.limitations,
      ...(source.topics ?? []),
      ...(source.access_modes ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (
      (!normalizedQuery || haystack.includes(normalizedQuery)) &&
      (!topic || source.topics.includes(topic)) &&
      (!publisherScope || source.publisher_scope === publisherScope) &&
      (!resourceType || source.resource_type === resourceType)
    );
  });
}

export function getOfficialSourceStats(sources) {
  return {
    total: sources.length,
    pakistan: sources.filter(({ publisher_scope }) => publisher_scope === "Pakistan").length,
    international: sources.filter(
      ({ publisher_scope }) => publisher_scope === "International",
    ).length,
    publishers: new Set(sources.map(({ publisher }) => publisher)).size,
  };
}
