const HOUR_MS = 60 * 60 * 1000;

function formatUtcDateTime(isoString) {
  const iso = String(isoString || "");
  const [dayKey, timeWithZone = ""] = iso.split("T");
  const time = timeWithZone.slice(0, 5);
  if (!dayKey || !time) {
    return "Unknown time";
  }
  return `${dayKey} ${time} UTC`;
}

function formatRelativeWindow(deltaMs) {
  if (!Number.isFinite(deltaMs)) {
    return "unknown";
  }

  const totalHours = Math.max(1, Math.round(Math.abs(deltaMs) / HOUR_MS));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0 && hours > 0) {
    return `${days}d ${hours}h`;
  }
  if (days > 0) {
    return `${days}d`;
  }
  return `${totalHours}h`;
}

export function buildFollowUpInboxState({ tasks, entries, templates, nowIso }) {
  const nowAt = Date.parse(nowIso);
  const entryById = new Map((entries || []).map((entry) => [entry.id, entry]));
  const templateById = new Map((templates || []).map((template) => [template.id, template]));

  const items = (tasks || [])
    .filter((task) => task?.status === "pending")
    .map((task) => {
      const entry = entryById.get(task.entryId) || null;
      const template = templateById.get(entry?.templateId) || null;
      const scheduledAt = Date.parse(task.scheduledForIso);
      const isOverdue = Number.isFinite(nowAt) && Number.isFinite(scheduledAt) && scheduledAt <= nowAt;
      const relativeWindow = formatRelativeWindow(
        Number.isFinite(nowAt) && Number.isFinite(scheduledAt) ? scheduledAt - nowAt : NaN
      );

      return {
        taskId: task.id,
        entryId: task.entryId,
        status: isOverdue ? "overdue" : "pending",
        title: template?.name || "Logged session",
        detailLabel: `${Number(task.windowHours) || 24}h check-in`,
        loggedAtLabel: entry?.performedAtIso ? `Logged ${formatUtcDateTime(entry.performedAtIso)}` : "",
        timingLabel: isOverdue ? `Overdue by ${relativeWindow}` : `Due in ${relativeWindow}`,
        scheduledLabel: `Due ${formatUtcDateTime(task.scheduledForIso)}`,
        ctaLabel: "Complete follow-up",
        scheduledAt
      };
    })
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "overdue" ? -1 : 1;
      }
      return left.scheduledAt - right.scheduledAt;
    });

  const overdueCount = items.filter((item) => item.status === "overdue").length;
  const pendingCount = items.length - overdueCount;

  return {
    totalCount: items.length,
    overdueCount,
    pendingCount,
    items,
    emptyTitle: "No follow-ups waiting",
    emptyBody: "New delayed outcome check-ins will appear here after you log sessions."
  };
}
