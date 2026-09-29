/**
 * Утилиты для работы с датами
 */

/**
 * Форматирование даты для отображения в UI
 */
export const formatDate = (dateString: unknown): string => {
  if (!dateString || typeof dateString !== 'string') return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch {
    return '';
  }
};

/**
 * Парсит UTC дату (ISO string) в локальные дату и время для формы
 * @param date - Дата в формате ISO string или Date объект
 * @returns Объект с полями date (YYYY-MM-DD) и time (HH:MM) в локальной временной зоне
 */
export function parseDateToLocal(
  date: string | Date | null | undefined
): { date: string; time: string } | null {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return null;

  // Используем локальные методы для получения даты и времени
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * Локальные YYYY-MM-DD и HH:mm → момент в часовом поясе браузера.
 * Использует конструктор Date(y, m, d, h, mi), чтобы не зависеть от парсинга строки ISO в разных движках.
 */
function parseLocalYmdHm(date: string, time: string): Date | null {
  const dTrim = date.trim();
  const tStr = time || '00:00';
  const dateParts = dTrim.split('-').map((x) => Number.parseInt(x, 10));
  const timeParts = tStr.split(':').map((x) => Number.parseInt(x, 10));
  const y = dateParts[0];
  const mo = dateParts[1];
  const d = dateParts[2];
  const h = timeParts[0];
  const mi = timeParts[1];
  if (
    dateParts.length !== 3 ||
    timeParts.length < 2 ||
    y === undefined ||
    mo === undefined ||
    d === undefined ||
    h === undefined ||
    mi === undefined ||
    [y, mo, d, h, mi].some((n) => Number.isNaN(n))
  ) {
    return null;
  }
  const local = new Date(y, mo - 1, d, h, mi, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local;
}

/** Сегодняшний календарный день пользователя, YYYY-MM-DD */
export function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Календарная дата с сервера / из ISO → YYYY-MM-DD для input type="date" (локальный календарный день).
 */
export function toLocalYmd(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Преобразует локальные дату и время в UTC ISO строку
 * @param date - Дата в формате YYYY-MM-DD
 * @param time - Время в формате HH:MM (опционально, по умолчанию 00:00)
 * @returns ISO строка в UTC или undefined если дата невалидна
 */
export function formatDateToUTC(date: string, time?: string): string | undefined {
  if (!date?.trim()) return undefined;
  const local = parseLocalYmdHm(date, time || '00:00');
  if (!local) return undefined;
  return local.toISOString();
}

/**
 * Только дата из поля type="date" → ISO UTC (полночь этого календарного дня в зоне браузера).
 * Невалидная строка возвращается как есть (совместимость с прежним поведением формы заказа).
 */
export function calendarYmdLocalMidnightToUtcIso(ymd: string): string {
  const trimmed = ymd.trim();
  const iso = formatDateToUTC(trimmed, '00:00');
  if (iso !== undefined) return iso;
  return trimmed;
}

/**
 * Форматирует дату и время для отображения в таблице
 * @param date - Дата в формате ISO string или Date объект
 * @returns Отформатированная строка даты и времени в локальной временной зоне
 */
export function formatDateTime(date?: string | Date | null): string {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('ru-RU');
}

/**
 * Валидация диапазона дат
 * @param startDate - Дата начала в формате YYYY-MM-DD
 * @param startTime - Время начала в формате HH:MM
 * @param endDate - Дата окончания в формате YYYY-MM-DD
 * @param endTime - Время окончания в формате HH:MM
 * @returns true если диапазон валиден, false если нет
 */
export function validateDateRange(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): boolean {
  if (!startDate || !endDate) return true;

  const startTimeStr = startTime || '00:00';
  const endTimeStr = endTime || '00:00';

  const start = parseLocalYmdHm(startDate, startTimeStr);
  const end = parseLocalYmdHm(endDate, endTimeStr);

  if (!start || !end) {
    return true; // Если дата невалидна, пропускаем валидацию (валидация формата будет в другом месте)
  }

  return start <= end;
}

