# Aaron Family Finance System

**Version:** 1.0  
**Last Updated:** December 2025  
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
│  │  Discord        │  │  (Excel/Sheets) │  │  (GitHub Pages) │         │
│  │                 │  │                 │  │                 │         │
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

### For Monthly Review
1. Run `!status` in Discord for budget overview
2. Open Dashboard for visual cash flow
3. Follow [MONTHLY_CHECKLIST.md](operations/MONTHLY_CHECKLIST.md)

### For Financial Planning
1. Open StandardFinance model in Google Sheets
2. Review projections through 2042
3. Adjust assumptions as needed

---

## Module Summary

| Module | Purpose | Interface | Documentation |
|--------|---------|-----------|---------------|
| **ShadowLedger** | Daily expense tracking | Discord bot | [ShadowLedger_Blueprint.md](modules/shadowledger/ShadowLedger_Blueprint.md) |
| **StandardFinance** | 17-year financial model | Google Sheets/Excel | [StandardFinance_Guide.md](modules/standard-finance/StandardFinance_Guide.md) |
| **Dashboard** | Cash flow visualization | Web (GitHub Pages) | [Dashboard_Blueprint.md](modules/dashboard/Dashboard_Blueprint.md) |

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [OVERALL_ARCHITECTURE.md](OVERALL_ARCHITECTURE.md) | System design, data flow, integrations |
| [ROADMAP.md](ROADMAP.md) | Planned features across all modules |
| [MONTHLY_CHECKLIST.md](operations/MONTHLY_CHECKLIST.md) | Step-by-step monthly ritual |
| [SOP.md](operations/SOP.md) | Standard Operating Procedure |

---

## Technical Files

| Module | File | Purpose |
|--------|------|---------|
| ShadowLedger | `ShadowLedger_v2.gs` | Google Apps Script backend |
| ShadowLedger | `ShadowLedger_Setup.md` | Cloudflare + Render deployment guide |
| Dashboard | `Dashboard_Code.gs` | Google Apps Script API |
| Dashboard | `Dashboard_UI.html` | Frontend (GitHub Pages) |
| StandardFinance | `FinanceSource_v6_1.xlsx` | Main financial model |

---

## Access Points

| Component | URL/Location |
|-----------|--------------|
| Dashboard | https://lanmanist.github.io/finance-dashboard/ |
| Google Sheet | https://docs.google.com/spreadsheets/d/1rTVkCLy0yqq1sByvBuM-ENWM_3ctK0V1/edit |
| Discord | #expenses channel in family server |
| GitHub Repo | (Dashboard hosting) |

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

## Support

- **Budget questions:** Run `!help` in Discord
- **Technical issues:** Check module-specific documentation
- **Feature requests:** Add to [ROADMAP.md](ROADMAP.md)

---

*Last Updated: December 2025*
