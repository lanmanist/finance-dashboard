# Aaron Family Finance System

**Version:** 2.0  
**Last Updated:** December 29, 2025  
**Status:** Production

---

## What Is This?

A comprehensive personal finance management system for the Aaron Family, consisting of three integrated modules that track expenses, project finances through 2042, and visualize cash flows.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AARON FAMILY FINANCE SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  ShadowLedger   │  │ StandardFinance │  │    Dashboard    │         │
│  │                 │  │                 │  │                 │         │
│  │  Daily expense  │  │  17-year cash   │  │  Sankey flow    │         │
│  │  tracking via   │──▶  flow model     │──▶  visualization  │         │
│  │  Discord        │  │  (Google Sheets)│  │  (GitHub Pages) │         │
│  │                 │  │                 │  │                 │         │
│  │  v2.2.0         │  │  v6.1           │  │  v3.1           │         │
│  │  Cost: €0/mo    │  │  Cost: €0/mo    │  │  Cost: €0/mo    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                         │
│  Total System Cost: €0/month                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### For Daily Use (Expense Tracking)
1. Open Discord → #expenses channel
2. Type: `45 rewe` (amount + merchant)
3. Done! Bot confirms and shows budget status

### For Income Logging (Monthly)
1. Run `!income 4200 salary h` for salary
2. Run `!ta 45 h` for Time Account hours
3. Run `!income status` to verify completion

### For Investment Tracking
1. Run `!invest 500 scalable` when making transfers
2. Run `!invest status` to see monthly totals

### For Monthly Review
1. Run `!status` in Discord for budget overview
2. Open Dashboard for visual cash flow
3. Follow [Operations Blueprint](Operations_Blueprint_v1_0_0.md)

### For Financial Planning
1. Open StandardFinance model in Google Sheets
2. Review projections through 2042
3. Adjust assumptions as needed

---

## Module Summary

| Module | Version | Purpose | Interface | Documentation |
|--------|---------|---------|-----------|---------------|
| **ShadowLedger** | v2.2.0 | Daily expense, income & investment tracking | Discord bot | [BLUEPRINT_ShadowLedger_v2_2_0.md](BLUEPRINT_ShadowLedger_v2_2_0.md) |
| **StandardFinance** | v6.1 | 17-year financial model (88 columns) | Google Sheets | [StandardFinance_Guide.md](StandardFinance_Guide.md) |
| **Dashboard** | v3.1.0 | Cash flow visualization | Web (GitHub Pages) | [Dashboard_Blueprint_v3_1.md](Dashboard_Blueprint_v3_1.md) |

---

## Key Documents

### 🔷 META / SYSTEM-LEVEL

| File | Type | Purpose |
|------|------|---------|
| `OVERALL_README.md` | Meta | Quick start guide (this file) |
| `OVERALL_ARCHITECTURE.md` | Meta | System design, data flows, integrations |
| `ROADMAP.md` | Meta | Planned features across all modules |
| `Aaron_Family_Finance_Assessment.md` | Meta | Deep health check report |

### 🔷 MODULE BLUEPRINTS

| File | Module | Purpose |
|------|--------|---------|
| `BLUEPRINT_ShadowLedger_v2_2_0.md` | ShadowLedger | Complete expense/income/investment tracking spec |
| `Dashboard_Blueprint_v3_1.md` | Dashboard | Sankey visualization spec |
| `StandardFinance_Guide.md` | StandardFinance | 17-year financial model documentation |
| `Operations_Blueprint_v1_0_0.md` | Operations | SOP, Monthly Checklist, Procedures |

### 🔷 TECHNICAL FILES

| File | Module | Purpose |
|------|--------|---------|
| `ShadowLedger_Code.gs` | ShadowLedger + Dashboard | Google Apps Script backend (unified) |
| `index.html` | Dashboard | Frontend UI (GitHub Pages) |
| `FinanceSource_v6_1.xlsx` | StandardFinance | Main financial model |
| `ShadowLedger_Cloudflare_Migration_Guide_v4.md` | ShadowLedger | Deployment guide |

---

## Access Points

| Component | URL/Location |
|-----------|--------------|
| Dashboard | https://lanmanist.github.io/finance-dashboard/ |
| Google Sheet | https://docs.google.com/spreadsheets/d/1mrMCTbgPxjxbkHepDiQk_ddN0cbJ-A-GWWtwt3wOgSU/edit |
| Discord | #expenses channel in family server |
| GitHub Repo | Dashboard hosting |

---

## Technology Stack

| Layer | Technology | Cost |
|-------|------------|------|
| Data | Google Sheets | Free |
| Backend | Google Apps Script | Free |
| Bot Hosting | Render.com | Free |
| Relay | Cloudflare Workers | Free |
| Frontend | GitHub Pages | Free |
| AI | Gemini API | Free tier |
| Interface | Discord | Free |

---

## Current Feature Status

### ShadowLedger v2.2.0 (16 Features Complete)

| # | Feature | Status |
|---|---------|--------|
| 1-9 | MVP Features (expenses, commands, AI) | ✅ |
| 10-13 | Income Tracking (!income, !ta, reminders) | ✅ |
| 14-16 | Investment Tracking (!invest, status) | ✅ |

### Dashboard v3.1.0

| Feature | Status |
|---------|--------|
| Multi-month range selection | ✅ |
| Simple/Detailed view toggle | ✅ |
| Expense click modal with categories | ✅ |
| Debt detail modals | ✅ |
| Loading states & refresh feedback | ✅ |
| Expanded expense view (17 categories) | ✅ |

### StandardFinance v6.1

| Feature | Status |
|---------|--------|
| 204-month simulation (Jan 2026 - Dec 2042) | ✅ |
| 88-column model | ✅ |
| POT system architecture | ✅ |
| Sondertilgung logic | ✅ |
| Salary_Schedule with modifiers | ✅ |
| ShadowLedger → Exp_Alloc integration | ✅ |

---

## Support

- **Budget questions:** Run `!help` in Discord
- **Technical issues:** Check module-specific blueprints
- **Feature requests:** Add to [ROADMAP.md](ROADMAP.md)

---

*Last Updated: December 29, 2025*
