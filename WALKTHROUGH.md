# Borrower Copilot — 5-Minute Written Walkthrough (WALKTHROUGH.md)

> *"Every lender has a model that decides what a borrower gets. The borrower has nothing. They walk in blind, take the first sanction letter, and find out three years later that they paid four points over fair and stretched to 65% of income."*
> — Lokta Challenge Brief

---

## 1. Product Philosophy & Architectural Decisions

Borrower Copilot is built on a single premise: **making the borrower the best-informed person in the room**.

### Core Architecture Highlights
1. **Separation of Rules from UI**:
   - The lending decision engine lives purely in [`src/engine/`](src/engine/) with zero UI or framework dependencies.
   - Every threshold, FOIR limit, credit band, and product benchmark is codified in [`src/engine/rules.ts`](src/engine/rules.ts) and documented in [`RULES.md`](RULES.md).
   - If an evaluator asks us in a live follow-up to change a rule (e.g. *"Lower LAP LTV from 60% to 50%"* or *"Make informal haircut 50% instead of 40%"*), it takes exactly one line change in `rules.ts` and all tests re-verify in 160ms.
2. **Zero-Backend Privacy Guarantee**:
   - Runs 100% client-side in the borrower’s browser.
   - No login, no phone number, no bureau pull, no server tracking.
3. **Sub-5-Minute Local Launch**:
   - Zero database setup, zero environment variable requirements. Runs on `npm install && npm run dev` instantly.

---

## 2. How the 5 Challenge Rules Were Honored

### Rule 1: Adaptive
* **Salaried IT Employee (Priya)**: Asked about MNC employer category (Tier 1 vs startup) and job vintage. Never asked about shop premises, cash books, or ITR turnover.
* **Kirana Store Owner (Ravi)**: Asked about filed ITR, shop vintage, unencumbered premises value, and secondary household income. Never asked about corporate employment tiers.
* **Informal Gig Worker (Anita)**: Asked about daily/weekly take-home, active app debt, recent EMI bounces, and electric vehicle income uplift.

### Rule 2: Confidence Widens with Silence
* When a borrower answers only the Tier 1 Must-Questions, the confidence engine locks into **Low Confidence**:
  - The interest rate band broadens to **±3.5%** (a 7% spread).
  - The loan amount uncertainty margin broadens to **±25%**.
  - The app transparently explains: *"Silence widens the band. Answering precision questions will narrow your negotiating range."*
* When precision questions (CIBIL score, collateral, emergency savings, clean history) are provided, confidence increases to **High** with a tight **±0.60%** institutional spread.

### Rule 3: Unknown is Never Zero
* When a borrower selects *"I don't know my credit score"* or *"Never taken a formal loan (No History)"*, the engine **never** assumes a 300 or default.
* It models the borrower as **Unscored / New-to-Credit (NTB)** with a standard +1.50% unscored margin and surrogate banking underwriting, exactly matching Indian institutional banking practices.

### Rule 4: Every Number Has a Why
* Every single output is backed by a plain-English, one-sentence explanation:
  - *"Your safe EMI ceiling is ₹35,500/mo because after your ₹28,000 rent, ₹25,000 living costs, and existing ₹14,000 EMI, exceeding ₹35,500 strips your monthly emergency buffer."*
  - *"Lenders allow up to ₹46,500/mo because standard credit policy caps total debt service at 55% of your recognized income."*

### Rule 5: India, in Rupees
* FOIR benchmarks are tiered (<₹35k = 40%, ₹35k–₹75k = 50%, >₹75k = 55%–60%).
* Unverified cash carries a 40% haircut.
* Interest rates reflect real Indian retail benchmarks (Personal Loan: 10.5%–14%, LAP: 9.0%–10.5%, 2W/EV: 11%–15%).
* statutory RBI **All-in APR** incorporates the mandatory 18% GST on processing fees and documentation charges amortized over loan tenure using true monthly IRR.

---

## 3. The Three Personas: Domain Reasoning

### Priya (Salaried MNC, Bengaluru)
* **The Dilemma**: Priya asks for ₹8,00,000 for a wedding (pure consumption). Banks will happily offer her ₹19,80,000 based on 55% FOIR on her ₹1,10,000 salary.
* **The Domain Insight**: Wedding expenses have 0% ROI. Combined with Bangalore rent of ₹28,000, borrowing ₹19.8L would leave her with 15% disposable cushion.
* **Copilot Action**: Outputs both numbers, tells her to **use the Borrower Safe Carry (₹11.1L or lower)**, and provides counter-scripts to negotiate her prime rate down to 10.75% while rejecting ₹20,000 bundled insurance.

### Ravi (Kirana Owner, Mysuru)
* **The Dilemma**: Ravi wants ₹15,00,000 for business expansion. His ITR shows only ₹4,20,000/year and he has no CIBIL score.
* **The Domain Insight**: An unsecured personal loan desk will either reject him or quote 22%+ interest. But Ravi owns an unencumbered shop premises worth ₹45,00,000!
* **Copilot Action**: Implements the **"Ravi Rule"** — dynamically routes him to **Loan Against Property (LAP)** at 60% LTV. Ravi qualifies for ₹15L at **9.25% – 10.50%**, saving over ₹8,50,000 in interest over 7 years.

### Anita (Informal Gig Rider, Hubballi)
* **The Dilemma**: Anita wants ₹1,50,000 for an EV scooter. She has 3 active predatory app loans at 30%+ and bounced an EMI last month.
* **The Domain Insight**: Adding an unsecured personal loan on top of active debt distress leads directly to default and harassment.
* **Copilot Action**: **"Don't Borrow" fires**. The copilot warns against predatory apps, prioritizes clearing the ₹35,000 app loans, and routes her to delivery-platform EV lease-to-own programs with PM E-Drive subsidies instead of cash borrowing.

---

## 4. What We Would Build Next (Product Roadmap)

1. **Account Aggregator (AA) Integration (ReBIT Standard)**:
   - An instant, consent-based bank statement analyzer using India's Account Aggregator framework (Setu, Finvu, OneMoney).
   - In 10 seconds, it would automatically verify cash flow volatility, count bounces, and calculate actual living expense burn without requiring manual input.
2. **KFS / Sanction Letter Camera OCR & Discrepancy Scanner**:
   - A borrower uploads or snaps a photo of the lender's sanction letter or WhatsApp quote.
   - The Copilot's local OCR reads the hidden terms: flagging hidden insurance deductions, processing fee markups, and highlighting if the headline interest rate conceals an inflated APR.
3. **Vernacular Audio Copilot (Voice-First UI)**:
   - For informal borrowers like Anita or micro-retailers like Ravi, an on-device voice interface in Kannada, Hindi, Tamil, and Marathi.
4. **Geo-coded Municipal Circle Rate Lookup**:
   - For LAP borrowers, auto-estimating property collateral value from municipal ward circle rates.

---

## 5. What We Would Cut (Ruthless Product Craft)

1. **Credit Bureau Score Estimators**:
   - Many apps attempt to "predict your CIBIL score" with 20 questions. We would cut this entirely. Predicting a score creates false precision; what matters for loan negotiation is knowing whether the borrower is prime, near-prime, or unscored.
2. **Generic Multi-Product Portals**:
   - We would cut generic listings of 50 different NBFC cards. A borrower doesn't want an affiliate aggregator; they want an honest, unbiased assessment of their specific leverage before they walk into a branch.
3. **Mandatory Login & Registration**:
   - Any requirement for OTP, email, or Aadhaar before seeing calculations creates drop-off and distrust. True borrower empowerment must remain zero-friction.
