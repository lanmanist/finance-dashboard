# Monthly Financial Checklist

**Version:** 1.0  
**Last Updated:** December 2025  
**When:** 1st-3rd of each month

---

## Overview

This checklist guides you through the monthly "Hard Close" process - converting projections into actuals and resetting for the new month.

**Time Required:** 30-45 minutes  
**Tools Needed:** Bank access, Google Sheets, Discord

---

## PRE-CLOSE: Day 28-31 of Current Month

### □ Daily Expense Check
```
Discord: !status
```
- [ ] Review budget status
- [ ] Log any missed expenses
- [ ] Check for over-budget categories

### □ Upcoming Bills Awareness
- [ ] Note any large bills due in first week of next month
- [ ] Ensure sufficient CMP balance

---

## HARD CLOSE: Day 1-3 of New Month

### Phase 1: Create Backup (5 min)

- [ ] Open Google Sheets: `FinanceSource_v6_1`
- [ ] File → Make a copy
- [ ] Name: `FinanceSource_YYYY_MM_Backup` (previous month)
- [ ] Move to Backups folder

### Phase 2: Income Truth (10 min)

Log into bank accounts and record ACTUAL amounts received:

**Husband's Account:**
- [ ] Net salary received (end of last month): €_______
- [ ] Update `H_Net_Salary` cell for the month

**Wife's Account:**
- [ ] Net salary received (end of last month): €_______
- [ ] Update `W_Net_Salary` cell for the month

**If Bonus Month (April):**
- [ ] H Bonus net received: €_______
- [ ] W Bonus net received: €_______

**If RSU Month (Jan, Jul, Oct):**
- [ ] H RSU net received: €_______
- [ ] W RSU net received: €_______

**YouTube (if applicable):**
- [ ] YT revenue received: €_______

### Phase 3: Expense Lock-in (5 min)

- [ ] Run `!status` in Discord - note total spent
- [ ] Verify `Exp_Alloc` (column BQ) shows correct actual
- [ ] The SUMIFS formula should already have the correct value
- [ ] If manual adjustment needed, copy cell → Paste Values

### Phase 4: Mark-to-Market (10 min)

Update actual balances from accounts:

**Investment Account:**
- [ ] Log into brokerage
- [ ] Current balance: €_______
- [ ] Update `Inv_End` (column BV) with actual

**Debt Balances:**
- [ ] TF Card balance: €_______ → `D_TF_Bal`
- [ ] Klarna balance: €_______ → `D_Klarna_Bal`
- [ ] Nordea balance: €_______ → `D_Nordea_Bal`
- [ ] DB Overdraft: €_______ → `D_DB_Bal`
- [ ] Aktia balance: €_______ → `D_Aktia_Bal`
- [ ] SAP Loan balance: €_______ → `SAP_Loan_Bal`

**Mortgage:**
- [ ] Current balance: €_______ → `Mort_End`

**CMP (Checking Account):**
- [ ] Current balance: €_______ → `CMP_End`

**Cashpile (Savings):**
- [ ] Current balance: €_______ → `Cash_End`

### Phase 5: Visual Confirmation (5 min)

- [ ] Highlight the closed month row in **light yellow**
- [ ] Scroll to Dec 2042 - verify no #REF or #VALUE errors
- [ ] Check Net Worth trajectory looks reasonable

### Phase 6: Dashboard Verification (5 min)

- [ ] Open Dashboard: https://lanmanist.github.io/finance-dashboard/
- [ ] Click Refresh
- [ ] Select closed month
- [ ] Verify Sankey flows match expectations
- [ ] Check stat cards show correct values

---

## POST-CLOSE: Quick Checks

### ShadowLedger Reset Verification
```
Discord: !status
```
- [ ] Confirm all categories show €0 spent (new month)
- [ ] Verify budget amounts are correct

### Year-to-Date Check (Monthly)
```
Discord: !ytd
```
- [ ] Review YTD spending vs budget
- [ ] Note any categories trending over

---

## QUARTERLY ADDITIONS (Mar, Jun, Sep, Dec)

### RSU Verification (if RSU month)
- [ ] Confirm RSU vest amount matches RSU_Schedule
- [ ] Record actual net received after tax

### Sondertilgung Check (if applicable)
- [ ] Verify conditions were/weren't met
- [ ] If paid, confirm mortgage balance reduced by €21,550

---

## ANNUAL ADDITIONS (January)

### Year-End Review
- [ ] Compare actual 20XX vs projected 20XX
- [ ] Note major variances
- [ ] Update Assumptions if needed (salary raises, etc.)

### Budget Adjustment
- [ ] Review SL_Budget amounts
- [ ] Adjust for 3% lifestyle inflation if desired
- [ ] Update any category budgets based on actual patterns

### Tax Preparation
- [ ] Note YT Tax Reserve total for tax filing
- [ ] Export relevant transaction data if needed

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Exp_Alloc shows wrong value | Check ShadowLedger tab has correct month's transactions |
| Dashboard won't load | Check Apps Script deployment, try new incognito window |
| CMP_End goes very negative | Review debt payments, may need to adjust timing |
| Formula errors (#REF) | Check for deleted rows/columns, restore from backup |

---

## COMPLETION SIGN-OFF

**Month Closed:** _______________  
**Date Completed:** _______________  
**Completed By:** _______________

### Verification Checklist:
- [ ] Backup created
- [ ] All actuals recorded
- [ ] Row highlighted yellow
- [ ] Dashboard verified
- [ ] No formula errors
- [ ] ShadowLedger reset confirmed

---

*Reference: [SOP.md](SOP.md) for detailed operational procedures*
