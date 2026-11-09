# Indian Compensation, Pay Structure & Tax Visualizer

A clean, layman-friendly, deterministic Indian CTC compensation modeler and tax visualizer verified against Indian Tax Laws (Income Tax Act, 1961, FY 2024-25 / FY 2025-26).

---

## Layman-Centric Multi-Tab Architecture

The interface is structured into six dedicated tabs. Each tab delivers exactly **one clear, focused insight** with custom SVG line graphics and zero conceptual overlap:

### 1. Take-Home Pay ("What hits my bank account each month?")
- **Single Insight**: Exact monthly in-hand take-home deposit after all mandatory deductions.
- **Line Graphic**: 12-month cumulative cash deposit trajectory curve showing financial year accumulation.
- **Paycheck Math**: Clear, human-readable deduction breakdown (Gross $\rightarrow$ PF $\rightarrow$ PT $\rightarrow$ TDS $\rightarrow$ In-Hand).

### 2. New vs Old Tax ("Which tax regime saves me more money?")
- **Single Insight**: Direct comparison of whether to choose the New Tax Regime (Section 115BAC) or Old Tax Regime.
- **Line Graphic**: Side-by-side tax payable comparison lines and threshold indicator.
- **Layman Inputs**: Simple inputs for rent paid (HRA), PPF/ELSS (80C), and health insurance (80D).

### 3. Where CTC Goes ("Where does my package disappear?")
- **Single Insight**: How your total CTC converts into liquid cash, retiral savings (PF, Gratuity, NPS), and statutory taxes.
- **Line Graphic**: Horizontal flow pathway tracing CTC to net bank cash.
- **3-Bucket Split**: Percentage and rupee amounts for Cash In-Hand, Retirement Wealth, and Tax Outlay.

### 4. Growth & Surcharges ("What happens when I get a raise?")
- **Single Insight**: How tax and take-home scale as compensation grows from ₹6 Lakhs to ₹1.5 Crores.
- **Line Graphic**: Interactive SVG sensitivity chart of Take-Home vs CTC with toggle for Effective Marginal Tax Rate.
- **Marginal Relief Protection**: Visualizes the ₹50L and ₹1 Cr surcharge thresholds and illustrates how Section 115BAC marginal relief prevents cliff jumps.

### 5. RSU & Startup ESOPs ("How are stock grants taxed?")
- **Single Insight**: Two-stage stock taxation (Stage 1 Vesting Perquisite TDS vs Stage 2 Sale Capital Gains).
- **Line Graphic**: 4-year vesting milestone timeline with per-year unit distribution.
- **Section 80-IAC Startup Deferral**: Models the statutory 5-year tax deferral under Section 192(1C) for eligible DPIIT startups (₹0 cash tax paid today).

### 6. Employer True Cost ("What is the company's real cost?")
- **Single Insight**: The company's effective net outlay after deducting salary, PF, and corporate tax shields under Section 37(1).
- **Line Graphic**: Corporate Outlay Bridge Line comparing Stated CTC against Net Outlay.
- **Corporate Surcharge Profiles**: Domestic company tax profiles with base tax, turnover surcharges, and 4% Higher Education Cess.

---

## Running and Testing

### Run Development Server
```bash
npm run dev
```

### Run Automated Unit Tests
```bash
npm test
```

### Build Production Bundle
```bash
npm run build
```

---

## Statutory References
- **Income Tax Act, 1961**: Section 115BAC (Revised Slabs & Surcharges), Section 87A (Rebates), Section 192(1C) / 80-IAC (Startup ESOP Deferral), Section 10(13A) (HRA), Section 17(2)(vii) (Retirals perquisite ceiling), Section 80C, 80D, 80CCD(1), 80CCD(1B), 80CCD(2), Rule 3(7)(iii) (Meal Coupons), Section 10(5) (LTC).
- **Finance Act**: 4% Health and Education Cess.
- **Article 276(2), Constitution of India**: Maximum ₹2,500 annual cap on Professional Tax.
- **Employees' Provident Funds Act, 1952**: Wage ceiling ₹15,000/mo.
- **Payment of Gratuity Act, 1972**: 15/26 formula (~4.81% of Basic).
