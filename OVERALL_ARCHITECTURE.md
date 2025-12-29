# Aaron Family Finance System - Architecture

**Version:** 2.0  
**Last Updated:** December 29, 2025

---

## 1. SYSTEM ARCHITECTURE

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AARON FAMILY FINANCE SYSTEM                             │
│                              ARCHITECTURE v2.0                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  USER INTERFACES                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  📱 Discord     │  │  🌐 Dashboard   │  │  📊 Google      │                 │
│  │  (Mobile/PC)    │  │  (Browser)      │  │  Sheets         │                 │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                    │                           │
│           ▼                    ▼                    ▼                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         API LAYER                                        │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │   │
│  │  │  Render.com     │  │  Cloudflare     │  │  Google Apps    │          │   │
│  │  │  Discord Bot    │─▶│  Worker Relay   │─▶│  Script v2.2    │          │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘          │   │
│  │                                                     │                    │   │
│  │  ┌─────────────────────────────────────────────────┐│                    │   │
│  │  │  Unified API (Apps Script doGet/doPost)        ││                    │   │
│  │  │  • ?action=dashboard  → Financial data         ││                    │   │
│  │  │  • ?action=expenses   → Category breakdown     ││                    │   │
│  │  │  • POST               → ShadowLedger commands  ││                    │   │
│  │  └─────────────────────────────────────────────────┘│                    │   │
│  └─────────────────────────────────────────────────────┼────────────────────┘   │
│                                                        │                        │
│                                                        ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER (Google Sheets)                       │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  FinanceSource_v6.1 (Primary Database)                          │    │   │
│  │  │                                                                  │    │   │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │    │   │
│  │  │  │ Monthly_Model_v4 │  │ ShadowLedger     │  │ SL_Budget    │   │    │   │
│  │  │  │ (204 rows)       │  │ (Transactions)   │  │ (Categories) │   │    │   │
│  │  │  │ (88 columns)     │  │                  │  │              │   │    │   │
│  │  │  └──────────────────┘  └──────────────────┘  └──────────────┘   │    │   │
│  │  │                                                                  │    │   │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │    │   │
│  │  │  │ SL_Patterns      │  │ SL_Config        │  │ Assumptions  │   │    │   │
│  │  │  │ (58 merchants)   │  │ (API keys, etc)  │  │ (90+ params) │   │    │   │
│  │  │  └──────────────────┘  └──────────────────┘  └──────────────┘   │    │   │
│  │  │                                                                  │    │   │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │    │   │
│  │  │  │ SL_Income_Log    │  │ SL_Investment_Log│  │ RSU_Schedule │   │    │   │
│  │  │  │ (v2.1)           │  │ (v2.2)           │  │              │   │    │   │
│  │  │  └──────────────────┘  └──────────────────┘  └──────────────┘   │    │   │
│  │  │                                                                  │    │   │
│  │  │  ┌──────────────────┐  ┌──────────────────┐                     │    │   │
│  │  │  │ Salary_Schedule  │  │ Debt_Register    │                     │    │   │
│  │  │  └──────────────────┘  └──────────────────┘                     │    │   │
│  │  └──────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MODULE ARCHITECTURE

### 2.1 ShadowLedger (Expense, Income & Investment Tracking)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHADOWLEDGER v2.2 DATA FLOW                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User types "45 rewe" or "!income 4200 salary h"                    │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────┐                                                │
│  │  Discord App    │  (Mobile or Desktop)                           │
│  └────────┬────────┘                                                │
│           │ WebSocket                                               │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  Render.com     │  Discord Bot (Node.js + discord.js)            │
│  │  Free Tier      │  - Listens to #expenses channel                │
│  │  750 hrs/mo     │  - Keep-alive HTTP server                      │
│  └────────┬────────┘                                                │
│           │ POST /forward                                           │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  Cloudflare     │  Worker Relay                                  │
│  │  Workers        │  - 100K requests/day free                      │
│  │  Free Tier      │  - Logs all requests                           │
│  └────────┬────────┘                                                │
│           │ POST to Apps Script                                     │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  Google Apps    │  ShadowLedger_Code.gs v2.2                     │
│  │  Script         │  - Parse input (Gemini AI or regex)            │
│  │                 │  - Route to handler (expense/income/invest)    │
│  │                 │  - Write to appropriate sheet                  │
│  │                 │  - Calculate budget/status                     │
│  └────────┬────────┘                                                │
│           │ Webhook POST                                            │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  Discord        │  Response: "✅ Logged: €45 → Groceries"        │
│  │  Webhook        │  + Budget status                               │
│  └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Technical Files:**
- `ShadowLedger_Code.gs` - Backend logic (v2.2.0)
- `BLUEPRINT_ShadowLedger_v2_2_0.md` - Full documentation
- `ShadowLedger_Cloudflare_Migration_Guide_v4.md` - Deployment guide

**Key Capabilities (v2.2.0):**
- Expense logging with flexible input parsing
- Income tracking (!income, !ta commands)
- Investment tracking (!invest command)
- 17 budget categories (€4,110/month total)
- Automated income reminders (Days 1,6,11,16,21,26)

### 2.2 StandardFinance (Financial Model)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   STANDARDFINANCE v6.1 STRUCTURE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Monthly_Model_v4 (Main Simulation)                          │   │
│  │  204 rows × 88 columns                                       │   │
│  │  Jan 2026 → Dec 2042                                         │   │
│  │                                                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │ Income  │─▶│   CMP   │─▶│ Outflows│─▶│Net Worth│        │   │
│  │  │ (A-AJ)  │  │ (AK-AN) │  │(AO-BY)  │  │(CE-CJ)  │        │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                           │                                         │
│         ┌─────────────────┼─────────────────┐                      │
│         ▼                 ▼                 ▼                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Assumptions │  │RSU_Schedule │  │Salary_Sched │                │
│  │ (90+ params)│  │             │  │ (modifiers) │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
│  KEY INTEGRATION: Exp_Alloc (BQ) pulls from ShadowLedger!          │
│  =IF(TODAY()>EOMONTH(C2,0), SUMIFS(...), MAX(Budget,SUMIFS(...)))  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Technical Files:**
- `FinanceSource_v6_1.xlsx` - Main model
- `StandardFinance_Guide.md` - Full documentation

**Key Specifications:**
- 88 columns (updated from 77 in v4)
- Monthly budget: €4,110 (with €100 buffer)
- 3% annual lifestyle inflation
- POT system with €10K CMP cap
- Sondertilgung logic (€21,550/year max)

### 2.3 Dashboard (Visualization)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD v3.1 DATA FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │  GitHub Pages   │  index.html                                    │
│  │  (Static Host)  │  - D3.js Sankey diagram                        │
│  │                 │  - Controls (year, month, view mode)           │
│  │                 │  - Expense modal with category breakdown       │
│  │                 │  - Debt detail modals                          │
│  │                 │  - Loading states & refresh feedback           │
│  └────────┬────────┘                                                │
│           │ Fetch JSON (?action=dashboard)                          │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  Google Apps    │  ShadowLedger_Code.gs (unified)                │
│  │  Script API     │  - doGet() routes to dashboard handler         │
│  │                 │  - getDashboardData() extracts 88 columns      │
│  │                 │  - getExpenseBreakdown() for category detail   │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  Google Sheets  │  Monthly_Model_v4                              │
│  │  (Data Source)  │  - 88 columns of financial data                │
│  │                 │  - 204 months of simulation                    │
│  └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Technical Files:**
- `ShadowLedger_Code.gs` - API backend (unified with ShadowLedger)
- `index.html` - Frontend (v3.1)
- `Dashboard_Blueprint_v3_1.md` - Documentation

**Key Features (v3.1):**
- 88-column support (v6.1 model)
- Expense click modal with 17 categories
- Debt detail views (High-APR, Low-APR, Fixed, SAP)
- Expanded expense Sankey view
- Loading overlay and refresh spinner

---

## 3. DATA FLOW BETWEEN MODULES

### 3.1 Complete Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DATA INTEGRATION v2.0                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────┐                                                          │
│  │   ShadowLedger    │                                                          │
│  │   (SL_* sheets)   │                                                          │
│  └─────────┬─────────┘                                                          │
│            │                                                                     │
│    ┌───────┴───────┬───────────────┬───────────────┐                           │
│    ▼               ▼               ▼               ▼                           │
│  ┌─────┐       ┌─────┐       ┌─────────┐     ┌───────────┐                     │
│  │ SL  │       │ SL_ │       │ SL_     │     │ SL_       │                     │
│  │Trans│       │Budget│      │Income_  │     │Investment_│                     │
│  │     │       │     │       │Log      │     │Log        │                     │
│  └──┬──┘       └──┬──┘       └────┬────┘     └─────┬─────┘                     │
│     │             │               │                │                            │
│     │  SUMIFS     │               │  VLOOKUP       │                            │
│     │             │               │                │                            │
│     ▼             ▼               ▼                ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      Monthly_Model_v4                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │   │
│  │  │ Exp_Alloc│  │ Budget   │  │ H/W Net  │  │ Inv_     │                │   │
│  │  │ (BQ)     │  │ Status   │  │ Salary   │  │ Tracking │                │   │
│  │  │ ← Actual │  │ ← Formula│  │ (L, T)   │  │ (BR-BV)  │                │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │   │
│  └──────────────────────────────────┬──────────────────────────────────────┘   │
│                                     │                                           │
│                          API Read (?action=dashboard)                           │
│                                     │                                           │
│                                     ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           Dashboard                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │   │
│  │  │ Sankey   │  │ Stat     │  │ Expense  │  │ Debt     │                │   │
│  │  │ Diagram  │  │ Cards    │  │ Modal    │  │ Modals   │                │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Integration Details

| Source | Target | Method | Status |
|--------|--------|--------|--------|
| ShadowLedger → Monthly_Model | Exp_Alloc (BQ) | SUMIFS formula | ✅ Live |
| SL_Income_Log → Monthly_Model | H/W Net Salary (L, T) | VLOOKUP | ✅ Live |
| SL_Income_Log → Monthly_Model | YT_Gross (AG) | VLOOKUP | ✅ Live |
| SL_Income_Log → Monthly_Model | Other_Fam_Net (AJ) | SUMIF | ✅ Live |
| Monthly_Model → Dashboard | JSON API | Apps Script doGet | ✅ Live |
| SL_Budget → Dashboard | Expense breakdown | ?action=expenses | ✅ Live |

### 3.3 Self-Closing Expense Formula

The Exp_Alloc column (BQ) uses smart logic that switches between guardrail and actual modes:

```
=IF( TODAY() > EOMONTH($C2, 0),
     // PAST MONTH: Use actual ShadowLedger sum
     SUMIFS(ShadowLedger!D:D, ShadowLedger!C:C, ">="&$C2, ShadowLedger!C:C, "<="&EOMONTH($C2,0)),
     
     // CURRENT MONTH: Use MAX(Budget, Actual) - pessimistic projection
     MAX($BP2, SUMIFS(ShadowLedger!D:D, ShadowLedger!C:C, ">="&$C2, ShadowLedger!C:C, "<="&EOMONTH($C2,0)))
)
```

---

## 4. GOOGLE SHEETS STRUCTURE

### 4.1 Sheet Inventory

| Sheet Name | Purpose | Row Count | Col Count |
|------------|---------|-----------|-----------|
| Monthly_Model_v4 | Main simulation | 204 | 88 |
| Assumptions | Configuration parameters | ~100 | 3 |
| RSU_Schedule | RSU vesting reference | ~68 | 5 |
| Salary_Schedule | Monthly salary with modifiers | 204 | 9 |
| Debt_Register | All 14 debts with details | 14 | 8 |
| ShadowLedger | Expense transactions | Dynamic | 10 |
| SL_Budget | Monthly budget categories | 17 × months | 6 |
| SL_Patterns | Merchant → Category mapping | 58 | 2 |
| SL_Config | System configuration | ~10 | 2 |
| SL_Income_Log | Income and TA tracking | Dynamic | 8 |
| SL_Investment_Log | Investment transfers | Dynamic | 8 |

### 4.2 Monthly_Model_v4 Column Map (88 Columns)

| Section | Columns | Count | Description |
|---------|---------|-------|-------------|
| Date Info | A-E | 5 | Month, Year, Date, Income_From, Month_Type |
| Husband Income | F-M | 8 | Gross, TA, OWNSAP, Taxable, Tax, Net, RSU, Bonus |
| Wife Income | N-U | 8 | Gross, TA, OWNSAP, Taxable, Tax, Net, RSU, Bonus |
| OWNSAP | V-X | 3 | H Value, W Value, Total |
| SAP Loan | Y-AF | 8 | H/W TaxedAdv, Payment, Balance |
| YouTube | AG-AI | 3 | Gross, Tax Reserve, Net |
| Other Income | AJ | 1 | Other_Fam_Net_Inc |
| CMP | AK-AN | 4 | Carry, Inflow, Available, End |
| Mortgage | AO-AT | 6 | Begin, Payment, Interest, Principal, Sondertilgung, End |
| High-APR Debt | AU-BE | 11 | TF, Klarna, Nordea, DB, Aktia (payments + balances) |
| Low-APR Debt | BF-BI | 4 | Scalable, AK (payments + balances) |
| Fixed Loans | BJ-BO | 6 | Revolut, C3, Student, IKEA, N26 (payments) |
| Expenses | BP-BQ | 2 | Budget, Allocation |
| Investment | BR-BV | 5 | Begin, OWNSAP, Excess, Growth, End |
| Cashpile | BW-BY | 3 | Begin, Add, End |
| Tax Reserve | BZ-CB | 3 | Begin, Add, End |
| Time Account | CC-CD | 2 | H Hours, W Hours |
| Net Worth | CE-CJ | 6 | Investment, House, Mortgage, Debt, TA, Total |

---

## 5. SECURITY MODEL

| Layer | Protection | Notes |
|-------|------------|-------|
| Google Sheet | Private (owner access only) | Shared with spouse |
| Apps Script API | URL is secret (~80 char random string) | Not committed to repo |
| Dashboard | Public repo, no sensitive data in code | API URL in localStorage |
| API URL Storage | Browser localStorage (per-device) | Prompt on first visit |
| Discord Bot | Channel-specific, server-restricted | MESSAGE CONTENT INTENT |
| Cloudflare | Environment variables for secrets | APPS_SCRIPT_URL secret |

---

## 6. COST STRUCTURE

| Service | Usage | Free Tier Limit | Status |
|---------|-------|-----------------|--------|
| Google Sheets | Database | Unlimited | ✅ OK |
| Google Apps Script | Backend | 6 min/execution, 90 min/day | ✅ OK |
| Render.com | Discord Bot | 750 hrs/month | ✅ OK |
| Cloudflare Workers | Relay | 100K requests/day | ✅ OK |
| GitHub Pages | Dashboard | Unlimited | ✅ OK |
| Gemini API | AI categorization | 60 req/min, 1500/day | ✅ OK |
| Discord | Interface | Unlimited | ✅ OK |

**Total Monthly Cost: €0**

---

## 7. FAILURE MODES & RECOVERY

| Component Fails | Impact | Recovery |
|-----------------|--------|----------|
| Render.com bot | No expense logging | Restart service in Render dashboard |
| Cloudflare Worker | No expense logging | Check worker logs, verify URL |
| Apps Script | No logging, no API | Check execution logs, redeploy |
| Google Sheets | Everything down | Wait for Google recovery |
| GitHub Pages | No Dashboard | Data still safe in Sheets |
| Gemini API | Falls back to pattern matching | Automatic, no action needed |
| SL_Income_Log missing | Income commands fail | Run any income command to auto-create |
| SL_Investment_Log missing | Invest commands fail | Run any invest command to auto-create |

---

## 8. VERSION COMPATIBILITY MATRIX

| Component | Current Version | Compatible With |
|-----------|-----------------|-----------------|
| ShadowLedger_Code.gs | v2.2.0 | FinanceSource v6.1+ |
| Dashboard (index.html) | v3.1.0 | 88-column model |
| FinanceSource | v6.1 | All current components |
| Discord Bot | v1.0 | ShadowLedger v2.0+ |
| Cloudflare Worker | v1.0 | All Apps Script versions |

---

## 9. FUTURE ARCHITECTURE CONSIDERATIONS

### Planned Improvements
1. **Named Ranges** - Replace column letters with semantic names
2. **API Versioning** - `/api/v1/finance`, `/api/v2/finance`
3. **Config Centralization** - All settings in SL_Config sheet
4. **Caching Layer** - ScriptProperties for patterns/budget

### Potential New Modules
- Goals Tracker (milestones visualization)
- Variance Report (actual vs planned)
- Mobile PWA (installable app)
- Bank Integration (Open Banking API)

---

*See [ROADMAP.md](ROADMAP.md) for planned enhancements*
