export type TaxRegime = 'new' | 'old';
export type CityTier = 'metro' | 'non-metro';
export type AppMode = 'employee' | 'employer';
export type IndianState =
  | 'karnataka'
  | 'maharashtra'
  | 'telangana'
  | 'tamil_nadu'
  | 'delhi'
  | 'west_bengal'
  | 'gujarat'
  | 'haryana'
  | 'andhra_pradesh'
  | 'kerala'
  | 'uttar_pradesh'
  | 'other';

export type VestingScheduleType = 'cliff' | 'graded_equal' | 'graded_backloaded' | 'custom';
export type DispositionAction = 'hold' | 'sell_all' | 'sell_partial';

export interface CompanyPolicy {
  // PF Policy
  pfCapAtStatutoryLimit: boolean; // true = 12% on ₹15k cap (₹1,800/mo), false = 12% of actual Basic
  enableVPF: boolean;
  vpfPercentage: number; // additional % of basic by employee

  // Gratuity Policy
  gratuityIncludedInCTC: boolean; // true = included in gross CTC, false = over and above CTC
  gratuityRatePercent: number; // default 4.81%

  // HRA Allocation Policy
  defaultHraPercentOfBasic: number; // default 50% for metro / 40% for non-metro

  // Superannuation & NPS Policy
  employerNpsEnabled: boolean;
  employerNpsPercent: number; // 0-14%, default 10% for private
  superannuationEnabled: boolean;
  superannuationPercent: number; // e.g. 0% or 5%

  // RSU Cross-Charge Policy
  rsuCrossChargedToLocalEntity: boolean; // true = tax deductible for local Indian employer

  // Corporate Tax Policy (for employer mode)
  corporateTaxRate: number; // default 25.17% (22% + surcharge + cess) or 25%
}

export interface CompensationInputs {
  ctcAnnual: number;
  basicPercentOfCTC: number; // e.g. 40% or 50%
  customBasicAnnual?: number;
  hraPercentOfBasic: number; // e.g. 50% or 40%

  // Work Location & State Nuances
  state?: IndianState;
  selectedCity?: string;
  professionalTaxAnnual?: number;
  customProfessionalTaxOverride?: boolean;

  // Specific components
  ltaAnnual: number;
  foodCouponAnnual: number;
  booksAndPeriodicalsAnnual: number;
  communicationAnnual: number;
  otherFlexiAnnual: number;

  // Variable and Equity
  variablePayAnnual: number;
  rsuVestedValueAnnual: number;
  rsuUnvestedGrantAnnual: number;

  // Rent and Location for HRA (Sec 10(13A))
  monthlyRentPaid: number;
  cityTier: CityTier;

  // Old Regime Deductions
  deduction80C: number; // Max 1.5L
  deduction80D: number; // Health insurance
  deduction80CCD1B: number; // Self NPS (Max 50k)
  deductionHomeLoanInterest: number; // Sec 24b (Max 2L)
  deduction80E: number; // Education loan interest
  deduction80TTA: number; // Savings bank interest (Max 10k)
  otherExemptionsOldRegime: number;

  // Chosen regime in UI
  selectedRegime: TaxRegime;
}

export interface CompensationBreakdown {
  ctcAnnual: number;
  basicAnnual: number;
  hraAnnual: number;
  specialAllowanceAnnual: number; // Auto-balanced spillover
  ltaAnnual: number;
  otherAllowancesAnnual: number;
  variablePayAnnual: number;

  // Employer Contributions (Cost to Company side)
  employerPFAnnual: number;
  gratuityAnnual: number;
  employerNPSAnnual: number;
  superannuationAnnual: number;
  totalEmployerRetirals: number;

  // Equity
  rsuVestedAnnual: number;
  rsuUnvestedAnnual: number;

  // Gross Pay & Take-home Components
  grossSalaryAnnual: number; // CTC minus Employer Retirals & unvested RSUs (or Gross Earnings)

  // Employee Deductions from Pay Slip
  employeePFAnnual: number;
  employeeVPFAnnual: number;
  employeeNPSAnnual: number;
  professionalTaxAnnual: number;
  professionalTaxMonthly: number;
  stateApplied: IndianState;

  // Retiral Perquisite under Sec 17(2)(vii)
  retiralPerquisiteTaxable: number;

  // Allocation validation
  totalAllocated: number;
  isOverAllocated: boolean;
  unallocatedSpillover: number;
}

export interface TaxSlabDetail {
  slabRange: string;
  rate: number;
  taxableInSlab: number;
  taxAmount: number;
}

export interface TaxCalculationResult {
  regime: TaxRegime;
  grossTotalIncome: number;

  // Deductions & Exemptions applied
  standardDeduction: number;
  hraExemption: number;
  hraExemptionStateNote?: string;
  ltaExemption: number;
  chapterVIA80CDeduction: number;
  chapterVIA80DDeduction: number;
  chapterVIA80CCD1BDeduction: number;
  employerNPSDeduction80CCD2: number;
  otherDeductions: number;
  totalDeductionsAndExemptions: number;

  // Net Taxable Income
  netTaxableIncome: number;

  // Tax computations
  slabTax: number;
  slabBreakdown: TaxSlabDetail[];
  section87ARebate: number;
  taxAfterRebate: number;
  surchargeAmount: number;
  surchargeRatePercent: number;
  marginalRelief: number;
  healthAndEduCess: number;
  totalTaxLiabilityAnnual: number;
  totalTaxLiabilityMonthly: number;
  effectiveTaxRatePercent: number;

  // Net Take-Home (In-Hand Pay)
  annualInHandSalary: number;
  monthlyInHandSalary: number;
}

export interface RegimeComparison {
  oldRegime: TaxCalculationResult;
  newRegime: TaxCalculationResult;
  recommendedRegime: TaxRegime;
  taxDifferenceAnnual: number;
  monthlyTakeHomeDifference: number;
  summaryReason: string;
}

export interface EmployerTaxShield {
  grossCTC: number;
  deductibleExpenses: {
    basicAndAllowances: number;
    employerPF: number;
    gratuity: number;
    employerNPS: number;
    rsuCrossChargeDeductible: number;
    totalDeductible: number;
  };
  nonDeductibleExpenses: {
    rsuNonDeductible: number;
    otherNonDeductible: number;
    totalNonDeductible: number;
  };
  corporateTaxRate: number;
  corporateTaxShieldAmount: number;
  effectiveEmployerNetCost: number;
  taxSavingsPercentOfCTC: number;
}

export interface ComplianceAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  sectionReference?: string;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  iconName: string;
  ctc: number;
  basicPercent: number;
  hraPercent: number;
  variablePercent: number;
  rsuVestedPercent: number;
  rsuUnvestedPercent: number;
  lta: number;
  flexi: number;
}

export interface VestingYearDetail {
  year: number;
  vestingDate: string;
  vestPercentage: number;
  unitsVesting: number;
  fmvAtVestingUSD: number;
  perquisiteINR: number;
  isCurrentTaxYear: boolean;
}

export interface RSUTaxDetails {
  totalGrantedUnits: number;
  grantPriceUSD: number;
  usdToInrRate: number;
  fmvAtVestingUSD: number;
  unitsVested: number; // for single batch or current active year
  holdingPeriodMonths: number;
  salePriceUSD: number;
  isDomesticListed: boolean;

  // 1. Vesting Schedules
  vestingScheduleType?: VestingScheduleType;
  vestingDurationYears?: number; // e.g. 4 years
  currentTaxYearNumber?: number; // 1, 2, 3, 4
  customVestingPercentages?: number[]; // [25, 25, 25, 25] or [10, 20, 30, 40]

  // 2. Reload RSUs
  hasReloadFeature?: boolean;
  reloadGrantRatioPercent?: number; // e.g. 50% or 100% of withheld shares re-granted
  reloadFMVUSD?: number;
  reloadVestingPeriodMonths?: number;

  // 3. Disqualifying Dispositions & Capital Gains
  dispositionAction?: DispositionAction;
  soldUnits?: number;
}

export interface RSUTaxCalculationResult {
  // Current Year Vesting Perquisite (Stage 1)
  unitsVestingCurrentFY: number;
  perquisiteValueINR: number;
  perquisiteTaxINR: number;
  effectiveMarginalTaxRate: number;

  // Vesting Schedule Breakdown across years
  vestingScheduleBreakdown: VestingYearDetail[];

  // Capital Gains (Stage 2) & Disqualifying Disposition Evaluation
  soldUnits: number;
  costOfAcquisitionPerUnitINR: number;
  totalCostOfAcquisitionSoldINR: number;
  totalSaleProceedsINR: number;
  capitalGainsINR: number;
  isLTCG: boolean;
  isDisqualifyingDisposition: boolean; // Flagged when sold before LTCG holding period (12m domestic / 24m foreign)
  capitalGainsTaxRatePercent: number;
  capitalGainsTaxINR: number;
  disqualifyingTaxPenaltyINR: number; // Difference between STCG slab and preferential LTCG

  // Reload RSU impact
  reloadUnitsAwarded: number;
  reloadGrossValueINR: number;
  reloadPerquisiteFutureEstimateINR: number;
  reloadExplanation: string;

  // Totals
  totalTaxPaidINR: number;
  netRealizedGainINR: number;
}
