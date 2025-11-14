// Utility functions for calculations
import { TipEntry, DashboardStats } from '../types';
import { AppConfig } from '../constants/config';

// Calculate hourly rate
export const calculateHourlyRate = (tips: number, hours: number): number => {
  if (hours === 0) return 0;
  return Number((tips / hours).toFixed(2));
};

// Calculate total tips from entries
export const calculateTotalTips = (entries: TipEntry[]): number => {
  return entries.reduce((sum, entry) => sum + entry.tips_earned, 0);
};

// Calculate total hours from entries
export const calculateTotalHours = (entries: TipEntry[]): number => {
  return entries.reduce((sum, entry) => sum + entry.hours_worked, 0);
};

// Calculate average hourly rate
export const calculateAverageHourlyRate = (entries: TipEntry[]): number => {
  const totalTips = calculateTotalTips(entries);
  const totalHours = calculateTotalHours(entries);
  return calculateHourlyRate(totalTips, totalHours);
};

// Calculate tax estimate
export const calculateTaxEstimate = (income: number, taxRate: number = AppConfig.DEFAULT_TAX_RATE): number => {
  return Number((income * taxRate).toFixed(2));
};

// Calculate quarterly tax estimate
export const calculateQuarterlyTax = (annualIncome: number): number => {
  const annualTax = calculateTaxEstimate(annualIncome);
  return Number((annualTax / 4).toFixed(2));
};

// Calculate dashboard stats from tip entries
export const calculateDashboardStats = (
  todayEntries: TipEntry[],
  yesterdayEntries: TipEntry[],
  weekEntries: TipEntry[],
  monthEntries: TipEntry[]
): DashboardStats => {
  const todayTips = calculateTotalTips(todayEntries);
  const todayHours = calculateTotalHours(todayEntries);
  const todayHourlyRate = calculateAverageHourlyRate(todayEntries);

  const yesterdayTips = calculateTotalTips(yesterdayEntries);

  const weekTips = calculateTotalTips(weekEntries);
  const weekHours = calculateTotalHours(weekEntries);
  const weekHourlyRate = calculateAverageHourlyRate(weekEntries);

  // Find best day of the week
  const dayTotals = new Map<string, number>();
  weekEntries.forEach(entry => {
    const current = dayTotals.get(entry.date) || 0;
    dayTotals.set(entry.date, current + entry.tips_earned);
  });

  let bestDay = '';
  let bestDayAmount = 0;
  dayTotals.forEach((amount, date) => {
    if (amount > bestDayAmount) {
      bestDayAmount = amount;
      bestDay = date;
    }
  });

  const monthTips = calculateTotalTips(monthEntries);
  const monthHours = calculateTotalHours(monthEntries);
  const monthHourlyRate = calculateAverageHourlyRate(monthEntries);

  return {
    today: {
      tips: todayTips,
      hours: todayHours,
      hourly_rate: todayHourlyRate,
      vs_yesterday: todayTips - yesterdayTips,
    },
    week: {
      tips: weekTips,
      hours: weekHours,
      hourly_rate: weekHourlyRate,
      best_day: bestDay,
      best_day_amount: bestDayAmount,
    },
    month: {
      tips: monthTips,
      hours: monthHours,
      hourly_rate: monthHourlyRate,
    },
  };
};

// Calculate goal progress percentage
export const calculateGoalProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Number(((current / target) * 100).toFixed(1));
};

// Project monthly earnings based on current progress
export const projectMonthlyEarnings = (currentMonthTips: number, dayOfMonth: number): number => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  if (dayOfMonth === 0) return 0;

  const dailyAverage = currentMonthTips / dayOfMonth;
  return Number((dailyAverage * daysInMonth).toFixed(2));
};

// Calculate tip per shift to save for taxes
export const calculateTaxPerShift = (estimatedAnnualIncome: number, shiftsPerYear: number): number => {
  const annualTax = calculateTaxEstimate(estimatedAnnualIncome);
  if (shiftsPerYear === 0) return 0;
  return Number((annualTax / shiftsPerYear).toFixed(2));
};
