export function toLocalDateTime(datetimeString: string | undefined): string {
  if (!datetimeString) return "-";
  try {
    // Parse as UTC first
    const utcDate = new Date(datetimeString);

    return utcDate.toLocaleString(undefined, {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,  // ✅ user's local timezone
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Failed to parse datetime:", datetimeString, error);
    return "-";
  }
}
