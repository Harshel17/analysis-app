export function toLocalDateTime(datetimeString: string | undefined): string {
  if (!datetimeString) return "-";
  const utcDate = new Date(datetimeString);

  // Get local date components
  const localDate = new Date(utcDate.getTime() + new Date().getTimezoneOffset() * -60000);

  return localDate.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}
