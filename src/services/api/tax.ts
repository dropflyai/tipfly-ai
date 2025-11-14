// Tax tracking and calculations API
import { supabase } from './supabase';
import { Deduction } from '../../types';

export interface TaxSummary {
  year: number;
  quarter: number;
  totalEarnings: number;
  totalDeductions: number;
  netIncome: number;
  estimatedTax: number;
  taxRate: number;
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

    // Calculate summary for each quarter
    const calculateQuarter = (quarterNum: number): TaxSummary => {
      const quarterTips = tips?.filter(t => getQuarter(t.date) === quarterNum) || [];
      const quarterDeductions = deductions?.filter(d => getQuarter(d.date) === quarterNum) || [];

      const totalEarnings = quarterTips.reduce((sum, t) => sum + parseFloat(t.tips_earned.toString()), 0);
      const totalDeductions = quarterDeductions.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
      const netIncome = totalEarnings - totalDeductions;
      const estimatedTax = netIncome * TAX_RATE;

      return {
        year,
        quarter: quarterNum,
        totalEarnings,
        totalDeductions,
        netIncome,
        estimatedTax,
        taxRate: TAX_RATE,
      };
    };

    const q1 = calculateQuarter(1);
    const q2 = calculateQuarter(2);
    const q3 = calculateQuarter(3);
    const q4 = calculateQuarter(4);

    // Year total
    const yearTotal: TaxSummary = {
      year,
      quarter: 0,
      totalEarnings: q1.totalEarnings + q2.totalEarnings + q3.totalEarnings + q4.totalEarnings,
      totalDeductions: q1.totalDeductions + q2.totalDeductions + q3.totalDeductions + q4.totalDeductions,
      netIncome: q1.netIncome + q2.netIncome + q3.netIncome + q4.netIncome,
      estimatedTax: q1.estimatedTax + q2.estimatedTax + q3.estimatedTax + q4.estimatedTax,
      taxRate: TAX_RATE,
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
