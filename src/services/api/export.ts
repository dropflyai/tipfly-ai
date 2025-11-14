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
