type ParsedTime = { hours: number; minutes: number } | null;

const parseTime = (time: string): ParsedTime => {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
};

export function isValidTime(time: string): boolean {
  const parsed = parseTime(time);
  if (!parsed) return false;

  const { hours, minutes } = parsed;
  if (hours < 0 || hours > 24) return false;
  if (minutes < 0 || minutes > 59) return false;

  // Для 24-го часа допустимо только 24:00
  if (hours === 24 && minutes !== 0) return false;

  return true;
}

export const clampTimeTo24 = (value: string): string => {
  const parsed = parseTime(value);
  if (!parsed) return value;

  const { hours, minutes } = parsed;

  if (hours > 24 || (hours === 24 && minutes > 0)) {
    return '24:00';
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};