export const DEFAULT_TIME_ZONE = "Asia/Seoul";

export function getTodayDate(timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

export function formatDateTime(value: string, timeZone = DEFAULT_TIME_ZONE) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

export function extractTime(value: string, timeZone = DEFAULT_TIME_ZONE) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function getMonthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const lastDate = new Date(Date.UTC(year, monthIndex, 0));

  return {
    start: firstDate.toISOString().slice(0, 10),
    end: lastDate.toISOString().slice(0, 10),
  };
}

export function addMonths(month: string, amount: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
