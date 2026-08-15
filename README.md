# Indian Compensation, Pay Structure & Tax Visualizer

A 100% deterministic, interactive dual-sided Indian CTC compensation builder, pay structure modeler, and tax visualizer verified against Indian Tax Laws (Income Tax Act, 1961, FY 2024-25 / FY 2025-26).

---

## Key Features

### 1. Dual-Perspective Architecture
- **Employee View**: Models exact monthly and annual in-hand take-home pay, compares **New Tax Regime (Section 115BAC)** vs **Old Tax Regime**, calculates statutory itemized exemptions (HRA under Rule 2A, Standard Deduction ₹75k/₹50k, 80C, 80D, 80CCD(1B)), and provides dynamic tax slab breakdowns.
- **Employer / HR View**: Models corporate tax shields on deductible CTC components (Basic, Allowances, PF, Gratuity, NPS, cross-charged RSUs), computes the **Effective Net Outlay to Company**, and flags non-deductible expenses.

### 2. State-Specific Professional Tax (PT) & City HRA Nuances
- **State-by-State Professional Tax Engine**: Deterministic calculation across Indian States (Karnataka, Maharashtra, Telangana, Tamil Nadu, West Bengal, Gujarat, Andhra Pradesh, Delhi, etc.) with support for monthly brackets, February-specific surcharges (e.g. Maharashtra ₹300), and the constitutional ceiling under Article 276(2) (₹2,500/year).
- **HRA Statutory Classification & Nuances**: Distinguishes statutory metros under Income Tax Rule 2A (Mumbai, Delhi, Kolkata, Chennai - 50% cap) from major tech hubs (Bangalore, Hyderabad, Pune, Gurugram - 40% cap) with informational notes on market rent dynamics.

### 3. Advanced RSU & Equity Tax Modeler
- **Multi-Year Vesting Schedules**: Supports Graded Equal, Amazon-style Graded Backloaded, Cliff, and Custom vesting timelines with year-by-year perquisite valuation.
- **Reload RSU Grants**: Models automatic new RSU grants triggered when shares are withheld to satisfy Stage 1 tax withholding.
- **Disqualifying Dispositions**: Flags early liquidation before statutory holding periods (12 months for domestic listed; 24 months for foreign/unlisted shares), calculating exact tax penalties and shifting gains from concessional LTCG (12.5%) to slab-rate STCG.

### 4. Global Company Policy Engine (Firm-Specific Rules)
- **Provident Fund (PF) Policy**: Toggle between Statutory Ceiling (12% of ₹15,000/month = ₹1,800/mo cap) to maximize monthly cash in-hand, or full 12% on uncapped Basic Pay. Supports Voluntary PF (VPF).
- **Gratuity Policy**: Toggle whether 4.81% gratuity (Payment of Gratuity Act, 1972) is structured inside CTC or provided over-and-above CTC.
- **HRA Allocation Policy**: Custom % allocation of Basic Pay into House Rent Allowance (50% Metro / 40% Non-Metro).
- **Superannuation & NPS Policy**: Configure employer NPS contribution (Sec 80CCD(2), up to 14%) and corporate superannuation.
- **Retiral Perquisite Rule (Sec 17(2)(vii))**: Tracks the combined ₹7,50,000 annual ceiling on Employer PF + NPS + Superannuation, automatically adding any excess into taxable salary perquisites.
- **Equity Cross-Charge Policy**: Toggle cross-charging of parent company RSUs to local Indian entity to determine Sec 37(1) corporate tax deductibility.

### 5. Idiot-Proofing & Compliance Guardrails
- **Auto-Balancing Spillover**: Automatically spills residual unallocated CTC into Special Allowance. Over-allocated components trigger an instant visual warning.
- **Code on Wages Advisory**: Flags CTC configurations where Basic Pay is less than 50% of total CTC.
- **HRA Exemption Formula**: Evaluates the minimum of:
  1. Actual HRA received
  2. Rent paid minus 10% of Basic Pay
  3. 50% Basic (Metro) / 40% Basic (Non-Metro)
  *(Flags when rent paid is $\le$ 10% of Basic)*.
- **Pay Slip Generation**: Generates printable standard monthly salary slips with earnings, employee PF, Professional Tax, and TDS deductions.

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

## Statutory References & Verification
- **Income Tax Act, 1961**: Section 115BAC (Revised Slabs & ₹75,000 Standard Deduction), Section 87A (Rebates), Section 10(13A) (HRA), Section 17(2)(vii) (Retirals perquisite ceiling), Section 80C, 80D, 80CCD(1B), 80CCD(2).
- **Article 276(2), Constitution of India**: Maximum ₹2,500 annual cap on Professional Tax.
- **Employees' Provident Funds and Miscellaneous Provisions Act, 1952**: Wage ceiling ₹15,000/mo.
- **Payment of Gratuity Act, 1972**: 15/26 days per completed year formula (~4.81% of Basic).
- **Code on Wages, 2019**: Wage definition guideline (Basic Pay $\ge$ 50% of CTC).
