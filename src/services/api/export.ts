// Export API - Generate and share reports in various formats
import { supabase } from './supabase';
import { TipEntry } from './tips';
import { Deduction } from './tax';

export interface ExportOptions {
  startDate: Date;
  endDate: Date;
  format: 'csv' | 'pdf';
  includeDeductions?: boolean;
}

export interface ExportData {
  entries: TipEntry[];
  deductions?: Deduction[];
  summary: {
    totalTips: number;
    totalHours: number;
    avgPerHour: number;
    totalDeductions: number;
  };
}

/**
 * Get tip entries for export
 */
export const getEntriesForExport = async (
  startDate: Date,
  endDate: Date
): Promise<TipEntry[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tip_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching entries for export:', error);
    throw new Error(error.message || 'Failed to fetch entries');
  }
};

/**
 * Get deductions for export
 */
export const getDeductionsForExport = async (
  startDate: Date,
  endDate: Date
): Promise<Deduction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('deductions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching deductions for export:', error);
    throw new Error(error.message || 'Failed to fetch deductions');
  }
};

/**
 * Generate export data with summary
 */
export const generateExportData = async (
  options: ExportOptions
): Promise<ExportData> => {
  try {
    // Fetch tip entries
    const entries = await getEntriesForExport(options.startDate, options.endDate);

    // Fetch deductions if requested
    let deductions: Deduction[] | undefined;
    if (options.includeDeductions) {
      deductions = await getDeductionsForExport(options.startDate, options.endDate);
    }

    // Calculate summary
    const totalTips = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const totalHours = entries.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0);
    const avgPerHour = totalHours > 0 ? totalTips / totalHours : 0;
    const totalDeductions = deductions?.reduce(
      (sum, deduction) => sum + (deduction.amount || 0),
      0
    ) || 0;

    return {
      entries,
      deductions,
      summary: {
        totalTips,
        totalHours,
        avgPerHour,
        totalDeductions,
      },
    };
  } catch (error: any) {
    console.error('Error generating export data:', error);
    throw new Error(error.message || 'Failed to generate export data');
  }
};

/**
 * Convert data to CSV format
 */
export const exportToCSV = (data: ExportData): string => {
  let csv = '';

  // Summary section
  csv += 'SUMMARY\n';
  csv += `Total Tips,$${data.summary.totalTips.toFixed(2)}\n`;
  csv += `Total Hours,${data.summary.totalHours.toFixed(2)}\n`;
  csv += `Average Per Hour,$${data.summary.avgPerHour.toFixed(2)}\n`;
  if (data.deductions) {
    csv += `Total Deductions,$${data.summary.totalDeductions.toFixed(2)}\n`;
  }
  csv += '\n';

  // Tip entries section
  csv += 'TIP ENTRIES\n';
  csv += 'Date,Amount,Hours,Shift Type,Notes\n';
  data.entries.forEach(entry => {
    const date = new Date(entry.date).toLocaleDateString();
    const amount = entry.amount?.toFixed(2) || '0.00';
    const hours = entry.hours_worked?.toFixed(2) || '0';
    const shiftType = entry.shift_type || '';
    const notes = (entry.notes || '').replace(/,/g, ';'); // Replace commas in notes
    csv += `${date},$${amount},${hours},${shiftType},"${notes}"\n`;
  });

  // Deductions section
  if (data.deductions && data.deductions.length > 0) {
    csv += '\n';
    csv += 'DEDUCTIONS\n';
    csv += 'Date,Category,Amount,Description\n';
    data.deductions.forEach(deduction => {
      const date = new Date(deduction.date).toLocaleDateString();
      const category = deduction.category || '';
      const amount = deduction.amount?.toFixed(2) || '0.00';
      const description = (deduction.description || '').replace(/,/g, ';');
      csv += `${date},${category},$${amount},"${description}"\n`;
    });
  }

  return csv;
};

/**
 * Generate HTML for PDF export
 */
export const generatePDFHTML = (data: ExportData, startDate: Date, endDate: Date, userName: string): string => {
  const dateRange = formatDateRange(startDate, endDate);
  const exportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          color: #1f2937;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          color: #4f46e5;
        }
        .header .subtitle {
          margin: 10px 0;
          font-size: 16px;
          color: #6b7280;
        }
        .summary-box {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .summary-box h2 {
          margin: 0 0 15px 0;
          font-size: 20px;
          color: #1f2937;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .summary-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
        }
        .summary-item .label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .summary-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #4f46e5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
        }
        table caption {
          text-align: left;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #1f2937;
        }
        th {
          background: #4f46e5;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background: #f9fafb;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TipFly AI Earnings Report</h1>
        <div class="subtitle">
          <strong>${userName}</strong><br>
          ${dateRange}<br>
          Generated on ${exportDate}
        </div>
      </div>

      <div class="summary-box">
        <h2>Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="label">Total Tips</div>
            <div class="value">$${data.summary.totalTips.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Hours</div>
            <div class="value">${data.summary.totalHours.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Average Per Hour</div>
            <div class="value">$${data.summary.avgPerHour.toFixed(2)}</div>
          </div>
          ${data.deductions ? `
          <div class="summary-item">
            <div class="label">Total Deductions</div>
            <div class="value">$${data.summary.totalDeductions.toFixed(2)}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <table>
        <caption>Tip Entries</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Hours</th>
            <th>Shift Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Add tip entries
  data.entries.forEach(entry => {
    const date = new Date(entry.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const amount = entry.amount?.toFixed(2) || '0.00';
    const hours = entry.hours_worked?.toFixed(2) || '0';
    const shiftType = entry.shift_type || '-';
    const notes = entry.notes || '-';

    html += `
          <tr>
            <td>${date}</td>
            <td>$${amount}</td>
            <td>${hours}</td>
            <td>${shiftType}</td>
            <td>${notes}</td>
          </tr>
    `;
  });

  html += `
        </tbody>
      </table>
  `;

  // Add deductions if included
  if (data.deductions && data.deductions.length > 0) {
    html += `
      <table>
        <caption>Tax Deductions</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.deductions.forEach(deduction => {
      const date = new Date(deduction.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const category = deduction.category || '-';
      const amount = deduction.amount?.toFixed(2) || '0.00';
      const description = deduction.description || '-';

      html += `
          <tr>
            <td>${date}</td>
            <td>${category}</td>
            <td>$${amount}</td>
            <td>${description}</td>
          </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  html += `
      <div class="footer">
        This report was generated by TipFly AI<br>
        For tax filing and record keeping purposes
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Get filename for export
 */
export const getExportFilename = (
  format: 'csv' | 'pdf',
  startDate: Date,
  endDate: Date
): string => {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  return `tipgenius_${start}_to_${end}.${format}`;
};

/**
 * Format date for display
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString(
    'en-US',
    formatOptions
  )}`;
};

/**
 * Tax Summary data for PDF generation
 */
export interface TaxSummaryPDFData {
  year: number;
  userName: string;
  // Income
  grossTips: number;
  tipOut: number;
  netTipEarnings: number;
  // $25K Threshold
  taxFreeTips: number;
  taxableTips: number;
  thresholdUsed: number; // percentage
  // Deductions by category
  deductionsByCategory: { category: string; amount: number }[];
  totalDeductions: number;
  // Final numbers
  taxableIncome: number;
  estimatedTax: number;
  taxRate: number;
  // Quarterly breakdown
  quarters: {
    quarter: number;
    grossTips: number;
    tipOut: number;
    netTips: number;
    taxFreeTips: number;
    taxableTips: number;
    deductions: number;
    estimatedTax: number;
  }[];
  // Stats
  totalShifts: number;
  totalHours: number;
  avgHourlyRate: number;
}

/**
 * Generate professional Tax Summary PDF HTML
 */
export const generateTaxSummaryPDFHTML = (data: TaxSummaryPDFData): string => {
  const exportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formatMoney = (amount: number) => amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          padding: 32px;
          color: #1f2937;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 3px solid #4f46e5;
        }
        .header h1 {
          font-size: 24px;
          color: #4f46e5;
          margin-bottom: 4px;
        }
        .header .year {
          font-size: 32px;
          font-weight: 800;
          color: #1f2937;
          margin: 8px 0;
        }
        .header .subtitle {
          font-size: 13px;
          color: #6b7280;
        }
        .two-column {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }
        .column {
          flex: 1;
        }
        .section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 12px;
          border: 1px solid #e5e7eb;
        }
        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: #4f46e5;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .row:last-child {
          border-bottom: none;
        }
        .row.total {
          border-top: 2px solid #d1d5db;
          margin-top: 6px;
          padding-top: 8px;
          font-weight: 700;
        }
        .row .label {
          color: #6b7280;
        }
        .row .value {
          font-weight: 600;
          color: #1f2937;
        }
        .row .value.green {
          color: #059669;
        }
        .row .value.red {
          color: #dc2626;
        }
        .row .value.primary {
          color: #4f46e5;
        }
        .highlight-box {
          background: #4f46e5;
          color: white;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          margin-bottom: 12px;
        }
        .highlight-box .label {
          font-size: 11px;
          opacity: 0.9;
          margin-bottom: 4px;
        }
        .highlight-box .value {
          font-size: 28px;
          font-weight: 800;
        }
        .highlight-box .subtext {
          font-size: 10px;
          opacity: 0.8;
          margin-top: 4px;
        }
        .threshold-bar {
          background: #e5e7eb;
          border-radius: 4px;
          height: 10px;
          margin: 8px 0;
          overflow: hidden;
        }
        .threshold-fill {
          height: 100%;
          background: ${data.thresholdUsed >= 100 ? '#f59e0b' : '#059669'};
          border-radius: 4px;
        }
        .quarterly-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        .quarterly-table th {
          background: #4f46e5;
          color: white;
          padding: 8px 6px;
          text-align: right;
          font-weight: 600;
        }
        .quarterly-table th:first-child {
          text-align: left;
        }
        .quarterly-table td {
          padding: 6px;
          border-bottom: 1px solid #e5e7eb;
          text-align: right;
        }
        .quarterly-table td:first-child {
          text-align: left;
          font-weight: 600;
        }
        .quarterly-table tr:last-child td {
          border-bottom: none;
        }
        .deduction-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
        .footer {
          margin-top: 20px;
          padding-top: 12px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 9px;
        }
        .disclaimer {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 10px;
          font-size: 9px;
          color: #92400e;
          margin-top: 12px;
        }
        .stats-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .stat-box {
          flex: 1;
          background: #f3f4f6;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
        }
        .stat-box .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }
        .stat-box .stat-label {
          font-size: 9px;
          color: #6b7280;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TIP INCOME SUMMARY</h1>
        <div class="year">${data.year}</div>
        <div class="subtitle">
          <strong>${data.userName}</strong><br>
          Generated on ${exportDate}
        </div>
      </div>

      <!-- Highlight: Estimated Tax -->
      <div class="highlight-box">
        <div class="label">Estimated Self-Employment Tax Owed</div>
        <div class="value">$${formatMoney(data.estimatedTax)}</div>
        <div class="subtext">Based on ${(data.taxRate * 100).toFixed(1)}% self-employment tax rate</div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-value">${data.totalShifts}</div>
          <div class="stat-label">Total Shifts</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${data.totalHours.toFixed(0)}</div>
          <div class="stat-label">Hours Worked</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">$${formatMoney(data.avgHourlyRate)}</div>
          <div class="stat-label">Avg Per Hour</div>
        </div>
      </div>

      <div class="two-column">
        <div class="column">
          <!-- Tip Income Section -->
          <div class="section">
            <div class="section-title">Tip Income</div>
            <div class="row">
              <span class="label">Gross Tips Earned</span>
              <span class="value">$${formatMoney(data.grossTips)}</span>
            </div>
            ${data.tipOut > 0 ? `
            <div class="row">
              <span class="label">Tip Out (Support Staff)</span>
              <span class="value red">-$${formatMoney(data.tipOut)}</span>
            </div>
            ` : ''}
            <div class="row total">
              <span class="label">Net Tip Earnings</span>
              <span class="value">$${formatMoney(data.netTipEarnings)}</span>
            </div>
          </div>

          <!-- $25K Threshold Section -->
          <div class="section">
            <div class="section-title">$25K Tax-Free Threshold</div>
            <div class="row">
              <span class="label">Tax-Free Tips (First $25K)</span>
              <span class="value green">$${formatMoney(data.taxFreeTips)}</span>
            </div>
            <div class="row">
              <span class="label">Taxable Tips (Over $25K)</span>
              <span class="value ${data.taxableTips > 0 ? 'red' : ''}">$${formatMoney(data.taxableTips)}</span>
            </div>
            <div class="threshold-bar">
              <div class="threshold-fill" style="width: ${Math.min(100, data.thresholdUsed)}%"></div>
            </div>
            <div style="text-align: center; font-size: 10px; color: #6b7280;">
              ${data.thresholdUsed.toFixed(0)}% of $25,000 threshold used
            </div>
          </div>
        </div>

        <div class="column">
          <!-- Deductions Section -->
          <div class="section">
            <div class="section-title">Business Deductions</div>
            ${data.deductionsByCategory.length > 0 ? data.deductionsByCategory.map(d => `
            <div class="deduction-item">
              <span class="label">${d.category}</span>
              <span class="value green">$${formatMoney(d.amount)}</span>
            </div>
            `).join('') : '<div style="color: #9ca3af; text-align: center; padding: 10px;">No deductions recorded</div>'}
            <div class="row total">
              <span class="label">Total Deductions</span>
              <span class="value green">-$${formatMoney(data.totalDeductions)}</span>
            </div>
          </div>

          <!-- Final Calculation -->
          <div class="section" style="background: #eef2ff; border-color: #4f46e5;">
            <div class="section-title">Tax Calculation</div>
            <div class="row">
              <span class="label">Taxable Tips</span>
              <span class="value">$${formatMoney(data.taxableTips)}</span>
            </div>
            <div class="row">
              <span class="label">Less: Deductions</span>
              <span class="value green">-$${formatMoney(data.totalDeductions)}</span>
            </div>
            <div class="row total">
              <span class="label">Taxable Income</span>
              <span class="value primary">$${formatMoney(data.taxableIncome)}</span>
            </div>
            <div class="row" style="margin-top: 8px;">
              <span class="label">Self-Employment Tax (15.3%)</span>
              <span class="value primary">$${formatMoney(data.estimatedTax)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quarterly Breakdown -->
      <div class="section">
        <div class="section-title">Quarterly Breakdown</div>
        <table class="quarterly-table">
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Gross Tips</th>
              <th>Tip Out</th>
              <th>Net Tips</th>
              <th>Tax-Free</th>
              <th>Taxable</th>
              <th>Deductions</th>
              <th>Est. Tax</th>
            </tr>
          </thead>
          <tbody>
            ${data.quarters.map(q => `
            <tr>
              <td>Q${q.quarter}</td>
              <td>$${formatMoney(q.grossTips)}</td>
              <td>${q.tipOut > 0 ? '-$' + formatMoney(q.tipOut) : '-'}</td>
              <td>$${formatMoney(q.netTips)}</td>
              <td style="color: #059669;">$${formatMoney(q.taxFreeTips)}</td>
              <td style="color: ${q.taxableTips > 0 ? '#dc2626' : '#1f2937'};">$${formatMoney(q.taxableTips)}</td>
              <td style="color: #059669;">${q.deductions > 0 ? '-$' + formatMoney(q.deductions) : '-'}</td>
              <td style="color: #4f46e5;">$${formatMoney(q.estimatedTax)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <strong>Important:</strong> This summary is for informational purposes only and is based on the "No Tax on Tips Act" (proposed 2025) which exempts the first $25,000 in tips from federal income tax. Tax laws may change. Consult a qualified tax professional for advice specific to your situation. This document does not constitute tax advice.
      </div>

      <div class="footer">
        Generated by TipFly AI • For tax filing and record keeping purposes<br>
        tipfly.ai
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Get filename for tax summary export
 */
export const getTaxSummaryFilename = (year: number): string => {
  return `TipFly_Tax_Summary_${year}.pdf`;
};

/**
 * Income Summary Report data structure
 */
export interface IncomeVerificationData {
  // User info
  userName: string;
  userEmail: string;
  // Report period
  periodType: 'monthly' | 'quarterly' | 'annual' | 'custom';
  periodLabel: string; // e.g., "January 2025", "Q4 2024", "2024"
  startDate: Date;
  endDate: Date;
  // Income data
  grossIncome: number;
  tipOut: number;
  netIncome: number;
  // Work stats
  totalShifts: number;
  totalHours: number;
  averagePerShift: number;
  averagePerHour: number;
  // Monthly breakdown (for quarterly/annual reports)
  monthlyBreakdown?: {
    month: string;
    income: number;
    shifts: number;
    hours: number;
  }[];
  // Verification
  reportId: string; // Unique ID for this report
  generatedAt: string; // ISO timestamp
}

/**
 * Generate a unique report ID
 */
const generateReportId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TF-${timestamp}-${random}`.toUpperCase();
};

/**
 * Generate Income Summary Report PDF HTML
 * Professional format suitable for apartment applications, loans, etc.
 */
export const generateIncomeVerificationPDFHTML = (data: IncomeVerificationData): string => {
  const formatMoney = (amount: number) =>
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Georgia, serif;
          padding: 48px;
          color: #1a1a1a;
          font-size: 12px;
          line-height: 1.6;
          background: white;
        }
        .letterhead {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .letterhead .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          letter-spacing: 2px;
        }
        .letterhead .tagline {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }
        .document-title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 30px;
          color: #1a1a1a;
        }
        .report-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          font-size: 11px;
        }
        .report-info-left {
          text-align: left;
        }
        .report-info-right {
          text-align: right;
        }
        .report-info strong {
          color: #2563eb;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1a1a1a;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 8px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .certification-box {
          background: #f8fafc;
          border: 2px solid #2563eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
        }
        .certification-text {
          font-size: 13px;
          line-height: 1.8;
        }
        .highlight {
          font-weight: bold;
          color: #2563eb;
        }
        .income-summary {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        .income-box {
          flex: 1;
          background: #f1f5f9;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .income-box.primary {
          background: #2563eb;
          color: white;
        }
        .income-box .label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .income-box.primary .label {
          opacity: 0.9;
        }
        .income-box .value {
          font-size: 24px;
          font-weight: bold;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .details-table th {
          background: #f1f5f9;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }
        .details-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .details-table tr:last-child td {
          border-bottom: none;
        }
        .details-table .label {
          color: #6b7280;
        }
        .details-table .value {
          font-weight: 600;
          text-align: right;
        }
        .monthly-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .monthly-table th {
          background: #2563eb;
          color: white;
          padding: 8px 10px;
          text-align: right;
          font-weight: 600;
        }
        .monthly-table th:first-child {
          text-align: left;
        }
        .monthly-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e5e7eb;
          text-align: right;
        }
        .monthly-table td:first-child {
          text-align: left;
        }
        .monthly-table tr:nth-child(even) {
          background: #f9fafb;
        }
        .monthly-table tr.total {
          background: #f1f5f9;
          font-weight: bold;
        }
        .verification-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        .verification-id {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 10px;
        }
        .verification-id .id-label {
          color: #6b7280;
        }
        .verification-id .id-value {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #2563eb;
          font-size: 12px;
        }
        .disclaimer {
          margin-top: 25px;
          padding: 15px;
          background: #fefce8;
          border: 1px solid #fde047;
          border-radius: 6px;
          font-size: 10px;
          color: #713f12;
        }
        .disclaimer strong {
          display: block;
          margin-bottom: 5px;
        }
        .signature-section {
          margin-top: 30px;
          padding-top: 20px;
        }
        .signature-line {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }
        .signature-box {
          width: 45%;
        }
        .signature-box .line {
          border-top: 1px solid #1a1a1a;
          padding-top: 8px;
          font-size: 10px;
          color: #6b7280;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 9px;
          color: #9ca3af;
        }
        .watermark {
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 8px;
          color: #d1d5db;
        }
      </style>
    </head>
    <body>
      <!-- Letterhead -->
      <div class="letterhead">
        <div class="logo">TIPFLY AI</div>
        <div class="tagline">Professional Tip & Income Tracking Platform</div>
      </div>

      <!-- Document Title -->
      <div class="document-title">Income Summary Report</div>

      <!-- Report Info -->
      <div class="report-info">
        <div class="report-info-left">
          <strong>Prepared For:</strong><br>
          ${data.userName}<br>
          ${data.userEmail}
        </div>
        <div class="report-info-right">
          <strong>Report ID:</strong> ${data.reportId}<br>
          <strong>Generated:</strong> ${generatedDate}<br>
          <strong>Period:</strong> ${data.periodLabel}
        </div>
      </div>

      <!-- Summary Box -->
      <div class="certification-box">
        <div class="certification-text">
          This document summarizes self-reported income recorded by <span class="highlight">${data.userName}</span>
          through the TipFly AI platform for the period of
          <span class="highlight">${formatDate(data.startDate)}</span> through
          <span class="highlight">${formatDate(data.endDate)}</span>.
          The reported net income for this period is
          <span class="highlight">$${formatMoney(data.netIncome)}</span>.
        </div>
      </div>

      <!-- Income Summary Boxes -->
      <div class="income-summary">
        <div class="income-box primary">
          <div class="label">Net Income</div>
          <div class="value">$${formatMoney(data.netIncome)}</div>
        </div>
        <div class="income-box">
          <div class="label">Total Shifts</div>
          <div class="value">${data.totalShifts}</div>
        </div>
        <div class="income-box">
          <div class="label">Hours Worked</div>
          <div class="value">${data.totalHours.toFixed(1)}</div>
        </div>
        <div class="income-box">
          <div class="label">Avg Per Hour</div>
          <div class="value">$${formatMoney(data.averagePerHour)}</div>
        </div>
      </div>

      <!-- Income Details Section -->
      <div class="section">
        <div class="section-title">Income Details</div>
        <table class="details-table">
          <tr>
            <td class="label">Gross Tips Earned</td>
            <td class="value">$${formatMoney(data.grossIncome)}</td>
          </tr>
          ${data.tipOut > 0 ? `
          <tr>
            <td class="label">Tip Out (Shared with Support Staff)</td>
            <td class="value">-$${formatMoney(data.tipOut)}</td>
          </tr>
          ` : ''}
          <tr>
            <td class="label"><strong>Net Income</strong></td>
            <td class="value"><strong>$${formatMoney(data.netIncome)}</strong></td>
          </tr>
        </table>
        <table class="details-table">
          <tr>
            <td class="label">Total Shifts Worked</td>
            <td class="value">${data.totalShifts}</td>
          </tr>
          <tr>
            <td class="label">Total Hours Worked</td>
            <td class="value">${data.totalHours.toFixed(1)} hours</td>
          </tr>
          <tr>
            <td class="label">Average Income Per Shift</td>
            <td class="value">$${formatMoney(data.averagePerShift)}</td>
          </tr>
          <tr>
            <td class="label">Average Hourly Rate</td>
            <td class="value">$${formatMoney(data.averagePerHour)}/hr</td>
          </tr>
        </table>
      </div>
  `;

  // Add monthly breakdown for quarterly/annual reports
  if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
    const totalIncome = data.monthlyBreakdown.reduce((sum, m) => sum + m.income, 0);
    const totalShifts = data.monthlyBreakdown.reduce((sum, m) => sum + m.shifts, 0);
    const totalHours = data.monthlyBreakdown.reduce((sum, m) => sum + m.hours, 0);

    html += `
      <!-- Monthly Breakdown Section -->
      <div class="section">
        <div class="section-title">Monthly Breakdown</div>
        <table class="monthly-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Shifts</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyBreakdown.map(m => `
            <tr>
              <td>${m.month}</td>
              <td>$${formatMoney(m.income)}</td>
              <td>${m.shifts}</td>
              <td>${m.hours.toFixed(1)}</td>
            </tr>
            `).join('')}
            <tr class="total">
              <td>Total</td>
              <td>$${formatMoney(totalIncome)}</td>
              <td>${totalShifts}</td>
              <td>${totalHours.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
      <!-- Report Footer -->
      <div class="verification-footer">
        <div class="verification-id">
          <span class="id-label">Report ID</span>
          <span class="id-value">${data.reportId}</span>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <strong>Important Notice:</strong>
        This income summary report is generated based on data self-reported by the user through the TipFly AI platform.
        TipFly AI does not independently verify this information and makes no representations or warranties regarding its accuracy.
        This document is provided for informational purposes only and may be used alongside other documentation to support income claims.
        For questions about this document, contact support@tipfly.ai.
      </div>

      <!-- Footer -->
      <div class="footer">
        TipFly AI Income Summary Report | Document ID: ${data.reportId}<br>
        Generated on ${generatedDate} | tipfly.ai
      </div>

      <div class="watermark">
        Generated by TipFly AI
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Get income verification data for a period
 */
export const getIncomeVerificationData = async (
  startDate: Date,
  endDate: Date,
  periodType: 'monthly' | 'quarterly' | 'annual' | 'custom',
  periodLabel: string
): Promise<IncomeVerificationData> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Get entries for the period
    const entries = await getEntriesForExport(startDate, endDate);

    // Calculate totals - handle both tips_earned and amount fields
    const grossIncome = entries.reduce((sum, e) => sum + ((e as any).tips_earned || (e as any).amount || 0), 0);
    const tipOut = entries.reduce((sum, e) => sum + ((e as any).tip_out || 0), 0);
    const netIncome = grossIncome - tipOut;
    const totalShifts = entries.length;
    const totalHours = entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0);
    const averagePerShift = totalShifts > 0 ? netIncome / totalShifts : 0;
    const averagePerHour = totalHours > 0 ? netIncome / totalHours : 0;

    // Generate monthly breakdown for quarterly/annual reports
    let monthlyBreakdown: IncomeVerificationData['monthlyBreakdown'];
    if (periodType !== 'monthly') {
      const monthlyData: { [key: string]: { income: number; shifts: number; hours: number } } = {};

      entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const monthKey = entryDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, shifts: 0, hours: 0 };
        }

        const entryIncome = ((entry as any).tips_earned || (entry as any).amount || 0) - ((entry as any).tip_out || 0);
        monthlyData[monthKey].income += entryIncome;
        monthlyData[monthKey].shifts += 1;
        monthlyData[monthKey].hours += entry.hours_worked || 0;
      });

      monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
      }));
    }

    return {
      userName: profile?.full_name || user.email || 'Unknown',
      userEmail: profile?.email || user.email || '',
      periodType,
      periodLabel,
      startDate,
      endDate,
      grossIncome,
      tipOut,
      netIncome,
      totalShifts,
      totalHours,
      averagePerShift,
      averagePerHour,
      monthlyBreakdown,
      reportId: generateReportId(),
      generatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error generating income verification data:', error);
    throw new Error(error.message || 'Failed to generate income verification data');
  }
};

/**
 * Get filename for income summary report export
 */
export const getIncomeVerificationFilename = (periodLabel: string): string => {
  const sanitized = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  return `TipFly_Income_Summary_${sanitized}.pdf`;
};
