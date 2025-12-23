# Aaron Family Finance System - Roadmap

**Version:** 2.0  
**Last Updated:** December 23, 2025  
**Status:** Active Development

---

## OVERVIEW

This roadmap consolidates planned features across all modules plus system-wide improvements.

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

| Date | Module | Feature |
|------|--------|---------|
| Dec 2025 | ShadowLedger | v2.0 Full MVP (all 9 features) |
| Dec 2025 | ShadowLedger | Cloudflare + Render.com migration |
| Dec 2025 | ShadowLedger | Timezone-aware timestamps (UTC+1) |
| Dec 2025 | Dashboard | v2.0 Multi-month, detailed views |
| Dec 2025 | StandardFinance | v6.1 with 87 columns |
| Dec 2025 | **Integration** | ShadowLedger → Exp_Alloc SUMIFS link |
| Dec 2025 | **Docs** | Documentation restructure & naming convention |

### ShadowLedger v2.0 Features Complete

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Extended Spender Aliases | ✅ | h/w/husband/wife/nha/anh/aaron/trang/chang/em |
| 2 | Multi-Transaction per Message | ✅ | Line break detection, batch processing |
| 3 | Enhanced !status with % | ✅ | Monospace table, color-coded |
| 4 | !ytd Command | ✅ | Year-to-date spending table |
| 5 | Smart Flexible Input Parsing | ✅ | Gemini AI + regex fallback |
| 6 | Enhanced Date Parsing | ✅ | yesterday, DD.MM, natural language |
| 7 | Gemini AI Categorization | ✅ | Optional API key, pattern fallback |
| 8 | !budgetleft Command | ✅ | Remaining budget table |
| 9 | !undo Command | ✅ | 10-min window, confirmation step |

---

## MODULE: SHADOWSLEDGER

### 🟠 High Priority

| # | Feature | Status | Effort | Impact | Cost |
|---|---------|--------|--------|--------|------|
| 10 | **Pattern Learning** | 📋 | 5-6h | Reduces AI calls 80%+ | €0 |
| 12 | **Category Recategorization** | 📋 | 3-4h | Fix AI mistakes easily | €0 |
| 13 | **Daily Summary** | 📋 | 3-4h | Proactive awareness | €0 |

#### Feature 10: Pattern Learning
**Description:** Auto-suggest patterns after 5+ consistent categorizations

**Implementation:**
- Track merchant frequency in transactions
- When merchant appears 5+ times with >80% category consistency
- Suggest pattern via Discord message
- Command: `!addpattern [merchant] [category]` to confirm
- Add approved patterns to SL_Patterns sheet

**User Experience:**
```
💡 Pattern Suggestion
────────────────────────────────
Merchant: "cafe_latte"
Appears: 7 times
Category: "Eat Out & Food delivery" (86% confidence)

Reply !addpattern cafe_latte eat to create this pattern
────────────────────────────────
```

**Success Criteria:**
- Auto-detects 5+ repeat merchants
- Calculates confidence >80%
- User can approve/reject suggestions
- Approved patterns added to SL_Patterns

---

#### Feature 12: Category Recategorization
**Description:** Fix transaction categories after logging

**Commands:**
- `!recategorize [txn_id] [new_category]`
- `!recategorize last [new_category]`

**User Experience:**
```
✅ Recategorized
────────────────────────────────
Transaction: €45.00 - Rewe
Old: Shopping
New: Groceries + Food

📊 Updated Budget:
🟢 Groceries + Food: €320/€600 (53%)
🟢 Shopping: €100/€400 (25%)
────────────────────────────────
```

---

#### Feature 13: Scheduled Daily Summary
**Description:** Auto-post at 21:00 CET daily

**Implementation:**
- Apps Script time-driven trigger (21:00 CET)
- Calculate: Today's total, top 3 categories, budget status
- Post to Discord #expenses channel

**User Experience:**
```
📅 Daily Summary (2025-12-17)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today's Spending: €127.50
Transactions: 7

Top Categories:
🟢 Groceries + Food: €67.50
🟡 Eat Out: €45.00
🟢 Shopping: €15.00

Month Progress:
Day 17/31 (55%)
Spent: €2,450/€4,090 (60%)

Status: ✅ On track
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 🟡 Medium Priority

| # | Feature | Status | Effort | Impact | Cost |
|---|---------|--------|--------|--------|------|
| 11 | Historical Data Import | 📋 | 3-4h | Complete history | €0 |
| 14 | Weekly Summary | 📋 | 2-3h | Weekly review | €0 |
| 17 | Full Date Support | 📋 | 2-3h | Flexibility | €0 |
| 16 | !month Command | 📋 | 2h | Quick review | €0 |
| 18 | Budget Adjustment | 📋 | 2-3h | Easy changes | €0 |
| 19 | Recurring Expense Detection | 📋 | 6-8h | Subscription alerts | €0 |

#### Feature 11: Historical Data Import
**Description:** Bulk import historical expenses from CSV

**Commands:**
- `!import [google_drive_file_id]`
- `!import confirm`

**CSV Format:** `date,amount,merchant,category,spender`

**User Experience:**
```
📊 Import Preview
────────────────────────────────
File: expenses_2024.csv
Rows: 247
Date Range: 2024-01-01 to 2024-12-31
Duplicates: 3 (will skip)

Reply !import confirm to proceed
────────────────────────────────

After confirmation:
✅ Imported 244 transactions
❌ Skipped 3 duplicates
```

---

#### Feature 14: Scheduled Weekly Summary
**Description:** Auto-post Sunday 20:00 CET

**User Experience:**
```
📊 Weekly Summary (Dec 11-17)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: €487.50 (7 days)
Avg/day: €69.64
Transactions: 34

Daily Breakdown:
Mon: €45.00 (3)
Tue: €67.50 (5)
Wed: €89.00 (6)
...

Top Merchants:
1. Rewe: €127.50 (8 visits)
2. Lidl: €89.00 (5 visits)
3. Lieferando: €67.50 (3 visits)

Budget Status: 🟢 60% used
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 🟢 Future Features

| # | Feature | Status | Effort | Cost | Notes |
|---|---------|--------|--------|------|-------|
| 15 | Receipt OCR | 💡 | 8-10h | €5-10/mo | Photo → transaction |
| 20 | Voice Input | 💡 | 8-10h | €5-10/mo | Voice note → transaction |
| 21 | Analytics Dashboard | 💡 | 6-8h | €0 | Spending visualizations |
| 23 | Bank API Integration | 💡 | 15-20h | Varies | Auto-import from N26/Revolut |
| 24 | Email Receipt Parsing | 💡 | 10-12h | €0 | Parse Amazon/PayPal receipts |
| 25 | Budget Forecasting | 💡 | 8-10h | €0 | Predict end-of-month totals |
| 26 | Shared Family View | 💡 | 6-8h | €0 | Web dashboard for non-Discord |

---

### Technical Debt

| Issue | Priority | Effort | Notes |
|-------|----------|--------|-------|
| Fix !ytd to use txn_date instead of month_key | 🟠 High | 30min | Currently filters wrong column |
| Pro-rate current month in !ytd budget | 🟡 Medium | 30min | Shows full month budget mid-month |
| Cache patterns/budget in ScriptProperties | 🟡 Medium | 3-4h | Reduce sheet reads 80% |
| Add retry logic for transient failures | 🟡 Medium | 2h | Exponential backoff |
| Code modularization | 🟢 Low | 8-10h | Split into logical modules |
| Unit test coverage | 🟢 Low | 6-8h | Apps Script test framework |

---

## MODULE: STANDARDFINANCE

### 🔴 Critical

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| **Column Sync with Dashboard** | 📋 | 2-3h | Fix data mismatch (77→87 cols) |

### 🟠 High Priority

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| Validation Row | 📋 | 2-3h | Sum checks, balance validations |
| Named Ranges | 📋 | 4-6h | Replace column letters with names |
| Actuals Tracking | 📋 | 4-6h | Separate columns for plan vs actual |

### 🟡 Medium Priority

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| Scenario Modeling | 📋 | 6-8h | What-if analysis sheets |
| Tax Calculation Helper | 📋 | 4-6h | Annual tax estimate |
| Inflation Adjustment | 📋 | 2h | Auto-update SL_Budget annually |

### 🟢 Future

| Feature | Status | Effort |
|---------|--------|--------|
| Multi-currency Support | 💡 | 6-8h |
| Retirement Projections | 💡 | 8-12h |

---

## MODULE: DASHBOARD

### 🔴 Critical

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| **Fix Column Mapping** | 📋 | 2-3h | Update COL object for 87 columns |

### 🟠 High Priority

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| Expense Category Breakdown | 📋 | 4-6h | Show ShadowLedger categories in Sankey |
| Loading States | 📋 | 2h | Better UX during data fetch |
| Error Boundaries | 📋 | 2h | Graceful failure handling |

### 🟡 Medium Priority

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| Mobile Optimization | 📋 | 4-6h | Better touch interactions |
| Scenario Comparison | 📋 | 6-8h | Side-by-side what-if |
| Historical Trend Charts | 📋 | 4-6h | Net worth over time |
| Export to PDF | 📋 | 3-4h | Download current view |

### 🟢 Future

| Feature | Status | Effort |
|---------|--------|--------|
| PWA Support | 💡 | 4-6h |
| Offline Mode | 💡 | 6-8h |
| Push Notifications | 💡 | 4-6h |

---

## SYSTEM-WIDE IMPROVEMENTS

### 🟠 High Priority

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| Delete Obsolete Files | 📋 | 30min | Remove v4 files |
| Unified API Versioning | 📋 | 4-6h | `/api/v1/` prefix |

### 🟡 Medium Priority

| Feature | Status | Effort | Impact |
|---------|--------|--------|--------|
| Config Centralization | 📋 | 3-4h | All settings in SL_Config |
| Automated Testing | 📋 | 6-8h | Basic test suite |
| Monitoring Dashboard | 📋 | 4-6h | Health checks |

---

## NEW MODULES (PROPOSED)

### 🟡 Goals Tracker
**Purpose:** Visual milestones (debt-free date, €1M net worth, etc.)  
**Effort:** 8-12h  
**Priority:** Medium

Features:
- Define goals with target dates/amounts
- Progress visualization
- Celebration notifications when achieved

### 🟡 Variance Report
**Purpose:** Monthly actual vs planned analysis  
**Effort:** 6-8h  
**Priority:** Medium

Features:
- Auto-generate comparison report
- Highlight significant variances (>10%)
- Trend analysis

### 🟢 Family Finance Game
**Purpose:** Gamify savings for teaching son  
**Effort:** 10-15h  
**Priority:** Low

Features:
- Simple goals for kids
- Visual rewards
- Educational component

---

## IMPLEMENTATION SCHEDULE

### Sprint 1: Critical Fixes (This Week)
- [ ] Fix Dashboard column mapping (2-3h) 🔴
- [ ] Fix !ytd to use txn_date (30min) 🟠
- [ ] Delete obsolete v4 files (30min)

**Total: ~4 hours**

### Sprint 2: Quick Wins (Next 2 Weeks)
- [ ] Pattern Learning (5-6h) 🟠
- [ ] Category Recategorization (3-4h) 🟠
- [ ] Daily Summary automation (3-4h) 🟠
- [ ] Validation row in StandardFinance (2-3h) 🟠

**Total: ~15 hours**

### Sprint 3: Enhancements (Month 2)
- [ ] Expense category breakdown in Dashboard (4-6h)
- [ ] Named ranges in StandardFinance (4-6h)
- [ ] Weekly Summary automation (2-3h)
- [ ] Historical data import (3-4h)

**Total: ~17 hours**

### Q2 2026
- Goals Tracker module
- Variance Report module
- Mobile PWA

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
| Gemini API (optional) | €0 (free tier) |
| **TOTAL** | **€0/month** |

### With Future Features

| Timeframe | Features Added | Monthly Cost |
|-----------|----------------|--------------|
| Current | All existing | €0 |
| +3 months | +Pattern Learning, Summaries | €0 |
| +6 months | +Receipt OCR (optional) | €0-10 |
| +12 months | +Voice Input (optional) | €0-20 |

**Projected Maximum: €20/month** (if all optional paid features added)

---

## SUCCESS METRICS

### Key Performance Indicators (KPIs)

**Adoption Metrics:**
- Daily active users (H+W)
- Transactions logged per day (target: 5-10)
- Command usage frequency

**Accuracy Metrics:**
- AI categorization accuracy (target: >90%)
- Pattern match rate (target: >70%)
- Recategorization rate (target: <10%)

**Efficiency Metrics:**
- Average logging time (target: <10 seconds)
- System response time (target: <5 seconds)
- Uptime (target: >99.9%)

**Financial Metrics:**
- Budget adherence rate (target: 80% categories within budget)
- Over-budget categories per month (target: <3)
- Uncategorized transactions (target: <5%)

---

## HOW TO PROPOSE NEW FEATURES

1. Add to appropriate module section above
2. Include: Description, Effort estimate, Impact assessment
3. Assign initial priority
4. Discuss in next planning session

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Dec 23, 2025 | Consolidated ShadowLedger_TODO + ROADMAP |
| 1.0 | Dec 2025 | Initial consolidated roadmap |

---

*This is a living document. Update as features are completed or priorities change.*
