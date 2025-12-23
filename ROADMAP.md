# Aaron Family Finance System - Roadmap

**Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Active Development

---

## OVERVIEW

This roadmap consolidates planned features across all three modules plus system-wide improvements.

### Priority Legend
- 🔴 **Critical** - Do immediately
- 🟠 **High** - Next sprint
- 🟡 **Medium** - This quarter
- 🟢 **Low** - Future consideration

---

## RECENTLY COMPLETED ✅

| Date | Module | Feature |
|------|--------|---------|
| Dec 2025 | ShadowLedger | v2.0 Full MVP (all 9 features) |
| Dec 2025 | ShadowLedger | Cloudflare + Render migration |
| Dec 2025 | Dashboard | v2.0 Multi-month, detailed views |
| Dec 2025 | StandardFinance | v6.1 with 87 columns |
| Dec 2025 | **Integration** | ShadowLedger → Exp_Alloc formula link |

---

## MODULE: SHADOWSLEDGER

### 🟠 High Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| **Pattern Learning** | Auto-suggest patterns after 5+ consistent categorizations | 5-6h | Reduces AI calls |
| **Category Recategorization** | `!recategorize [txn_id] [category]` command | 3-4h | Fix mistakes easily |
| **Daily Summary** | Auto-post at 21:00 CET daily | 3-4h | Proactive awareness |

### 🟡 Medium Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Weekly Summary | Auto-post Sunday 20:00 | 2-3h | Weekly review |
| Historical Import | CSV bulk import | 3-4h | Complete history |
| Full Date Support | DD/MM/YYYY for any date | 2-3h | Flexibility |
| !month Command | Full month transactions | 2h | Quick review |
| Budget Adjustment | `!setbudget [category] [amount]` | 2-3h | Easy changes |

### 🟢 Future

| Feature | Description | Effort | Cost |
|---------|-------------|--------|------|
| Receipt OCR | Photo → transaction | 8-10h | €5-10/mo |
| Voice Input | Voice note → transaction | 8-10h | €5-10/mo |
| Bank Integration | Auto-import from N26/Revolut | 20-30h | Varies |
| Recurring Detection | Auto-detect subscriptions | 6-8h | €0 |

### Technical Debt

| Issue | Priority | Effort |
|-------|----------|--------|
| Cache patterns/budget in ScriptProperties | 🟡 Medium | 3-4h |
| Add retry logic for transient failures | 🟡 Medium | 2h |
| Fix !ytd to use txn_date instead of month_key | 🟠 High | 30min |
| Pro-rate current month in !ytd budget | 🟡 Medium | 30min |

---

## MODULE: STANDARDFINANCE

### 🔴 Critical

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| **Column Sync** | Update Dashboard API to match 87 columns | 2-3h | Fix data mismatch |

### 🟠 High Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Validation Row | Sum checks, balance validations | 2-3h | Catch errors |
| Named Ranges | Replace column letters with names | 4-6h | Maintainability |
| Actuals Tracking | Separate columns for plan vs actual | 4-6h | Variance analysis |

### 🟡 Medium Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Scenario Modeling | What-if analysis sheets | 6-8h | Planning |
| Tax Calculation Helper | Annual tax estimate | 4-6h | Tax prep |
| Inflation Adjustment | Auto-update SL_Budget annually | 2h | Accuracy |

### 🟢 Future

| Feature | Description | Effort |
|---------|-------------|--------|
| Multi-currency Support | EUR/USD/SEK handling | 6-8h |
| Retirement Projections | Post-2042 modeling | 8-12h |

---

## MODULE: DASHBOARD

### 🔴 Critical

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| **Fix Column Mapping** | Update Code.gs COL object for 87 columns | 2-3h | Data accuracy |

### 🟠 High Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Expense Category Breakdown | Show ShadowLedger categories in Sankey | 4-6h | Better visibility |
| Loading States | Better UX during data fetch | 2h | Polish |
| Error Boundaries | Graceful failure handling | 2h | Reliability |

### 🟡 Medium Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Mobile Optimization | Better touch interactions | 4-6h | Mobile UX |
| Scenario Comparison | Side-by-side what-if | 6-8h | Planning |
| Historical Trend Charts | Net worth over time | 4-6h | Visualization |
| Export to PDF | Download current view | 3-4h | Reporting |

### 🟢 Future

| Feature | Description | Effort |
|---------|-------------|--------|
| PWA Support | Installable mobile app | 4-6h |
| Offline Mode | Cache recent data | 6-8h |
| Push Notifications | Budget alerts | 4-6h |

---

## SYSTEM-WIDE IMPROVEMENTS

### 🟠 High Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| **Documentation Consolidation** | Implement new docs/ structure | 2-3h | Clarity |
| **Delete Obsolete Files** | Remove v4 files from project | 30min | Cleanliness |
| Unified API Versioning | `/api/v1/` prefix for all endpoints | 4-6h | Maintainability |

### 🟡 Medium Priority

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Config Centralization | All settings in SL_Config | 3-4h | Single source |
| Automated Testing | Basic test suite for Apps Script | 6-8h | Reliability |
| Monitoring Dashboard | Health checks for all services | 4-6h | Visibility |

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
- Highlight significant variances
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
1. [ ] Fix Dashboard column mapping (2-3h)
2. [ ] Fix !ytd to use txn_date (30min)
3. [ ] Delete obsolete files (30min)
4. [ ] Finalize documentation structure (2h)

**Total: ~6 hours**

### Sprint 2: Quick Wins (Next 2 Weeks)
1. [ ] Pattern Learning for ShadowLedger (5-6h)
2. [ ] Category Recategorization command (3-4h)
3. [ ] Daily Summary automation (3-4h)
4. [ ] Validation row in StandardFinance (2-3h)

**Total: ~15 hours**

### Sprint 3: Enhancements (Month 2)
1. [ ] Expense category breakdown in Dashboard (4-6h)
2. [ ] Named ranges in StandardFinance (4-6h)
3. [ ] Weekly Summary automation (2-3h)
4. [ ] Historical data import (3-4h)

**Total: ~17 hours**

### Q2 2026
- Goals Tracker module
- Variance Report module
- Mobile PWA

---

## COST PROJECTION

| Timeframe | Features | Monthly Cost |
|-----------|----------|--------------|
| Current | All existing | €0 |
| +3 months | +Pattern Learning, Summaries | €0 |
| +6 months | +Receipt OCR (optional) | €0-10 |
| +12 months | +Voice Input (optional) | €0-20 |

**Projected Maximum: €20/month** (if all optional paid features added)

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
| 1.0 | Dec 2025 | Initial consolidated roadmap |

---

*This is a living document. Update as features are completed or priorities change.*
