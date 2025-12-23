/**
 * Financial Sankey Dashboard - Google Apps Script API v2
 * =======================================================
 * 
 * UPDATES in v2:
 * - Added gross income data for detailed view
 * - Added deduction breakdowns
 * - Added debt details (individual balances)
 * - Added investment details (contributions, growth)
 * - Added mortgage details (interest/principal split, months remaining)
 * - Added net worth breakdown
 * 
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Extensions â†’ Apps Script
 * 3. Replace all code with this file
 * 4. Save, then Deploy â†’ Manage deployments â†’ Edit â†’ Deploy new version
 */

// ============ CONFIGURATION ============
const SHEET_NAME = 'Monthly_Model_v4';

// Column mapping (1-indexed)
const COL = {
  // Date Info (A-E)
  month: 1,
  year: 2,
  date: 3,
  income_from: 4,
  month_type: 5,
  
  // Husband Income (F-M)
  h_gross_salary: 6,
  h_ta_ded: 7,
  h_ownsap_ded: 8,
  h_gross_bonus: 9,
  h_bonus_ta: 10,
  h_taxable: 11,
  h_net_salary: 12,
  h_rsu_net: 13,
  
  // Wife Income (N-U)
  w_gross_salary: 14,
  w_ta_ded: 15,
  w_ownsap_ded: 16,
  w_gross_bonus: 17,
  w_bonus_ta: 18,
  w_taxable: 19,
  w_net_salary: 20,
  w_rsu_net: 21,
  
  // OWNSAP (V-X)
  h_ownsap_val: 22,
  w_ownsap_val: 23,
  ownsap_total: 24,
  
  // YouTube (Y-AA)
  yt_gross: 25,
  yt_tax_res: 26,
  yt_net: 27,
  
  // SAP Loan (AB-AC)
  sap_loan_pmt: 28,
  sap_loan_bal: 29,
  
  // CMP (AD-AG)
  cmp_carry: 30,
  cmp_inflow: 31,
  cmp_available: 32,
  cmp_end: 33,
  
  // Mortgage (AH-AM)
  mort_begin: 34,
  mort_pmt: 35,
  mort_int: 36,
  mort_princ: 37,
  sondertilgung: 38,
  mort_end: 39,
  
  // High-APR Debt (AN-AX)
  d_tf_pmt: 40,
  d_tf_bal: 41,
  d_klarna_pmt: 42,
  d_klarna_bal: 43,
  d_nordea_pmt: 44,
  d_nordea_bal: 45,
  d_db_pmt: 46,
  d_db_bal: 47,
  d_aktia_pmt: 48,
  d_aktia_bal: 49,
  d_highapr_total: 50,
  
  // Fixed Loans (AY-BD)
  d_revolut_pmt: 51,
  d_c3_pmt: 52,
  d_student_pmt: 53,
  d_ikea_pmt: 54,
  d_n26_pmt: 55,
  d_fixed_total: 56,
  
  // Expenses (BE-BF)
  exp_budget: 57,
  exp_alloc: 58,
  
  // Investment (BG-BK)
  inv_begin: 59,
  inv_ownsap: 60,
  inv_excess: 61,
  inv_growth: 62,
  inv_end: 63,
  
  // Cashpile (BL-BN)
  cash_begin: 64,
  cash_add: 65,
  cash_end: 66,
  
  // Tax Reserve (BO-BQ)
  taxres_beg: 67,
  taxres_add: 68,
  taxres_end: 69,
  
  // Time Account (BR-BS)
  h_ta_hrs: 70,
  w_ta_hrs: 71,
  
  // Net Worth (BT-BY)
  nw_invest: 72,
  nw_house: 73,
  nw_mortgage: 74,
  nw_debt: 75,
  nw_ta: 76,
  nw_total: 77,
};

// ============ MAIN ENTRY POINT ============

function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const data = extractFinancialData();
    output.setContent(JSON.stringify({
      success: true,
      count: data.length,
      timestamp: new Date().toISOString(),
      data: data
    }));
  } catch (error) {
    output.setContent(JSON.stringify({
      success: false,
      error: error.toString(),
      stack: error.stack
    }));
  }
  
  return output;
}

// ============ DATA EXTRACTION ============

function extractFinancialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Available: ${ss.getSheets().map(s => s.getName()).join(', ')}`);
  }
  
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(...Object.values(COL));
  const allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  const results = [];
  const TAX_RATE = 0.40; // Approximate tax rate for calculations
  
  // Track mortgage start for "months remaining" calc
  const MORTGAGE_START_BALANCE = 396554;
  const MORTGAGE_TOTAL_MONTHS = 90; // Until Jun 2033
  
  for (let i = 0; i < allData.length; i++) {
    const row = allData[i];
    
    const get = (colName) => {
      const idx = COL[colName] - 1;
      const val = row[idx];
      return (val === '' || val === null || val === undefined) ? 0 : Number(val) || 0;
    };
    
    const getStr = (colName) => {
      const idx = COL[colName] - 1;
      const val = row[idx];
      return val ? String(val) : '';
    };
    
    const month = get('month');
    const year = get('year');
    
    if (!month || !year) continue;
    
    // Gross values
    const h_gross_salary = get('h_gross_salary');
    const w_gross_salary = get('w_gross_salary');
    const h_gross_bonus = get('h_gross_bonus');
    const w_gross_bonus = get('w_gross_bonus');
    const yt_gross = get('yt_gross');
    
    // Deductions
    const h_ta_ded = get('h_ta_ded');
    const w_ta_ded = get('w_ta_ded');
    const h_ownsap_ded = get('h_ownsap_ded');
    const w_ownsap_ded = get('w_ownsap_ded');
    const h_bonus_ta = get('h_bonus_ta');
    const w_bonus_ta = get('w_bonus_ta');
    const yt_tax_res = get('yt_tax_res');
    
    // Calculate implied tax (Gross - TA - OWNSAP - Net = Tax)
    const h_net_salary = get('h_net_salary');
    const w_net_salary = get('w_net_salary');
    const h_taxable = get('h_taxable');
    const w_taxable = get('w_taxable');
    const h_tax = h_taxable > 0 ? h_taxable - h_net_salary : 0;
    const w_tax = w_taxable > 0 ? w_taxable - w_net_salary : 0;
    
    // Net values
    const h_rsu_net = get('h_rsu_net');
    const w_rsu_net = get('w_rsu_net');
    const yt_net = get('yt_net');
    const ownsap_total = get('ownsap_total');
    const inv_ownsap = get('inv_ownsap');
    
    const ownsap_to_cmp = (inv_ownsap === 0 && ownsap_total > 0) ? ownsap_total : 0;
    const ownsap_to_inv = inv_ownsap;
    
    // Mortgage details
    const mort_begin = get('mort_begin');
    const mort_pmt = get('mort_pmt');
    const mort_int = get('mort_int');
    const mort_princ = get('mort_princ');
    const sondertilgung = get('sondertilgung');
    const mort_end = get('mort_end');
    
    // Calculate months remaining (approximate)
    const mort_months_remaining = mort_end > 0 ? Math.ceil(mort_end / (mort_princ > 0 ? mort_princ : 1000)) : 0;
    
    // Debt details
    const tf_pmt = get('d_tf_pmt');
    const tf_bal = get('d_tf_bal');
    const klarna_pmt = get('d_klarna_pmt');
    const klarna_bal = get('d_klarna_bal');
    const nordea_pmt = get('d_nordea_pmt');
    const nordea_bal = get('d_nordea_bal');
    const db_pmt = get('d_db_pmt');
    const db_bal = get('d_db_bal');
    const aktia_pmt = get('d_aktia_pmt');
    const aktia_bal = get('d_aktia_bal');
    
    const revolut_pmt = get('d_revolut_pmt');
    const c3_pmt = get('d_c3_pmt');
    const student_pmt = get('d_student_pmt');
    const ikea_pmt = get('d_ikea_pmt');
    const n26_pmt = get('d_n26_pmt');
    
    const high_apr_pmt = get('d_highapr_total');
    const fixed_debt_pmt = get('d_fixed_total');
    const sap_loan_pmt = get('sap_loan_pmt');
    const sap_loan_bal = get('sap_loan_bal');
    
    const high_apr_remaining = tf_bal + klarna_bal + nordea_bal + db_bal + aktia_bal;
    
    // Investment details
    const inv_begin = get('inv_begin');
    const inv_excess = get('inv_excess');
    const inv_growth = get('inv_growth');
    const inv_end = get('inv_end');
    
    // Cashpile
    const cash_end = get('cash_end');
    const cash_add = get('cash_add');
    
    // Expenses
    const expenses = get('exp_alloc');
    const exp_budget = get('exp_budget');
    
    // CMP
    const cmp_carry = get('cmp_carry');
    const cmp_inflow = get('cmp_inflow');
    const cmp_end = get('cmp_end');
    
    // Net worth breakdown
    const nw_invest = get('nw_invest');
    const nw_house = get('nw_house');
    const nw_mortgage = get('nw_mortgage');
    const nw_debt = get('nw_debt');
    const nw_ta = get('nw_ta');
    const nw_total = get('nw_total');
    
    // Month type
    const month_type = getStr('month_type');
    const is_bonus_month = month_type === 'FAT_BONUS';
    const is_rsu_month = month_type === 'FAT_RSU' || (h_rsu_net > 0 || w_rsu_net > 0);
    const is_sondertilgung_month = sondertilgung > 0;
    const is_post_mortgage = mort_end <= 0 && mort_begin <= 0;
    const is_debt_attack_phase = high_apr_remaining > 0;
    
    results.push({
      month: month,
      year: year,
      date: `${String(month).padStart(2, '0')}/${year}`,
      income_from: getStr('income_from'),
      month_type: month_type,
      is_bonus_month: is_bonus_month,
      is_rsu_month: is_rsu_month,
      is_sondertilgung_month: is_sondertilgung_month,
      is_post_mortgage: is_post_mortgage,
      is_debt_attack_phase: is_debt_attack_phase,
      
      // NEW: Gross income for detailed view
      gross: {
        h_salary: round(h_gross_salary),
        w_salary: round(w_gross_salary),
        h_bonus: round(h_gross_bonus),
        w_bonus: round(w_gross_bonus),
        yt: round(yt_gross)
      },
      
      // NEW: Deduction details
      deductions: {
        h_ta: round(h_ta_ded),
        w_ta: round(w_ta_ded),
        h_ownsap: round(h_ownsap_ded),
        w_ownsap: round(w_ownsap_ded),
        h_bonus_ta: round(h_bonus_ta),
        w_bonus_ta: round(w_bonus_ta),
        h_tax: round(h_tax),
        w_tax: round(w_tax),
        yt_tax_reserve: round(yt_tax_res)
      },
      
      inflows: {
        h_salary_net: round(h_net_salary),
        w_salary_net: round(w_net_salary),
        h_rsu_net: round(h_rsu_net),
        w_rsu_net: round(w_rsu_net),
        yt_net: round(yt_net),
        ownsap_to_cmp: round(ownsap_to_cmp)
      },
      
      outflows: {
        mortgage_payment: round(mort_pmt),
        mortgage_interest: round(mort_int),
        mortgage_principal: round(mort_princ),
        sondertilgung: round(sondertilgung),
        high_apr_payment: round(high_apr_pmt),
        fixed_debt_payment: round(fixed_debt_pmt),
        sap_loan_payment: round(sap_loan_pmt),
        expenses: round(expenses),
        inv_ownsap: round(ownsap_to_inv),
        inv_excess: round(Math.max(0, inv_excess)),
        cash_add: round(cash_add)
      },
      
      // NEW: Individual debt breakdown
      debt_details: {
        tf: { payment: round(tf_pmt), balance: round(tf_bal) },
        klarna: { payment: round(klarna_pmt), balance: round(klarna_bal) },
        nordea: { payment: round(nordea_pmt), balance: round(nordea_bal) },
        db: { payment: round(db_pmt), balance: round(db_bal) },
        aktia: { payment: round(aktia_pmt), balance: round(aktia_bal) },
        revolut: { payment: round(revolut_pmt), balance: 0 }, // Balance not tracked per month
        c3: { payment: round(c3_pmt), balance: 0 },
        student: { payment: round(student_pmt), balance: 0 },
        ikea: { payment: round(ikea_pmt), balance: 0 },
        n26: { payment: round(n26_pmt), balance: 0 },
        sap: { payment: round(sap_loan_pmt), balance: round(sap_loan_bal) }
      },
      
      // NEW: Investment breakdown
      investment_details: {
        begin: round(inv_begin),
        ownsap_contrib: round(ownsap_to_inv),
        excess_contrib: round(Math.max(0, inv_excess)),
        growth: round(inv_growth),
        end: round(inv_end)
      },
      
      // NEW: Mortgage breakdown
      mortgage_details: {
        begin: round(mort_begin),
        interest_rate: 3.89,
        months_remaining: mort_months_remaining,
        total_paid: round(MORTGAGE_START_BALANCE - mort_end)
      },
      
      balances: {
        cmp: round(cmp_end),
        mortgage: round(mort_end),
        high_apr_debt: round(high_apr_remaining),
        fixed_debt: round(sap_loan_bal), // SAP loan as main fixed debt balance
        investment: round(inv_end),
        cashpile: round(cash_end),
        net_worth: round(nw_total)
      },
      
      // NEW: Net worth component breakdown
      net_worth_breakdown: {
        investment: round(nw_invest),
        house: round(nw_house),
        mortgage: round(nw_mortgage),
        other_debt: round(nw_debt),
        time_account: round(nw_ta)
      },
      
      // CMP details for hover
      cmp_details: {
        carry: round(cmp_carry),
        inflow: round(cmp_inflow),
        outflow: round(cmp_inflow - cmp_end + cmp_carry),
        end: round(cmp_end)
      }
    });
  }
  
  return results;
}

function round(val) {
  return Math.round(val * 100) / 100;
}

// ============ TEST FUNCTION ============

function testExtraction() {
  const data = extractFinancialData();
  Logger.log(`Extracted ${data.length} months`);
  Logger.log('First month: ' + JSON.stringify(data[0], null, 2));
  Logger.log('Sample gross: ' + JSON.stringify(data[0].gross));
  Logger.log('Sample deductions: ' + JSON.stringify(data[0].deductions));
  Logger.log('Sample debt_details: ' + JSON.stringify(data[0].debt_details));
}
