# Dashboard Blueprint v3.2.0

```yaml
version: v3.2.0
lastUpdated: 2026-01-11 23:35:00 UTC+2
module: Dashboard
status: Production
parent_system: Aaron Family Financial Model v6.1
```

---

## Overview

A fully online, free dashboard that visualizes household cash flows as an interactive Sankey diagram, reading live data from Google Sheets via Apps Script API integrated with ShadowLedger.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     100% FREE - 100% ONLINE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │  Google Sheet   │────▶│  Apps Script    │────▶│  GitHub Pages   │   │
│  │                 │     │  (ShadowLedger) │     │                 │   │
│  │  Your Data      │     │  JSON API       │     │  Dashboard UI   │   │
│  │  Monthly_Model  │     │  ?action=       │     │  index.html     │   │
│  │  _v4            │     │  dashboard      │     │                 │   │
│  │                 │     │                 │     │                 │   │
│  │  Edit anytime   │     │  Always on      │     │  Always on      │   │
│  │  FREE ✓         │     │  FREE ✓         │     │  FREE ✓         │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Current Deployment

| Component | URL |
|-----------|-----|
| Apps Script | Integrated into ShadowLedger project (same deployment URL) |

---

## Features

### v1 Features (Completed)
- ✅ Single month view
- ✅ Full year aggregated view
- ✅ Live data from Google Sheets
- ✅ Month type badges (Bonus, RSU, Sondertilgung, Post-Mortgage, Debt Attack)
- ✅ Basic stat cards (Total Inflow, Outflow, CMP, Investment, Mortgage, Net Worth)
- ✅ Interactive Sankey with hover tooltips
- ✅ CMP as central hub visualization

### v2 Features (Completed)
- ✅ Multi-month range selection (consecutive months, e.g., Jan-Mar 2026)
- ✅ Simple/Detailed view toggle (Simple = net flows, Detailed = gross-to-net)
- ✅ Enhanced stat card labels ("Current Investment Value", "Mortgage Left to Pay")
- ✅ Rich hover insights on stat cards
- ✅ Rich hover insights on Sankey nodes

### v3 Features (Completed - Dec 2024)
- ✅ **API Integration with ShadowLedger** - Uses `?action=dashboard` routing
- ✅ **88-Column v6.1 Model Support** - Updated from 77 columns
- ✅ **Expense Click Modal** - Full category breakdown with colored budget progress bars (🟢🟡🟠🔴)
- ✅ **Expense Hover Enhancement** - All 17 categories visible on hover with actual vs budget
- ✅ **Debt Click Modals** - High-APR, Low-APR, Fixed Loans, SAP Loan detail views
- ✅ **Debt Hover Details** - Payment/month + balance for each debt item
- ✅ **Low-APR Debt Support** - Scalable, AK columns (new in v6.1)
- ✅ **Other Family Income** - `other_fam_net_inc` field (new in v6.1)
- ✅ **SAP Loan H/W Breakdown** - Split view for husband/wife loan portions
- ✅ **CMP Flow Section** - Single-month view shows carry from previous month
- ✅ **Pre-fetch Expense Data** - Instant hover tooltips via `prefetchExpenseData()`
- ✅ **Expense API Endpoint** - `?action=expenses&month=YYYY-MM`
- ✅ **Bug Fix: Total Outflow** - Excludes `mortgage_interest` and `mortgage_principal` (already in `mortgage_payment`)

### v3.1 Features (Dec 2024)
- ✅ **Loading Overlay** - Semi-transparent overlay on Sankey during render
- ✅ **Refresh Button Feedback** - Spinner animation while data loads
- ✅ **Expense Loading Indicator** - "Loading expenses..." in status bar during prefetch
- ✅ **Expense View Toggle** - Collapsed | Expanded button in controls bar
- ✅ **Expanded Expense Sankey** - Individual category nodes with distinct colors
- ✅ **Category Color Scheme** - 17 distinct purple-gradient colors for categories
- ✅ **Min Amount Threshold** - €10 minimum; smaller categories grouped as "Other Expenses"

### v3.2 Features (Current - Jan 2026)
- ✅ **Category Emojis** - Visual emoji mapping for all 17 categories
- ✅ **Expense Hover Tooltips** - Transaction details on category hover
- ✅ **Recent Transactions Section** - Shows last 10 transactions by date
- ✅ **Top Transactions Section** - Shows top 10 transactions by amount
- ✅ **Category Insights** - Average amount, largest transaction info
- ✅ **German Number Formatting** - Thousand separators for percentages (de-DE locale)
- ✅ **Tooltip Positioning Fix** - Uses `clientX/clientY` with boundary detection
- ✅ **API URL Cleanup** - Strips query params from stored URL on init
- ✅ **Cache Validation** - Validates cached expense data structure before use

---

## Architecture

### Integration Model

Dashboard is **integrated into the ShadowLedger Apps Script project** rather than a separate deployment. This was chosen because Apps Script allows only ONE `doGet()` function per project.

```
ShadowLedger Project (Apps Script)
├── Code.gs          # Main routing + ShadowLedger functions
│   └── doGet(e)     # Routes based on ?action= parameter
│   └── getExpenseBreakdown(month)  # Enhanced with transaction details
├── Dashboard data extraction embedded in Code.gs
└── [Other SL functions]
```

### API Routing

| Endpoint | Method | Returns |
|----------|--------|---------|
| `?action=dashboard` | GET | Full financial data for Sankey (204 months) |
| `?action=expenses&month=YYYY-MM` | GET | Category expense breakdown with transactions |
| `?action=test` | GET | Health check + endpoint list |
| (POST body) | POST | ShadowLedger Discord webhook (unchanged) |

---

## Data Architecture

### Google Sheet → Apps Script API

**Sheet:** `Monthly_Model_v4` (88 columns - v6.1)

| Section | Columns | Data Returned |
|---------|---------|---------------|
| Date Info | A-E | month, year, date, income_from, month_type |
| Husband Income | F-M | gross, deductions (TA, OWNSAP), taxable, net, RSU |
| Wife Income | N-U | gross, deductions (TA, OWNSAP), taxable, net, RSU |
| OWNSAP | V-X | H value, W value, total |
| SAP Loan Detail | Y-AF | H/W TaxedAdv, Payment, Balance (8 cols) |
| YouTube | AG-AI | gross, tax reserve, net |
| Other Income | AJ | other_fam_net_inc |
| CMP | AK-AN | carry, inflow, available, end |
| Mortgage | AO-AT | begin, payment, interest, principal, sondertilgung, end |
| High-APR Debt | AU-BE | TF, Klarna, Nordea, DB, Aktia (payments + balances) |
| Low-APR Debt | BF-BI | Scalable, AK (payments + balances) |
| Fixed Loans | BJ-BO | Revolut, C3, Student, IKEA, N26 (payments) |
| Expenses | BP-BQ | budget, allocation |
| Investment | BR-BV | begin, OWNSAP, excess, growth, end |
| Cashpile | BW-BY | begin, add, end |
| Tax Reserve | BZ-CB | begin, add, end |
| Time Account | CC-CD | H hours, W hours |
| Net Worth | CE-CJ | investment, house, mortgage, debt, TA, total |

---

## Technical Implementation

### Category Emoji Mapping

```javascript
const categoryEmojis = {
  'Childcare': '👶',
  'Family Support': '👨‍👩‍👦',
  'Groceries + Food': '🛒',
  'Utilities': '💡',
  'Car': '🚗',
  'Shopping': '🛍️',
  'Travel & Leisure': '✈️',
  'Insurance': '🛡️',
  'Eat Out & Food delivery': '🍽️',
  'Gifts': '🎁',
  'Entertainment': '🎬',
  'Health & beauty': '💊',
  'Home improvement': '🏠',
  'Business & Subscription': '💼',
  'Donation': '❤️',
  'Special IO': '⭐',
  'Buffer': '🔄'
};

function getCategoryEmoji(name) {
  return categoryEmojis[name] || '📦';
}
```

### Category Color Scheme

```javascript
const categoryColors = {
  'Childcare': '#7c3aed',
  'Family Support': '#8b5cf6',
  'Groceries + Food': '#a78bfa',
  'Utilities': '#c4b5fd',
  'Car': '#ddd6fe',
  'Shopping': '#5b21b6',
  'Travel & Leisure': '#4c1d95',
  'Insurance': '#6d28d9',
  'Eat Out & Food delivery': '#a855f7',
  'Gifts': '#d946ef',
  'Entertainment': '#e879f9',
  'Health & beauty': '#f0abfc',
  'Home improvement': '#c026d3',
  'Business & Subscription': '#9333ea',
  'Donation': '#7e22ce',
  'Special IO': '#581c87',
  'Buffer': '#4c1d95'
};
```

### German Percentage Formatting

```javascript
function formatPercentGerman(percent) {
  if (percent === null || percent === undefined) return 'N/A';
  return percent.toLocaleString('de-DE') + '%';
}
// Example: 1140 → "1.140%"
```

### Expense Tooltip Component

```javascript
function showExpenseTooltip(event, idx) {
  const cat = currentExpenseData.categories[idx];
  if (!cat) return;
  
  const tooltip = document.getElementById('expenseTooltip');
  
  let html = `
    <div class="expense-tooltip-header">
      <span class="expense-category-emoji">${getCategoryEmoji(cat.name)}</span>
      <strong>${cat.name}</strong>
    </div>
    <div class="expense-tooltip-summary">
      €${cat.spent.toFixed(2)} / €${cat.budget} (${formatPercentGerman(cat.percent)})
    </div>
  `;
  
  // Recent transactions section
  if (cat.transactions_recent && cat.transactions_recent.length > 0) {
    html += `<div class="expense-tooltip-section">
      <div class="expense-tooltip-section-title">📅 Recent</div>`;
    cat.transactions_recent.slice(0, 5).forEach(t => {
      html += `<div class="expense-tooltip-txn">
        <span>${t.date}</span>
        <span>${t.merchant}</span>
        <span>€${t.amount.toFixed(2)}</span>
      </div>`;
    });
    html += `</div>`;
  }
  
  // Top transactions section
  if (cat.transactions_top && cat.transactions_top.length > 0) {
    html += `<div class="expense-tooltip-section">
      <div class="expense-tooltip-section-title">💰 Largest</div>`;
    cat.transactions_top.slice(0, 3).forEach(t => {
      html += `<div class="expense-tooltip-txn">
        <span>${t.date}</span>
        <span>${t.merchant}</span>
        <span>€${t.amount.toFixed(2)}</span>
      </div>`;
    });
    html += `</div>`;
  }
  
  // Insights section
  if (cat.insights) {
    html += `<div class="expense-tooltip-section">
      <div class="expense-tooltip-section-title">💡 Insights</div>
      <div class="expense-tooltip-insight">Avg: €${cat.insights.avg_amount.toFixed(2)}</div>
      <div class="expense-tooltip-insight">${cat.transaction_count} transactions</div>
    </div>`;
  }
  
  tooltip.innerHTML = html;
  tooltip.classList.add('visible');
  moveExpenseTooltip(event);
}
```

### Tooltip Positioning (Fixed)

```javascript
function moveExpenseTooltip(event) {
  const tooltip = document.getElementById('expenseTooltip');
  const padding = 15;
  
  let x = event.clientX + padding;
  let y = event.clientY + padding;
  
  // Boundary detection
  const rect = tooltip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) {
    x = event.clientX - rect.width - padding;
  }
  if (y + rect.height > window.innerHeight) {
    y = event.clientY - rect.height - padding;
  }
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}
```

### API URL Cleanup Pattern

```javascript
// On init, strip any existing query params
function init() {
  let storedUrl = localStorage.getItem('sankey_api_url');
  if (storedUrl) {
    // Clean up URL - remove any query params
    API_URL = storedUrl.split('?')[0];
    localStorage.setItem('sankey_api_url', API_URL);
  }
}

// Same cleanup in saveApiUrl, refreshData, fetchExpenseData
function saveApiUrl() {
  const input = document.getElementById('apiUrlInput');
  API_URL = input.value.trim().split('?')[0];  // Strip params
  localStorage.setItem('sankey_api_url', API_URL);
}
```

### Cache Validation

```javascript
async function fetchExpenseData(month) {
  // Check cache first
  if (expenseCache[month]) {
    const cached = expenseCache[month];
    // Validate structure
    if (cached.categories && cached.summary) {
      return cached;
    }
  }
  
  // Fetch from API
  const url = API_URL.split('?')[0] + `?action=expenses&month=${month}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.success && data.categories && data.summary) {
    expenseCache[month] = data;
    return data;
  }
  
  return null;
}
```

### Expense Expanded View Logic

Categories below **€10 minimum threshold** are grouped into "Other Expenses" node:

```javascript
const MIN_AMOUNT = 10;

// Categories >= €10 get individual nodes
currentExpenseData.categories
  .filter(cat => cat.spent >= MIN_AMOUNT)
  .forEach(cat => {
    const idx = addNode(cat.name, getCategoryColor(cat.name), true, () => showExpenseModal());
    nodes[idx].data = { spent: cat.spent, budget: cat.budget, percent: cat.percent, status: cat.status };
    links.push({ source: cmpIdx, target: idx, value: cat.spent, color: getCategoryColor(cat.name) });
  });

// Categories < €10 combined into "Other Expenses"
const smallTotal = currentExpenseData.categories
  .filter(cat => cat.spent > 0 && cat.spent < MIN_AMOUNT)
  .reduce((sum, cat) => sum + cat.spent, 0);

if (smallTotal > 0) {
  const idx = addNode('Other Expenses', colors.expenses, true, () => showExpenseModal());
  links.push({ source: cmpIdx, target: idx, value: smallTotal, color: colors.expenses });
}
```

### Loading State Functions

```javascript
function showLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

function setRefreshButtonLoading(loading) {
  const btn = document.getElementById('refreshBtn');
  if (loading) {
    btn.classList.add('btn-refreshing');
    btn.disabled = true;
  } else {
    btn.classList.remove('btn-refreshing');
    btn.disabled = false;
  }
}

function showExpenseLoadingIndicator(show) {
  const indicator = document.getElementById('expenseLoadingIndicator');
  indicator.classList.toggle('hidden', !show);
}
```

### Pre-fetch Logic

```javascript
let expenseCache = {};
let currentExpenseData = null;

async function prefetchExpenseData() {
  showExpenseLoadingIndicator(true);
  expenseCache = {};  // Clear on refresh
  
  const months = [];
  for (let m = monthFrom; m <= monthTo; m++) {
    months.push(getMonthKey(currentYear, m));
  }
  
  try {
    const results = await Promise.all(months.map(m => fetchExpenseData(m)));
    currentExpenseData = aggregateExpenseData(results);
  } catch (err) {
    currentExpenseData = null;
  } finally {
    showExpenseLoadingIndicator(false);
  }
}
```

### Total Outflow Calculation

```javascript
// CORRECT: Excludes mortgage_interest and mortgage_principal
const totalOutflow = 
  out.mortgage_payment +      // Already includes interest + principal
  out.sondertilgung +
  out.high_apr_payment +
  out.low_apr_payment +
  out.fixed_debt_payment +
  out.sap_loan_payment +
  out.expenses +
  out.inv_ownsap +
  out.inv_excess +
  out.cash_add;

// WRONG (previous bug): Double-counted mortgage components
// out.mortgage_payment + out.mortgage_interest + out.mortgage_principal...
```

### Status Emoji Logic

```javascript
function getStatusEmoji(percent) {
  if (percent === null) return 'N/A';
  if (percent >= 100) return '🔴';  // Over budget
  if (percent >= 80) return '🟠';   // Warning
  if (percent >= 50) return '🟡';   // Caution
  return '🟢';                       // On track
}
```

---

## Color Scheme

```javascript
const colors = {
  // Gross Income (Detailed view)
  h_gross: '#16a34a',
  w_gross: '#059669',
  
  // Deductions
  tax: '#ef4444',
  ta_deduction: '#0ea5e9',
  ownsap_ded: '#c2410c',
  
  // Net Income
  h_salary: '#22c55e',
  w_salary: '#10b981',
  h_rsu: '#a855f7',
  w_rsu: '#c084fc',
  youtube: '#ef4444',
  ownsap_sell: '#f97316',
  
  // Central Hub
  cmp: '#3b82f6',
  cmp_carry: '#60a5fa',
  cmp_next: '#93c5fd',
  
  // Outflows
  mortgage: '#64748b',
  sondertilgung: '#dc2626',
  high_apr: '#f43f5e',
  low_apr: '#fb7185',
  fixed_debt: '#fb923c',
  sap_loan: '#94a3b8',
  expenses: '#8b5cf6',
  
  // Investments & Savings
  investment: '#06b6d4',
  ownsap_inv: '#0ea5e9',
  cashpile: '#14b8a6'
};
```

---

## CSS Classes (New in v3.2)

```css
/* Expense category in table */
.expense-category {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expense-category-emoji {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

/* Expense hover tooltip */
.expense-tooltip {
  position: fixed;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  width: 340px;
  max-width: 400px;
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}

.expense-tooltip.visible {
  opacity: 1;
}

.expense-tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 15px;
}

.expense-tooltip-summary {
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.expense-tooltip-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.expense-tooltip-section-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.expense-tooltip-txn {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 2px 0;
}

.expense-tooltip-insight {
  font-size: 12px;
  color: var(--text-secondary);
}
```

---

## File Structure

```
GitHub Pages:
├── index.html              # Dashboard v3.2 UI (production)

Google Sheet (ShadowLedger Project):
├── Code.gs                 # Main routing + all functions
│   └── doGet()             # API routing
│   └── getDashboardData()  # 88-col mapping
│   └── getExpenseBreakdown() # Enhanced with transactions
└── [ShadowLedger functions]

Sheet Tabs:
├── Monthly_Model_v4        # Primary data source (88 columns)
├── SL_Budget               # Multi-month budget schema
└── ShadowLedger            # Expense transactions
```

---

## Security Model

| Layer | Protection |
|-------|------------|
| Google Sheet | Private (only owner can edit) |
| Apps Script API | URL is secret (~80 char random string) |
| Dashboard | Public repo but no sensitive data in code |
| API URL Storage | Browser localStorage (per-device) |

---

## Update Workflow

| Change | Where to Update | Deployment |
|--------|-----------------|------------|
| Financial data | Google Sheet | Instant (click Refresh) |
| API logic/columns | Apps Script → Deploy new version | ~1 min |
| Dashboard UI | GitHub repo → Commit | ~2 min |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial local Flask + Excel version |
| 1.1 | Dec 2024 | Migrated to Google Sheets + Apps Script |
| 1.2 | Dec 2024 | Deployed to GitHub Pages |
| 2.0 | Dec 2024 | Multi-month, Simple/Detailed views, Rich hover insights |
| 3.0 | Dec 2024 | Integrated with ShadowLedger, 88-col v6.1 support, Expense/Debt modals, Pre-fetch, Bug fixes |
| 3.1 | Dec 2024 | Loading states, Expense view toggle (Collapsed/Expanded), Category colors, €10 min threshold |
| 3.2 | Jan 2026 | Category emojis, Expense hover tooltips with transactions, German number formatting, Tooltip positioning fix, API URL cleanup, Cache validation |

---

## Future Features (Roadmap)

- **Scenario Modeling**: What-if analysis for different financial paths
- **Mobile App**: React Native wrapper for on-the-go access
- **Historical Comparison**: Compare months/years side-by-side
- **Export to PDF**: Generate monthly financial reports
- **Pie/Bar Charts**: Alternative visualizations for expenses

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch" | Check Apps Script is deployed, URL is correct, includes `?action=dashboard` |
| Data outdated | Click Refresh, check Google Sheet has latest |
| Wrong columns | Update COL mapping in Code.gs, redeploy Apps Script |
| CORS error | Shouldn't happen with Apps Script; try incognito |
| Reset API URL | Console: `localStorage.removeItem('sankey_api_url')` |
| Expense data not loading | Check SL_Budget has multi-month schema with Month_Key column |
| Double-counted outflow | Ensure using corrected calculation (excludes mort_int/mort_princ) |
| Expanded view empty | Ensure expense prefetch completed; check API returns categories |
| Tooltip far from cursor | Fixed in v3.2 - uses clientX/clientY |
| Cached stale data | Fixed in v3.2 - cache cleared on init/refresh |
| API URL has double ?action= | Fixed in v3.2 - strips query params on save |

---

## Safe to Delete

| File | Reason |
|------|--------|
| `Dashboard_Blueprint_v3_1.md` | Superseded by v3.2.0 |
| `Dashboard_ShadowLedger_changelog_20260111_2200.md` | Absorbed into this Blueprint |

---

*Blueprint v3.2.0 | Last Updated: 2026-01-11 23:35:00 (UTC+2)*
