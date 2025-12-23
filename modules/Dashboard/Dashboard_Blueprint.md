# Financial Sankey Dashboard - Blueprint v2

## Overview

A fully online, free dashboard that visualizes household cash flows as an interactive Sankey diagram, reading live data from Google Sheets via Apps Script API.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     100% FREE - 100% ONLINE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │  Google Sheet   │────▶│  Apps Script    │────▶│  GitHub Pages   │   │
│  │                 │     │                 │     │                 │   │
│  │  Your Data      │     │  JSON API       │     │  Dashboard UI   │   │
│  │  Monthly_Model  │     │  Auto-hosted    │     │  index.html     │   │
│  │  _v4            │     │  by Google      │     │                 │   │
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
| Google Sheet | https://docs.google.com/spreadsheets/d/1rTVkCLy0yqq1sByvBuM-ENWM_3ctK0V1/edit |
| Apps Script | Deployed (URL stored in browser localStorage) |

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

### v2 Features (New)
- ✅ **Multi-month range selection** - Select consecutive months (e.g., Jan-Mar 2026)
- ✅ **Simple/Detailed view toggle** - Simple shows net flows, Detailed shows gross-to-net
- ✅ **Enhanced stat card labels** - "Current Investment Value", "Mortgage Left to Pay"
- ✅ **Rich hover insights on stat cards** - Breakdown details on hover
- ✅ **Rich hover insights on Sankey nodes** - Debt breakdowns, salary components, etc.

---

## Data Architecture

### Google Sheet → Apps Script API

**Sheet:** `Monthly_Model_v4` (77 columns)

| Section | Columns | Data Returned |
|---------|---------|---------------|
| Date Info | A-E | month, year, date, income_from, month_type |
| Husband Income | F-M | gross, deductions (TA, OWNSAP), taxable, net, RSU |
| Wife Income | N-U | gross, deductions (TA, OWNSAP), taxable, net, RSU |
| OWNSAP | V-X | H value, W value, total |
| YouTube | Y-AA | gross, tax reserve, net |
| SAP Loan | AB-AC | payment, balance |
| CMP | AD-AG | carry, inflow, available, end |
| Mortgage | AH-AM | begin, payment, interest, principal, sondertilgung, end |
| High-APR Debt | AN-AX | TF, Klarna, Nordea, DB, Aktia (payments + balances) |
| Fixed Loans | AY-BD | Revolut, C3, Student, IKEA, N26 (payments) |
| Expenses | BE-BF | budget, allocation |
| Investment | BG-BK | begin, OWNSAP, excess, growth, end |
| Cashpile | BL-BN | begin, add, end |
| Net Worth | BT-BY | investment, house, mortgage, debt, TA, total |

### API Response Format (v2)

```json
{
  "success": true,
  "count": 204,
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
      "ownsap_to_cmp": 1200.00
    },
    
    "outflows": {
      "mortgage_payment": 2281.00,
      "mortgage_interest": 1287.00,
      "mortgage_principal": 994.00,
      "sondertilgung": 0,
      "high_apr_payment": 600.00,
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
      "revolut": { "payment": 650, "balance": 11700 },
      "c3": { "payment": 290, "balance": 9710 },
      "student": { "payment": 200, "balance": 10800 },
      "ikea": { "payment": 132, "balance": 2368 },
      "n26": { "payment": 90, "balance": 270 }
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
      "fixed_debt": 34848,
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
    }
  }]
}
```

---

## UI Components

### 1. Controls Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ View: [Simple ▼]  Year: [2026 ▼]  From: [Jan ▼]  To: [Mar ▼]  [⟳]  │
└─────────────────────────────────────────────────────────────────────┘
```

- **View Mode**: Simple (net flows) / Detailed (gross-to-net)
- **Year**: 2026-2042
- **From/To Month**: Consecutive month range selection
- **Refresh**: Reload from API

### 2. Stat Cards (with hover insights)

| Card | Label | Hover Shows |
|------|-------|-------------|
| 1 | Total Inflow | H Salary: €X, W Salary: €X, RSU: €X, YouTube: €X, OWNSAP: €X |
| 2 | Total Outflow | Mortgage: €X, Debts: €X, Expenses: €X, Investments: €X |
| 3 | CMP Balance | Inflow: €X, Outflow: €X, Net Change: €X |
| 4 | Current Investment Value | Start: €X, Contributions: €X, Growth: €X |
| 5 | Mortgage Left to Pay | Original: €X, Paid: €X, Rate: X%, Months: X |
| 6 | Net Worth | Investment + House - Mortgage - Debts + Time Account |

### 3. Sankey Diagram

**Simple View:**
```
Income Sources ──▶ CMP ──▶ Outflows
```

**Detailed View:**
```
Gross Income ──▶ Deductions ──▶ Net Income ──▶ CMP ──▶ Outflows
```

### 4. Node Hover Details

| Node | Hover Shows |
|------|-------------|
| H Salary (Detailed) | Gross: €X, Tax: €X, TA: €X, OWNSAP: €X, Net: €X |
| High-APR Debt | TF: €X (bal €X), Klarna: €X (bal €X), ... |
| Fixed Loans | Revolut: €X, C3: €X, Student: €X, IKEA: €X, N26: €X |
| Mortgage | Payment: €X (Principal: €X, Interest: €X), Balance: €X |
| Investment | OWNSAP: €X, Excess: €X, Growth: €X |
| Expenses | Budget: €X allocated |

---

## Color Scheme

```javascript
const colors = {
  // Gross Income
  h_gross: '#166534',      // Dark green
  w_gross: '#15803d',      // Medium green
  
  // Deductions
  tax: '#dc2626',          // Red
  ta_deduction: '#9333ea', // Purple
  ownsap_ded: '#c2410c',   // Dark orange
  
  // Net Income
  h_salary: '#22c55e',     // Green
  w_salary: '#10b981',     // Teal
  h_rsu: '#a855f7',        // Purple
  w_rsu: '#c084fc',        // Light purple
  youtube: '#ef4444',      // Red
  ownsap_sell: '#f97316',  // Orange
  
  // Central Hub
  cmp: '#3b82f6',          // Blue
  
  // Outflows
  mortgage: '#64748b',     // Gray
  sondertilgung: '#dc2626',// Dark red
  high_apr: '#f43f5e',     // Rose
  fixed_debt: '#fb923c',   // Orange
  sap_loan: '#94a3b8',     // Light gray
  expenses: '#8b5cf6',     // Violet
  
  // Investments & Savings
  investment: '#06b6d4',   // Cyan
  ownsap_inv: '#0ea5e9',   // Sky blue
  cashpile: '#14b8a6',     // Teal
};
```

---

## File Structure

```
finance-dashboard/
├── index.html          # Dashboard UI (GitHub Pages)
└── README.md           # Optional

Google Sheet:
├── Monthly_Model_v4    # Data source
└── Apps Script
    └── Code.gs         # API endpoint
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

---

## Future Modules (Planned)

- **Expense Tracker**: Discord bot for daily expense logging
- **Expense Categories**: Breakdown of €3,840 monthly budget
- **Scenario Modeling**: What-if analysis
- **Mobile App**: React Native wrapper

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch" | Check Apps Script is deployed, URL is correct |
| Data outdated | Click Refresh, check Google Sheet has latest |
| Wrong columns | Update COL mapping in Code.gs, redeploy |
| CORS error | Shouldn't happen with Apps Script; try incognito |
| Reset API URL | Console: `localStorage.removeItem('sankey_api_url')` |

---

*Last Updated: December 2024*
