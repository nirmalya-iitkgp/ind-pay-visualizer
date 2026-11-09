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

export type CorporateTaxProfileType =
  | 'sec_115baa'
  | 'sec_115bab'
  | 'sme_upto_1cr'
  | 'sme_1cr_to_10cr'
  | 'sme_above_10cr'
  | 'large_above_10cr'
  | 'custom';

export interface CompanyPolicy {
  // PF Policy
  pfCapAtStatutoryLimit: boolean;
  enableVPF: boolean;
  vpfPercentage: number;

  // Gratuity Policy
  gratuityIncludedInCTC: boolean;
  gratuityRatePercent: number;

  // HRA Allocation Policy
  defaultHraPercentOfBasic: number;

  // Superannuation & NPS Policy
  employerNpsEnabled: boolean;
  employerNpsPercent: number; // 0-14% (typically 10%)
  superannuationEnabled: boolean;
  superannuationPercent: number;

  // RSU Cross-Charge Policy
  rsuCrossChargedToLocalEntity: boolean;

  // Corporate Tax Policy (Employer Mode)
  corporateTaxProfile: CorporateTaxProfileType;
  corporateBaseRate: number; // e.g. 22%, 15%, 25%, 30%
  corporateSurchargeRate: number; // e.g. 0%, 7%, 10%, 12%
  corporateCessRate: number; // 4% Higher Education Cess
  corporateTaxRate: number; // Combined effective corporate tax rate
}

export interface CompensationInputs {
  ctcAnnual: number;
  basicPercentOfCTC: number;
  customBasicAnnual?: number;
  hraPercentOfBasic: number;

  // Location & State
  state?: IndianState;
  selectedCity?: string;
  professionalTaxAnnual?: number;
  customProfessionalTaxOverride?: boolean;

  // Allowances & Meal / LTC
  ltaAnnual: number;
  foodCouponAnnual: number; // Meal coupons (Sodexo / Pluxee / Zaggle)
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

  // NPS Employee Contributions
  employeeNpsTier1Percent: number; // 0-10% of Basic Pay (80CCD(1))
  employeeNpsTier2Annual: number; // Voluntary liquid layer

  // Old Regime Deductions
  deduction80C: number;
  deduction80D: number;
  deduction80CCD1B: number; // Additional self NPS (Max 50k)
  deductionHomeLoanInterest: number;
  deduction80E: number;
  deduction80TTA: number;
  otherExemptionsOldRegime: number;

  selectedRegime: TaxRegime;
}

export interface CompensationBreakdown {
  ctcAnnual: number;
  basicAnnual: number;
  hraAnnual: number;
  specialAllowanceAnnual: number;
  ltaAnnual: number;
  otherAllowancesAnnual: number;
  foodCouponAnnual: number;
  variablePayAnnual: number;

  // Employer Contributions
  employerPFAnnual: number;
  gratuityAnnual: number;
  employerNPSAnnual: number;
  superannuationAnnual: number;
  totalEmployerRetirals: number;

  // Equity
  rsuVestedAnnual: number;
  rsuUnvestedAnnual: number;

  // Gross Earnings
  grossSalaryAnnual: number;

  // Employee Deductions from Pay Slip
  employeePFAnnual: number;
  employeeVPFAnnual: number;
  employeeNpsTier1Annual: number;
  employeeNpsTier2Annual: number;
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
  mealCouponExemption: number;
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

  // Net Take-Home
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
  taxProfileName: string;
  baseCorporateTaxRate: number;
  surchargeRatePercent: number;
  cessRatePercent: number;
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
  unitsVested: number;
  holdingPeriodMonths: number;
  salePriceUSD: number;
  isDomesticListed: boolean;

  // Vesting Schedules
  vestingScheduleType?: VestingScheduleType;
  vestingDurationYears?: number;
  currentTaxYearNumber?: number;
  customVestingPercentages?: number[];

  // Startup ESOP Deferral (Section 80-IAC / Section 192(1C))
  isDPIITStartupEligible?: boolean;
  deferralYearsLimit?: number; // default 5 years / 60 months

  // Reload RSUs
  hasReloadFeature?: boolean;
  reloadGrantRatioPercent?: number;
  reloadFMVUSD?: number;
  reloadVestingPeriodMonths?: number;

  // Disqualifying Dispositions & Capital Gains
  dispositionAction?: DispositionAction;
  soldUnits?: number;
}

export interface RSUTaxCalculationResult {
  // Current Year Vesting Perquisite (Stage 1)
  unitsVestingCurrentFY: number;
  perquisiteValueINR: number;
  perquisiteTaxINR: number;
  effectiveMarginalTaxRate: number;

  // ESOP Deferral (Section 80-IAC)
  isTdsDeferred: boolean;
  tdsDeferredAmountINR: number;
  immediateTdsPayableINR: number;
  deferralDueDateNote: string;

  // Vesting Schedule Breakdown across years
  vestingScheduleBreakdown: VestingYearDetail[];

  // Capital Gains (Stage 2) & Disqualifying Disposition Evaluation
  soldUnits: number;
  costOfAcquisitionPerUnitINR: number;
  totalCostOfAcquisitionSoldINR: number;
  totalSaleProceedsINR: number;
  capitalGainsINR: number;
  isLTCG: boolean;
  isDisqualifyingDisposition: boolean;
  capitalGainsTaxRatePercent: number;
  capitalGainsTaxINR: number;
  disqualifyingTaxPenaltyINR: number;

  // Reload RSU impact
  reloadUnitsAwarded: number;
  reloadGrossValueINR: number;
  reloadPerquisiteFutureEstimateINR: number;
  reloadExplanation: string;

  // Totals
  totalTaxPaidINR: number;
  netRealizedGainINR: number;
}
