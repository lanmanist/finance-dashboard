# Aaron Family Finance System - Roadmap

**Version:** 3.0  
**Last Updated:** December 29, 2025  
**Status:** Active Development

---

## OVERVIEW

This roadmap consolidates planned features across all modules plus system-wide improvements. Updated to reflect v2.2.0 (ShadowLedger), v3.1 (Dashboard), and v6.1 (StandardFinance) completion.

### Priority Legend
- 🔴 **Critical** - Do immediately
- 🟠 **High** - Next sprint
- 🟡 **Medium** - This quarter
- 🟢 **Low** - Future consideration
- 💡 **Idea** - Not yet planned

### Status Legend
- ✅ Complete
- 🚧 In Progress
- 📋 Planned
- 💡 Idea

---

## RECENTLY COMPLETED ✅

### December 2025 Achievements

| Date | Module | Feature | Version |
|------|--------|---------|---------|
| Dec 28 | ShadowLedger | Investment tracking (!invest, !invest status) | v2.2.0 |
| Dec 28 | ShadowLedger | SL_Investment_Log sheet with destinations | v2.2.0 |
| Dec 28 | Dashboard | Expanded expense view with 17 categories | v3.1 |
| Dec 28 | Dashboard | Loading overlay and refresh spinner | v3.1 |
| Dec 28 | Dashboard | Category color scheme (purple gradient) | v3.1 |
| Dec 27 | ShadowLedger | Income tracking (!income, !ta commands) | v2.1.0 |
| Dec 27 | ShadowLedger | Automated income reminders | v2.1.0 |
| Dec 27 | ShadowLedger | SL_Income_Log sheet | v2.1.0 |
| Dec 26 | Dashboard | Expense click modal with budget bars | v3.0 |
| Dec 26 | Dashboard | Debt detail modals (High-APR, Low-APR, Fixed, SAP) | v3.0 |
| Dec 26 | Dashboard | 88-column v6.1 model support | v3.0 |
| Dec 25 | **Integration** | ShadowLedger → Exp_Alloc SUMIFS link | - |
| Dec 25 | **Integration** | SL_Income_Log → Monthly_Model VLOOKUP | - |
| Dec 24 | ShadowLedger | Cloudflare + Render.com migration | v2.0 |
| Dec 23 | StandardFinance | v6.1 with 88 columns | v6.1 |
| Dec 22 | ShadowLedger | v2.0 Full MVP (9 features) | v2.0 |

---

## FEATURE COMPLETION SUMMARY

### ShadowLedger v2.2.0 (16 Features Complete)

| # | Feature | Version | Status |
|---|---------|---------|--------|
| 1 | Extended spender aliases (h/w/husband/wife/nha/anh/aaron/trang/chang/em) | v2.0 | ✅ |
| 2 | Multi-transaction per message (batch logging) | v2.0 | ✅ |
| 3 | Enhanced !status with percentages | v2.0 | ✅ |
| 4 | !ytd command (year-to-date) | v2.0 | ✅ |
| 5 | Smart flexible input parsing (Gemini AI) | v2.0 | ✅ |
| 6 | Enhanced date parsing (yesterday, DD.MM, natural language) | v2.0 | ✅ |
| 7 | Gemini AI categorization fallback | v2.0 | ✅ |
| 8 | !budgetleft command | v2.0 | ✅ |
| 9 | !undo command with confirmation | v2.0 | ✅ |
| 10 | !income command (salary, youtube, other) | v2.1 | ✅ |
| 11 | !ta command (Time Account hours) | v2.1 | ✅ |
| 12 | !income status command | v2.1 | ✅ |
| 13 | Automated monthly income reminders | v2.1 | ✅ |
| 14 | !invest command for transfers | v2.2 | ✅ |
| 15 | !invest status command | v2.2 | ✅ |
| 16 | SL_Investment_Log with destinations | v2.2 | ✅ |

### Dashboard v3.1.0 (All v1-v3 Features Complete)

| Feature | Version | Status |
|---------|---------|--------|
| Single month view | v1.0 | ✅ |
| Full year aggregated view | v1.0 | ✅ |
| Live data from Google Sheets | v1.0 | ✅ |
| Month type badges | v1.0 | ✅ |
| Basic stat cards | v1.0 | ✅ |
| Interactive Sankey | v1.0 | ✅ |
| Multi-month range selection | v2.0 | ✅ |
| Simple/Detailed view toggle | v2.0 | ✅ |
| Enhanced stat card labels | v2.0 | ✅ |
| Rich hover insights | v2.0 | ✅ |
| API integration with ShadowLedger | v3.0 | ✅ |
| 88-column v6.1 model support | v3.0 | ✅ |
| Expense click modal | v3.0 | ✅ |
| Debt click modals | v3.0 | ✅ |
| Pre-fetch expense data | v3.0 | ✅ |
| Loading overlay | v3.1 | ✅ |
| Refresh button feedback | v3.1 | ✅ |
| Expense view toggle (Collapsed/Expanded) | v3.1 | ✅ |
| Category color scheme | v3.1 | ✅ |

### StandardFinance v6.1 (Complete)

| Feature | Status |
|---------|--------|
| 204-month simulation (Jan 2026 - Dec 2042) | ✅ |
| 88-column model | ✅ |
| POT system architecture | ✅ |
| Sondertilgung logic (€21,550/year) | ✅ |
| Salary_Schedule with modifiers | ✅ |
| Balloon payment Jul 2033 | ✅ |
| ShadowLedger expense integration | ✅ |
| Income log integration | ✅ |

---

## MODULE: SHADOWSLEDGER

### 🟠 High Priority (Q1 2026)

| # | Feature | Status | Effort | Impact | Cost | Notes |
|---|---------|--------|--------|--------|------|-------|
| 17 | **Pattern Learning** | 📋 | 5-6h | High | €0 | Auto-suggest after 5+ consistent categorizations |
| 18 | **Category Recategorization** | 📋 | 3-4h | Medium | €0 | `!recategorize last groceries` |
| 19 | **Daily Summary (21:00 CET)** | 📋 | 3-4h | High | €0 | Time-triggered summary post |
| 20 | **!month Command** | 📋 | 2h | Medium | €0 | View specific month summary |

#### Feature 17: Pattern Learning
**Problem:** Users repeatedly categorize same merchants; AI calls cost latency.  
**Solution:** Track merchant frequency; suggest pattern after 5+ consistent categorizations.  
**Implementation:**
- Query ShadowLedger for merchants with 5+ occurrences
- Calculate category consistency (>80% = suggest)
- Post suggestion via Discord: "Reply `!addpattern [merchant] [category]` to confirm"
- Add confirmed patterns to SL_Patterns

**Success Metrics:**
- Reduce AI categorization calls by 50%+
- User approval rate >90%
- Pattern growth: +10/month average

**Considerations:**
- Need to handle merchant name variations (rewe vs REWE vs Rewe Markt)
- Should store suggestion history to avoid re-suggesting rejected patterns
- Could implement auto-approval after 10+ consistent categorizations

---

#### Feature 18: Category Recategorization
**Problem:** AI sometimes miscategorizes; users want to fix without undo/redo.  
**Solution:** `!recategorize [txn_id|last] [new_category]`

**Implementation:**
- Parse transaction ID or "last" keyword
- Validate new category against CATEGORIES array
- Update ShadowLedger sheet row
- Recalculate budget status
- Post confirmation with updated budgets

**User Experience:**
```
!recategorize last groceries
✅ Recategorized
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transaction: €45.00 - Rewe
Old: Shopping → New: Groceries + Food
Budget updated: 🟢 Groceries: €320/€600 (53%)
```

---

#### Feature 19: Daily Summary
**Problem:** No proactive spending awareness; users must remember to check.  
**Solution:** Automated 21:00 CET daily summary post.

**Implementation:**
- Apps Script time-driven trigger
- Calculate: today's total, top categories, budget status
- Compare to daily average (budget / days in month)
- Post to Discord #expenses

**Output Format:**
```
📅 Daily Summary (2025-12-29)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today: €127.50 (7 transactions)
Daily Target: €132.58

Top Categories:
🟢 Groceries: €67.50
🟡 Eat Out: €45.00
🟢 Shopping: €15.00

Month Progress: Day 29/31 (94%)
Spent: €3,890/€4,110 (95%)
Status: ⚠️ Slightly over pace
```

**Considerations:**
- Skip posting if €0 spent (or make configurable)
- Different formats for weekdays vs weekends?
- Could add weekly streak tracking

---

### 🟡 Medium Priority (Q2 2026)

| # | Feature | Status | Effort | Impact | Cost | Notes |
|---|---------|--------|--------|--------|------|-------|
| 21 | **Weekly Summary (Sunday 20:00)** | 📋 | 2-3h | Medium | €0 | Week comparison |
| 22 | **Historical Data Import** | 📋 | 3-4h | High | €0 | CSV upload for past expenses |
| 23 | **Budget Adjustment Commands** | 📋 | 4-5h | Medium | €0 | `!budget groceries 700` |
| 24 | **Full Date Support** | 📋 | 2-3h | Low | €0 | `45 rewe 2025-12-15` |
| 25 | **Recurring Detection** | 📋 | 6-8h | Medium | €0 | Auto-detect subscriptions |

#### Feature 22: Historical Data Import
**Problem:** New system has no history; difficult to compare YoY.  
**Solution:** CSV import command with validation.

**Format:** `date,amount,merchant,category,spender`

**Implementation:**
- User uploads CSV to Google Drive
- `!import [file_id]` triggers preview
- `!import confirm` executes import
- Duplicate detection by date+amount+merchant

**Considerations:**
- Max import size (1000 rows?)
- Handle date format variations
- Generate txn_ids for imported rows
- Should not trigger budget recalculation per row (batch)

---

### 🟢 Future Features (2026+)

| # | Feature | Status | Effort | Cost/Month | Impact | Considerations |
|---|---------|--------|--------|------------|--------|----------------|
| 26 | **Receipt OCR** | 💡 | 8-10h | €5-10 | High | Photo → auto-parse amount/merchant |
| 27 | **Voice Input** | 💡 | 8-10h | €5-10 | Medium | Voice note → transaction |
| 28 | **Analytics Dashboard** | 💡 | 6-8h | €0 | Medium | Spending charts, trends |
| 29 | **Bank API Integration** | 💡 | 15-20h | Varies | Very High | Auto-import from N26/Revolut |
| 30 | **Email Receipt Parsing** | 💡 | 10-12h | €0 | Medium | Parse Amazon/PayPal receipts |
| 31 | **Budget Forecasting** | 💡 | 8-10h | €0 | Medium | ML-based end-of-month prediction |
| 32 | **Multi-Currency** | 💡 | 6-8h | €0 | Low | EUR/USD/SEK conversion |
| 33 | **Shared Family View** | 💡 | 6-8h | €0 | Low | Web dashboard for non-Discord users |

#### Feature 26: Receipt OCR - Deep Dive
**Tech Options:**
1. **Google Cloud Vision** - €1.50/1000 images, high accuracy
2. **Tesseract (self-hosted)** - Free, moderate accuracy
3. **Gemini Vision** - Free tier exists, good accuracy

**Implementation Path:**
1. User sends image to Discord
2. Bot detects attachment, uploads to Cloud Vision/Gemini
3. Extract: total amount, merchant name, date
4. Auto-fill expense form, ask for confirmation

**Challenges:**
- German receipt formats vary widely
- Handling partial/blurry images
- Multiple items on one receipt (grocery vs individual)

**ROI Analysis:**
- Time saved: ~30 sec/receipt × 5 receipts/week = 2.5 min/week
- Cost: ~€5/month for moderate usage
- Verdict: Nice-to-have, not critical

---

### Technical Debt

| Issue | Priority | Effort | Notes |
|-------|----------|--------|-------|
| Cache patterns in ScriptProperties | 🟠 High | 3-4h | Currently reads full sheet each time |
| Add retry logic with exponential backoff | 🟠 High | 2h | Handle transient failures |
| Code modularization | 🟡 Medium | 8-10h | Split into logical modules |
| Unit test coverage | 🟢 Low | 6-8h | Apps Script test framework |
| Rate limiting protection | 🟡 Medium | 2h | Prevent Discord spam attacks |

---

## MODULE: STANDARDFINANCE

### 🟠 High Priority

| Feature | Status | Effort | Impact | Notes |
|---------|--------|--------|--------|-------|
| **Validation Row** | 📋 | 2-3h | High | Sum checks, balance validations |
| **Named Ranges** | 📋 | 4-6h | High | Replace column letters (CMP_End vs AN) |
| **Actuals Column Overlay** | 📋 | 4-6h | High | Separate plan vs actual tracking |

#### Named Ranges - Implementation Plan
**Problem:** Code references `col[87]`; breaks when columns shift.  
**Solution:** Define named ranges in Google Sheets.

**Key Ranges to Define:**
```
CMP_End         = Monthly_Model_v4!$AN$2:$AN$205
Exp_Alloc       = Monthly_Model_v4!$BQ$2:$BQ$205
Inv_End         = Monthly_Model_v4!$BV$2:$BV$205
Net_Worth       = Monthly_Model_v4!$CJ$2:$CJ$205
Mort_End        = Monthly_Model_v4!$AT$2:$AT$205
```

**Migration Steps:**
1. Define ranges in Google Sheets (Data → Named Ranges)
2. Update getDashboardData() to use INDIRECT()
3. Update formulas to reference ranges
4. Test thoroughly before deploying

---

### 🟡 Medium Priority

| Feature | Status | Effort | Impact | Notes |
|---------|--------|--------|--------|-------|
| **Scenario Modeling** | 📋 | 6-8h | High | What-if analysis sheets |
| **Tax Calculation Helper** | 📋 | 4-6h | Medium | Annual tax estimate |
| **Inflation Adjustment Automation** | 📋 | 2h | Medium | Auto-update SL_Budget annually |
| **Variance Report Generator** | 📋 | 4-5h | High | Actual vs projected monthly |

### 🟢 Future

| Feature | Status | Effort | Notes |
|---------|--------|--------|-------|
| Multi-currency Support | 💡 | 6-8h | EUR/USD/SEK |
| Retirement Projections | 💡 | 8-12h | Post-2042 modeling |
| Monte Carlo Simulation | 💡 | 10-15h | Probability-based outcomes |

---

## MODULE: DASHBOARD

### 🟠 High Priority

| Feature | Status | Effort | Impact | Notes |
|---------|--------|--------|--------|-------|
| **Mobile Optimization** | 📋 | 4-6h | High | Touch interactions, responsive |
| **Historical Trend Charts** | 📋 | 4-6h | High | Net worth over time line chart |
| **Error Boundaries** | 📋 | 2h | Medium | Graceful failure handling |

### 🟡 Medium Priority

| Feature | Status | Effort | Impact | Notes |
|---------|--------|--------|--------|-------|
| **Scenario Comparison** | 📋 | 6-8h | Medium | Side-by-side what-if |
| **Export to PDF** | 📋 | 3-4h | Medium | Download current view |
| **Investment Performance** | 📋 | 4-5h | Medium | Portfolio breakdown chart |
| **Debt Payoff Timeline** | 📋 | 3-4h | Medium | Visual debt freedom countdown |

### 🟢 Future

| Feature | Status | Effort | Notes |
|---------|--------|--------|-------|
| PWA Support | 💡 | 4-6h | Installable app |
| Offline Mode | 💡 | 6-8h | Cache last data |
| Push Notifications | 💡 | 4-6h | Budget alerts |
| Dark/Light Theme Toggle | 💡 | 2h | User preference |

---

## MODULE: OPERATIONS

### 🟠 High Priority

| Feature | Status | Effort | Impact | Notes |
|---------|--------|--------|--------|-------|
| **Automated Backup** | 📋 | 2-3h | High | Daily snapshot to Google Drive |
| **Health Check Dashboard** | 📋 | 4-6h | High | System status at-a-glance |
| **Reconciliation Checklist Automation** | 📋 | 3-4h | Medium | Auto-track completion |

---

## NEW MODULES (PROPOSED)

### 🟠 Goals Tracker Module

**Purpose:** Visual milestones (debt-free date, €1M net worth, etc.)  
**Effort:** 8-12h  
**Cost:** €0  
**Priority:** High

**Features:**
- Define goals with target dates/amounts
- Progress visualization (progress bars, milestone markers)
- Celebration notifications when achieved
- Integration with Dashboard

**Implementation:**
1. New sheet: `Goals` (Name, Target, Current, Deadline, Type)
2. Apps Script function to calculate progress
3. Dashboard widget showing top 3 goals
4. Discord notifications on milestone achievement

**Example Goals:**
- High-APR Debt Free: Target €0, Current €15,040, Deadline Mar 2026
- Emergency Fund: Target €15,000, Current €5,000
- €1M Net Worth: Target €1,000,000, Deadline 2035

---

### 🟡 Variance Report Module

**Purpose:** Monthly actual vs planned analysis  
**Effort:** 6-8h  
**Cost:** €0  
**Priority:** Medium

**Features:**
- Auto-generate comparison report
- Highlight significant variances (>10%)
- Trend analysis over time
- Export to PDF

**Implementation:**
1. New sheet: `Variance_Reports` (Month, Category, Planned, Actual, Variance%, Note)
2. Time-triggered generation (1st of each month)
3. Discord post with summary
4. Dashboard page for detailed view

---

### 🟡 Tax Preparation Module

**Purpose:** Annual tax calculation helper  
**Effort:** 15-20h  
**Cost:** €0  
**Priority:** Medium

**Features:**
- Track deductible expenses
- Calculate estimated tax liability
- YT income tax reserve tracking
- Export-ready summary for Steuerberater

**Considerations:**
- German tax complexity (Progressionsvorbehalt, etc.)
- Integration with existing YT_TaxRes column
- Category tagging for deductibility

---

### 🟢 Family Finance Education Module

**Purpose:** Gamify savings for teaching son (AK)  
**Effort:** 10-15h  
**Cost:** €0  
**Priority:** Low

**Features:**
- Simple goals with visual rewards
- Age-appropriate explanations
- Allowance tracking
- Savings challenges

---

## SYSTEM-WIDE IMPROVEMENTS

### 🟠 High Priority

| Feature | Status | Effort | Impact | Notes |
|---------|--------|--------|--------|-------|
| **Documentation Consolidation** | ✅ | 4h | High | Completed Dec 28-29 |
| **API Versioning** | 📋 | 4-6h | Medium | `/api/v1/` prefix |
| **Config Centralization** | 📋 | 3-4h | Medium | All settings in SL_Config |

### 🟡 Medium Priority

| Feature | Status | Effort | Impact | Notes |
|---------|--------|--------|--------|-------|
| **Automated Testing** | 📋 | 6-8h | Medium | Basic test suite |
| **Monitoring Dashboard** | 📋 | 4-6h | Medium | Health checks |
| **Logging & Analytics** | 📋 | 4-5h | Medium | Usage tracking |

---

## IMPLEMENTATION SCHEDULE

### Sprint 1: Quick Wins (Jan 1-15, 2026)
- [ ] Pattern Learning (Feature 17) - 5-6h
- [ ] Daily Summary automation (Feature 19) - 3-4h
- [ ] Automated backup setup - 2-3h
- [ ] Mobile optimization (Dashboard) - 4-6h

**Total: ~16 hours**

### Sprint 2: Enhancements (Jan 15-31, 2026)
- [ ] Category Recategorization (Feature 18) - 3-4h
- [ ] Named Ranges (StandardFinance) - 4-6h
- [ ] Historical Trend Charts (Dashboard) - 4-6h
- [ ] Weekly Summary automation (Feature 21) - 2-3h

**Total: ~17 hours**

### Sprint 3: New Module (Feb 2026)
- [ ] Goals Tracker Module - 8-12h
- [ ] Validation Row (StandardFinance) - 2-3h
- [ ] Error Boundaries (Dashboard) - 2h

**Total: ~15 hours**

### Q2 2026
- Variance Report module
- Historical Data Import
- Scenario Modeling
- Tax Preparation Module (start)

---

## COST PROJECTION

### Current System (All Free)

| Component | Cost |
|-----------|------|
| Google Apps Script | €0 |
| Google Sheets | €0 |
| Render.com (Bot) | €0 |
| Cloudflare Workers | €0 |
| Discord | €0 |
| GitHub Pages | €0 |
| Gemini API | €0 (free tier) |
| **TOTAL** | **€0/month** |

### With Future Features

| Timeframe | Features Added | Monthly Cost |
|-----------|----------------|--------------|
| Current | All existing | €0 |
| +3 months | +Pattern Learning, Summaries, Goals | €0 |
| +6 months | +Receipt OCR (optional) | €0-10 |
| +12 months | +Voice Input, Bank API (optional) | €0-30 |

**Projected Maximum: €30/month** (if all optional paid features added)

---

## SUCCESS METRICS

### Key Performance Indicators (KPIs)

**Adoption Metrics:**
- Daily active users: 2 (H+W)
- Transactions logged per day: Target 5-10
- Income logging compliance: Target 100% by Day 5

**Accuracy Metrics:**
- AI categorization accuracy: Target >90%
- Pattern match rate: Target >70%
- Recategorization rate: Target <10%

**Efficiency Metrics:**
- Average logging time: Target <10 seconds
- System response time: Target <5 seconds
- Uptime: Target >99.9%

**Financial Metrics:**
- Budget adherence rate: Target 80% categories within budget
- Over-budget categories per month: Target <3
- Projection accuracy: Target ±10% of actual

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | Dec 29, 2025 | Comprehensive update reflecting v2.2/v3.1/v6.1 completion; added detailed feature specs |
| 2.0 | Dec 23, 2025 | Consolidated ShadowLedger_TODO + ROADMAP |
| 1.0 | Dec 2025 | Initial consolidated roadmap |

---

*This is a living document. Update as features are completed or priorities change.*
