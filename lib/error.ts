export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error && typeof error === "object" && "errors" in error) {
    const errs = (error as { errors: Record<string, string[]> }).errors;
    if (errs && typeof errs === "object") {
      const messages = Object.entries(errs)
        .map(([field, msgs]) => {
          const formattedField = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
          const msgsText = Array.isArray(msgs) ? msgs.join(", ") : msgs;
          return `${formattedField}: ${msgsText}`;
        })
        .join(" | ");
      if (messages) return messages;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
}
