# Dashboard Blueprint v3.1.0
---
version: 3.1.0
lastUpdated: 2025-12-28 23:55:00
module: Dashboard
status: Production
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
| Dashboard | https://lanmanist.github.io/finance-dashboard/ |
| Google Sheet | https://docs.google.com/spreadsheets/d/1mrMCTbgPxjxbkHepDiQk_ddN0cbJ-A-GWWtwt3wOgSU/edit |
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

### v3.1 Features (Current - Dec 2024)
- ✅ **Loading Overlay** - Semi-transparent overlay on Sankey during render
- ✅ **Refresh Button Feedback** - Spinner animation while data loads
- ✅ **Expense Loading Indicator** - "Loading expenses..." in status bar during prefetch
- ✅ **Expense View Toggle** - Collapsed | Expanded button in controls bar
- ✅ **Expanded Expense Sankey** - Individual category nodes with distinct colors
- ✅ **Category Color Scheme** - 17 distinct purple-gradient colors for categories
- ✅ **Min Amount Threshold** - €10 minimum; smaller categories grouped as "Other Expenses"

---

## Architecture

### Integration Model

Dashboard is **integrated into the ShadowLedger Apps Script project** rather than a separate deployment. This was chosen because Apps Script allows only ONE `doGet()` function per project.

```
ShadowLedger Project (Apps Script)
├── Code.gs          # Main routing + ShadowLedger functions
│   └── doGet(e)     # Routes based on ?action= parameter
├── Dashboard_Code.gs # Dashboard data extraction
│   └── getDashboardData(e)
└── [Other SL files]
```

### API Routing

| Endpoint | Method | Returns |
|----------|--------|---------|
| `?action=dashboard` | GET | Full financial data for Sankey (204 months) |
| `?action=expenses&month=YYYY-MM` | GET | Category expense breakdown with budgets |
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

### API Response Format (Dashboard)

```json
{
  "success": true,
  "count": 204,
  "timestamp": "2025-12-28T14:30:00.000Z",
  "data": [{
    "month": 1,
    "year": 2026,
    "date": "01/2026",
    "income_from": "12/2025",
    "month_type": "LEAN",
    "is_bonus_month": false,
    "is_rsu_month": false,
    "is_sondertilgung_month": false,
    "is_post_mortgage": false,
    "is_debt_attack_phase": true,
    
    "gross": {
      "h_salary": 6666.67,
      "w_salary": 6500.00,
      "h_bonus": 0,
      "w_bonus": 0,
      "yt": 1000.00
    },
    
    "deductions": {
      "h_ta": 200,
      "w_ta": 200,
      "h_ownsap": 666.67,
      "w_ownsap": 650.00,
      "h_bonus_ta": 0,
      "w_bonus_ta": 0,
      "h_tax": 2400,
      "w_tax": 2340,
      "yt_tax_reserve": 443
    },
    
    "inflows": {
      "h_salary_net": 3400.00,
      "w_salary_net": 3310.00,
      "h_rsu_net": 0,
      "w_rsu_net": 0,
      "yt_net": 557.00,
      "ownsap_to_cmp": 1200.00,
      "other_fam_net": 0
    },
    
    "outflows": {
      "mortgage_payment": 2281.00,
      "mortgage_interest": 1287.00,
      "mortgage_principal": 994.00,
      "sondertilgung": 0,
      "high_apr_payment": 600.00,
      "low_apr_payment": 0,
      "fixed_debt_payment": 1362.00,
      "sap_loan_payment": 583.00,
      "expenses": 3840.00,
      "inv_ownsap": 0,
      "inv_excess": 0,
      "cash_add": 0
    },
    
    "debt_details": {
      "tf": { "payment": 300, "balance": 8900 },
      "klarna": { "payment": 200, "balance": 1800 },
      "nordea": { "payment": 100, "balance": 1900 },
      "db": { "payment": 0, "balance": 2000 },
      "aktia": { "payment": 0, "balance": 440 },
      "scalable": { "payment": 0, "balance": 0 },
      "ak": { "payment": 0, "balance": 0 },
      "revolut": { "payment": 650, "balance": 0 },
      "c3": { "payment": 290, "balance": 0 },
      "student": { "payment": 200, "balance": 0 },
      "ikea": { "payment": 132, "balance": 0 },
      "n26": { "payment": 90, "balance": 0 },
      "sap": { 
        "payment": 583, 
        "balance": 14000,
        "h_balance": 7000,
        "w_balance": 7000
      }
    },
    
    "investment_details": {
      "begin": 12000,
      "ownsap_contrib": 0,
      "excess_contrib": 0,
      "growth": 85,
      "end": 12085
    },
    
    "mortgage_details": {
      "begin": 396554,
      "interest_rate": 3.89,
      "months_remaining": 90,
      "total_paid": 0
    },
    
    "balances": {
      "cmp": 0,
      "mortgage": 395560,
      "high_apr_debt": 15040,
      "low_apr_debt": 0,
      "fixed_debt": 14000,
      "investment": 12085,
      "cashpile": 0,
      "net_worth": 124786
    },
    
    "net_worth_breakdown": {
      "investment": 12085,
      "house": 529092,
      "mortgage": -395560,
      "other_debt": -49888,
      "time_account": 29057
    },
    
    "cmp_details": {
      "carry": 0,
      "inflow": 8467,
      "outflow": 8467,
      "end": 0
    }
  }]
}
```

### Expense API Response Format

```json
{
  "success": true,
  "month": "2026-01",
  "month_name": "January 2026",
  "categories": [
    {
      "name": "Groceries + Food",
      "spent": 850.00,
      "budget": 900,
      "percent": 94,
      "status": "🟠"
    }
  ],
  "summary": {
    "total_spent": 3500.00,
    "total_budget": 4110,
    "total_percent": 85,
    "transaction_count": 47,
    "budget_available": true
  }
}
```

---

## UI Components

### 1. Controls Bar

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ View: [Simple|Detailed]  Expenses: [Collapsed|Expanded]                       │
│ Year: [2026 ▼]  From: [Jan ▼]  To: [Mar ▼]                       [⟳ Refresh] │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2. CMP Flow Section (Single-Month Only)

Shows when `monthFrom === monthTo`:
- Carry from Previous Month
- Current Month Income
- Current Month Outflows  
- Flow to Next Month

### 3. Stat Cards

| Card | Label | Hover Shows |
|------|-------|-------------|
| 1 | Total Inflow | H Salary, W Salary, RSU, YouTube, OWNSAP, Other |
| 2 | Total Outflow | Mortgage, Debts, Expenses, Investments |
| 3 | CMP Balance | Carry, Inflow, Outflow, Net Change |
| 4 | Current Investment Value | Start, Contributions, Growth |
| 5 | Mortgage Left to Pay | Original, Paid, Rate, Months |
| 6 | Net Worth | Investment + House - Mortgage - Debts + TA |

### 4. Sankey Diagram

**Simple View:**
```
Income Sources ──▶ CMP ──▶ Outflows
```

**Detailed View:**
```
Gross Income ──▶ Deductions ──▶ Net Income ──▶ CMP ──▶ Outflows
```

**Expense View: Collapsed (default)**
```
CMP ──▶ [Expenses €3,840]
```

**Expense View: Expanded**
```
CMP ──┬▶ [Childcare €1,200]
      ├▶ [Groceries + Food €850]
      ├▶ [Utilities €400]
      ├▶ ... (17 categories)
      └▶ [Other Expenses €45]  (< €10 categories combined)
```

### 5. Interactive Elements

| Element | Hover | Click |
|---------|-------|-------|
| Expenses Node | All 17 categories with actual/budget | Modal with progress bars |
| Category Node (expanded) | Spent/Budget/Status for that category | Modal with full breakdown |
| High-APR Debt Node | 5 debts with payment + balance | Modal with full details |
| Low-APR Debt Node | Scalable + AK with payment + balance | Modal |
| Fixed Loans Node | 5 loans with payment/mo | Modal with balances |
| SAP Loan Node | Payment, balance, 0% rate | Modal with H/W split |
| Mortgage Node | Payment, principal, interest | — |
| Investment Node | Begin, OWNSAP, Excess, Growth, End | — |

### 6. Loading States

| State | Visual Feedback |
|-------|-----------------|
| Data refresh | Refresh button shows spinner, disabled |
| Sankey render | Semi-transparent overlay with spinner |
| Expense prefetch | "Loading expenses..." in status bar |

---

## Technical Implementation

### Column Mapping (Dashboard_Code.gs)

```javascript
const COL = {
  // Date Info (A-E)
  month: 1, year: 2, date: 3, income_from: 4, month_type: 5,
  
  // Husband Income (F-M)
  h_gross_salary: 6, h_ta_ded: 7, h_ownsap_ded: 8, h_gross_bonus: 9,
  h_bonus_ta: 10, h_taxable: 11, h_net_salary: 12, h_rsu_net: 13,
  
  // Wife Income (N-U)
  w_gross_salary: 14, w_ta_ded: 15, w_ownsap_ded: 16, w_gross_bonus: 17,
  w_bonus_ta: 18, w_taxable: 19, w_net_salary: 20, w_rsu_net: 21,
  
  // OWNSAP (V-X)
  h_ownsap_val: 22, w_ownsap_val: 23, ownsap_total: 24,
  
  // SAP Loan Detail (Y-AF)
  h_sap_taxed_adv: 25, h_sap_loan_pmt: 26, h_sap_loan_bal: 27,
  w_sap_taxed_adv: 28, w_sap_loan_pmt: 29, w_sap_loan_bal: 30,
  sap_loan_pmt: 31, sap_loan_bal: 32,
  
  // YouTube (AG-AI)
  yt_gross: 33, yt_tax_res: 34, yt_net: 35,
  
  // Other Income (AJ)
  other_fam_net_inc: 36,
  
  // CMP (AK-AN)
  cmp_carry: 37, cmp_inflow: 38, cmp_available: 39, cmp_end: 40,
  
  // Mortgage (AO-AT)
  mort_begin: 41, mort_pmt: 42, mort_int: 43, mort_princ: 44,
  sondertilgung: 45, mort_end: 46,
  
  // High-APR Debt (AU-BE)
  d_tf_pmt: 47, d_tf_bal: 48, d_klarna_pmt: 49, d_klarna_bal: 50,
  d_nordea_pmt: 51, d_nordea_bal: 52, d_db_pmt: 53, d_db_bal: 54,
  d_aktia_pmt: 55, d_aktia_bal: 56, d_highapr_total: 57,
  
  // Low-APR Debt (BF-BI)
  d_scalable_pmt: 58, d_scalable_bal: 59, d_ak_pmt: 60, d_ak_bal: 61,
  
  // Fixed Loans (BJ-BO)
  d_revolut_pmt: 62, d_c3_pmt: 63, d_student_pmt: 64,
  d_ikea_pmt: 65, d_n26_pmt: 66, d_fixed_total: 67,
  
  // Expenses (BP-BQ)
  exp_budget: 68, exp_alloc: 69,
  
  // Investment (BR-BV)
  inv_begin: 70, inv_ownsap: 71, inv_excess: 72, inv_growth: 73, inv_end: 74,
  
  // Cashpile (BW-BY)
  cash_begin: 75, cash_add: 76, cash_end: 77,
  
  // Tax Reserve (BZ-CB)
  taxres_beg: 78, taxres_add: 79, taxres_end: 80,
  
  // Time Account (CC-CD)
  h_ta_hrs: 81, w_ta_hrs: 82,
  
  // Net Worth (CE-CJ)
  nw_invest: 83, nw_house: 84, nw_mortgage: 85,
  nw_debt: 86, nw_ta: 87, nw_total: 88
};
```

### API Routing Logic (ShadowLedger_Code.gs)

```javascript
function doGet(e) {
  const action = e.parameter ? e.parameter.action : null;
  
  if (action === 'dashboard') {
    return getDashboardData();
  }
  
  if (action === 'expenses') {
    const month = e.parameter.month; // e.g., "2025-12"
    if (!month) {
      return error('Missing required parameter: month (format: YYYY-MM)');
    }
    return getExpenseBreakdown(month);
  }
  
  if (action === 'test') {
    return healthCheck();
  }
  
  return defaultResponse();
}
```

### Category Colors (index.html)

17 expense categories use a purple gradient for visual consistency:

```javascript
const categoryColors = {
  'Childcare': '#7c3aed',
  'Family Support': '#8b5cf6',
  'Groceries + Food': '#a78bfa',
  'Utilities': '#6366f1',
  'Car': '#818cf8',
  'Shopping': '#c4b5fd',
  'Travel & Leisure': '#4f46e5',
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

### Total Outflow Calculation (Bug Fix)

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

## File Structure

```
GitHub Pages:
├── index.html              # Dashboard v3.1 UI (production)

Google Sheet (ShadowLedger Project):
├── Code.gs                 # Main routing + ShadowLedger functions
├── Dashboard_Code.gs       # getDashboardData() with 88-col mapping
└── [Other ShadowLedger files]

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

---

## Future Features (Roadmap)

- **Expense Categories Visualization**: Pie/bar chart of €4,110 monthly budget
- **Scenario Modeling**: What-if analysis for different financial paths
- **Mobile App**: React Native wrapper for on-the-go access
- **Historical Comparison**: Compare months/years side-by-side
- **Export to PDF**: Generate monthly financial reports

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch" | Check Apps Script is deployed, URL is correct, includes `?action=dashboard` |
| Data outdated | Click Refresh, check Google Sheet has latest |
| Wrong columns | Update COL mapping in Dashboard_Code.gs, redeploy Apps Script |
| CORS error | Shouldn't happen with Apps Script; try incognito |
| Reset API URL | Console: `localStorage.removeItem('sankey_api_url')` |
| Expense data not loading | Check SL_Budget has multi-month schema with Month_Key column |
| Double-counted outflow | Ensure using corrected calculation (excludes mort_int/mort_princ) |
| Expanded view empty | Ensure expense prefetch completed; check API returns categories |

---

*Blueprint v3.1.0 | Last Updated: 2025-12-28 23:55:00 (UTC+2)*
