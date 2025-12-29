# Aaron Family Standard Finance Guide

```yaml
version: 6.2.0
last_updated: 2025-12-28 23:15:00 UTC+2
status: Production
simulation_period: January 2026 - December 2042 (204 months)
associated_file: FinanceSource_v6.1.xlsx
```

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Workbook Structure](#2-workbook-structure)
3. [Money Flow Architecture](#3-money-flow-architecture)
4. [Income Structure](#4-income-structure)
5. [Debt Management](#5-debt-management)
6. [The POT System](#6-the-pot-system)
7. [Sondertilgung (Extra Mortgage Payments)](#7-sondertilgung)
8. [Investment Strategy](#8-investment-strategy)
9. [Monthly Model Column Reference](#9-monthly-model-column-reference)
10. [ShadowLedger Integration](#10-shadowledger-integration)
11. [Assumptions Reference](#11-assumptions-reference)
12. [Key Formulas Explained](#12-key-formulas-explained)
13. [Financial Projections](#13-financial-projections)
14. [Validation Checkpoints](#14-validation-checkpoints)
15. [Architectural Decisions](#15-architectural-decisions)
16. [Version History](#16-version-history)

---

## 1. OVERVIEW

This guide documents the Aaron Family's comprehensive 17-year financial simulation model. The model tracks all income sources, debt obligations, investments, and net worth from January 2026 through December 2042.

### 1.1 Key Principles

1. **Central Master Pot (CMP) Architecture**: All money flows through a single hub
2. **Avalanche Debt Strategy**: Attack highest-APR debt first
3. **Baseline Protection**: Maintain minimum balances before discretionary spending
4. **Opportunistic Sondertilgung**: Make extra mortgage payments when conditions allow
5. **Salary Timing Rule**: Income earned in Month X is available in Month X+1

### 1.2 Family Context

- **Location**: Baden-Württemberg, Germany
- **Employment**: Both spouses work at SAP SE (SuccessFactors division)
- **Housing**: Owner-occupied home with mortgage maturing June 2033
- **Child**: One son (AK)

### 1.3 System Integration

StandardFinance is part of a three-module system:

| Module | Purpose | Integration |
|--------|---------|-------------|
| **ShadowLedger** | Discord-based expense/income tracking | Feeds actual income to Monthly_Model |
| **StandardFinance** | 17-year financial projection | Core calculation engine |
| **Dashboard** | Sankey flow visualization | Reads from Monthly_Model |

---

## 2. WORKBOOK STRUCTURE

### 2.1 Core Sheets

| Sheet | Purpose | Status |
|-------|---------|--------|
| `Assumptions` | All configurable parameters (~90 values) | **Active** |
| `RSU_Schedule` | RSU vesting reference by quarter | Active |
| `Salary_Schedule` | Monthly salary/bonus with growth projections | Active |
| `Debt_Register` | All 14 debts with details | Active |
| `Monthly_Model_v4` | Main 204-row simulation (88 columns) | **Active - USE THIS** |

### 2.2 ShadowLedger Integration Sheets

These sheets are documented in `BLUEPRINT_ShadowLedger_v2_2_0.md`:

| Sheet | Purpose | Data Flow |
|-------|---------|-----------|
| `ShadowLedger` | Expense transaction log | → Exp_Alloc reporting |
| `SL_Budget` | Monthly budget tracking | ← Budget formulas |
| `SL_Patterns` | Merchant categorization rules | Internal to SL |
| `SL_Config` | System configuration | Internal to SL |
| `SL_Income_Log` | Actual income entries | **→ Monthly_Model cols L, T, AG, AJ** |
| `SL_Investment_Log` | Investment transfer log | Audit trail |

### 2.3 Deprecated Sheets

- `Monthly_Model` - Original version
- `Monthly_Model_v2` - Previous iteration

---

## 3. MONEY FLOW ARCHITECTURE

### 3.1 The Critical Salary Timing Rule

**CRITICAL**: Salary for Month X is received at the END of Month X, therefore available for spending in Month X+1.

| Income Type | Earned | Available |
|-------------|--------|-----------|
| January Salary | End of Jan | February |
| March Bonus | End of Mar | April |
| June RSU Vest | End of Jun | July |
| YouTube Revenue | End of month | Next month |

**Fat Months** = Months where extra income is AVAILABLE (not earned):
- **April**: March bonus available
- **July**: June RSU available
- **October**: September RSU available
- **January**: December RSU available

### 3.2 Money Flow Diagram

```
+========================================================================+
|                           MONEY FLOW v6.2                              |
+========================================================================+

                     GROSS INCOME (Month X-1)
                (Salaries + Bonus + RSU + YouTube)
                Received end of Month X-1
                Available in Month X
                               |
                               v
                +------------------------------+
                |     PRE-TAX DEDUCTIONS       |
                |  * Time Account (€400/mo)    |
                |  * OWNSAP (~€1,356/mo)       |
                +------------------------------+
                               |
                               v
                +------------------------------+
                |   TAXES & SOCIAL (~40%)      |
                +------------------------------+
                               |
                               v
                +------------------------------+
                |     POST-TAX DEDUCTIONS      |
                |  * SAP Loan (€583/mo) auto   |
                |  * SAP Taxed Advantage       |
                |    (0.3% x prev balance)     |
                +------------------------------+
                               |
         +---------------------+-------------------------+
         |                                               |
         v                                               v
+-----------------+                        +---------------------+
|  TAX RESERVE    |                        |   CENTRAL MASTER    |
|  (YT 44.3%)     |                        |      POT (CMP)      |
|                 |                        |                     |
|  Separate acct  |                        |  Cap: €10,000       |
|  Resets yearly  |                        |  Can go negative    |
+-----------------+                        |  (to -€1,000 max)   |
                                           +---------------------+
                                                      |
                ==========================================
                ALLOCATE IN PRIORITY ORDER            |
                ==========================================
                                                      |
         +--------------------------------------------+-----------+
         |                                            |           |
         v                                            v           v
+-----------------+  +-----------------+  +-----------------+
|  MORTGAGE       |  |  DEBT           |  |  EXPENSES       |
|                 |  |  REPAYMENT      |  |                 |
|  €2,281/mo      |  |                 |  |  €4,110 base    |
|  Until Jun 2033 |  |  High-APR first |  |  +3%/yr inflate |
|                 |  |  Then fixed     |  |                 |
|  Sondertilgung: |  |                 |  |  2027: €4,233   |
|  When possible  |  |  SAP Loan auto  |  |  2030: €4,625   |
|  €21,550/yr     |  |                 |  |  2042: €6,593   |
+-----------------+  +-----------------+  +-----------------+
         |                    |                    |
         +--------------------+--------------------+
                                |
                                v
                      REMAINING EXCESS
                                |
         +----------------------+----------------------+
         |                      |                      |
         v                      v                      v
+-----------------+  +-----------------+  +-----------------+
|  SONDERTILGUNG  |  |  CASHPILE       |  |  INVESTMENT     |
|  (If conditions |  |                 |  |                 |
|   met)          |  |  20% of excess  |  |  80% of excess  |
|                 |  |  Target: €15K   |  |  OWNSAP contrib |
|  €21,550/year   |  |                 |  |  8.5%/yr growth |
+-----------------+  +-----------------+  +-----------------+
```

---

## 4. INCOME STRUCTURE

### 4.1 Salary Structure (90% Fixed / 10% Bonus)

| Person | Fixed Salary 2026 | Bonus 2026 | Total 2026 | Growth Rate |
|--------|-------------------|------------|------------|-------------|
| Husband | €88,397 | €9,821 | €98,218 | 5.0% annually |
| Wife | €74,348 | €8,261 | €82,609 | 3.5% annually |

**Monthly breakdown (2026):**
- H Fixed Monthly: €7,366.42
- W Fixed Monthly: €6,195.67
- Bonuses paid in March, available in April

### 4.2 Salary_Schedule Sheet

The `Salary_Schedule` sheet contains pre-calculated monthly values with growth applied:

| Column | Header | Description |
|--------|--------|-------------|
| A | Year | 2026-2042 |
| B | Month | 1-12 |
| C | H_Salary_Modifier | Default 0%, applies to husband's salary+bonus |
| D | W_Salary_Modifier | Default 0%, applies to wife's salary+bonus |
| E | H_Fixed_Monthly | Base × growth × (1+H_modifier) |
| F | H_Bonus | In April rows only |
| G | W_Fixed_Monthly | Base × growth × (1+W_modifier) |
| H | W_Bonus | In April rows only |
| I | Notes | For manual annotations |

**To give a raise**: Change the modifier in column C (husband) or D (wife).
- Set C50 = 0.10 to give husband a 10% raise starting that month
- Set D50 = 0.15 to give wife a 15% raise starting that month

### 4.3 Time Account Contributions

| Person | Monthly TA | Bonus TA Rate |
|--------|------------|---------------|
| Husband | €200/month | 35% of bonus |
| Wife | €200/month | 35% of bonus |

**Hourly Rate Calculation**:
- Hourly rate = Annual FIXED salary / 208 working days / 8 hours
- Rate updates dynamically based on Salary_Schedule
- Example (2026): €88,397 / 208 / 8 = €53.13/hour

Time Account hours accumulate and can be cashed out (tracked in NW_TA).

### 4.4 RSU (Restricted Stock Units)

| Person | Annual Grant | Vesting Schedule |
|--------|--------------|------------------|
| Husband | €20,000 | Quarterly (Mar, Jun, Sep, Dec) |
| Wife | €10,000 | Quarterly (Mar, Jun, Sep, Dec) |

RSUs vest at end of quarter, available the following month.

### 4.5 OWNSAP (Employee Stock Purchase Plan)

- **Deduction Rate**: 10% of gross salary
- **Value Multiplier**: Deduction × 1.4 + €20
- **Handling**:
  - During High-APR debt attack: SOLD immediately, proceeds to CMP
  - After High-APR cleared: Goes directly to Investment

### 4.6 YouTube Income

| Parameter | Value |
|-----------|-------|
| Starting (Jan 2026) | €1,000/month gross |
| Growth | €1,000 every 6 months |
| Cap | €20,000/month |
| Tax Reserve | 44.3% (set aside, not spent) |
| Net to CMP | ~€557/month initially |

**Tax Reserve Reset**: Resets to €0 at the beginning of each year (January).

### 4.7 SAP Loan (Split 50/50 with Taxed Advantage)

| Parameter | Husband | Wife | Total |
|-----------|---------|------|-------|
| Starting Balance | €26,250 | €26,250 | €52,500 |
| Monthly Payment | €291.67 | €291.67 | €583.34 |
| End Date | Jun 2033 | Jun 2033 | Jun 2033 |
| Interest Rate | 0% | 0% | 0% |
| Taxed Advantage | 0.3%/mo on prev balance | 0.3%/mo on prev balance | ~€157.50/mo initially |

**Note**: The SAP Loan is interest-free, but the benefit is taxed as income. The "Taxed Advantage" is deducted from net salary.

---

## 5. DEBT MANAGEMENT

### 5.1 Debt Register Overview

| # | Debt | Owner | Balance | APR | Minimum | Type | Priority |
|---|------|-------|---------|-----|---------|------|----------|
| 1 | TF Credit Card | H | €9,200 | 22.0% | €300 | Attack | 1 |
| 2 | DB Overdraft | H | €2,000 | 13.0% | €0 | Attack | 2 |
| 3 | Klarna | W | €2,000 | 14.0% | €200 | Attack | 3 |
| 4 | Nordea Card | W | €2,000 | 13.0% | €100 | Attack | 4 |
| 5 | Aktia Card | W | €440 | 13.0% | €30 | Attack | 5 |
| 6 | Scalable Credit | H | €5,500 | 3.3% | €0 | Low | - |
| 7 | AK Payback (Son) | H+W | €5,000 | 0% | €0 | Future | - |
| 8 | Revolut Loan | H | €12,350 | 5.95% | €650 | Fixed | - |
| 9 | C3 Family Loan | H | €10,000 | 0% | €290+Q | Fixed | - |
| 10 | Student Loan | W | €11,000 | 3.2% | €200 | Fixed | - |
| 11 | IKEA Card | W | €2,500 | 0% | €132 | Fixed | - |
| 12 | N26 Overdraft | W | €360 | 0% | €90 | Fixed | - |
| 13 | SAP Loan | H+W | €52,500 | 0%* | €583 | Fixed | - |
| 14 | Mortgage | H+W | €397,546 | 3.89% | €2,281 | Fixed | - |

*SAP Loan: 0% interest but taxed as benefit

### 5.2 Debt Attack Strategy (Avalanche Method)

**Phase 1: High-APR Attack (Jan-Apr 2026)**

1. Pay **minimum payments** on all high-APR debts FIRST:
   - Klarna: €200/mo minimum
   - Nordea: €100/mo minimum
   - Aktia: €30/mo minimum
   - TF: €300/mo minimum
   - DB: €0/mo minimum (no minimum required)

2. Direct ALL remaining excess to highest-APR debt (TF first)
3. When one debt cleared, attack next highest APR
4. OWNSAP is SOLD during this phase
5. CMP can go negative up to -€1,000 if needed

**Attack Order**: TF → DB → Klarna → Nordea → Aktia

**Expected Clearance**:
- TF: April 2026
- DB: July 2026
- Klarna: August 2026
- Aktia: September 2026
- Nordea: October 2026

### 5.3 Fixed Payment Loans

These loans have set payment schedules - let them run:

| Loan | End Date | Total Paid |
|------|----------|------------|
| N26 Overdraft | Apr 2026 | €360 |
| C3 Family | Apr 2027 | €10,000 |
| IKEA Card | Jul 2027 | €2,500 |
| Revolut | Aug 2027 | €12,350 |
| Student Loan | Jul 2030 | €11,000 |
| SAP Loan | Jun 2033 | €52,500 |

### 5.4 Low-APR Debt Strategy

**Scalable Credit (€5,500 @ 3.3%)**: Leave open, invest instead. The expected investment return (8.5%) exceeds the interest cost.

**AK Payback (€5,000 @ 0%)**: Future repayment to son's account. No current payment schedule - tracked for visibility.

---

## 6. THE POT SYSTEM

### 6.1 Central Master Pot (CMP) Rules

The CMP is the central hub through which ALL money flows.

```
                    +-------------------+
      ALL INCOME    |        CMP        |     ALL OUTFLOWS
         --------->  |  (Central Hub)    | <---------
                    +---------+---------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
   +---------+          +---------+          +---------+
   | Mortgage|          |  Debt   |          |Expenses |
   +---------+          +---------+          +---------+
        |                     |                     |
        v                     v                     v
   +---------+          +----------+         +---------+
   |Cashpile |          |Investment|         |Tax Res  |
   +---------+          +----------+         +---------+
```

**Rule 1**: CMP receives ALL net income first
- Net salaries (after tax, TA, OWNSAP, SAP deductions)
- Net RSU
- Net YouTube
- OWNSAP proceeds (during debt attack phase)
- Other family income

**Rule 2**: CMP pays out in priority order
1. Mortgage payment (€2,281/mo)
2. Sondertilgung (if conditions met)
3. High-APR debt payments
4. Fixed loan payments
5. Expenses

**Rule 3**: CMP is capped at €10,000
- Excess above cap flows to Investment and Cashpile
- 20% to Cashpile (until €15,000 target)
- 80% to Investment

**Rule 4**: CMP can go negative (controlled)
- Minimum: -€1,000 (hard floor)
- Jan-Mar 2026: May go negative during debt attack
- Fat months replenish

### 6.2 Cashpile Rules

| Phase | Target | Priority |
|-------|--------|----------|
| Phase 1 | €5,000 | Build first |
| Phase 2 | €15,000 | Build to full |
| Maintenance | €15,000 | Maintain |

- Receives 20% of CMP excess (after debts paid)
- Once at €15,000, no further contributions
- Can be drawn for Sondertilgung/Balloon funding (down to €5,000 baseline)

### 6.3 Investment Account Rules

**Inflows**:
- OWNSAP contributions (after High-APR cleared)
- CMP overflow (excess above €10K cap)
- 80% of monthly excess

**Outflows**:
- Sondertilgung funding (sell if needed)
- Balloon payment in Jul 2033

**Growth**: 8.5% annual return (0.68% monthly)

---

## 7. SONDERTILGUNG

### 7.1 What is Sondertilgung?

Sondertilgung = Extra principal payment on the mortgage, allowed once per year up to €21,550.

### 7.2 Funding Logic

**Trigger Conditions** (ALL must be met):
1. High-APR debt = €0
2. CMP >= €10,000 baseline (after regular payments)
3. Investment >= €20,000 baseline
4. Cashpile >= €5,000 baseline
5. Not already paid this calendar year
6. Mortgage balance > €0

**Funding Sources** (to reach €21,550):
```
Available = MAX(0, CMP_raw - 10,000)
          + MAX(0, Investment_prev - 20,000)
          + MAX(0, Cashpile_prev - 5,000)

IF Available >= 21,550 THEN pay €21,550
```

Where `CMP_raw` = CMP_Available - Mortgage_Pmt - Debt_Payments - Expenses

**Funding Priority**:
1. Use CMP excess first (amount over €10K)
2. Draw from Cashpile (amount over €5K)
3. Sell from Investment (amount over €20K)

**Flow**: All funding channels through CMP before paying Sondertilgung.

### 7.3 Sondertilgung Schedule (From xlsx)

| Year | Month | Amount | Type |
|------|-------|--------|------|
| 2027 | May | €21,550 | Regular |
| 2028 | January | €21,550 | Regular |
| 2029 | January | €21,550 | Regular |
| 2030 | January | €21,550 | Regular |
| 2031 | January | €21,550 | Regular |
| 2032 | January | €21,550 | Regular |
| 2033 | July | €143,522 | **Balloon** |

**Note:** No regular Sondertilgung in 2033 (balloon year). Total extra principal: ~€272,822

---

## 8. INVESTMENT STRATEGY

### 8.1 Asset Allocation

All investments are in a single growth portfolio:
- Expected annual return: 8.5%
- Tax on gains: 18.4625%

### 8.2 OWNSAP Handling

| Phase | Action |
|-------|--------|
| High-APR Attack | SELL immediately → CMP |
| After Attack | Hold → Investment account |

### 8.3 Balloon Payment (July 2033)

When the mortgage matures at end of June 2033 (month 90), the remaining balance is paid in July 2033 (month 91):

**Funding Sources** (in order):
1. CMP excess (amount over €10,000 baseline)
2. Cashpile (amount over €5,000 baseline)
3. Sell from Investment (whatever remains)

**Expected Balloon**: ~€143,522

After the balloon payment:
- Mortgage = €0
- SAP Loan also ends (last payment in Jun 2033)
- ~€2,864/month freed up (Mort + SAP payments)
- All excess flows directly to Investment

---

## 9. MONTHLY MODEL COLUMN REFERENCE

### 9.1 Complete Column Mapping (88 Columns)

| Col | Letter | Header | Description |
|-----|--------|--------|-------------|
| 1 | A | Month | 1-12 |
| 2 | B | Year | 2026-2042 |
| 3 | C | Date | MM/YYYY format |
| 4 | D | Income_From | Which month's income is available |
| 5 | E | Month_Type | FAT_BONUS, FAT_RSU, or LEAN |
| **Husband Income** ||||
| 6 | F | H_Gross_Salary | From Salary_Schedule |
| 7 | G | H_TA_Ded | €200/month to Time Account |
| 8 | H | H_OWNSAP_Ded | Gross × 10% |
| 9 | I | H_Gross_Bonus | From Salary_Schedule (April) |
| 10 | J | H_Bonus_TA | Bonus × 35% |
| 11 | K | H_Taxable | Gross - TA - OWNSAP + Bonus - Bonus_TA |
| 12 | L | H_Net_Salary | **Actual from SL_Income_Log OR projection** |
| 13 | M | H_RSU_Net | Previous month's RSU vest |
| **Wife Income** ||||
| 14 | N | W_Gross_Salary | From Salary_Schedule |
| 15 | O | W_TA_Ded | €200/month to Time Account |
| 16 | P | W_OWNSAP_Ded | Gross × 10% |
| 17 | Q | W_Gross_Bonus | From Salary_Schedule (April) |
| 18 | R | W_Bonus_TA | Bonus × 35% |
| 19 | S | W_Taxable | Gross - TA - OWNSAP + Bonus - Bonus_TA |
| 20 | T | W_Net_Salary | **Actual from SL_Income_Log OR projection** |
| 21 | U | W_RSU_Net | Previous month's RSU vest |
| **OWNSAP** ||||
| 22 | V | H_OWNSAP_Val | Deduction × 1.4 + €20 |
| 23 | W | W_OWNSAP_Val | Deduction × 1.4 + €20 |
| 24 | X | OWNSAP_Total | V + W |
| **SAP Loan Detail** ||||
| 25 | Y | H_SAP_TaxedAdv | 0.3% × previous balance |
| 26 | Z | H_SAPLoan_Pmt | €291.67 for 90 months |
| 27 | AA | H_SAPLoan_Bal | €26,250 decreasing |
| 28 | AB | W_SAP_TaxedAdv | 0.3% × previous balance |
| 29 | AC | W_SAPLoan_Pmt | €291.67 for 90 months |
| 30 | AD | W_SAPLoan_Bal | €26,250 decreasing |
| 31 | AE | SAP_Loan_Pmt | Total: Z + AC |
| 32 | AF | SAP_Loan_Bal | Total: AA + AD |
| **YouTube** ||||
| 33 | AG | YT_Gross | **Actual from SL_Income_Log OR projection** |
| 34 | AH | YT_Tax_Res | Gross × 44.3% |
| 35 | AI | YT_Net | Gross - Tax Reserve |
| **Other Income** ||||
| 36 | AJ | Other_Fam_Net_Inc | **Sum from SL_Income_Log (type="other")** |
| **CMP** ||||
| 37 | AK | CMP_Carry | Previous month's CMP_End |
| 38 | AL | CMP_Inflow | Net salaries + RSU + YT + OWNSAP (if attacking) + Other_Fam |
| 39 | AM | CMP_Available | Carry + Inflow |
| 40 | AN | CMP_End | MAX(-1000, MIN(€10K, Available - Outflows)) |
| **Mortgage** ||||
| 41 | AO | Mort_Begin | Previous End balance |
| 42 | AP | Mort_Pmt | €2,281 for months 1-90, then €0 |
| 43 | AQ | Mort_Int | Balance × 3.89%/12 |
| 44 | AR | Mort_Princ | Payment - Interest |
| 45 | AS | Sondertilg | €21,550 when conditions met; BALLOON in month 91 |
| 46 | AT | Mort_End | Begin - Principal - Sondertilgung |
| **High-APR Debt** ||||
| 47 | AU | D_TF_Pmt | TF Card payment (attack after minimums) |
| 48 | AV | D_TF_Bal | TF Card balance |
| 49 | AW | D_Klarna_Pmt | Klarna payment (min €200) |
| 50 | AX | D_Klarna_Bal | Klarna balance |
| 51 | AY | D_Nordea_Pmt | Nordea payment (min €100) |
| 52 | AZ | D_Nordea_Bal | Nordea balance |
| 53 | BA | D_DB_Pmt | DB Overdraft payment |
| 54 | BB | D_DB_Bal | DB Overdraft balance |
| 55 | BC | D_Aktia_Pmt | Aktia payment (min €30) |
| 56 | BD | D_Aktia_Bal | Aktia balance |
| 57 | BE | D_HighAPR_Total | Sum of High-APR payments |
| **Low-APR/Future Debt** ||||
| 58 | BF | D_Scalable_Pmt | €0 (placeholder) |
| 59 | BG | D_Scalable_Bal | €5,500 |
| 60 | BH | D_AK_Pmt | €0 (placeholder) |
| 61 | BI | D_AK_Bal | €5,000 |
| **Fixed Loans** ||||
| 62 | BJ | D_Revolut_Pmt | €650 until Aug 2027 |
| 63 | BK | D_C3_Pmt | €290 + €2,350 quarterly |
| 64 | BL | D_Student_Pmt | €200 until Jul 2030 |
| 65 | BM | D_IKEA_Pmt | €132 until Jul 2027 |
| 66 | BN | D_N26_Pmt | €90 until Apr 2026 |
| 67 | BO | D_Fixed_Total | Sum incl. Scalable + AK |
| **Expenses** ||||
| 68 | BP | Exp_Budget | Base × (1 + 3%)^years |
| 69 | BQ | Exp_Alloc | = Budget (linked to ShadowLedger for actuals) |
| **Investment** ||||
| 70 | BR | Inv_Begin | Previous End |
| 71 | BS | Inv_OWNSAP | OWNSAP if High-APR cleared |
| 72 | BT | Inv_Excess | CMP overflow - Sondertilgung/Balloon funding |
| 73 | BU | Inv_Growth | (Begin + Inflows) × 0.68%/mo |
| 74 | BV | Inv_End | Begin + OWNSAP + Excess + Growth |
| **Cashpile** ||||
| 75 | BW | Cash_Begin | Previous End |
| 76 | BX | Cash_Add | 20% of excess OR negative (Sondertilgung/Balloon) |
| 77 | BY | Cash_End | Begin + Add |
| **Tax Reserve** ||||
| 78 | BZ | TaxRes_Beg | Previous End OR 0 if January |
| 79 | CA | TaxRes_Add | YT_Tax_Res |
| 80 | CB | TaxRes_End | Begin + Add |
| **Time Account** ||||
| 81 | CC | H_TA_Hrs | Cumulative hours (dynamic rate) |
| 82 | CD | W_TA_Hrs | Cumulative hours (dynamic rate) |
| **Net Worth** ||||
| 83 | CE | NW_Invest | Investment End |
| 84 | CF | NW_House | Starting × (1 + 1.5%)^years |
| 85 | CG | NW_Mortgage | -Mortgage End |
| 86 | CH | NW_Debt | -(High-APR + SAP + Scalable + AK) |
| 87 | CI | NW_TA | Hours × dynamic_hourly_rate × 65% |
| 88 | CJ | NW_Total | Sum of all components |

---

## 10. SHADOWLEDGER INTEGRATION

### 10.1 Overview

ShadowLedger feeds **actual income data** to Monthly_Model_v4 via the `SL_Income_Log` sheet. This enables real income values to override projections while preserving the 17-year forecast.

**Data Flow:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                    INCOME DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Discord                                                            │
│    │                                                                │
│    ├─ !income 4200 salary h ──┐                                     │
│    ├─ !income 3800 salary w ──┤                                     │
│    ├─ !income 1200 youtube ───┼──▶ SL_Income_Log (sheet)            │
│    └─ !income 50 other ───────┘           │                         │
│                                           │                         │
│                                           ▼                         │
│  Monthly_Model_v4                                                   │
│    │                                                                │
│    ├─ L (H_Net_Salary) ◀─── IF actual exists, ELSE projection       │
│    ├─ T (W_Net_Salary) ◀─── IF actual exists, ELSE projection       │
│    ├─ AG (YT_Gross) ◀────── IF actual exists, ELSE projection       │
│    └─ AJ (Other_Inc) ◀───── SUMIFS (0 if none)                      │
│              │                                                      │
│              ▼                                                      │
│    CMP_Inflow (col AL) ◀─── L + M + T + U + AI + AJ + ...           │
│              │                                                      │
│              ▼                                                      │
│    CMP_Available → CMP_End → Inv_Excess → ... → 2042                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Formula Pattern

The integration uses `IF(COUNTIFS>0, SUMIFS, fallback)` pattern because SUMIFS returns 0 (not an error) when no match is found.

**MonthKey Construction:**
```
TEXT(B,"0000") & "-" & TEXT(A,"00")
```
Where A = Month (1-12), B = Year (2026+). Result: "2026-01"

### 10.3 Exact Formulas (Row 2)

**L2 (H_Net_Salary):**
```excel
=IF(COUNTIFS(SL_Income_Log!$B:$B,TEXT(B2,"0000")&"-"&TEXT(A2,"00"),SL_Income_Log!$C:$C,"salary",SL_Income_Log!$E:$E,"H")>0,
    SUMIFS(SL_Income_Log!$D:$D,SL_Income_Log!$B:$B,TEXT(B2,"0000")&"-"&TEXT(A2,"00"),SL_Income_Log!$C:$C,"salary",SL_Income_Log!$E:$E,"H"),
    K2*(1-Assumptions!$B$102)-Z2-Y2)
```

**T2 (W_Net_Salary):**
```excel
=IF(COUNTIFS(SL_Income_Log!$B:$B,TEXT(B2,"0000")&"-"&TEXT(A2,"00"),SL_Income_Log!$C:$C,"salary",SL_Income_Log!$E:$E,"W")>0,
    SUMIFS(SL_Income_Log!$D:$D,SL_Income_Log!$B:$B,TEXT(B2,"0000")&"-"&TEXT(A2,"00"),SL_Income_Log!$C:$C,"salary",SL_Income_Log!$E:$E,"W"),
    S2*(1-Assumptions!$B$102)-AC2-AB2)
```

**AG2 (YT_Gross):**
```excel
=IF(COUNTIFS(SL_Income_Log!$B:$B,TEXT(B2,"0000")&"-"&TEXT(A2,"00"),SL_Income_Log!$C:$C,"youtube")>0,
    SUMIFS(SL_Income_Log!$D:$D,SL_Income_Log!$B:$B,TEXT(B2,"0000")&"-"&TEXT(A2,"00"),SL_Income_Log!$C:$C,"youtube"),
    MIN(Assumptions!$B$49+FLOOR((ROW()-2)/6,1)*Assumptions!$B$50,Assumptions!$B$51))
```

**AJ2 (Other_Fam_Net_Inc):**
```excel
=SUMIFS(SL_Income_Log!$D:$D,SL_Income_Log!$B:$B,TEXT(B2,"0000")&"-"&TEXT(A2,"00"),SL_Income_Log!$C:$C,"other")
```

### 10.4 Integration Behavior

| Aspect | Behavior |
|--------|----------|
| **Cascade** | When actual differs from projection, delta cascades through all downstream calculations to 2042 |
| **No Match** | Falls back to projection formula (salary) or returns 0 (other income) |
| **Multiple Entries** | SUMIFS aggregates all matching entries for the month |
| **TA Hours** | NOT integrated via formula - manual override at Hard Close if needed |
| **Investment** | NOT integrated via formula - logged for audit trail only |

### 10.5 What's Automatic vs Manual

**Automatic (formula-driven):**
- H Net Salary → Discord → Model ✅
- W Net Salary → Discord → Model ✅
- YouTube Gross → Discord → Model ✅
- Other Income → Discord → Model ✅

**Manual (audit trail only):**
- TA Hours → Discord log + Manual override if needed
- Investment → Discord log + Manual override at Hard Close

---

## 11. ASSUMPTIONS REFERENCE

### 11.1 Income Parameters

| Row | Parameter | Value | Notes |
|-----|-----------|-------|-------|
| 4 | H_Base_Salary | €88,397 | 90% of total |
| 5 | H_Salary_Growth | 5% | Annual |
| 6 | H_Base_Bonus | €9,821 | 10% of total |
| 8 | H_TA_Monthly | €200 | Fixed |
| 9 | H_Bonus_TA_Rate | 35% | To Time Account |
| 58 | H_OWNSAP_Rate | 10% | Of gross |
| 15 | W_Base_Salary | €74,348 | 90% of total |
| 16 | W_Salary_Growth | 3.5% | Annual |
| 17 | W_Base_Bonus | €8,261 | 10% of total |
| 20 | W_Bonus_TA_Rate | 35% | To Time Account |

### 11.2 YouTube Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 49 | YT_Starting_Gross | €1,000 |
| 50 | YT_Growth_Per_6Mo | €1,000 |
| 51 | YT_Monthly_Cap | €20,000 |
| 52 | YT_Tax_Rate | 44.3% |

### 11.3 SAP Loan Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 64 | SAP_Loan_Total | €52,500 |
| 65 | SAP_Monthly_Pmt | €583.33 |
| 66 | SAP_End_Month | 120 (Jun 2033) |

### 11.4 Mortgage Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 32 | Mort_Interest_Rate | 3.89% |
| 33 | Mort_Monthly_Pmt | €2,281 |
| 34 | Mort_Max_Sondertilgung | €21,550 |
| 37 | Mort_Starting_Balance | €397,546 |

### 11.5 Expense Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 86 | Buffer | €100 |
| 87 | Total_Monthly_Budget | =SUM(B70:B86) ≈ €4,110 |
| 88 | Lifestyle_Inflation | 3% |

### 11.6 Investment Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 41 | Inv_Starting_Balance | €12,000 |
| 42 | Inv_Annual_Return | 8.5% |
| 44 | Inv_Tax_Rate | 18.4625% |

### 11.7 Target Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 91 | Cashpile_Target_Phase1 | €5,000 |
| 92 | Cashpile_Target_Phase2 | €15,000 |
| 93 | CMP_Cap | €10,000 |
| 94 | Max_Monthly_Deficit | -€1,000 |
| 98 | Cashpile_Allocation_Rate | 20% |

### 11.8 Debt Minimum Payments

| Row | Parameter | Value |
|-----|-----------|-------|
| 108 | TF_Card_Minimum | €300 |
| 113 | Klarna_Minimum | €200 |
| 114 | Nordea_Minimum | €100 |
| 115 | Aktia_Minimum | €30 |

### 11.9 Tax Rates

| Row | Parameter | Value |
|-----|-----------|-------|
| 102 | Salary_Tax_Effective | 40% |
| 103 | RSU_Tax | 44.3% |
| 104 | YouTube_Tax | 44.3% |
| 105 | Investment_Gains_Tax | 18.4625% |

---

## 12. KEY FORMULAS EXPLAINED

### 12.1 Net Salary Formula (Projection)

```
H_Net_Salary = H_Taxable × (1 - Tax_Rate) - H_SAPLoan_Pmt - H_SAP_TaxedAdv
             = K × 0.6 - Z - Y
```

### 12.2 Sondertilgung Trigger Formula

```excel
=IF(AND(
    (AV{prev}+AX{prev}+AZ{prev}+BB{prev}+BD{prev})<5,  -- High-APR cleared
    BV{prev}>=20000,                                    -- Investment baseline
    BY{prev}>=5000,                                     -- Cashpile baseline
    SUMIF(B$2:B{prev},B{row},AS$2:AS{prev})=0,         -- Not paid this year
    AO{row}>0,                                          -- Mortgage exists
    (MAX(0,AN-AP-BE-BO-BP-10000)                        -- CMP excess
     +MAX(0,BV{prev}-20000)                             -- Investment excess
     +MAX(0,BY{prev}-5000))>=21550                      -- Cashpile excess
), 21550, 0)
```

### 12.3 Investment Excess with Sondertilgung Funding

```excel
=IF(AS{row}>0,
    -- Sondertilgung case: CMP overflow minus amount sold from Investment
    MAX(0,AN-AP-BE-BO-BP-AS-10000)
    - MAX(0, AS - MAX(0,AN-AP-BE-BO-BP-10000) - MAX(0,BY{prev}-5000)),
    -- Normal case: just CMP overflow
    MAX(0,AN-AP-BE-BO-BP-10000)
)
```

### 12.4 YT Tax Reserve Yearly Reset

```excel
TaxRes_Beg = IF(A{row}=1, 0, CB{row-1})
```

---

## 13. FINANCIAL PROJECTIONS

### 13.1 Key Milestones

| Date | Event |
|------|-------|
| Mar 2026 | ALL High-APR debt cleared |
| Apr 2026 | N26 Overdraft paid off |
| Apr 2027 | C3 Family Loan paid off |
| May 2027 | First Sondertilgung (€21,550) |
| Jul 2027 | IKEA Card paid off |
| Aug 2027 | Revolut Loan paid off |
| Jul 2030 | Student Loan paid off |
| Jun 2033 | Mortgage + SAP Loan maturity |
| Jul 2033 | Balloon payment (~€143,522) |
| Dec 2042 | Simulation end |

### 13.2 Net Worth Trajectory

| Date | CMP | Mortgage | Investment | Cashpile | Net Worth |
|------|-----|----------|------------|----------|-----------|
| Jan 2026 | ~€0 | €396,554 | €12,000 | €0 | ~€114,000 |
| Dec 2026 | €10,000 | €381,000 | €35,000 | €10,000 | ~€205,000 |
| Dec 2027 | €10,000 | €345,000 | €55,000 | €10,000 | ~€269,000 |
| Dec 2030 | €10,000 | €225,000 | €280,000 | €10,000 | ~€640,000 |
| Jun 2033 | €10,000 | €0 | €900,000 | €10,000 | ~€1,500,000 |
| Dec 2042 | €10,000 | €0 | €5,400,000 | €10,000 | ~€5,440,000 |

---

## 14. VALIDATION CHECKPOINTS

| Checkpoint | Expected Value |
|------------|----------------|
| Jan 2026 H_Gross_Salary | €7,366.42 |
| Jan 2026 W_Gross_Salary | €6,195.67 |
| Jan 2026 H_Net_Salary | ~€3,487 |
| Jan 2026 W_Net_Salary | ~€2,855 |
| Jan 2026 SAP_Loan_Pmt | €583.34 |
| Jan 2026 H_SAP_TaxedAdv | €78.75 |
| Jan 2026 Expenses | €4,110 |
| Apr 2026 H_Gross_Bonus | €9,821 |
| Apr 2026 Month_Type | FAT_BONUS |
| May 2027 Sondertilgung | €21,550 |
| Jan 2027 TaxRes_Beg | €0 (reset) |
| Jun 2033 Mort_End | €0 |
| Jun 2033 SAP_Loan_Bal | €0 |
| Jul 2033 Balloon | €143,522 |
| Debt Minimums | Klarna €200, Nordea €100, Aktia €30 |

---

## 15. ARCHITECTURAL DECISIONS

### ADR-017: Actual vs Projected Income Pattern
- **Decision:** Monthly_Model_v4 formulas check SL_Income_Log for actuals before using projection
- **Pattern:** `=IF(COUNTIFS(...)>0, SUMIFS(...), [PROJECTION_FORMULA])`
- **Behavior:** Actual replaces projection for that specific month only; future months unaffected

### ADR-018: Cascade Through 2042
- **Decision:** When actual income differs from projection, the delta cascades through all downstream calculations
- **Impact chain:** Income → CMP_Inflow → CMP_End → Investment/Cashpile allocation → Net Worth
- **Rationale:** Desired behavior for accurate long-term modeling

### ADR-019: YouTube Input is GROSS, Net Calculated
- **Decision:** User inputs YouTube GROSS via Discord; YT_Tax_Res and YT_Net formulas remain unchanged
- **Rationale:** AdSense shows gross; tax reserve (44.3%) is a known formula

### ADR-030: IF(COUNTIFS>0) Pattern Over IFERROR
- **Decision:** Use `IF(COUNTIFS(...)>0, SUMIFS(...), fallback)` instead of `IFERROR(SUMIFS(...), fallback)`
- **Rationale:** SUMIFS returns 0 (not an error) when no match is found

### ADR-031: Direct Formula Integration for 4 Income Columns
- **Decision:** Columns L, T, AG, AJ pull actuals from SL_Income_Log with projection fallback
- **Rationale:** Automatic integration eliminates manual override for routine income

### ADR-032: Exclude TA Hours from Formula Integration
- **Decision:** Do NOT modify columns CC (H_TA_Hrs) and CD (W_TA_Hrs)
- **Rationale:** TA columns store CUMULATIVE balance, but `!ta` logs MONTHLY delta; complexity not worth the effort

### ADR-033: Other_Fam_Net_Inc Uses Simple SUMIFS
- **Decision:** Column AJ uses plain `SUMIFS()` without IF/COUNTIFS wrapper
- **Rationale:** Zero is the correct value when no "other" income exists

### ADR-034: MonthKey Construction
- **Decision:** Construct MonthKey as `TEXT(B,"0000")&"-"&TEXT(A,"00")` to match SL_Income_Log format
- **Rationale:** Monthly_Model_v4 uses Column A = Month (1-12), Column B = Year (2026+)

---

## 16. VERSION HISTORY

### v6.2.0 (2025-12-28 23:15 UTC+2)
- **NEW: ShadowLedger Integration section** - Documents SL_Income_Log formula integration
- **NEW: Architectural Decisions section** - ADR-017 through ADR-034
- **FIX: YouTube Growth** - Corrected to €1,000/6mo (was €100/6mo)
- **FIX: Debt Minimums** - Klarna €200, Nordea €100, Aktia €30
- **FIX: Sondertilgung Table** - Added May 2027, corrected balloon to €143,522
- **FIX: Column Count** - Header now correctly shows 88 columns
- **FIX: Workbook Structure** - Added SL integration sheets with cross-reference
- **Consolidated:** Absorbed all changelogs into unified document

### v6.1.2 (2025-12-28 UTC+1)
- Documentation sync with xlsx source of truth
- Column count corrected to 88
- Cashpile_Target_Phase2 corrected to €15,000
- Budget corrected to €4,110 with €100 buffer
- First Sondertilgung corrected to May 2027
- Debt minimums corrected
- Assumptions row references updated

### v6.1.1 (2025-12-16 08:00 UTC+1)
- Sondertilgung 1x/year fix
- Separate salary modifiers (H/W)
- 2033 balloon handling

### v6.1.0 (2025-12-16 07:30 UTC+1)
- Debt minimums enforcement
- CMP negative floor (-€1,000)
- Salary_Schedule modifier column
- Time Account dynamic hourly rate
- SAP deductions POST-tax correction
- Mortgage maturity at month 90
- Balloon payment funding logic
- Cashpile target raised to €15,000
- Other_Fam_Net_Inc column added
- Column count: 88

### v6.0.0 (2025-12-15 21:25 UTC+1)
- Sondertilgung logic overhaul
- Column restructure
- Scalable/AK visibility columns
- D_Fixed_Total updated
- Consolidated documentation

### v5.0.0 (2025-12-15)
- Salary restructure to 90% fixed / 10% bonus
- SAP Loan split 50/50 with taxed advantage tracking
- Wife's Bonus TA rate increased to 35%
- Expenses increased by €250
- YT Tax Reserve yearly reset
- Salary_Schedule sheet with growth
- Added AK Payback to Debt_Register

### v4.0.0 (December 2025)
- POT system architecture
- Debt_Register sheet
- High-APR attack strategy
- Sondertilgung implementation
- 77 columns in Monthly_Model_v4

---

**END OF STANDARD FINANCE GUIDE v6.2.0**

*Last Updated: 2025-12-28 23:15:00 UTC+2*
*Status: Production*
*Next Review: After implementing additional income types*
