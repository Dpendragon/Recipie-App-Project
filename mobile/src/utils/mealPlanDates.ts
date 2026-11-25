import type { MealSlot } from '@/types/mealPlan.types';

// Mọi ngày ở đây là ngày theo giờ máy (không có giờ), tuần bắt đầu từ Thứ Hai.

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

export const MEAL_SLOT_LABELS: Record<MealSlot, { title: string; short: string }> = {
  breakfast: { title: 'Bữa sáng', short: 'Sáng' },
  lunch: { title: 'Bữa trưa', short: 'Trưa' },
  dinner: { title: 'Bữa tối', short: 'Tối' },
};

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const pad = (n: number) => String(n).padStart(2, '0');

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Thứ Hai của tuần chứa date.
export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7; // Thứ Hai = 0 ... Chủ Nhật = 6
  return addDays(date, -offset);
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// YYYY-MM-DD — định dạng backend dùng cho tham số và trường date.
export function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateOnly(a) === toDateOnly(b);
}

export function weekdayShort(date: Date): string {
  return WEEKDAY_SHORT[date.getDay()];
}

// "Thứ Ba, 03/11"
export function dayHeading(date: Date): string {
  return `${WEEKDAY_LONG[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

// "Thứ Ba, 03/11/2026"
export function dayFull(date: Date): string {
  return `${dayHeading(date)}/${date.getFullYear()}`;
}

// "02 – 08 tháng 11, 2026" hoặc "30/11 – 06/12/2026" khi tuần nằm ở 2 tháng.
export function weekRangeLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  if (weekStart.getMonth() === end.getMonth()) {
    return `${pad(weekStart.getDate())} – ${pad(end.getDate())} tháng ${end.getMonth() + 1}, ${end.getFullYear()}`;
  }
  return `${pad(weekStart.getDate())}/${pad(weekStart.getMonth() + 1)} – ${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
}

// "02 – 08/11/2026"
export function weekRangeShort(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const startPart =
    weekStart.getMonth() === end.getMonth()
      ? pad(weekStart.getDate())
      : `${pad(weekStart.getDate())}/${pad(weekStart.getMonth() + 1)}`;
  return `${startPart} – ${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
}

// "Tuần này" / "Tuần trước" / "Tuần sau" / null với các tuần khác.
export function relativeWeekName(weekStart: Date): string | null {
  const diffWeeks = Math.round(
    (weekStart.getTime() - startOfWeek(today()).getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  if (diffWeeks === 0) return 'Tuần này';
  if (diffWeeks === -1) return 'Tuần trước';
  if (diffWeeks === 1) return 'Tuần sau';
  return null;
}
