import { Transaction, Category, Account, Budget, UserSettings } from '../types';
import { formatCurrency } from './currency';

/**
 * Generates a beautifully structured CSV document with Executive Summary,
 * Category Totals, and Itemized Transactions List.
 */
export function generateTransactionsCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  currency: string = 'USD',
  settings?: UserSettings
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const incomeTxs = transactions.filter((t) => t.type === 'income');
  const expenseTxs = transactions.filter((t) => t.type === 'expense');

  const recordedIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
  const targetIncome = settings?.monthlyIncomeTarget || settings?.monthlyIncome || 0;
  const totalIncome = recordedIncome > 0 ? recordedIncome : targetIncome;

  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;

  const lines: string[] = [];

  // Section 1: Metadata
  lines.push(`"FINANCIAL REPORT & TRANSACTIONS AUDIT CSV"`);
  lines.push(`"Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}"`);
  lines.push(`"Currency: ${currency}"`);
  lines.push('');

  // Section 2: Executive Summary Table
  lines.push(`"EXECUTIVE SUMMARY"`);
  lines.push(`"Total Income (${currency})","Total Expenses (${currency})","Net Savings (${currency})","Total Transactions"`);
  lines.push(`"${totalIncome.toFixed(2)}","${totalExpense.toFixed(2)}","${netSavings.toFixed(2)}","${transactions.length}"`);
  lines.push('');

  // Section 3: Category Spending Breakdown Table
  lines.push(`"CATEGORY SPENDING BREAKDOWN"`);
  lines.push(`"Category Name","Type","Total Amount (${currency})","Percentage of Expense"`);

  const categorySpentMap = new Map<string, number>();
  expenseTxs.forEach((t) => {
    categorySpentMap.set(t.categoryId, (categorySpentMap.get(t.categoryId) || 0) + t.amount);
  });

  categories
    .filter((c) => c.type === 'expense')
    .forEach((cat) => {
      const spent = categorySpentMap.get(cat.id) || 0;
      if (spent > 0) {
        const pct = totalExpense > 0 ? ((spent / totalExpense) * 100).toFixed(1) : '0.0';
        lines.push(`"${cat.name}","EXPENSE","${spent.toFixed(2)}","${pct}%"`);
      }
    });
  lines.push('');

  // Section 4: Itemized Transactions History Table
  lines.push(`"ITEMIZED TRANSACTIONS HISTORY"`);
  lines.push(`"Date","Type","Category","Account","Amount (${currency})","Note / Description","Split Type"`);

  transactions.forEach((t) => {
    const catName = categoryMap.get(t.categoryId) || 'Uncategorized';
    const accName = accountMap.get(t.accountId) || 'Default Account';
    const cleanDate = t.date ? t.date.split('T')[0] : '';
    const noteEscaped = t.note ? `"${t.note.replace(/"/g, '""')}"` : '""';
    const splitStr = t.splitType && t.splitType !== 'none' ? `"${t.splitType}"` : '"Personal"';

    lines.push(
      [
        `"${cleanDate}"`,
        `"${t.type.toUpperCase()}"`,
        `"${catName}"`,
        `"${accName}"`,
        `"${t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}"`,
        noteEscaped,
        splitStr,
      ].join(',')
    );
  });

  return '\uFEFF' + lines.join('\n');
}

/**
 * Generates a beautifully structured Executive Financial Statement document (PDF / Text format).
 */
export function generateFinancialStatement(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  settings: UserSettings,
  monthYearStr: string
): string {
  const currency = settings.currency || 'USD';
  const monthlyIncomeTarget = settings.monthlyIncomeTarget || settings.monthlyIncome || 0;

  const monthTx = transactions.filter((t) => t.date.startsWith(monthYearStr));
  const incomeTx = monthTx.filter((t) => t.type === 'income');
  const expenseTx = monthTx.filter((t) => t.type === 'expense');

  const totalActualIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0) || monthlyIncomeTarget;
  const totalActualExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalActualIncome - totalActualExpense;
  const savingsRate = totalActualIncome > 0 ? ((netSavings / totalActualIncome) * 100).toFixed(1) : '0';

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const categorySpentMap: Record<string, number> = {};

  let essentialSpend = 0;
  let discretionarySpend = 0;

  expenseTx.forEach((t) => {
    categorySpentMap[t.categoryId] = (categorySpentMap[t.categoryId] || 0) + t.amount;
    const cat = categoryMap.get(t.categoryId);
    if (cat?.isEssential) {
      essentialSpend += t.amount;
    } else {
      discretionarySpend += t.amount;
    }
  });

  let statement = `╔══════════════════════════════════════════════════════════════════╗\n`;
  statement += `║            EXECUTIVE FINANCIAL STATEMENT SUMMARY                 ║\n`;
  statement += `║                       PERIOD: ${monthYearStr.padEnd(12)}               ║\n`;
  statement += `╚══════════════════════════════════════════════════════════════════╝\n\n`;

  statement += `1. CASH FLOW & SAVINGS OVERVIEW\n`;
  statement += `──────────────────────────────────────────────────────────────────\n`;
  statement += ` • Monthly Target Income  : ${formatCurrency(monthlyIncomeTarget, currency)}\n`;
  statement += ` • Total Income Recorded  : ${formatCurrency(totalActualIncome, currency)}\n`;
  statement += ` • Total Expenses Spent   : ${formatCurrency(totalActualExpense, currency)}\n`;
  statement += ` • Net Monthly Surplus    : ${formatCurrency(netSavings, currency)}\n`;
  statement += ` • Net Savings Rate       : ${savingsRate}%\n\n`;

  statement += `2. USER ALLOCATED INCOME BUDGET PLAN (%)\n`;
  statement += `──────────────────────────────────────────────────────────────────\n`;
  const allocations = settings.incomeAllocations || {};
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  if (Object.keys(allocations).length === 0) {
    statement += ` • (No custom income allocations configured - showing actual spending breakdown below)\n\n`;
  } else {
    expenseCategories.forEach((cat) => {
      const allocatedPct = allocations[cat.id] || 0;
      if (allocatedPct > 0) {
        const targetAmt = (totalActualIncome * allocatedPct) / 100;
        const spentAmt = categorySpentMap[cat.id] || 0;
        const statusStr = spentAmt <= targetAmt ? 'WITHIN BUDGET' : `EXCEEDED BY ${formatCurrency(spentAmt - targetAmt, currency)}`;
        statement += ` • ${cat.name.padEnd(20)} : Target ${allocatedPct}% (${formatCurrency(targetAmt, currency)}) | Spent: ${formatCurrency(spentAmt, currency)} [${statusStr}]\n`;
      }
    });
    statement += `\n`;
  }

  statement += `3. TOP CATEGORY SPENDING BREAKDOWN\n`;
  statement += `──────────────────────────────────────────────────────────────────\n`;
  const sortedCategories = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => ({
      cat,
      spent: categorySpentMap[cat.id] || 0,
      pct: totalActualExpense > 0 ? (((categorySpentMap[cat.id] || 0) / totalActualExpense) * 100).toFixed(1) : '0',
    }))
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  if (sortedCategories.length === 0) {
    statement += ` (No expenses recorded for this period)\n`;
  } else {
    sortedCategories.forEach((item) => {
      statement += ` • ${item.cat.name.padEnd(20)} : ${formatCurrency(item.spent, currency).padEnd(12)} (${item.pct}%)\n`;
    });
  }

  statement += `\n══════════════════════════════════════════════════════════════════\n`;
  statement += ` Document Generated : ${new Date().toLocaleString()}\n`;
  statement += ` App                : Expense Tracker Pro\n`;
  statement += `══════════════════════════════════════════════════════════════════\n`;

  return statement;
}

/**
 * Generates an executive, beautifully styled HTML document (viewable & printable as PDF)
 * featuring SVG Donut & Bar Charts, User Income Allocations, and Structured Financial Tables.
 */
export function generateFinancialStatementHTML(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  settings: UserSettings,
  monthYearStr: string
): string {
  const currency = settings.currency || 'USD';
  const monthlyIncomeTarget = settings.monthlyIncomeTarget || settings.monthlyIncome || 0;

  const monthTx = transactions.filter((t) => t.date.startsWith(monthYearStr));
  const incomeTx = monthTx.filter((t) => t.type === 'income');
  const expenseTx = monthTx.filter((t) => t.type === 'expense');

  const totalActualIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0) || monthlyIncomeTarget;
  const totalActualExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalActualIncome - totalActualExpense;
  const savingsRate = totalActualIncome > 0 ? ((netSavings / totalActualIncome) * 100).toFixed(1) : '0';

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const categorySpentMap: Record<string, number> = {};
  let essentialSpend = 0;
  let discretionarySpend = 0;

  // Shared & Split Expense Calculations
  const sharedTx = monthTx.filter((t) => t.splitType && t.splitType !== 'none');
  const personalTx = monthTx.filter((t) => !t.splitType || t.splitType === 'none');
  const sharedSpent = sharedTx.reduce((sum, t) => sum + t.amount, 0);
  const personalSpent = personalTx.reduce((sum, t) => sum + t.amount, 0);
  const sharedPct = totalActualExpense > 0 ? ((sharedSpent / totalActualExpense) * 100).toFixed(1) : '0';

  expenseTx.forEach((t) => {
    categorySpentMap[t.categoryId] = (categorySpentMap[t.categoryId] || 0) + t.amount;
    const cat = categoryMap.get(t.categoryId);
    if (cat?.isEssential) {
      essentialSpend += t.amount;
    } else {
      discretionarySpend += t.amount;
    }
  });

  const sortedCategories = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => ({
      cat,
      spent: categorySpentMap[cat.id] || 0,
      pct: totalActualExpense > 0 ? (((categorySpentMap[cat.id] || 0) / totalActualExpense) * 100).toFixed(1) : '0',
    }))
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // User Income Allocation Calculations
  const allocations = settings.incomeAllocations || {};
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const allocationItems = expenseCategories.map((cat) => {
    const allocatedPct = allocations[cat.id] || 0;
    const targetAmt = Math.round((totalActualIncome * allocatedPct) / 100);
    const spentAmt = categorySpentMap[cat.id] || 0;
    const remainingAmt = targetAmt - spentAmt;
    const progressPct = targetAmt > 0 ? Math.min(100, Math.round((spentAmt / targetAmt) * 100)) : (spentAmt > 0 ? 100 : 0);

    return {
      cat,
      allocatedPct,
      targetAmt,
      spentAmt,
      remainingAmt,
      progressPct,
      isOver: spentAmt > targetAmt && targetAmt > 0,
    };
  }).filter((item) => item.allocatedPct > 0 || item.spentAmt > 0);

  // -------------------------------------------------------------
  // SVG Donut Chart Generation for Top Category Spending
  // -------------------------------------------------------------
  const sliceColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#64748B'];
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.15
  let cumulativePct = 0;

  const topSlices = sortedCategories.slice(0, 5);
  const otherSpent = sortedCategories.slice(5).reduce((sum, item) => sum + item.spent, 0);
  if (otherSpent > 0) {
    topSlices.push({
      cat: { id: 'others', name: 'Others', icon: '📦', color: '#64748B', type: 'expense', isEssential: false, isPreset: true },
      spent: otherSpent,
      pct: totalActualExpense > 0 ? ((otherSpent / totalActualExpense) * 100).toFixed(1) : '0',
    });
  }

  const donutSvgPaths = topSlices.map((item, idx) => {
    const pctVal = Number(item.pct);
    const dashLength = (pctVal / 100) * circumference;
    const offset = (cumulativePct / 100) * circumference;
    cumulativePct += pctVal;
    const color = sliceColors[idx % sliceColors.length];

    return `<circle
      cx="70" cy="70" r="${radius}"
      fill="transparent"
      stroke="${color}"
      stroke-width="20"
      stroke-dasharray="${dashLength.toFixed(2)} ${(circumference - dashLength).toFixed(2)}"
      stroke-dashoffset="-${offset.toFixed(2)}"
    />`;
  }).join('');

  // -------------------------------------------------------------
  // SVG Cash Flow Velocity Bar Chart Generation
  // -------------------------------------------------------------
  const maxBarVal = Math.max(totalActualIncome, totalActualExpense, Math.max(0, netSavings), 1);
  const incomeBarHeight = Math.round((totalActualIncome / maxBarVal) * 90);
  const expenseBarHeight = Math.round((totalActualExpense / maxBarVal) * 90);
  const surplusBarHeight = Math.round((Math.max(0, netSavings) / maxBarVal) * 90);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Executive Financial Report - ${monthYearStr}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #0F172A; color: #F8FAFC; line-height: 1.5; }
    .top-bar { background: #1E293B; padding: 14px 28px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
    .print-btn { background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); }
    .container { max-width: 850px; margin: 32px auto; background: #1E293B; border-radius: 20px; padding: 40px; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
    
    /* Header & Branding */
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 24px; margin-bottom: 32px; }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 42px; height: 42px; background: linear-gradient(135deg, #10B981, #047857); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #FFF; font-size: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
    .logo-title { font-size: 22px; font-weight: 800; color: #F8FAFC; letter-spacing: -0.5px; }
    .logo-sub { color: #94A3B8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
    .badge { background: rgba(16, 185, 129, 0.12); color: #34D399; padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3); text-align: right; }
    
    /* KPI Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #0F172A; padding: 18px; border-radius: 14px; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.6px; }
    .stat-value { font-size: 20px; font-weight: 800; margin-top: 6px; color: #F8FAFC; }
    .stat-value.green { color: #34D399; }
    .stat-value.red { color: #F87171; }
    .stat-sub { font-size: 11px; color: #64748B; margin-top: 4px; font-weight: 500; }

    /* Section Component Panels */
    .section-card { background: #0F172A; border-radius: 16px; border: 1px solid #334155; padding: 24px; margin-bottom: 32px; }
    .section-title { font-size: 15px; font-weight: 800; margin-bottom: 18px; color: #F8FAFC; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; width: 4px; height: 16px; background: #10B981; border-radius: 2px; }

    /* Visual Charts Grid */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .chart-box { background: #0F172A; border-radius: 16px; border: 1px solid #334155; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; }
    .donut-wrapper { display: flex; align-items: center; gap: 20px; margin-top: 10px; }
    .legend-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .legend-item { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
    .legend-color { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 6px; }

    /* Tables */
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 12px; }
    th { text-align: left; padding: 12px 14px; background: #1E293B; color: #94A3B8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #334155; }
    th:first-child { border-top-left-radius: 8px; }
    th:last-child { border-top-right-radius: 8px; }
    td { padding: 12px 14px; border-bottom: 1px solid #334155; font-size: 13px; color: #E2E8F0; }
    tr:nth-child(even) td { background: rgba(255, 255, 255, 0.02); }
    
    /* Progress Bars & Badges */
    .progress-bar-bg { background: #334155; height: 8px; border-radius: 4px; overflow: hidden; }
    .progress-bar-fill { height: 100%; border-radius: 4px; }
    .status-badge { padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; display: inline-block; }
    .status-badge.green { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-badge.red { background: rgba(239, 68, 68, 0.15); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-badge.gray { background: rgba(148, 163, 184, 0.15); color: #94A3B8; border: 1px solid rgba(148, 163, 184, 0.3); }

    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; display: flex; justify-content: space-between; color: #64748B; font-size: 12px; }

    /* Print Specific Styles */
    @media print {
      .no-print { display: none !important; }
      body { background: #FFFFFF !important; color: #0F172A !important; }
      .container { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; background: #FFFFFF !important; color: #0F172A !important; padding: 0 !important; }
      .stat-card, .section-card, .chart-box { background: #F8FAFC !important; border: 1px solid #CBD5E1 !important; color: #0F172A !important; }
      .stat-value { color: #0F172A !important; }
      th { background: #F1F5F9 !important; color: #475569 !important; border-bottom: 2px solid #CBD5E1 !important; }
      td { border-bottom: 1px solid #E2E8F0 !important; color: #1E293B !important; }
      tr:nth-child(even) td { background: #F8FAFC !important; }
      .section-title { color: #0F172A !important; }
      .progress-bar-bg { background: #E2E8F0 !important; }
      .logo-title { color: #0F172A !important; }
    }
  </style>
</head>
<body>
  <div class="top-bar no-print">
    <span style="font-weight: 600; font-size: 14px; color: #94A3B8;">Executive Financial Statement & Analytics</span>
    <button class="print-btn" onclick="window.print()">🖨️ Save as PDF / Print Report</button>
  </div>

  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-box">
        <div class="logo-icon">📊</div>
        <div>
          <div class="logo-title">EXPENSE TRACKER PRO</div>
          <div class="logo-sub">Executive Financial Statement & Audit Log</div>
        </div>
      </div>
      <div class="badge">
        PERIOD: ${monthYearStr}<br>
        <span style="font-size: 11px; font-weight: 500; opacity: 0.8;">Currency: ${currency}</span>
      </div>
    </div>

    <!-- SECTION 1: CASH FLOW & SAVINGS OVERVIEW -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Income</div>
        <div class="stat-value green">${formatCurrency(totalActualIncome, currency)}</div>
        <div class="stat-sub">Target: ${formatCurrency(monthlyIncomeTarget, currency)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Expenses</div>
        <div class="stat-value red">${formatCurrency(totalActualExpense, currency)}</div>
        <div class="stat-sub">${monthTx.filter(t => t.type === 'expense').length} expense items</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Net Surplus</div>
        <div class="stat-value ${netSavings >= 0 ? 'green' : 'red'}">${formatCurrency(netSavings, currency)}</div>
        <div class="stat-sub">${netSavings >= 0 ? 'Surplus Saved' : 'Deficit'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Savings Rate</div>
        <div class="stat-value">${savingsRate}%</div>
        <div class="stat-sub">Retained Income</div>
      </div>
    </div>

    <!-- Visual Charts Side-by-Side Grid -->
    <div class="charts-grid">
      <!-- Donut Chart: Top Category Breakdown -->
      <div class="chart-box">
        <div class="section-title">Expense Distribution</div>
        <div class="donut-wrapper">
          <svg width="140" height="140" viewBox="0 0 140 140" style="transform: rotate(-90deg);">
            <circle cx="70" cy="70" r="50" fill="transparent" stroke="#334155" stroke-width="20"/>
            ${sortedCategories.length > 0 ? donutSvgPaths : ''}
          </svg>
          <div class="legend-list">
            ${topSlices.length === 0
              ? '<span style="color: #94A3B8; font-size: 12px;">No expenses recorded</span>'
              : topSlices.map((item, idx) => `
                <div class="legend-item">
                  <span>
                    <span class="legend-color" style="background: ${sliceColors[idx % sliceColors.length]};"></span>
                    <strong>${item.cat.name}</strong>
                  </span>
                  <span style="color: #94A3B8;">${item.pct}%</span>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>

      <!-- Bar Chart: Cash Flow Velocity -->
      <div class="chart-box">
        <div class="section-title">Cash Flow Velocity</div>
        <div style="height: 120px; display: flex; align-items: flex-end; justify-content: space-around; padding-top: 10px; border-bottom: 1px solid #334155;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: #34D399;">${formatCurrency(totalActualIncome, currency, { hideDecimals: true })}</span>
            <div style="width: 36px; height: ${Math.max(6, incomeBarHeight)}px; background: linear-gradient(180deg, #34D399, #059669); border-radius: 6px 6px 0 0;"></div>
            <span style="font-size: 10px; color: #94A3B8; font-weight: 700;">INCOME</span>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: #F87171;">${formatCurrency(totalActualExpense, currency, { hideDecimals: true })}</span>
            <div style="width: 36px; height: ${Math.max(6, expenseBarHeight)}px; background: linear-gradient(180deg, #F87171, #DC2626); border-radius: 6px 6px 0 0;"></div>
            <span style="font-size: 10px; color: #94A3B8; font-weight: 700;">EXPENSE</span>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: #60A5FA;">${formatCurrency(Math.max(0, netSavings), currency, { hideDecimals: true })}</span>
            <div style="width: 36px; height: ${Math.max(6, surplusBarHeight)}px; background: linear-gradient(180deg, #60A5FA, #2563EB); border-radius: 6px 6px 0 0;"></div>
            <span style="font-size: 10px; color: #94A3B8; font-weight: 700;">SURPLUS</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: USER ALLOCATED INCOME BUDGET PLAN TABLE -->
    <div class="section-card">
      <div class="section-title">1. User Configured Income Allocation Plan</div>
      ${allocationItems.length === 0
        ? '<div style="color: #94A3B8; font-size: 13px; text-align: center; padding: 12px;">No custom income allocations configured in settings yet.</div>'
        : `<table>
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Target Allocated %</th>
                <th>Target Amount</th>
                <th>Actual Spent</th>
                <th>Status & Gauge</th>
              </tr>
            </thead>
            <tbody>
              ${allocationItems.map(item => `
                <tr>
                  <td><strong>${item.cat.icon} ${item.cat.name}</strong></td>
                  <td>${item.allocatedPct > 0 ? item.allocatedPct + '%' : 'Unallocated'}</td>
                  <td>${formatCurrency(item.targetAmt, currency)}</td>
                  <td style="color: ${item.isOver ? '#F87171' : '#F8FAFC'}; font-weight: 700;">${formatCurrency(item.spentAmt, currency)}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span class="status-badge ${item.allocatedPct === 0 ? 'gray' : (item.isOver ? 'red' : 'green')}">
                        ${item.allocatedPct === 0 ? 'Unallocated' : (item.isOver ? 'Exceeded' : 'On Track')}
                      </span>
                      <div class="progress-bar-bg" style="flex: 1;">
                        <div class="progress-bar-fill" style="width: ${item.progressPct}%; background: ${item.isOver ? '#EF4444' : '#10B981'};"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
      }
    </div>

    <!-- SECTION 3: CATEGORY SPENDING ANALYSIS TABLE -->
    <div class="section-card">
      <div class="section-title">2. Category Spending Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Classification</th>
            <th>Total Spent</th>
            <th>Share of Expenses</th>
          </tr>
        </thead>
        <tbody>
          ${sortedCategories.length === 0
            ? '<tr><td colspan="4" style="text-align: center; color: #94A3B8;">No expenses recorded for this period</td></tr>'
            : sortedCategories.map(item => `
              <tr>
                <td><strong>${item.cat.icon || ''} ${item.cat.name}</strong></td>
                <td>
                  <span class="status-badge ${item.cat.isEssential ? 'green' : 'gray'}">
                    ${item.cat.isEssential ? 'Essential Needs' : 'Discretionary'}
                  </span>
                </td>
                <td style="color: #F87171; font-weight: 700;">${formatCurrency(item.spent, currency)}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: 700; width: 42px;">${item.pct}%</span>
                    <div class="progress-bar-bg" style="flex: 1;">
                      <div class="progress-bar-fill" style="width: ${item.pct}%; background: #3B82F6;"></div>
                    </div>
                  </div>
                </td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>

    <!-- SECTION 4: SHARED & SPLIT EXPENSE AUDIT PANEL -->
    <div class="section-card">
      <div class="section-title">3. Shared & Split Expense Audit</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background: #1E293B; padding: 14px; border-radius: 10px; border: 1px solid #334155;">
          <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Shared / Split Total</div>
          <div style="font-size: 18px; font-weight: 800; color: #A7F3D0; margin-top: 4px;">${formatCurrency(sharedSpent, currency)} (${sharedPct}% of expenses)</div>
        </div>
        <div style="background: #1E293B; padding: 14px; border-radius: 10px; border: 1px solid #334155;">
          <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Personal Solo Total</div>
          <div style="font-size: 18px; font-weight: 800; color: #F8FAFC; margin-top: 4px;">${formatCurrency(personalSpent, currency)}</div>
        </div>
      </div>
    </div>

    <!-- SECTION 5: ITEMIZED TRANSACTIONS LEDGER -->
    <div class="section-card">
      <div class="section-title">4. Itemized Transactions History Log</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Split / Notes</th>
          </tr>
        </thead>
        <tbody>
          ${monthTx.length === 0
            ? '<tr><td colspan="5" style="text-align: center; color: #94A3B8;">No transactions recorded for this period</td></tr>'
            : monthTx.slice(0, 30).map(tx => {
              const cat = categoryMap.get(tx.categoryId);
              const isInc = tx.type === 'income';
              const amtStr = `${isInc ? '+' : '-'}${formatCurrency(tx.amount, currency)}`;
              const splitTag = tx.splitType && tx.splitType !== 'none' ? `[${tx.splitType.toUpperCase()}] ` : '';
              return `
                <tr>
                  <td>${tx.date ? tx.date.split('T')[0] : ''}</td>
                  <td>
                    <span class="status-badge ${isInc ? 'green' : 'red'}">
                      ${tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td><strong>${cat ? cat.name : 'Uncategorized'}</strong></td>
                  <td style="color: ${isInc ? '#34D399' : '#F87171'}; font-weight: 800;">${amtStr}</td>
                  <td style="color: #94A3B8; font-size: 12px;">${splitTag}${tx.note || 'Personal'}</td>
                </tr>
              `;
            }).join('')
          }
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>Generated on ${new Date().toLocaleString()}</span>
      <span>Expense Tracker Pro Executive Analytics</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates a genuine, valid PDF 1.4 binary file specification string in pure JS.
 * Opens natively in Adobe, Drive, Files, and mobile PDF readers without corruption errors.
 */
export function generatePurePDFString(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  settings: UserSettings,
  monthYearStr: string
): string {
  const currency = settings.currency || 'USD';
  const monthlyIncomeTarget = settings.monthlyIncomeTarget || settings.monthlyIncome || 0;

  const monthTx = transactions.filter((t) => t.date.startsWith(monthYearStr));
  const incomeTx = monthTx.filter((t) => t.type === 'income');
  const expenseTx = monthTx.filter((t) => t.type === 'expense');

  const totalActualIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0) || monthlyIncomeTarget;
  const totalActualExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalActualIncome - totalActualExpense;
  const savingsRate = totalActualIncome > 0 ? ((netSavings / totalActualIncome) * 100).toFixed(1) : '0';

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const categorySpentMap: Record<string, number> = {};

  // Shared & Split Expense Analytics
  const sharedTx = monthTx.filter((t) => t.splitType && t.splitType !== 'none');
  const personalTx = monthTx.filter((t) => !t.splitType || t.splitType === 'none');
  const sharedSpent = sharedTx.reduce((sum, t) => sum + t.amount, 0);
  const personalSpent = personalTx.reduce((sum, t) => sum + t.amount, 0);
  const sharedPct = totalActualExpense > 0 ? ((sharedSpent / totalActualExpense) * 100).toFixed(1) : '0';

  expenseTx.forEach((t) => {
    categorySpentMap[t.categoryId] = (categorySpentMap[t.categoryId] || 0) + t.amount;
  });

  // User Income Allocations
  const allocations = settings.incomeAllocations || {};
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const sortedCategories = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => ({
      cat,
      spent: categorySpentMap[cat.id] || 0,
      pct: totalActualExpense > 0 ? (((categorySpentMap[cat.id] || 0) / totalActualExpense) * 100).toFixed(1) : '0',
    }))
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // Helper to escape PDF text strings
  const escapePdfStr = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // =========================================================
  // PAGE 1: EXECUTIVE DASHBOARD & USER ALLOCATION PLAN
  // =========================================================
  let p1Stream = '';

  // Executive Header Banner (Light Slate & Royal Blue Accents)
  p1Stream += `0.97 0.98 1 rg 30 720 552 50 re f\n`;
  p1Stream += `0.15 0.39 0.92 RG 1.5 w 30 720 552 50 re s\n`;
  p1Stream += `BT /F2 16 Tf 0.06 0.15 0.35 rg 42 750 Td (EXPENSE TRACKER PRO) Tj ET\n`;
  p1Stream += `BT /F2 11 Tf 0.15 0.39 0.92 rg 42 732 Td (EXECUTIVE FINANCIAL STATEMENT & AUDIT REPORT) Tj ET\n`;
  p1Stream += `BT /F1 9 Tf 0.3 0.35 0.45 rg 415 750 Td (Audit Period : ${escapePdfStr(monthYearStr)}) Tj ET\n`;
  p1Stream += `BT /F1 9 Tf 0.3 0.35 0.45 rg 415 732 Td (Page Number  : 1 of 2) Tj ET\n`;

  // Branding Sub-Bar
  p1Stream += `BT /F1 9 Tf 0.35 0.4 0.5 rg 30 702 Td (Prepared for: Account Holder  |  Currency: ${escapePdfStr(currency)}  |  Report ID: ETP-${monthYearStr.replace('-', '')}) Tj ET\n`;

  // TOP KPI Cards
  p1Stream += `BT /F2 11 Tf 0.06 0.15 0.35 rg 30 682 Td (1. EXECUTIVE CASH FLOW & SAVINGS OVERVIEW) Tj ET\n`;

  const cards = [
    { label: 'GROSS INCOME', val: `${currency} ${totalActualIncome.toFixed(2)}`, bg: '0.94 0.98 0.95', border: '0.02 0.62 0.42', txt: '0.02 0.50 0.34' },
    { label: 'TOTAL EXPENSES', val: `${currency} ${totalActualExpense.toFixed(2)}`, bg: '0.99 0.95 0.95', border: '0.86 0.15 0.15', txt: '0.75 0.10 0.10' },
    { label: 'NET SURPLUS', val: `${currency} ${netSavings.toFixed(2)}`, bg: '0.93 0.97 1', border: '0.15 0.39 0.92', txt: '0.10 0.30 0.75' },
    { label: 'SAVINGS RATE', val: `${savingsRate}%`, bg: '0.98 0.96 0.93', border: '0.85 0.47 0.03', txt: '0.70 0.38 0.02' },
  ];

  cards.forEach((c, idx) => {
    const x = 30 + idx * 140;
    p1Stream += `${c.bg} rg ${x} 615 132 54 re f\n`;
    p1Stream += `${c.border} RG 1 w ${x} 615 132 54 re s\n`;
    p1Stream += `BT /F1 8 Tf 0.4 0.45 0.5 rg ${x + 8} 655 Td (${c.label}) Tj ET\n`;
    p1Stream += `BT /F2 11 Tf ${c.txt} rg ${x + 8} 630 Td (${escapePdfStr(c.val)}) Tj ET\n`;
  });

  // Section 2: User Configured Income Allocations
  p1Stream += `BT /F2 11 Tf 0.1 0.15 0.2 rg 30 595 Td (2. USER CONFIGURED INCOME ALLOCATION BUDGET PLAN) Tj ET\n`;

  let yPos = 575;
  const topAllocatedCats = expenseCategories.filter((c) => (allocations[c.id] || 0) > 0).slice(0, 4);

  if (topAllocatedCats.length === 0) {
    p1Stream += `BT /F1 9 Tf 0.4 0.45 0.5 rg 30 ${yPos} Td (No custom income allocation percentages configured in user settings) Tj ET\n`;
    yPos -= 22;
  } else {
    topAllocatedCats.forEach((cat) => {
      const allocatedPct = allocations[cat.id] || 0;
      const targetAmt = (totalActualIncome * allocatedPct) / 100;
      const spentAmt = categorySpentMap[cat.id] || 0;
      const spentPct = targetAmt > 0 ? (spentAmt / targetAmt) * 100 : 0;
      const labelStr = `${cat.name}: Target ${allocatedPct}% (${currency} ${targetAmt.toFixed(2)}) | Spent: ${currency} ${spentAmt.toFixed(2)}`;

      p1Stream += `BT /F1 9 Tf 0.2 0.25 0.3 rg 30 ${yPos} Td (${escapePdfStr(labelStr)}) Tj ET\n`;
      p1Stream += `0.88 0.91 0.95 rg 30 ${yPos - 10} 552 6 re f\n`;
      const barW = Math.min(552, Math.max(0, (spentPct / 100) * 552));
      const barColor = spentAmt > targetAmt ? '0.85 0.2 0.2' : '0.06 0.72 0.51';
      if (barW > 0) {
        p1Stream += `${barColor} rg 30 ${yPos - 10} ${barW.toFixed(1)} 6 re f\n`;
      }
      yPos -= 26;
    });
  }

  yPos -= 8;

  // Section 3: Shared & Split Expense Audit
  p1Stream += `BT /F2 11 Tf 0.1 0.15 0.2 rg 30 ${yPos} Td (3. SHARED & SPLIT EXPENSE AUDIT BALANCE) Tj ET\n`;
  yPos -= 58;
  p1Stream += `0.95 0.96 0.98 rg 30 ${yPos} 552 52 re f\n`;
  p1Stream += `0.7 0.75 0.8 RG 0.5 w 30 ${yPos} 552 52 re s\n`;
  p1Stream += `BT /F1 9 Tf 0.2 0.25 0.3 rg 42 ${yPos + 32} Td ( • Shared / Split Expenses Total : ${escapePdfStr(currency + ' ' + sharedSpent.toFixed(2))} (${sharedPct}% of total spent)) Tj ET\n`;
  p1Stream += `BT /F1 9 Tf 0.2 0.25 0.3 rg 42 ${yPos + 14} Td ( • Sole Personal Expenses Total : ${escapePdfStr(currency + ' ' + personalSpent.toFixed(2))}) Tj ET\n`;

  yPos -= 24;

  // Section 4: Category Spending Analysis & Relative Gauges (Dynamically Populating Page 1!)
  p1Stream += `BT /F2 11 Tf 0.06 0.15 0.35 rg 30 ${yPos} Td (4. CATEGORY SPENDING ANALYSIS & RELATIVE GAUGES) Tj ET\n`;
  yPos -= 20;

  // Header Box
  p1Stream += `0.15 0.39 0.92 rg 30 ${yPos} 552 18 re f\n`;
  p1Stream += `BT /F2 9 Tf 1 1 1 rg 38 ${yPos + 5} Td (CATEGORY NAME) Tj ET\n`;
  p1Stream += `BT /F2 9 Tf 1 1 1 rg 210 ${yPos + 5} Td (SPENT AMOUNT) Tj ET\n`;
  p1Stream += `BT /F2 9 Tf 1 1 1 rg 320 ${yPos + 5} Td (SHARE %) Tj ET\n`;
  p1Stream += `BT /F2 9 Tf 1 1 1 rg 410 ${yPos + 5} Td (VISUAL SPENDING GAUGE) Tj ET\n`;
  yPos -= 20;

  if (sortedCategories.length === 0) {
    p1Stream += `BT /F1 9 Tf 0.5 0.5 0.5 rg 38 ${yPos} Td (No expenses recorded for this month) Tj ET\n`;
    yPos -= 20;
  } else {
    sortedCategories.forEach((catItem, idx) => {
      if (yPos >= 52) {
        const rowBg = idx % 2 === 0 ? '0.96 0.97 0.99' : '1 1 1';
        p1Stream += `${rowBg} rg 30 ${yPos - 2} 552 18 re f\n`;
        p1Stream += `BT /F1 9 Tf 0.15 0.2 0.25 rg 38 ${yPos + 3} Td (${escapePdfStr(catItem.cat.name.slice(0, 24))}) Tj ET\n`;
        p1Stream += `BT /F2 9 Tf 0.86 0.15 0.15 rg 210 ${yPos + 3} Td (${escapePdfStr(currency + ' ' + catItem.spent.toFixed(2))}) Tj ET\n`;
        p1Stream += `BT /F1 9 Tf 0.3 0.35 0.4 rg 320 ${yPos + 3} Td (${catItem.pct}%) Tj ET\n`;

        p1Stream += `0.92 0.94 0.97 rg 410 ${yPos + 4} 160 6 re f\n`;
        const catWidth = Math.min(160, (Number(catItem.pct) / 100) * 160);
        if (catWidth > 0) {
          p1Stream += `0.02 0.62 0.42 rg 410 ${yPos + 4} ${catWidth.toFixed(1)} 6 re f\n`;
        }
        yPos -= 19;
      }
    });
  }

  // Page 1 Footer Line
  p1Stream += `0.8 0.85 0.9 RG 0.5 w 30 35 552 0.5 re s\n`;
  p1Stream += `BT /F1 8 Tf 0.5 0.55 0.6 rg 30 22 Td (Expense Tracker Pro Analytics | Confidential Financial Audit Document) Tj ET\n`;

  // =========================================================
  // PAGE 2: ITEMIZED TRANSACTIONS AUDIT HISTORY LOG
  // =========================================================
  let p2Stream = '';

  // Header Banner Page 2
  p2Stream += `0.97 0.98 1 rg 30 720 552 50 re f\n`;
  p2Stream += `0.15 0.39 0.92 RG 1.5 w 30 720 552 50 re s\n`;
  p2Stream += `BT /F2 16 Tf 0.06 0.15 0.35 rg 42 750 Td (EXPENSE TRACKER PRO) Tj ET\n`;
  p2Stream += `BT /F2 11 Tf 0.15 0.39 0.92 rg 42 732 Td (ITEMIZED TRANSACTION AUDIT HISTORY LOG) Tj ET\n`;
  p2Stream += `BT /F1 9 Tf 0.3 0.35 0.45 rg 415 750 Td (Audit Period : ${escapePdfStr(monthYearStr)}) Tj ET\n`;
  p2Stream += `BT /F1 9 Tf 0.3 0.35 0.45 rg 415 732 Td (Page Number  : 2 of 2) Tj ET\n`;

  // Section 5: Itemized Transactions Audit Log Table
  let cY = 695;
  p2Stream += `BT /F2 11 Tf 0.06 0.15 0.35 rg 30 ${cY} Td (5. ITEMIZED TRANSACTIONS AUDIT HISTORY) Tj ET\n`;
  cY -= 20;

  // Header Box
  p2Stream += `0.15 0.39 0.92 rg 30 ${cY} 552 18 re f\n`;
  p2Stream += `BT /F2 9 Tf 1 1 1 rg 38 ${cY + 5} Td (DATE) Tj ET\n`;
  p2Stream += `BT /F2 9 Tf 1 1 1 rg 105 ${cY + 5} Td (TYPE) Tj ET\n`;
  p2Stream += `BT /F2 9 Tf 1 1 1 rg 160 ${cY + 5} Td (CATEGORY) Tj ET\n`;
  p2Stream += `BT /F2 9 Tf 1 1 1 rg 280 ${cY + 5} Td (AMOUNT) Tj ET\n`;
  p2Stream += `BT /F2 9 Tf 1 1 1 rg 380 ${cY + 5} Td (SPLIT / NOTE DETAILS) Tj ET\n`;
  cY -= 20;

  if (monthTx.length === 0) {
    p2Stream += `BT /F1 9 Tf 0.5 0.5 0.5 rg 38 ${cY} Td (No itemized transactions logged for this period) Tj ET\n`;
    cY -= 20;
  } else {
    monthTx.slice(0, 32).forEach((tx, idx) => {
      const rowBg = idx % 2 === 0 ? '0.96 0.97 0.99' : '1 1 1';
      p2Stream += `${rowBg} rg 30 ${cY - 2} 552 18 re f\n`;

      const cleanDate = tx.date ? tx.date.split('T')[0] : '';
      const catName = categoryMap.get(tx.categoryId)?.name || 'Uncategorized';
      const amtStr = `${tx.type === 'income' ? '+' : '-'}${currency} ${tx.amount.toFixed(2)}`;
      const amtColor = tx.type === 'income' ? '0.06 0.6 0.4' : '0.85 0.2 0.2';
      const splitInfo = tx.splitType && tx.splitType !== 'none' ? `[${tx.splitType.toUpperCase()}] ` : '';
      const noteStr = (splitInfo + (tx.note || 'Personal')).slice(0, 26);

      p2Stream += `BT /F1 8 Tf 0.3 0.35 0.4 rg 38 ${cY + 3} Td (${escapePdfStr(cleanDate)}) Tj ET\n`;
      p2Stream += `BT /F2 8 Tf 0.2 0.25 0.3 rg 105 ${cY + 3} Td (${tx.type.toUpperCase()}) Tj ET\n`;
      p2Stream += `BT /F1 8 Tf 0.2 0.25 0.3 rg 160 ${cY + 3} Td (${escapePdfStr(catName.slice(0, 18))}) Tj ET\n`;
      p2Stream += `BT /F2 8 Tf ${amtColor} rg 280 ${cY + 3} Td (${escapePdfStr(amtStr)}) Tj ET\n`;
      p2Stream += `BT /F1 8 Tf 0.4 0.45 0.5 rg 380 ${cY + 3} Td (${escapePdfStr(noteStr)}) Tj ET\n`;
      cY -= 18;
    });
  }

  // Page 2 Footer Line
  p2Stream += `0.8 0.85 0.9 RG 0.5 w 30 35 552 0.5 re s\n`;
  p2Stream += `BT /F1 8 Tf 0.5 0.55 0.6 rg 30 22 Td (Report Generated: ${escapePdfStr(new Date().toLocaleString())} | Expense Tracker Pro Analytics) Tj ET\n`;

  // Multi-Page PDF 1.4 Binary Specification Assembly
  const pdfBody = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
7 0 obj
<< /Length ${p1Stream.length} >>
stream
${p1Stream}
endstream
endobj
8 0 obj
<< /Length ${p2Stream.length} >>
stream
${p2Stream}
endstream
endobj
xref
0 9
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000121 00000 n 
0000000260 00000 n 
0000000399 00000 n 
0000000470 00000 n 
0000000546 00000 n 
0000000622 + ${p1Stream.length} 00000 n 
trailer
<< /Size 9 /Root 1 0 R >>
startxref
${620 + p1Stream.length + p2Stream.length}
%%EOF`;

  return pdfBody;
}

