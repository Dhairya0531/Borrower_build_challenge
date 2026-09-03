# Borrower Copilot — Lending Rules & Decision Matrix (RULES.md)

This document specifies every rule, threshold, benchmark band, and assumption utilized by the Borrower Copilot engine. Every single parameter is grounded in Reserve Bank of India (RBI) regulatory guidelines, standard Indian bank/NBFC credit policies, or documented under professional lending judgment.

---

## 1. Fixed Obligation to Income Ratio (FOIR) & Capacity Rules

FOIR dictates the maximum percentage of a borrower’s net monthly income that can be committed towards all debt obligations (existing EMIs + proposed new EMI).

| What | Value | Why | Source / Judgement |
| :--- | :--- | :--- | :--- |
| **Low-Income Tier FOIR (< ₹35,000/mo)** | **Max 40%** | Lower income leaves very small absolute surplus after essential living costs (food, rent, schooling). Higher FOIR leads to food/rent default. | RBI Master Directions on Regulatory Framework for Microfinance Loans (Directions, 2022) capping total indebtedness at 50% max, bank standard 40%. |
| **Middle-Income Tier FOIR (₹35,000 – ₹75,000/mo)** | **Max 50%** | Moderate surplus allows half of income to go toward debt if other expenses are stable. | Standard PSU & Private Bank Retail Credit Policy (SBI, HDFC Bank personal loan guidelines). |
| **High-Income Tier FOIR (> ₹75,000/mo)** | **Max 55% - 60%** | High absolute surplus (e.g. ₹1.1L salary leaves ₹44,000+ even at 60% FOIR), enabling higher debt capacity. | Tier-1 Bank Salaried Personal Loan underwriting manual. |
| **Informal / Unverified Cash Haircut** | **40% haircut (only 60% recognized)** | Cash income without ITR/GST or formal banking cannot be legally verified and fluctuates significantly. | Banking Surrogate Underwriting Standards (NBFC Informal Sector Assessment). |
| **Co-Applicant Income Recognition** | **100% formal, 50% informal** | Secondary earners (spouse/parent) provide real household support, but informal cash flow carries higher volatility. | Retail Credit Appraisal Manual. |
| **Minimum Survival Cushion (Hard Floor)** | **₹14,000/mo metro, ₹9,000/mo non-metro** | Irreducible baseline living expense for food, utilities, and emergency shelter before a single rupee can service debt. | NITI Aayog / NSSO urban-rural consumption expenditure benchmarks (inflated to 2026). |
| **Emergency Savings Threshold (Borrower Safe Carry)** | **3 months of living expenses + EMIs** | If a borrower has under 1 month buffer, taking an EMI creates an immediate default risk upon any health or income shock. | Financial Planning Standards Board (FPSB) & prudent lending judgment. |

---

## 2. Product Routing & Loan-To-Value (LTV) Rules

Borrowers frequently ask for the wrong loan product (e.g. unsecured personal loan when they hold unencumbered assets). The copilot actively steers borrowers to the most cost-effective structure.

| What | Value | Why | Source / Judgement |
| :--- | :--- | :--- | :--- |
| **Unsecured Personal Loan Max Tenure** | **60 months (5 years)** | Unsecured risk compounds over time; assets depreciate or consumption ends immediately while debt remains. | Indian Retail Banking norms. |
| **Loan Against Property (LAP) Max LTV** | **60% - 65% of market value** | Real estate is illiquid and distressed auctions realize haircuts. 60% LTV protects both lender and borrower from negative equity. | RBI Master Circular on Housing Finance & LAP guidelines. |
| **LAP Max Tenure** | **120 – 180 months (10 – 15 years)** | Long amortization lowers monthly EMI burden for large capital investments. | Commercial bank LAP product circulars. |
| **Two-Wheeler / EV Loan Max LTV** | **80% - 85% on-road price** | Vehicles depreciate rapidly (15-20% Year 1). 15% borrower equity is mandatory to avoid abandonment. | RBI Asset-Backed Lending guidelines & NBFC norms. |
| **Two-Wheeler / EV Max Tenure** | **36 – 48 months (3 – 4 years)** | Electric vehicle battery degradation and mechanical lifespan cap safe lending horizon to 3-4 years. | Auto finance industry standard. |
| **Secured Product Routing Rule (The "Ravi Rule")** | **If Loan Wanted > ₹5L AND unencumbered property exists, route to LAP** | Unsecured rate for self-employed with low ITR is 18%–24% (or rejected). LAP unlocks 9.0%–10.5% with 2x–3x higher borrowing capacity. | Core domain principle from Lokta challenge brief. |

---

## 3. Credit Score (CIBIL) & Risk Banding

The engine handles credit scores with honesty: missing scores are treated as **Unknown / Unscored**, never as default/zero.

| What | Value | Why | Source / Judgement |
| :--- | :--- | :--- | :--- |
| **Super Prime (Tier 1)** | **775 – 900** | Statistically negligible default probability (<1.2%). Eligible for lowest rack rates and fee waivers. | TransUnion CIBIL / Experian prime risk tier. |
| **Prime (Tier 2)** | **725 – 774** | Low default risk (~2.5%). Mainstream bank eligibility at standard card rates. | TransUnion CIBIL score distribution. |
| **Near Prime (Tier 3)** | **675 – 724** | Moderate risk. NBFCs and fintechs approve with 1.5% - 3.0% risk premium; PSU banks may ask for co-borrower. | Retail risk pricing grid. |
| **Subprime / Distressed** | **< 675** | High probability of past delinquency or high utilization. Major banks decline unsecured loans. | Credit Bureau cut-offs. |
| **Unknown / New-to-Credit (NTB)** | **Designated as -1 / No History (NH)** | First-time borrowers have no repayment track record. **Unknown is never 0 or 300.** Treated via surrogate banking & asset backing with +1.5% unscored buffer. | RBI Master Directions on Credit Information Companies & Brief Rule 3. |
| **Recent Bounce Penalty (The "Anita Rule")** | **Flagged as High Risk / "Don't Borrow"** | An EMI bounce within the last 90 days indicates active cash flow exhaustion. Adding debt creates a debt spiral. | Indian Banks' Association (IBA) credit underwriting policy. |
| **Predatory App Loan Threshold** | **Active loans at > 28% interest** | Servicing micro-loans at 30–40% drains borrower income faster than principal is retired. Must be consolidated or cleared before new debt. | RBI Guidelines on Digital Lending (September 2022). |

---

## 4. Benchmark Fair Interest Rates & RBI All-in APR

All quotes must include the statutory All-in APR (Annual Percentage Rate) disclosing processing fees and mandatory costs.

| Product | Base Benchmark (Prime) | Spread for Unscored / Moderate | High Risk / Distressed | Standard Processing Fee |
| :--- | :--- | :--- | :--- | :--- |
| **Personal Loan (Salaried)** | **10.50% – 11.50%** | **12.00% – 14.50%** | **16.00% – 22.00%** | 1.50% – 2.00% + 18% GST |
| **Personal Loan (Self-Employed)**| **12.00% – 13.50%** | **14.00% – 17.00%** | **18.00% – 24.00%** | 2.00% – 2.50% + 18% GST |
| **Loan Against Property (LAP)** | **8.90% – 9.75%** | **10.00% – 11.50%** | **12.00% – 14.00%** | 0.75% – 1.00% + 18% GST |
| **Two-Wheeler / EV Loan** | **10.50% – 12.50%** | **13.00% – 15.50%** | **16.50% – 20.00%** | 1.50% – 2.50% + 18% GST |
| **MSME / Business Secured** | **9.25% – 10.25%** | **10.50% – 12.00%** | **13.00% – 16.00%** | 1.00% – 1.50% + 18% GST |

### APR Calculation Formula (RBI Key Fact Statement Standard)
$$\text{Upfront Deductions} = \text{Loan Amount} \times (\text{Processing Fee \%} \times 1.18) + \text{Doc Charges}$$
$$\text{Net Disbursed Amount} = \text{Loan Amount} - \text{Upfront Deductions}$$
$$\text{APR} = \text{Internal Rate of Return (IRR) equating Net Disbursed Amount to monthly EMIs} \times 12$$

---

## 5. Decision Verdict Engine (O1 Rules)

The engine computes one of three verdicts: **Borrow**, **Borrow less**, or **Don't borrow**.

| Verdict | Trigger Conditions |
| :--- | :--- |
| **DON'T BORROW** | 1. **Active Debt Distress**: Borrower has recent bounced EMIs or active predatory app loans (>28% APR).<br>2. **Negative Discretionary Cash Flow**: Net income minus existing EMIs minus essential living expenses $\le$ 0.<br>3. **Zero Emergency Cushion with Consumption Loan**: Wedding/vacation loan when savings $< 1$ month expenses.<br>4. **Extreme Leverage**: Total debt obligations exceed 65% FOIR even on longest permissible tenure. |
| **BORROW LESS** | 1. **Requested Amount > Borrower Safe Carrying Capacity**: While the lender might approve it (e.g. high gross salary), the EMI would breach the 45% safe comfort ceiling.<br>2. **Productive Asset Down-Sizing**: Cash flow supports a partial loan, requiring an initial equity down payment. |
| **BORROW** | 1. **Requested Amount $\le$ Safe Carry Capacity AND $\le$ Lender Sanction**.<br>2. **Productive ROI**: For productive loans (scooter/kirana inventory), projected net earnings boost exceeds the monthly EMI.<br>3. **Healthy Emergency Reserve**: At least 3 months living expenses remain untouched. |

---

## 6. Confidence Dynamics ("Confidence Widens with Silence")

The engine starts with **Low Confidence (Wide Band)** when only Must-Questions are answered, and systematically tightens as precision questions are provided.

| Step Level | Information Provided | Rate Band Width | Amount Margin | Confidence Label |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 Only (Must Questions)** | Income, Employment, Existing EMIs, Rent, Desired Loan | **$\pm 3.5\%$** (7% spread) | **$\pm 25\%$** | **Low (Baseline Only)** |
| **Tier 2 Partial (+2 precision answers)** | + Credit score known, + Collateral or Employer Tier | **$\pm 1.75\%$** (3.5% spread) | **$\pm 15\%$** | **Medium (Calibrated)** |
| **Tier 2 Full (+4+ precision answers)** | + Bounces verified, + Emergency fund, + Productive ROI | **$\pm 0.60\%$** (1.2% spread) | **$\pm 5\%$** | **High (Verified Profile)** |

---

## 7. Stress Case Testing (O4 Rules)

The monthly EMI ceiling is subjected to two real-world shocks to test survival without default:

1. **Income Drop Shock (-20%)**: Simulates job disruption, medical hiatus, or seasonal business slump.
   - *Test Formula*: $\text{Post-Shock FOIR} = \frac{\text{Existing EMIs} + \text{Proposed EMI}}{\text{Net Income} \times 0.80}$
   - *Pass/Fail*: If Post-Shock FOIR $> 65\%$, the stress test fails and warns the borrower to reduce loan tenure or amount.
2. **Interest Rate Hike Shock (+200 bps / +2.0%)**: Simulates RBI monetary tightening on floating-rate loans (e.g. LAP/Home/Personal).
   - *Test Formula*: Recompute EMI at $(\text{Rate} + 2.0\%)$.
   - *Pass/Fail*: If stressed EMI increases monthly burden by $> ₹3,500$ or breaches cashflow surplus, flag for fixed rate or lower principal.

---

## 8. Honesty About Limits: What the Copilot Does Not Know & Where It Is Guessing

To maintain radical honesty with the borrower, this table documents the boundaries of this self-assessment and where institutional underwriting may deviate:

| Dimension | What We Do NOT Know | Where The App Is Guessing / Approximating | Why It Matters To The Borrower |
| :--- | :--- | :--- | :--- |
| **Bureau Inquiries (Hard Pulls)** | The app does not pull CIBIL/Experian to protect privacy and credit score. We do not know if the borrower applied to 5 other lenders this week. | We assume clean inquiry velocity unless the borrower reports recent loan rejections. | Applying at 4+ banks simultaneously drops CIBIL by 15-30 points and triggers automated underwriting decline. |
| **Property Title & Technical Valuation** | Whether property titles have legal encumbrances, multiple title-holders, agricultural zoning restrictions, or unapproved layouts. | We assume the ₹45L market value stated by the borrower will realize a 60% loan sanction. In reality, bank empanelled valuers apply 15-25% distress cuts. | Valuer technical report may value a ₹45L property at ₹38L, reducing the max sanction from ₹27L to ₹22.8L. |
| **Unrecorded Informal Cash Flow** | Actual gross margins of kirana / tailoring businesses without GST returns or audited P&L. | We apply a flat 40% haircut on unverified cash. | Some regional cooperative banks or NBFCs that do doorstep physical verification might recognize 70% of cash; conservative PSU banks recognize 0%. |
| **Branch Target Discounts** | End-of-quarter or financial year-end (March) branch manager discretionary rate concession pools (up to 25-50 bps). | We display prevailing standard card rack rate bands. | Borrowers visiting branches in the last 10 days of a fiscal quarter can often negotiate an extra 25 bps off headline rates. |
| **Pre-existing Health / Insurance Pre-conditions** | Medical underwriting criteria if the lender tries to bundle critical illness life cover. | We advise rejecting all bundled insurance per RBI Fair Practices, but some lenders make it difficult to opt out without branch manager signoff. | Borrowers must know they have the statutory right under RBI regulations to demand a pure loan without tied insurance. |

