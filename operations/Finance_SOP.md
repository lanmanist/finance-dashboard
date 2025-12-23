# **Aaron Family Finance: System Architecture & Operating Manual**

**Version:** 1.0

**Created:** December 16, 2025

**Purpose:** To document the methodology, validation, and operational workflow for the Aaron Family Financial Model.

## **1\. System Architecture: "The Financial Machine"**

Your financial model is not just a budget; it is a **Cash Flow-Based Simulation** (industry term: *Rolling Forecast*). It focuses on allocating surplus rather than just tracking expenses.

### **Core Components**

1. **The Engine (Income):** High fixed salaries \+ "Fat Months" (Quarterly RSU/Bonuses) \+ Side Hustle (YouTube).  
2. **The Hub (CMP):** The **Central Master Pot** acts as a corporate "Sweep Account." It is capped at €10,000. All income lands here; all bills are paid from here.  
3. **The Sweep Logic:**  
   * **Baseline:** Maintain €10k in CMP.  
   * **Overflow:** Excess \>€10k is automatically swept: 20% to Cashpile (Safety), 80% to Investments (Growth).  
4. **The "Rocket Fuel" (Sondertilgung):** A logic gate that triggers large mortgage principal payments (\~€21.5k) only when safety and investment targets are met.

### **Key Rules**

* **The 1-Month Lag:** Income earned in Jan is spent in Feb. This creates a permanent liquidity buffer.  
* **The "Shadow Ledger":** A separate, simple list for tracking daily expenses that feeds the main model.  
* **The "Hard Close":** The monthly ritual of converting "Plan" (Formulas) into "History" (Hard Values).

## **2\. Methodology Validation**

### **What You Are Doing Right (Pro Level)**

* **Reverse Budgeting:** You prioritize savings/debt targets first. Spending is what remains. This is the superior method for high earners.  
* **Algorithmic Decision Making:** Removing emotion from the Sondertilgung decision prevents cash-poor mistakes.  
* **Tax Segregation:** Reserving 44.3% of YouTube income *before* it hits the checking account protects you from year-end tax shocks.

### **Risks & Mitigations**

* **SAP Concentration Risk:** Your jobs and your RSUs are both SAP.  
  * *Mitigation:* Ensure the "Investment" pot buys global ETFs (e.g., MSCI World), not more SAP stock.  
* **Salary Timing Gap:** The model assumes Jan salary pays Jan bills. In reality, Dec salary pays Jan bills.  
  * *Mitigation:* Handled via the "Hard Close" procedure where you input the *actual* net cash received.  
* **"False Optimism" in Budgeting:** Assuming unspent budget is "saved" mid-month.  
  * *Mitigation:* Use the MAX(Budget, Actual) formula during the active month to ringfence funds.

## **3\. The Monthly Operational Playbook**

This is your recurring ritual to maintain the **Dynamic Rolling Forecast**.

### Phase 0: Daily Ritual (New)
* Log all expenses via ShadowLedger Discord
* Check !status before large purchases
* Target: <60 seconds per transaction

### **Phase 1: The "Launch" (Day 1\)**

* **Check the Flight Plan:** Look at the current month's column. Is the projected CMP\_End negative?  
* **Set Controls:** If projected negative, cut discretionary spending targets *immediately*.

### **Phase 2: The "Execution" (Day 2 – 29\)**

* **Feed the Shadow Ledger:** Log transactions in your Shadow\_Expenses tab (Groceries, etc.).  
* **The "Live" Sensor:** The Exp\_Alloc cell in your main model updates instantly  
  * *Meaning:* During the month, it pessimistically assumes you will spend your full budget. After the month, it reveals the truth.

### Phase 2.5: Weekly Review (New)
* Every Sunday: Review Dashboard
* Check all "red" budget categories
* Adjust upcoming week spending

### **Phase 3: The "Hard Close" (Day 1 of Next Month)**

* **Prerequisite:** Save a snapshot copy (Aaron\_Finance\_YYYY\_MM\_Snapshot.xlsx).  
* **Step 1: Income Truth:** Log into the bank. Overwrite the Net Salary cells with the exact amount received on Dec 31st (for Jan).  
* **Step 2: Expense Lock-in:** The formula will now show the actual sum from Shadow Ledger. Copy this cell and **Paste Values** to lock it forever.  
* **Step 3: Mark-to-Market:**  
  * Overwrite Inv\_End with actual Brokerage Balance.  
  * Overwrite D\_TF\_Bal / D\_Klarna\_Bal with actual Debt Balances.  
  * **Critical:** Overwrite CMP\_End with your actual Checking Account Balance.  
* **Step 4: Color Code:** Highlight the row **Light Yellow** to signify "Closed."

### **Phase 4: The "Re-Forecast" (Immediate)**

* Scroll down to future months (White cells).  
* Observe how the new CMP\_End ripples through to 2042\.  
* *Accept the new reality.* You have successfully re-routed.

### Phase 5: Quarterly Review (New)
* Compare actual vs projected
* RSU vest verification
* Sondertilgung planning

## **4\. Technical Implementation Details**

### **The "Self-Closing" Formula**

Use this in your Exp\_Alloc (Column BP) to automate the switch between "Guardrail" and "Truth":

\=IF( TODAY() \> EOMONTH($C2, 0),  
     SUMIFS(Shadow\_Expenses\!C:C, Shadow\_Expenses\!A:A, "\>="&$C2, Shadow\_Expenses\!A:A, "\<="\&EOMONTH($C2,0)),  
     MAX($BO2, SUMIFS(Shadow\_Expenses\!C:C, Shadow\_Expenses\!A:A, "\>="&$C2, Shadow\_Expenses\!A:A, "\<="\&EOMONTH($C2,0)))  
)

### **The Shadow Ledger Columns**

* **Date**  
* **Category** (Must match Assumptions sheet dropdowns exactly)  
* **Amount**  
* **Description**

*End of Standard Operating Procedure*