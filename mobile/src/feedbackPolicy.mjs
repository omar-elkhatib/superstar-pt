const SESSION_SUCCESS_MESSAGE = "Session added.";
const SUCCESS_BANNER_TTL_MS = 1600;
const ERROR_BANNER_TTL_MS = 2200;

function toErrorMessage(event) {
  if (typeof event?.message === "string" && event.message.trim().length > 0) {
    return event.message;
  }
  return "Unable to add session.";
}

export function resolveFeedbackEvent(event) {
  switch (event?.type) {
    case "view_change":
      return {
        hapticKind: "selection",
        banner: null
      };
    case "session_added":
      return {
        hapticKind: "success",
        banner: {
          kind: "success",
          message: SESSION_SUCCESS_MESSAGE,
          ttlMs: SUCCESS_BANNER_TTL_MS
        }
      };
    case "session_validation_error":
      return {
        hapticKind: "error",
        banner: {
          kind: "error",
          message: toErrorMessage(event),
          ttlMs: ERROR_BANNER_TTL_MS
        }
      };
    default:
      return {
        hapticKind: null,
        banner: null
      };
  }
}
