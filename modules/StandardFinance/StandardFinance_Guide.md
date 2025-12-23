# Aaron Family Standard Finance Guide

**Version:** 6.1.1  
**Last Updated:** 2025-12-16 08:00 UTC+1  
**Simulation Period:** January 2026 - December 2042 (204 months)  
**Associated File:** `FinanceSource_v6.1.xlsx`

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Workbook Structure](#workbook-structure)
3. [Money Flow Architecture](#money-flow-architecture)
4. [Income Structure](#income-structure)
5. [Debt Management](#debt-management)
6. [The POT System](#the-pot-system)
7. [Sondertilgung (Extra Mortgage Payments)](#sondertilgung)
8. [Investment Strategy](#investment-strategy)
9. [Monthly Model Column Reference](#monthly-model-column-reference)
10. [Assumptions Reference](#assumptions-reference)
11. [Key Formulas Explained](#key-formulas-explained)
12. [Financial Projections](#financial-projections)
13. [Validation Checkpoints](#validation-checkpoints)
14. [Version History](#version-history)

---

## OVERVIEW

This guide documents the Aaron Family's comprehensive 17-year financial simulation model. The model tracks all income sources, debt obligations, investments, and net worth from January 2026 through December 2042.

### Key Principles

1. **Central Master Pot (CMP) Architecture**: All money flows through a single hub
2. **Avalanche Debt Strategy**: Attack highest-APR debt first
3. **Baseline Protection**: Maintain minimum balances before discretionary spending
4. **Opportunistic Sondertilgung**: Make extra mortgage payments when conditions allow
5. **Salary Timing Rule**: Income earned in Month X is available in Month X+1

### Family Context

- **Location**: Baden-Württemberg, Germany
- **Employment**: Both spouses work at SAP SE (SuccessFactors division)
- **Housing**: Owner-occupied home with mortgage maturing June 2033
- **Child**: One son (AK)

---

## WORKBOOK STRUCTURE

| Sheet | Purpose | Status |
|-------|---------|--------|
| `Assumptions` | All configurable parameters (~90 values) | **Active** |
| `RSU_Schedule` | RSU vesting reference by quarter | Active |
| `Salary_Schedule` | Monthly salary/bonus with growth projections | **New in v6** |
| `Debt_Register` | All 14 debts with details | Active |
| `Monthly_Model_v4` | Main 204-row simulation (87 columns) | **Active - USE THIS** |

### Deprecated Sheets
- `Monthly_Model` - Original version
- `Monthly_Model_v2` - Previous iteration

---

## MONEY FLOW ARCHITECTURE

### The Critical Salary Timing Rule

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

### Money Flow Diagram

```
+========================================================================+
|                           MONEY FLOW v6.1                              |
+========================================================================+

                     GROSS INCOME (Month X-1)
                (Salaries + Bonus + RSU + YouTube)
                Received end of Month X-1
                Available in Month X
                               |
                               v
                +------------------------------+
                |     PRE-TAX DEDUCTIONS       |
                |  * Time Account (EUR400/mo)  |
                |  * OWNSAP (~EUR1,356/mo)     |
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
                |  * SAP Loan (EUR583/mo) auto |
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
|  Separate acct  |                        |  Cap: EUR10,000     |
|  Resets yearly  |                        |  Can go negative    |
+-----------------+                        |  (to -EUR1,000 max) |
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
|  EUR2,281/mo    |  |                 |  |  EUR4,090 base  |
|  Until Jun 2033 |  |  High-APR first |  |  +3%/yr inflate |
|                 |  |  Then fixed     |  |                 |
|  Sondertilgung: |  |                 |  |  2027: EUR4,213 |
|  When possible  |  |  SAP Loan auto  |  |  2030: EUR4,602 |
|  EUR21,550/yr   |  |                 |  |  2042: EUR6,560 |
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
|                 |  |  Target: EUR10K |  |  OWNSAP contrib |
|  EUR21,550/year |  |                 |  |  8.5%/yr growth |
+-----------------+  +-----------------+  +-----------------+
```

---

## INCOME STRUCTURE

### Salary Structure (v6 Update: 90% Fixed / 10% Bonus)

| Person | Fixed Salary 2026 | Bonus 2026 | Total 2026 | Growth Rate |
|--------|-------------------|------------|------------|-------------|
| Husband | €88,397 | €9,821 | €98,218 | 5.0% annually |
| Wife | €74,348 | €8,261 | €82,609 | 3.5% annually |

**Monthly breakdown (2026):**
- H Fixed Monthly: €7,366.42
- W Fixed Monthly: €6,195.67
- Bonuses paid in March, available in April

### Salary_Schedule Sheet

The `Salary_Schedule` sheet contains pre-calculated monthly values with growth applied:

| Column | Description |
|--------|-------------|
| A | Year (2026-2042) |
| B | Month (1-12) |
| C | **H_Salary_Modifier** (default 0%, applies to husband's salary+bonus) |
| D | **W_Salary_Modifier** (default 0%, applies to wife's salary+bonus) |
| E | H_Fixed_Monthly (base × growth × (1+H_modifier)) |
| F | H_Bonus (in April rows only) |
| G | W_Fixed_Monthly (base × growth × (1+W_modifier)) |
| H | W_Bonus (in April rows only) |
| I | Notes (for manual annotations) |

**To give a raise**: Change the modifier in column C (husband) or D (wife). For example:
- Set C50 = 0.10 to give husband a 10% raise starting that month
- Set D50 = 0.15 to give wife a 15% raise starting that month
- Modifiers are independent - you can adjust each spouse separately

### Time Account Contributions

| Person | Monthly TA | Bonus TA Rate |
|--------|------------|---------------|
| Husband | €200/month | 35% of bonus |
| Wife | €200/month | 35% of bonus |

**Hourly Rate Calculation** (v6.1 update):
- Hourly rate = Annual FIXED salary / 208 working days
- Rate updates dynamically based on Salary_Schedule
- Example (2026): EUR88,397 / 208 = EUR425.0/day ~ EUR53.13/hour

Time Account hours accumulate and can be cashed out (tracked in NW_TA).

### RSU (Restricted Stock Units)

| Person | Annual Grant | Vesting Schedule |
|--------|--------------|------------------|
| Husband | €20,000 | Quarterly (Mar, Jun, Sep, Dec) |
| Wife | €10,000 | Quarterly (Mar, Jun, Sep, Dec) |

RSUs vest at end of quarter, available the following month.

### OWNSAP (Employee Stock Purchase Plan)

- **Deduction Rate**: 10% of gross salary
- **Value Multiplier**: Deduction × 1.4 + €20
- **Handling**:
  - During High-APR debt attack: SOLD immediately, proceeds to CMP
  - After High-APR cleared: Goes directly to Investment

### YouTube Income

| Parameter | Value |
|-----------|-------|
| Starting (Dec 2025) | €1,000/month gross |
| Growth | €100 every 6 months |
| Cap | €2,000/month |
| Tax Reserve | 44.3% (set aside, not spent) |
| Net to CMP | ~€557/month initially |

**Tax Reserve Reset**: Resets to €0 at the beginning of each year (January).

### SAP Loan (v6 Update: Split 50/50 with Taxed Advantage)

| Parameter | Husband | Wife | Total |
|-----------|---------|------|-------|
| Starting Balance | €26,250 | €26,250 | €52,500 |
| Monthly Payment | €291.67 | €291.67 | €583.34 |
| End Date | Jun 2033 | Jun 2033 | Jun 2033 |
| Interest Rate | 0% | 0% | 0% |
| Taxed Advantage | 0.3%/mo on prev balance | 0.3%/mo on prev balance | ~€157.50/mo initially |

**Note**: The SAP Loan is interest-free, but the benefit is taxed as income. The "Taxed Advantage" is deducted from net salary.

---

## DEBT MANAGEMENT

### Debt Register Overview

| # | Debt | Owner | Balance | APR | Monthly | Type | Priority |
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

### Debt Attack Strategy (Avalanche Method)

**Phase 1: High-APR Attack (Jan-Apr 2026)**

1. Pay **minimum payments** on all high-APR debts FIRST:
   - Klarna: €250/mo minimum
   - Nordea: €200/mo minimum
   - Aktia: €50/mo minimum
   - TF: €300/mo minimum
   - DB: €0/mo minimum (no minimum required)

2. Direct ALL remaining excess to highest-APR debt (TF first)
3. When one debt cleared, attack next highest APR
4. OWNSAP is SOLD during this phase
5. CMP can go negative up to -€1,000 if needed

**Attack Order**: TF -> DB -> Klarna -> Nordea -> Aktia

**Expected Clearance**:
- TF: April 2026
- DB: July 2026
- Klarna: August 2026
- Aktia: September 2026
- Nordea: October 2026

### Fixed Payment Loans

These loans have set payment schedules - let them run:

| Loan | End Date | Total Paid |
|------|----------|------------|
| N26 Overdraft | Apr 2026 | €360 |
| C3 Family | Apr 2027 | €10,000 |
| IKEA Card | Jul 2027 | €2,500 |
| Revolut | Aug 2027 | €12,350 |
| Student Loan | Jul 2030 | €11,000 |
| SAP Loan | Jun 2033 | €52,500 |

### Low-APR Debt Strategy

**Scalable Credit (€5,500 @ 3.3%)**: Leave open, invest instead. The expected investment return (8.5%) exceeds the interest cost.

**AK Payback (€5,000 @ 0%)**: Future repayment to son's account. No current payment schedule - tracked for visibility.

---

## THE POT SYSTEM

### Central Master Pot (CMP) Rules

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

**Rule 2**: CMP pays out in priority order
1. Mortgage payment (€2,281/mo)
2. Sondertilgung (if conditions met)
3. High-APR debt payments
4. Fixed loan payments
5. Expenses

**Rule 3**: CMP is capped at €10,000
- Excess above cap flows to Investment and Cashpile
- 20% to Cashpile (until €10,000 target)
- 80% to Investment

**Rule 4**: CMP can go negative (controlled)
- Minimum: -€1,000 (hard floor)
- Jan-Mar 2026: May go negative during debt attack
- Fat months replenish

### Cashpile Rules

| Phase | Target | Priority |
|-------|--------|----------|
| Phase 1 | €5,000 | Build first |
| Phase 2 | €15,000 | Build to full |
| Maintenance | €15,000 | Maintain |

- Receives 20% of CMP excess (after debts paid)
- Once at €15,000, no further contributions
- Can be drawn for Sondertilgung/Balloon funding (down to €5,000 baseline)

### Investment Account Rules

**Inflows**:
- OWNSAP contributions (after High-APR cleared)
- CMP overflow (excess above €10K cap)
- 80% of monthly excess

**Outflows**:
- Sondertilgung funding (sell if needed)
- Balloon payment in Jun 2033

**Growth**: 8.5% annual return (0.68% monthly)

---

## SONDERTILGUNG

### What is Sondertilgung?

Sondertilgung = Extra principal payment on the mortgage, allowed once per year up to €21,550.

### v6 Funding Logic (UPDATED)

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

### Sondertilgung Schedule (Projected)

| Year | Month | Amount | Type |
|------|-------|--------|------|
| 2028 | January | €21,550 | Regular |
| 2029 | January | €21,550 | Regular |
| 2030 | January | €21,550 | Regular |
| 2031 | January | €21,550 | Regular |
| 2032 | January | €21,550 | Regular |
| 2033 | July | ~€170,815 | **Balloon** |

**Note:** No regular Sondertilgung in 2033 (balloon year). Total extra principal: ~€278,565

---

## INVESTMENT STRATEGY

### Asset Allocation

All investments are in a single growth portfolio:
- Expected annual return: 8.5%
- Tax on gains: 18.4625%

### OWNSAP Handling

| Phase | Action |
|-------|--------|
| High-APR Attack | SELL immediately -> CMP |
| After Attack | Hold -> Investment account |

### Balloon Payment (July 2033)

When the mortgage matures at end of June 2033 (month 90), the remaining balance is paid in July 2033 (month 91):

**Funding Sources** (in order):
1. CMP excess (amount over €10,000 baseline)
2. Cashpile (amount over €5,000 baseline)
3. Sell from Investment (whatever remains)

**Expected Balloon**: ~€122,000
**Expected Investment sell-off**: ~€90,000

After the balloon payment:
- Mortgage = €0
- SAP Loan also ends (last payment in Jun 2033)
- ~€2,864/month freed up (Mort + SAP payments)
- All excess flows directly to Investment

---

## MONTHLY MODEL COLUMN REFERENCE

### Complete Column Mapping (87 Columns)

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
| 12 | L | H_Net_Salary | Taxable × 0.6 - SAP_Pmt - SAP_TaxedAdv |
| 13 | M | H_RSU_Net | Previous month's RSU vest |
| **Wife Income** ||||
| 14 | N | W_Gross_Salary | From Salary_Schedule |
| 15 | O | W_TA_Ded | €200/month to Time Account |
| 16 | P | W_OWNSAP_Ded | Gross × 10% |
| 17 | Q | W_Gross_Bonus | From Salary_Schedule (April) |
| 18 | R | W_Bonus_TA | Bonus × 35% |
| 19 | S | W_Taxable | Gross - TA - OWNSAP + Bonus - Bonus_TA |
| 20 | T | W_Net_Salary | Taxable × 0.6 - SAP_Pmt - SAP_TaxedAdv |
| 21 | U | W_RSU_Net | Previous month's RSU vest |
| **OWNSAP** ||||
| 22 | V | H_OWNSAP_Val | Deduction × 1.4 + €20 |
| 23 | W | W_OWNSAP_Val | Deduction × 1.4 + €20 |
| 24 | X | OWNSAP_Total | V + W |
| **SAP Loan Detail (v6)** ||||
| 25 | Y | H_SAP_TaxedAdv | 0.3% × previous balance |
| 26 | Z | H_SAPLoan_Pmt | €291.67 for 90 months |
| 27 | AA | H_SAPLoan_Bal | €26,250 decreasing |
| 28 | AB | W_SAP_TaxedAdv | 0.3% × previous balance |
| 29 | AC | W_SAPLoan_Pmt | €291.67 for 90 months |
| 30 | AD | W_SAPLoan_Bal | €26,250 decreasing |
| 31 | AE | SAP_Loan_Pmt | Total: Z + AC |
| 32 | AF | SAP_Loan_Bal | Total: AA + AD |
| **YouTube** ||||
| 33 | AG | YT_Gross | MIN(base + growth, cap) |
| 34 | AH | YT_Tax_Res | Gross × 44.3% |
| 35 | AI | YT_Net | Gross - Tax Reserve |
| **Other Income (v6.1)** ||||
| 36 | AJ | Other_Fam_Net_Inc | Occasional family income (no tax reserve) |
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
| 49 | AW | D_Klarna_Pmt | Klarna payment (min €250) |
| 50 | AX | D_Klarna_Bal | Klarna balance |
| 51 | AY | D_Nordea_Pmt | Nordea payment (min €200) |
| 52 | AZ | D_Nordea_Bal | Nordea balance |
| 53 | BA | D_DB_Pmt | DB Overdraft payment |
| 54 | BB | D_DB_Bal | DB Overdraft balance |
| 55 | BC | D_Aktia_Pmt | Aktia payment (min €50) |
| 56 | BD | D_Aktia_Bal | Aktia balance |
| 57 | BE | D_HighAPR_Total | Sum of High-APR payments |
| **Low-APR/Future Debt (v6)** ||||
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
| 69 | BQ | Exp_Alloc | = Budget |
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

## ASSUMPTIONS REFERENCE

### Income Parameters

| Row | Parameter | Value | Notes |
|-----|-----------|-------|-------|
| 4 | H_Base_Salary | €88,397 | 90% of total |
| 5 | H_Salary_Growth | 5% | Annual |
| 6 | H_Base_Bonus | €9,821 | 10% of total |
| 9 | H_Bonus_TA_Rate | 35% | To Time Account |
| 10 | H_TA_Monthly | €200 | Fixed |
| 11 | H_OWNSAP_Rate | 10% | Of gross |
| 15 | W_Base_Salary | €74,348 | 90% of total |
| 16 | W_Salary_Growth | 3.5% | Annual |
| 17 | W_Base_Bonus | €8,261 | 10% of total |
| 20 | W_Bonus_TA_Rate | 35% | To Time Account |

### SAP Loan Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 30 | SAP_Loan_Total | €52,500 |
| 31 | SAP_Monthly_Pmt | €583.34 |
| 32 | SAP_Benefit_Rate | 0.3%/month |
| 33 | SAP_End_Month | 90 (Jun 2033) |

### Mortgage Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 32 | Mort_Interest_Rate | 3.89% |
| 33 | Mort_Monthly_Pmt | €2,281 |
| 34 | Mort_Max_Sondertilgung | €21,550 |
| 37 | Mort_Starting_Balance | €397,546 |

### Expense Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 80 | Buffer | €450 |
| 81 | Total_Monthly_Budget | €4,090 |
| 82 | Lifestyle_Inflation | 3% |

### Investment Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 41 | Inv_Starting_Balance | €12,000 |
| 43 | Inv_Annual_Return | 8.5% |
| 44 | Inv_Tax_Rate | 18.4625% |

### Target Parameters

| Row | Parameter | Value |
|-----|-----------|-------|
| 85 | Cashpile_Target_Phase1 | €5,000 |
| 86 | Cashpile_Target_Phase2 | €10,000 |
| 87 | CMP_Cap | €10,000 |
| 92 | Cashpile_Allocation_Rate | 20% |

---

## KEY FORMULAS EXPLAINED

### Net Salary Formula

```
H_Net_Salary = H_Taxable × (1 - Tax_Rate) - H_SAPLoan_Pmt - H_SAP_TaxedAdv
             = K × 0.6 - Z - Y
```

### Sondertilgung Trigger Formula

```excel
=IF(AND(
    (AU{prev}+AW{prev}+AY{prev}+BA{prev}+BC{prev})<5,  -- High-APR cleared
    BU{prev}>=20000,                                    -- Investment baseline
    BX{prev}>=5000,                                     -- Cashpile baseline
    SUMIF(B$2:B{prev},B{row},AR$2:AR{prev})=0,         -- Not paid this year
    AN{row}>0,                                          -- Mortgage exists
    (MAX(0,AL-AO-BD-BN-BP-10000)                        -- CMP excess
     +MAX(0,BU{prev}-20000)                             -- Investment excess
     +MAX(0,BX{prev}-5000))>=21550                      -- Cashpile excess
), 21550, 0)
```

### Investment Excess with Sondertilgung Funding

```excel
=IF(AR{row}>0,
    -- Sondertilgung case: CMP overflow minus amount sold from Investment
    MAX(0,AL-AO-BD-BN-BP-AR-10000)
    - MAX(0, AR - MAX(0,AL-AO-BD-BN-BP-10000) - MAX(0,BX{prev}-5000)),
    -- Normal case: just CMP overflow
    MAX(0,AL-AO-BD-BN-BP-10000)
)
```

### YT Tax Reserve Yearly Reset

```excel
TaxRes_Beg = IF(A{row}=1, 0, CA{row-1})
```

---

## FINANCIAL PROJECTIONS

### Key Milestones

| Date | Event |
|------|-------|
| Mar 2026 | ALL High-APR debt cleared |
| Apr 2026 | N26 Overdraft paid off |
| Apr 2027 | First Sondertilgung (€21,550) |
| Apr 2027 | C3 Family Loan paid off |
| Jul 2027 | IKEA Card paid off |
| Aug 2027 | Revolut Loan paid off |
| Jul 2030 | Student Loan paid off |
| Jun 2033 | Mortgage + SAP Loan maturity |
| Dec 2042 | Simulation end |

### Net Worth Trajectory

| Date | CMP | Mortgage | Investment | Cashpile | Net Worth |
|------|-----|----------|------------|----------|-----------|
| Jan 2026 | ~€0 | €396,554 | €12,000 | €0 | ~€114,000 |
| Dec 2026 | €10,000 | €381,000 | €35,000 | €10,000 | ~€205,000 |
| Dec 2027 | €10,000 | €345,000 | €55,000 | €10,000 | ~€269,000 |
| Dec 2030 | €10,000 | €225,000 | €280,000 | €10,000 | ~€640,000 |
| Jun 2033 | €10,000 | €0 | €900,000 | €10,000 | ~€1,500,000 |
| Dec 2042 | €10,000 | €0 | €5,400,000 | €10,000 | ~€5,440,000 |

---

## VALIDATION CHECKPOINTS

| Checkpoint | Expected Value |
|------------|----------------|
| Jan 2026 H_Gross_Salary | €7,366.42 |
| Jan 2026 W_Gross_Salary | €6,195.67 |
| Jan 2026 H_Net_Salary | ~€3,487 |
| Jan 2026 W_Net_Salary | ~€2,855 |
| Jan 2026 SAP_Loan_Pmt | €583.34 |
| Jan 2026 H_SAP_TaxedAdv | €78.75 |
| Jan 2026 Expenses | €4,090 |
| Apr 2026 H_Gross_Bonus | €9,821 |
| Apr 2026 Month_Type | FAT_BONUS |
| Apr 2027 Sondertilgung | €21,550 |
| Jan 2027 TaxRes_Beg | €0 (reset) |
| Jun 2033 Mort_End | €0 |
| Jun 2033 SAP_Loan_Bal | €0 |
| D_Fixed_Total includes | Scalable + AK + Revolut + C3 + Student + IKEA + N26 |

---

## VERSION HISTORY

### v6.1.1 (2025-12-16 08:00 UTC+1)
- **Sondertilgung 1x/year fix**: Now strictly enforces max 1 payment per calendar year
- **Separate salary modifiers**: H_Salary_Modifier (col C) and W_Salary_Modifier (col D)
- **2033 balloon handling**: No regular Sondertilgung in balloon year
- **Sondertilgung schedule**: 5 regular (2028-2032) + 1 balloon (Jul 2033)

### v6.1.0 (2025-12-16 07:30 UTC+1)
- **Debt minimums**: Klarna €250, Nordea €200, Aktia €50 enforced during attack
- **CMP negative floor**: Can go to -€1,000 (was €0)
- **Salary_Schedule modifier**: Added column for easy raise adjustments
- **Time Account hourly rate**: Now dynamic = Salary / 208 days
- **SAP deductions**: Corrected documentation - these are POST-tax
- **Mortgage maturity**: Stops at month 90 (Jun 2033), balloon in month 91 (Jul 2033)
- **Balloon payment**: Funded from CMP excess -> Cashpile excess -> Investment
- **Cashpile target**: Raised Phase 2 to €15,000
- **Other_Fam_Net_Inc**: New column AJ for occasional family income
- **Column count**: Now 88 columns (was 87)

### v6.0.0 (2025-12-15 21:25 UTC+1)
- **Sondertilgung logic overhaul**: Now correctly funds from CMP excess + Investment excess + Cashpile excess
- **Column restructure**: SAP detail columns moved after OWNSAP (cols 25-32)
- **Scalable/AK visibility**: Added columns 57-60 for tracking
- **D_Fixed_Total updated**: Now includes Scalable_Pmt and AK_Pmt
- **Consolidated documentation**: Merged all guides into single Standard Finance Guide

### v5.0.0 (2025-12-15)
- Salary restructure to 90% fixed / 10% bonus
- SAP Loan split 50/50 with taxed advantage tracking
- Wife's Bonus TA rate increased to 35%
- Expenses increased by €250 (buffer €450)
- YT Tax Reserve yearly reset
- Bonus_TA formula bug fix
- Salary_Schedule sheet with growth
- Added AK Payback to Debt_Register

### v4.0.0 (December 2025)
- POT system architecture
- Debt_Register sheet
- High-APR attack strategy
- Sondertilgung implementation
- 77 columns in Monthly_Model_v4

---

*End of Standard Finance Guide v6.1.0*
