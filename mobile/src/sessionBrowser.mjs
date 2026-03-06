export function resolveSelectedSessionId({ entries = [], selectedSessionId = null }) {
  if (selectedSessionId && entries.some((entry) => entry.id === selectedSessionId)) {
    return selectedSessionId;
  }

  return entries[0]?.id || null;
}

export function deleteSessionById({ entries = [], selectedSessionId = null, entryId }) {
  const nextEntries = entries.filter((entry) => entry.id !== entryId);
  const nextSelectedSessionId =
    selectedSessionId === entryId
      ? resolveSelectedSessionId({
          entries: nextEntries,
          selectedSessionId: null
        })
      : resolveSelectedSessionId({
          entries: nextEntries,
          selectedSessionId
        });

  return {
    entries: nextEntries,
    selectedSessionId: nextSelectedSessionId
  };
}
