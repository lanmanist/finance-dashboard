# Aaron Family Finance — Operations Blueprint

```yaml
version: v1.1.0
last_updated: 2026-01-11 23:50:00 UTC+2
status: Production
parent_system: Aaron Family Financial Model v6.1
modules_covered: Finance_SOP, Monthly Checklist
```

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [The Monthly Cycle](#2-the-monthly-cycle)
3. [Daily Operations](#3-daily-operations)
4. [Monthly Hard Close](#4-monthly-hard-close)
5. [Quarterly Reviews](#5-quarterly-reviews)
6. [Annual Tasks](#6-annual-tasks)
7. [Command Reference](#7-command-reference)
8. [Troubleshooting](#8-troubleshooting)
9. [Technical Implementation](#9-technical-implementation)
10. [Architectural Decisions](#10-architectural-decisions)
11. [Future Enhancements](#11-future-enhancements)

---

## 1. SYSTEM OVERVIEW

### 1.1 The Financial Machine

Your financial model is a **Cash Flow-Based Simulation** (Rolling Forecast) that focuses on allocating surplus rather than just tracking expenses.

**Core Components:**

| Component | Purpose | Tool |
|-----------|---------|------|
| **The Engine** | Income tracking | ShadowLedger `!income` |
| **The Hub (CMP)** | Central Master Pot (€10K cap) | StandardFinance |
| **The Tracker** | Daily expense logging | ShadowLedger Discord |
| **The Sweep** | Overflow allocation (20% Cash, 80% Invest) | StandardFinance formulas |
| **The Visualizer** | Cash flow diagrams | Dashboard |

### 1.2 Key Rules

| Rule | Description |
|------|-------------|
| **1-Month Lag** | Income earned in Jan is spent in Feb (permanent liquidity buffer) |
| **CMP Baseline** | Maintain €10K in CMP; excess triggers sweep logic |
| **Avalanche Debt** | Attack highest-APR debt first |
| **Hard Close** | Monthly ritual converting projections → actuals |

### 1.3 System URLs

| Component | URL |
|-----------|-----|
| Dashboard | https://lanmanist.github.io/finance-dashboard/ |
| Google Sheet | FinanceSource_v6_1 (private) |
| Discord | #expenses channel |

---

## 2. THE MONTHLY CYCLE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MONTHLY OPERATIONS CYCLE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Day 1-5          Day 6-14         Day 15          Day 25-31           │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐     ┌─────────┐         │
│  │ Income  │      │  Hard   │      │ Mid-Mo  │     │ Month   │         │
│  │ Input   │─────▶│  Close  │─────▶│ Review  │────▶│ End     │         │
│  │         │      │         │      │         │     │ Prep    │         │
│  └─────────┘      └─────────┘      └─────────┘     └─────────┘         │
│                                                                         │
│  ONGOING: Daily expense logging via Discord                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Automated Reminders

ShadowLedger sends income reminders on Days **1, 6, 11, 16, 21, 26** until all inputs are complete.

---

## 3. DAILY OPERATIONS

### 3.1 Expense Logging

**Target:** <60 seconds per transaction

```
Discord: 45 rewe
Discord: 27 lidl wife yesterday
Discord: rewe 45€ husband
```

**Batch Logging:** Use Shift+Enter for multiple lines
```
45 rewe
32 dm
15 backerei
```

### 3.2 Before Large Purchases

```
Discord: !status
```
Review budget status before spending >€50 on discretionary items.

### 3.3 Investment Transfers

Log immediately when making transfers:
```
Discord: !invest 500 scalable
Discord: !invest 1000 revolut ETF purchase
```

---

## 4. MONTHLY HARD CLOSE

**When:** Day 1-5 of each month  
**Time Required:** 30-45 minutes  
**Tools:** Bank access, Google Sheets, Discord

### 4.1 Phase 1: Income Input (Day 1-5)

| # | Task | Command | Source | Notes |
|---|------|---------|--------|-------|
| 1 | H Net Salary | `!income [amt] salary h` | **Bank deposit** | Final € hitting account |
| 2 | W Net Salary | `!income [amt] salary w` | **Bank deposit** | Final € hitting account |
| 3 | YouTube Gross | `!income [amt] youtube` | AdSense | Before tax reserve |
| 4 | H TA Hours | `!ta [hrs] h` | Payslip/SAP | Hours added this month |
| 5 | W TA Hours | `!ta [hrs] w` | Payslip/SAP | Hours added this month |
| 6 | Other Income | `!income [amt] other [desc]` | Bank (if any) | Optional |
| 7 | **Verify** | `!income status` | All ✅ | Must be complete |

**CRITICAL: What is "Net Salary"?**

Use the **final amount hitting your bank account** after ALL deductions including SAP loan:

```
Correct input = Bank deposit amount
              = Payslip Net - SAP Loan Payment - SAP Taxed Advantage
```

**Example:**
- Payslip shows: "Net: €3,783.00"
- Bank shows deposit: "€3,200.00"
- Log: `!income 3200 salary h` ✅
- Do NOT log: `!income 3783 salary h` ❌

**Why?** The Excel model expects the amount that actually hits CMP. SAP deductions are already factored into projections; logging the wrong amount causes double-deduction.

**Note:** Income logs to PREVIOUS month (reconciliation pattern). Logging in January records December's income.

### 4.2 Phase 2: Hard Close (Day 5-10)

| # | Task | Location |
|---|------|----------|
| 1 | Confirm `!income status` = all ✅ | Discord |
| 2 | Review investments | `!invest status` |
| 3 | Open FinanceSource_v6_1 | Google Sheets |
| 4 | Check CMP_End (positive?) | Monthly_Model_v4 |
| 5 | Verify Exp_Alloc (col **BQ**) matches ShadowLedger | Compare totals |
| 6 | Compare Inv_Excess actual vs projected | Monthly_Model_v4 |

### 4.3 Phase 3: Mark-to-Market

Update actual balances from bank accounts:

**Investment Account:**
- [ ] Log into brokerage
- [ ] Update `Inv_End` (column BV) with actual

**Debt Balances:**
- [ ] TF Card → `D_TF_Bal`
- [ ] Klarna → `D_Klarna_Bal`
- [ ] Nordea → `D_Nordea_Bal`
- [ ] DB Overdraft → `D_DB_Bal`
- [ ] Aktia → `D_Aktia_Bal`
- [ ] SAP Loan → `SAP_Loan_Bal`

**Other Balances:**
- [ ] Mortgage → `Mort_End`
- [ ] CMP (Checking) → `CMP_End`
- [ ] Cashpile (Savings) → `Cash_End`

### 4.4 Phase 4: Visual Confirmation

- [ ] Highlight closed month row in **light yellow**
- [ ] Scroll to Dec 2042 — verify no #REF or #VALUE errors
- [ ] Check Net Worth trajectory looks reasonable

### 4.5 Phase 5: Dashboard Verification

- [ ] Open Dashboard
- [ ] Click Refresh
- [ ] Select closed month
- [ ] Verify Sankey flows match expectations
- [ ] Check stat cards show correct values

### 4.6 Phase 6: ShadowLedger Reset Check

```
Discord: !status
```
- [ ] Confirm all categories show €0 spent (new month)
- [ ] Verify budget amounts are correct

---

## 5. QUARTERLY REVIEWS

**When:** End of Mar, Jun, Sep, Dec

### 5.1 RSU Verification (Jan, Apr, Jul, Oct)

- [ ] Confirm RSU vest amount matches RSU_Schedule
- [ ] Record actual net received after tax

### 5.2 Sondertilgung Check

- [ ] Verify conditions were/weren't met
- [ ] If paid, confirm mortgage balance reduced by €21,550

### 5.3 Quarterly Comparison

- [ ] Compare actual vs projected for quarter
- [ ] Note major variances
- [ ] Adjust assumptions if needed

---

## 6. ANNUAL TASKS

**When:** January

### 6.1 Year-End Review

- [ ] Compare actual 20XX vs projected 20XX
- [ ] Note major variances
- [ ] Update Assumptions if needed (salary raises, etc.)

### 6.2 Budget Adjustment

- [ ] Review SL_Budget amounts
- [ ] Adjust for 3% lifestyle inflation if desired
- [ ] Update any category budgets based on actual patterns

### 6.3 Tax Preparation

- [ ] Note YT Tax Reserve total for tax filing
- [ ] Export relevant transaction data if needed

---

## 7. COMMAND REFERENCE

### 7.1 Expense Commands

| Command | Purpose |
|---------|---------|
| `45 rewe` | Log €45 expense at Rewe |
| `27 lidl wife yesterday` | Log with spender + date |
| `!status` | Monthly budget table |
| `!budgetleft` | Remaining budget per category |
| `!ytd` | Year-to-date spending |
| `!today` | Today's transactions |
| `!week` | This week's transactions |
| `!undo` → `!undo confirm` | Delete last transaction |

### 7.2 Income Commands

| Command | Purpose | Target Month |
|---------|---------|--------------|
| `!income 3200 salary h` | Log H net salary (bank deposit) | Previous |
| `!income 2800 salary w` | Log W net salary (bank deposit) | Previous |
| `!income 1200 youtube` | Log YouTube gross | Previous |
| `!income 50 other payback` | Log other income | Previous |
| `!ta 3.52 h` | Log H hours added | Previous |
| `!ta 3.10 w` | Log W hours added | Previous |
| `!income status` | Check what's missing | Previous |

### 7.3 Investment Commands

| Command | Purpose | Target Month |
|---------|---------|--------------|
| `!invest 500 scalable` | Log transfer to Scalable | Current |
| `!invest 1000 revolut ETF` | Log with notes | Current |
| `!invest status` | This month's transfers | Current |

### 7.4 Spender Aliases

| Husband | Wife |
|---------|------|
| h, husband, nha, anh, aaron | w, wife, trang, chang, em |

### 7.5 Date Formats

| Format | Example |
|--------|---------|
| Relative | yesterday, today, tomorrow |
| DD.MM | 06.03, 6/3 |
| Natural | march 6 |

---

## 8. TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Exp_Alloc shows wrong value | Check ShadowLedger tab has correct month's transactions |
| Dashboard won't load | Check Apps Script deployment, try incognito window |
| CMP_End goes very negative | Review debt payments, may need to adjust timing |
| Formula errors (#REF) | Check for deleted rows/columns, restore from backup |
| Bot offline | Check Render.com service, verify keep-alive |
| No response from bot | Verify Cloudflare Worker URL |
| Wrong category | Add pattern to SL_Patterns sheet |
| Income not saving | Run command to auto-create sheet |
| Logged salary not appearing | Verify format: `!income [bank_amount] salary h` |
| Double CMP shortfall | Check you're logging bank deposit, not payslip net |

---

## 9. TECHNICAL IMPLEMENTATION

### 9.1 The Self-Closing Formula

**Location:** Column BQ (Exp_Alloc)

This formula automatically switches between "Guardrail" mode (during month) and "Truth" mode (after month closes):

```excel
=IF(TODAY() > EOMONTH($C2, 0),
     SUMIFS(ShadowLedger!D:D, ShadowLedger!C:C, ">="&$C2, 
            ShadowLedger!C:C, "<="&EOMONTH($C2,0)),
     MAX($BP2, SUMIFS(ShadowLedger!D:D, ShadowLedger!C:C, ">="&$C2, 
                      ShadowLedger!C:C, "<="&EOMONTH($C2,0))))
```

**Logic:**
- **During month:** Uses MAX(Budget, Actual) — pessimistically assumes full budget spend
- **After month:** Uses actual ShadowLedger sum only

### 9.2 Income Integration (UPDATED v6.1.3)

**Location:** Columns L, T, AG, AJ

Income columns use conditional COUNTIFS/SUMIFS pattern:

```excel
=IF(COUNTIFS(SL_Income_Log!$B:$B, RIGHT(D2,4)&"-"&LEFT(D2,2),
             SL_Income_Log!$C:$C, "salary",
             SL_Income_Log!$E:$E, "H") > 0,
    SUMIFS(SL_Income_Log!$D:$D,
           SL_Income_Log!$B:$B, RIGHT(D2,4)&"-"&LEFT(D2,2),
           SL_Income_Log!$C:$C, "salary",
           SL_Income_Log!$E:$E, "H"),
    projection_formula)
```

**Key Pattern:** `RIGHT(D2,4)&"-"&LEFT(D2,2)` extracts MonthKey from Income_From column.

**Behavior:** Actual from SL_Income_Log overrides projection; future months retain projection.

### 9.3 Time Account Integration (NEW v6.1.3)

**Location:** Columns CC, CD

```excel
=CC{prev} + IF(COUNTIFS(SL_Income_Log!$B:$B, RIGHT(D2,4)&"-"&LEFT(D2,2),
                        SL_Income_Log!$C:$C, "ta_h") > 0,
               SUMIFS(SL_Income_Log!$D:$D, ...),
               calculated_hours)
```

**Logic:** Uses logged hours from `!ta` command when available, falls back to €200/hourly_rate calculation.

### 9.4 Investment Integration

**Location:** SL_Investment_Log sheet

Each `!invest` command creates a new row:
- **ID:** INV-YYYYMMDD-HHMMSS
- **Date:** Transfer date
- **MonthKey:** YYYY-MM (current month)
- **Amount:** Euro amount
- **Destination:** scalable / revolut / comdirect / trade_republic / other
- **Notes:** Optional description

### 9.5 Column Reference

| Column | Letter | Description |
|--------|--------|-------------|
| Exp_Budget | BP | Base × (1 + 3%)^years |
| Exp_Alloc | BQ | Self-closing formula (actuals or MAX) |
| H_Net_Salary | L | Actual from SL_Income_Log OR projection |
| W_Net_Salary | T | Actual from SL_Income_Log OR projection |
| YT_Gross | AG | Actual from SL_Income_Log OR projection |
| Other_Fam_Net_Inc | AJ | Sum from SL_Income_Log (type="other") |
| H_TA_Hrs | CC | Cumulative: logged actual OR calculated |
| W_TA_Hrs | CD | Cumulative: logged actual OR calculated |

---

## 10. ARCHITECTURAL DECISIONS

### ADR-017: Income Tracking via ShadowLedger
- **Decision:** Add income tracking commands to ShadowLedger
- **Rationale:** Income has variability (YouTube, tax impact, Payback) that projection alone cannot capture
- **Alternative rejected:** Manual Excel entry — lacks real-time tracking and reminder system

### ADR-018: Actuals Override Projection Pattern
- **Decision:** When actual income is logged, it replaces projection for that month only
- **Rationale:** "Jan is actual, Feb onwards stays at original projection"
- **Impact:** Cascades through CMP and all downstream calculations

### ADR-019: TA Hours Input Method
- **Decision:** Input hours added per month (not cumulative, not deduction amount)
- **Rationale:** Hours visible on SAP portal; hourly rate changes annually

### ADR-020: Automated Reminder System
- **Decision:** Time-triggered reminders on Day 1, 6, 11, 16, 21, 26
- **Rationale:** Ensures monthly actuals are captured; stops once all inputs complete

### ADR-021: Other_Fam_Net_Inc Default Behavior
- **Decision:** Assume €0 if not entered (no explicit zero-entry required)
- **Rationale:** Reduces input burden for months without Payback/refunds

### ADR-022: Investment Tracking via ShadowLedger
- **Decision:** Add `!invest` command to log actual investment transfers
- **Rationale:** Investment is projection-only; actual transfers vary due to opportunistic investing

### ADR-023: Investment Logs to Current Month
- **Decision:** `!invest` logs to CURRENT month (unlike `!income` → previous)
- **Rationale:** Log investments as they happen (real-time), not during reconciliation

### ADR-024: Destination Tracking for Investments
- **Decision:** Track destination (Scalable, Revolut, Comdirect, Trade Republic, Other)
- **Rationale:** Visibility into where money goes for portfolio management

### ADR-025: Multiple Entries Per Month
- **Decision:** Each `!invest` creates a new row (no update-in-place)
- **Rationale:** Multiple transfers per month are common; each is a unique event

### ADR-026: Net Salary = Bank Deposit (v1.1.0)
- **Decision:** Clarify that "net salary" for `!income` means the final bank deposit amount
- **Rationale:** Prevents double-deduction of SAP loan in CMP calculations
- **User action:** Log what appears in bank account, NOT payslip "net before SAP"

---

## 11. FUTURE ENHANCEMENTS

### 11.1 Operations Improvements

| # | Enhancement | Effort | Priority |
|---|-------------|--------|----------|
| 1 | Automated bank statement reconciliation | 8-10h | Medium |
| 2 | Push notifications for budget alerts | 4-5h | Medium |
| 3 | Mobile-friendly checklist app | 10-12h | Low |
| 4 | Automated backup to Google Drive | 2-3h | High |

### 11.2 Integration Ideas

- Email parsing for receipts
- Bank API for auto-import transactions
- Calendar integration for financial milestones

---

## APPENDIX A: COMPLETION SIGN-OFF

**Month Closed:** _______________  
**Date Completed:** _______________  
**Completed By:** _______________

### Verification Checklist:
- [ ] Income logged (`!income status` = all ✅)
- [ ] Used bank deposit amounts (not payslip net)
- [ ] Investments logged (`!invest status` reviewed)
- [ ] All actuals recorded in Sheet
- [ ] Row highlighted yellow
- [ ] Dashboard verified
- [ ] No formula errors
- [ ] ShadowLedger reset confirmed

---

## APPENDIX B: FILES ABSORBED

This Blueprint consolidates:

| File | Status |
|------|--------|
| `Operations_Blueprint_v1_0_0.md` | ✅ Superseded |
| `Finance_SOP.md` | ✅ Absorbed |
| `MONTHLY_CHECKLIST.md` | ✅ Absorbed |
| `MONTHLY_CHECKLIST_v2.md` | ✅ Absorbed |
| `Finance_SOP_changelog_20251228_1830.md` | ✅ Absorbed (ADR-017 to ADR-021) |
| `Finance_SOP_changelog_20251228_1945.md` | ✅ Absorbed (ADR-022 to ADR-025) |
| `StandardFinance_changelog_20260101_2051.md` | ✅ Absorbed (clarification on net salary) |

---

## Safe to Delete

| File | Reason |
|------|--------|
| `Operations_Blueprint_v1_0_0.md` | Superseded by v1.1.0 |

---

**END OF OPERATIONS BLUEPRINT v1.1.0**

*Last Updated: 2026-01-11 23:50:00 UTC+2*  
*Next Review: After first full month using this Blueprint*
