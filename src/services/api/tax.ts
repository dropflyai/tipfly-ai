// Tax tracking and calculations API
import { supabase } from './supabase';
import { Deduction } from '../../types';

// Tax-free tips threshold under the "No Tax on Tips Act" (proposed 2025)
// First $25,000 in tips would be exempt from federal income tax
export const TAX_FREE_TIP_THRESHOLD = 25000;

export interface TaxSummary {
  year: number;
  quarter: number;
  totalEarnings: number;      // Gross tips earned
  totalTipOut: number;        // Amount tipped out to support staff
  netTipEarnings: number;     // Tips after tip out (totalEarnings - totalTipOut)
  totalDeductions: number;    // Business deductions
  netIncome: number;          // Net taxable income
  estimatedTax: number;
  taxRate: number;
  // $25K threshold tracking
  taxFreeTips: number;        // Tips within the $25K tax-free threshold
  taxableTips: number;        // Tips exceeding the $25K threshold
  thresholdProgress: number;  // Percentage toward $25K threshold (0-100)
  isOverThreshold: boolean;   // True if exceeded $25K
}

export interface QuarterlyBreakdown {
  q1: TaxSummary;
  q2: TaxSummary;
  q3: TaxSummary;
  q4: TaxSummary;
  yearTotal: TaxSummary;
}

// Get quarterly tax summary for a specific year
export const getTaxSummary = async (year: number): Promise<QuarterlyBreakdown> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch all tip entries for the year
    const { data: tips, error: tipsError } = await supabase
      .from('tip_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);

    if (tipsError) throw tipsError;

    // Fetch all deductions for the year
    const { data: deductions, error: deductionsError } = await supabase
      .from('deductions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);

    if (deductionsError) throw deductionsError;

    // Tax rate (15.3% self-employment tax)
    const TAX_RATE = 0.153;

    // Helper function to calculate quarter from date
    const getQuarter = (date: string): number => {
      const month = new Date(date).getMonth() + 1;
      return Math.ceil(month / 3);
    };

    // Calculate YTD totals first (needed for $25K threshold)
    const yearTotalEarnings = tips?.reduce((sum, t) => sum + parseFloat(t.tips_earned?.toString() || '0'), 0) || 0;
    const yearTotalTipOut = tips?.reduce((sum, t) => sum + parseFloat(t.tip_out?.toString() || '0'), 0) || 0;
    const yearNetTipEarnings = yearTotalEarnings - yearTotalTipOut;

    // Calculate $25K threshold values for the year
    const yearTaxFreeTips = Math.min(yearNetTipEarnings, TAX_FREE_TIP_THRESHOLD);
    const yearTaxableTips = Math.max(0, yearNetTipEarnings - TAX_FREE_TIP_THRESHOLD);
    const yearThresholdProgress = Math.min(100, (yearNetTipEarnings / TAX_FREE_TIP_THRESHOLD) * 100);
    const yearIsOverThreshold = yearNetTipEarnings > TAX_FREE_TIP_THRESHOLD;

    // Calculate summary for each quarter
    const calculateQuarter = (quarterNum: number, cumulativeTipsBeforeQuarter: number): TaxSummary => {
      const quarterTips = tips?.filter(t => getQuarter(t.date) === quarterNum) || [];
      const quarterDeductions = deductions?.filter(d => getQuarter(d.date) === quarterNum) || [];

      const totalEarnings = quarterTips.reduce((sum, t) => sum + parseFloat(t.tips_earned?.toString() || '0'), 0);
      const totalTipOut = quarterTips.reduce((sum, t) => sum + parseFloat(t.tip_out?.toString() || '0'), 0);
      const netTipEarnings = totalEarnings - totalTipOut;
      const totalDeductions = quarterDeductions.reduce((sum, d) => sum + parseFloat(d.amount?.toString() || '0'), 0);

      // Calculate quarter's portion of taxable tips
      // Tips are tax-free up to $25K cumulative for the year
      const cumulativeAfterQuarter = cumulativeTipsBeforeQuarter + netTipEarnings;
      const taxFreeBefore = Math.min(cumulativeTipsBeforeQuarter, TAX_FREE_TIP_THRESHOLD);
      const taxFreeAfter = Math.min(cumulativeAfterQuarter, TAX_FREE_TIP_THRESHOLD);
      const quarterTaxFreeTips = taxFreeAfter - taxFreeBefore;
      const quarterTaxableTips = netTipEarnings - quarterTaxFreeTips;

      // Only taxable tips are subject to self-employment tax
      const netIncome = quarterTaxableTips - totalDeductions;
      const estimatedTax = Math.max(0, netIncome) * TAX_RATE;

      const thresholdProgress = Math.min(100, (cumulativeAfterQuarter / TAX_FREE_TIP_THRESHOLD) * 100);

      return {
        year,
        quarter: quarterNum,
        totalEarnings,
        totalTipOut,
        netTipEarnings,
        totalDeductions,
        netIncome,
        estimatedTax,
        taxRate: TAX_RATE,
        taxFreeTips: quarterTaxFreeTips,
        taxableTips: quarterTaxableTips,
        thresholdProgress,
        isOverThreshold: cumulativeAfterQuarter > TAX_FREE_TIP_THRESHOLD,
      };
    };

    // Calculate quarters with cumulative tip tracking
    const q1Tips = tips?.filter(t => getQuarter(t.date) === 1) || [];
    const q1NetTips = q1Tips.reduce((sum, t) => sum + parseFloat(t.tips_earned?.toString() || '0') - parseFloat(t.tip_out?.toString() || '0'), 0);

    const q2Tips = tips?.filter(t => getQuarter(t.date) === 2) || [];
    const q2NetTips = q2Tips.reduce((sum, t) => sum + parseFloat(t.tips_earned?.toString() || '0') - parseFloat(t.tip_out?.toString() || '0'), 0);

    const q3Tips = tips?.filter(t => getQuarter(t.date) === 3) || [];
    const q3NetTips = q3Tips.reduce((sum, t) => sum + parseFloat(t.tips_earned?.toString() || '0') - parseFloat(t.tip_out?.toString() || '0'), 0);

    const q1 = calculateQuarter(1, 0);
    const q2 = calculateQuarter(2, q1NetTips);
    const q3 = calculateQuarter(3, q1NetTips + q2NetTips);
    const q4 = calculateQuarter(4, q1NetTips + q2NetTips + q3NetTips);

    // Year total
    const yearTotalDeductions = q1.totalDeductions + q2.totalDeductions + q3.totalDeductions + q4.totalDeductions;
    const yearNetIncome = yearTaxableTips - yearTotalDeductions;

    const yearTotal: TaxSummary = {
      year,
      quarter: 0,
      totalEarnings: yearTotalEarnings,
      totalTipOut: yearTotalTipOut,
      netTipEarnings: yearNetTipEarnings,
      totalDeductions: yearTotalDeductions,
      netIncome: yearNetIncome,
      estimatedTax: Math.max(0, yearNetIncome) * TAX_RATE,
      taxRate: TAX_RATE,
      taxFreeTips: yearTaxFreeTips,
      taxableTips: yearTaxableTips,
      thresholdProgress: yearThresholdProgress,
      isOverThreshold: yearIsOverThreshold,
    };

    return { q1, q2, q3, q4, yearTotal };
  } catch (error: any) {
    console.error('Error fetching tax summary:', error);
    throw error;
  }
};

// Add a new deduction
export const addDeduction = async (deduction: Omit<Deduction, 'id' | 'created_at'>): Promise<Deduction> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('deductions')
      .insert([{
        ...deduction,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error adding deduction:', error);
    throw error;
  }
};

// Get all deductions for a user (optionally filtered by year)
export const getDeductions = async (year?: number): Promise<Deduction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('deductions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (year) {
      query = query
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching deductions:', error);
    throw error;
  }
};

// Update a deduction
export const updateDeduction = async (id: string, updates: Partial<Deduction>): Promise<Deduction> => {
  try {
    const { data, error } = await supabase
      .from('deductions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating deduction:', error);
    throw error;
  }
};

// Delete a deduction
export const deleteDeduction = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('deductions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting deduction:', error);
    throw error;
  }
};
