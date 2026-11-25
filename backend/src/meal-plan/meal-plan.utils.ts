import { BadRequestException } from '@nestjs/common';
import { MealSlot } from '../generated/prisma/enums';

export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// API dùng chữ thường như tài liệu (Mục 7.10); Prisma dùng BREAKFAST/LUNCH/DINNER.
export const MEAL_SLOT_VALUES = ['breakfast', 'lunch', 'dinner'] as const;
export type MealSlotValue = (typeof MEAL_SLOT_VALUES)[number];

export function toPrismaMealSlot(value: MealSlotValue): MealSlot {
  return value.toUpperCase() as MealSlot;
}

export function toApiMealSlot(value: MealSlot): MealSlotValue {
  return value.toLowerCase() as MealSlotValue;
}

// "YYYY-MM-DD" -> Date lúc 00:00 UTC, để cột DATE không bị lệch ngày theo múi giờ.
// Ngày không có thật (vd 2026-02-30) thì báo lỗi 400.
export function parseDateOnly(value: string, field: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException(`${field} không hợp lệ (ngày không tồn tại)`);
  }
  return date;
}

// Date (00:00 UTC) -> "YYYY-MM-DD"
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
