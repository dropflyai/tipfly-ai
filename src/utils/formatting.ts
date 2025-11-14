// Utility functions for formatting
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { AppConfig } from '../constants/config';

// Format currency
export const formatCurrency = (amount: number, currency: string = AppConfig.DEFAULT_CURRENCY): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format hours (e.g., 5.5 => "5.5h")
export const formatHours = (hours: number): string => {
  return `${hours}h`;
};

// Format hourly rate (e.g., 15.50 => "$15.50/hr")
export const formatHourlyRate = (rate: number): string => {
  return `${formatCurrency(rate)}/hr`;
};

// Format date
export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

// Format relative date (e.g., "Today", "Yesterday", "Dec 25")
export const formatRelativeDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(dateObj)) return 'Today';
  if (isYesterday(dateObj)) return 'Yesterday';
  if (isThisWeek(dateObj)) return format(dateObj, 'EEEE'); // Day name
  if (isThisMonth(dateObj)) return format(dateObj, 'MMM d');
  return format(dateObj, 'MMM d, yyyy');
};

// Format day of week
export const formatDayOfWeek = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEE'); // Mon, Tue, etc.
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Format number with commas
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Format change (e.g., +$12.50, -$5.00)
export const formatChange = (value: number): string => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${formatCurrency(value)}`;
};

// Format change percentage (e.g., +15.5% ↑, -5.2% ↓)
export const formatChangePercentage = (value: number): string => {
  const prefix = value >= 0 ? '+' : '';
  const arrow = value >= 0 ? '↑' : '↓';
  return `${prefix}${formatPercentage(value)} ${arrow}`;
};

// Get today's date in ISO format
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get yesterday's date in ISO format
export const getYesterdayISO = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Get start of week in ISO format
export const getStartOfWeekISO = (): string => {
  const today = new Date();
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  return firstDayOfWeek.toISOString().split('T')[0];
};

// Get end of week in ISO format
export const getEndOfWeekISO = (): string => {
  const today = new Date();
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return lastDayOfWeek.toISOString().split('T')[0];
};

// Get start of month in ISO format
export const getStartOfMonthISO = (): string => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return firstDayOfMonth.toISOString().split('T')[0];
};

// Get end of month in ISO format
export const getEndOfMonthISO = (): string => {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDayOfMonth.toISOString().split('T')[0];
};
