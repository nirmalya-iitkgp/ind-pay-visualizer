import {
  CompanyPolicy,
  CompensationInputs,
  CompensationBreakdown,
  TaxCalculationResult,
  TaxRegime,
  RegimeComparison,
  EmployerTaxShield,
  ComplianceAlert,
  TaxSlabDetail,
  RSUTaxDetails,
  RSUTaxCalculationResult,
  VestingYearDetail,
  IndianState,
} from '../types';
import { STATUTORY_LIMITS, STATE_PT_CONFIGS, CITY_HRA_NUANCES, CORPORATE_TAX_PROFILES } from './constants';

/**
 * Helper to compute State-specific Professional Tax
 */
export function computeStateProfessionalTax(
  monthlyGrossSalary: number,
  state: IndianState,
  manualOverride?: number,
  isOverridden?: boolean
): { annualTax: number; monthlyTax: number; stateConfig: (typeof STATE_PT_CONFIGS)[IndianState] } {
  const stateConfig = STATE_PT_CONFIGS[state] || STATE_PT_CONFIGS.other;

  if (isOverridden && manualOverride !== undefined && manualOverride >= 0) {
    const cappedAnnual = Math.min(2500, manualOverride);
    return {
      annualTax: cappedAnnual,
      monthlyTax: cappedAnnual / 12,
      stateConfig,
    };
  }

  if (!stateConfig.hasProfessionalTax) {
    return { annualTax: 0, monthlyTax: 0, stateConfig };
  }

  const matchedSlab = stateConfig.slabs.find(
    (slab) => monthlyGrossSalary >= slab.minMonthlySalary && monthlyGrossSalary <= slab.maxMonthlySalary
  );

  let monthlyTax = matchedSlab ? matchedSlab.monthlyTax : 0;
  let annualTax = 0;

  for (let month = 1; month <= 12; month++) {
    if (matchedSlab?.specialMonthTax && matchedSlab.specialMonthTax.month === month) {
      annualTax += matchedSlab.specialMonthTax.tax;
    } else {
      annualTax += monthlyTax;
    }
  }

  annualTax = Math.min(2500, annualTax);

  return {
    annualTax,
    monthlyTax: annualTax / 12,
    stateConfig,
  };
}

/**
 * 1. Compute Compensation Breakdown & Auto-balancing
 */
export function computeCompensationBreakdown(
  inputs: CompensationInputs,
  policy: CompanyPolicy
): CompensationBreakdown {
  const ctc = Math.max(0, inputs.ctcAnnual);

  // 1. Basic Pay
  let basicAnnual =
    inputs.customBasicAnnual !== undefined && inputs.customBasicAnnual > 0
      ? inputs.customBasicAnnual
      : (ctc * Math.max(0, inputs.basicPercentOfCTC)) / 100;
  basicAnnual = Math.min(ctc, Math.max(0, basicAnnual));

  // 2. HRA
  const hraPercent = Math.max(0, inputs.hraPercentOfBasic || policy.defaultHraPercentOfBasic);
  const hraAnnual = Math.min(ctc, (basicAnnual * hraPercent) / 100);

  // 3. Employer Retirals
  let employerPFAnnual = 0;
  if (policy.pfCapAtStatutoryLimit) {
    const monthlyPfWage = Math.min(basicAnnual / 12, STATUTORY_LIMITS.PF_MONTHLY_WAGE_CEILING);
    employerPFAnnual = monthlyPfWage * STATUTORY_LIMITS.PF_RATE * 12;
  } else {
    employerPFAnnual = basicAnnual * STATUTORY_LIMITS.PF_RATE;
  }

  let gratuityAnnual = 0;
  if (policy.gratuityIncludedInCTC) {
    const rate = (policy.gratuityRatePercent || 4.81) / 100;
    gratuityAnnual = basicAnnual * rate;
  }

  let employerNPSAnnual = 0;
  if (policy.employerNpsEnabled) {
    const npsPercent = Math.max(0, Math.min(14, policy.employerNpsPercent || 10)) / 100;
    employerNPSAnnual = basicAnnual * npsPercent;
  }

  let superannuationAnnual = 0;
  if (policy.superannuationEnabled) {
    const superPercent = Math.max(0, policy.superannuationPercent || 0) / 100;
    superannuationAnnual = basicAnnual * superPercent;
  }

  const totalEmployerRetirals = employerPFAnnual + gratuityAnnual + employerNPSAnnual + superannuationAnnual;

  // 4. Specific Allowances & Variable
  const ltaAnnual = Math.max(0, inputs.ltaAnnual || 0);
  const foodCouponAnnual = Math.max(0, inputs.foodCouponAnnual || 0);
  const booksAnnual = Math.max(0, inputs.booksAndPeriodicalsAnnual || 0);
  const commsAnnual = Math.max(0, inputs.communicationAnnual || 0);
  const otherFlexi = Math.max(0, inputs.otherFlexiAnnual || 0);
  const otherAllowancesAnnual = foodCouponAnnual + booksAnnual + commsAnnual + otherFlexi;

  const variablePayAnnual = Math.max(0, inputs.variablePayAnnual || 0);
  const rsuVestedAnnual = Math.max(0, inputs.rsuVestedValueAnnual || 0);
  const rsuUnvestedAnnual = Math.max(0, inputs.rsuUnvestedGrantAnnual || 0);

  // 5. Auto-Balancing Spillover to Special Allowance
  const fixedAllocated =
    basicAnnual +
    hraAnnual +
    totalEmployerRetirals +
    ltaAnnual +
    otherAllowancesAnnual +
    variablePayAnnual +
    rsuVestedAnnual;

  const unallocatedSpillover = ctc - fixedAllocated;
  const isOverAllocated = unallocatedSpillover < -1;
  const specialAllowanceAnnual = Math.max(0, unallocatedSpillover);
  const totalAllocated = fixedAllocated + specialAllowanceAnnual;

  // 6. Gross Salary
  const grossSalaryAnnual =
    basicAnnual +
    hraAnnual +
    specialAllowanceAnnual +
    ltaAnnual +
    otherAllowancesAnnual +
    variablePayAnnual +
    rsuVestedAnnual;

  // 7. State Professional Tax
  const monthlyGross = grossSalaryAnnual / 12;
  const ptResult = computeStateProfessionalTax(
    monthlyGross,
    inputs.state || 'karnataka',
    inputs.professionalTaxAnnual,
    inputs.customProfessionalTaxOverride
  );
  const professionalTaxAnnual = ptResult.annualTax;
  const professionalTaxMonthly = ptResult.monthlyTax;

  // 8. Employee Deductions
  const employeePFAnnual = employerPFAnnual;
  const employeeVPFAnnual = policy.enableVPF ? (basicAnnual * Math.max(0, policy.vpfPercentage || 0)) / 100 : 0;
  const employeeNpsTier1Annual = (basicAnnual * Math.max(0, Math.min(10, inputs.employeeNpsTier1Percent || 0))) / 100;
  const employeeNpsTier2Annual = Math.max(0, inputs.employeeNpsTier2Annual || 0);

  // 9. Sec 17(2)(vii) Retiral Perquisite
  const combinedRetirals = employerPFAnnual + employerNPSAnnual + superannuationAnnual;
  const retiralPerquisiteTaxable = Math.max(0, combinedRetirals - STATUTORY_LIMITS.RETIRAL_PERQUISITE_ANNUAL_CAP);

  return {
    ctcAnnual: ctc,
    basicAnnual,
    hraAnnual,
    specialAllowanceAnnual,
    ltaAnnual,
    otherAllowancesAnnual,
    foodCouponAnnual,
    variablePayAnnual,
    employerPFAnnual,
    gratuityAnnual,
    employerNPSAnnual,
    superannuationAnnual,
    totalEmployerRetirals,
    rsuVestedAnnual,
    rsuUnvestedAnnual,
    grossSalaryAnnual,
    employeePFAnnual,
    employeeVPFAnnual,
    employeeNpsTier1Annual,
    employeeNpsTier2Annual,
    professionalTaxAnnual,
    professionalTaxMonthly,
    stateApplied: inputs.state || 'karnataka',
    retiralPerquisiteTaxable,
    totalAllocated,
    isOverAllocated,
    unallocatedSpillover,
  };
}

/**
 * Compute Retiral Perquisite under Section 17(2)(vii)
 */
export function computeRetiralPerquisite(
  employerPFAnnual: number,
  employerNPSAnnual: number,
  superannuationAnnual: number = 0
): number {
  const combined = employerPFAnnual + employerNPSAnnual + superannuationAnnual;
  return Math.max(0, combined - STATUTORY_LIMITS.RETIRAL_PERQUISITE_ANNUAL_CAP);
}

/**
 * 2. Compute HRA Exemption (Sec 10(13A) + Rule 2A)
 */
export function computeHRAExemption(
  basicAnnual: number,
  hraReceivedAnnual: number,
  annualRentPaid: number,
  isMetro: boolean,
  cityName?: string
): {
  exemption: number;
  criteria: { actualHRA: number; rentMinus10PercentBasic: number; salaryPercentageLimit: number };
  stateNuanceNote?: string;
} {
  if (basicAnnual <= 0 || hraReceivedAnnual <= 0 || annualRentPaid <= 0) {
    return {
      exemption: 0,
      criteria: { actualHRA: hraReceivedAnnual, rentMinus10PercentBasic: 0, salaryPercentageLimit: 0 },
    };
  }

  const basic10Percent = basicAnnual * 0.1;
  const rentMinus10PercentBasic = Math.max(0, annualRentPaid - basic10Percent);
  const salaryPercentageLimit = basicAnnual * (isMetro ? 0.5 : 0.4);

  const exemption = Math.min(hraReceivedAnnual, rentMinus10PercentBasic, salaryPercentageLimit);

  let stateNuanceNote: string | undefined;
  if (cityName) {
    const cityNuance = CITY_HRA_NUANCES.find((c) => c.cityName.toLowerCase().includes(cityName.toLowerCase()));
    if (cityNuance) {
      stateNuanceNote = cityNuance.nuanceExplanation;
    }
  }

  return {
    exemption: Math.max(0, exemption),
    criteria: {
      actualHRA: hraReceivedAnnual,
      rentMinus10PercentBasic,
      salaryPercentageLimit,
    },
    stateNuanceNote,
  };
}

/**
 * 3. Exact Surcharge & Marginal Relief Calculator
 * Covers New Tax Regime (Section 115BAC) & Old Tax Regime
 * Smooths out the cliff edge above ₹50L, ₹1Cr, ₹2Cr (and ₹5Cr in Old Regime).
 */
export function computeSurchargeAndRelief(
  taxableIncome: number,
  baseTax: number,
  isNewRegime: boolean
): { surchargeAmount: number; surchargeRatePercent: number; marginalRelief: number; thresholdPassed: number } {
  if (taxableIncome <= 5000000 || baseTax <= 0) {
    return { surchargeAmount: 0, surchargeRatePercent: 0, marginalRelief: 0, thresholdPassed: 0 };
  }

  let rate = 0;
  let threshold = 5000000;
  let baseTaxAtThreshold = 0;
  let surchargeAtThreshold = 0;

  if (isNewRegime) {
    // New Regime: 0-3L 0%, 3-7L 5% (20k), 7-10L 10% (30k), 10-12L 15% (30k), 12-15L 20% (60k) = 1.4L up to 15L
    // At 50L: 1.4L + 30% of 35L = 11.90L. Surcharge = 0. Total = 11.90L
    // At 1Cr: 11.90L + 30% of 50L = 26.90L. Surcharge @ 10% = 2.69L. Total = 29.59L
    // At 2Cr: 11.90L + 30% of 1.5Cr = 56.90L. Surcharge @ 15% = 8.535L. Total = 65.435L
    if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
      rate = 0.1;
      threshold = 5000000;
      baseTaxAtThreshold = 1190000;
      surchargeAtThreshold = 0;
    } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
      rate = 0.15;
      threshold = 10000000;
      baseTaxAtThreshold = 2690000;
      surchargeAtThreshold = 269000;
    } else {
      // > 20000000 (New regime surcharge is capped at 25%)
      rate = 0.25;
      threshold = 20000000;
      baseTaxAtThreshold = 5690000;
      surchargeAtThreshold = 853500;
    }
  } else {
    // Old Regime: 0-2.5L 0%, 2.5-5L 5% (12.5k), 5-10L 20% (1L) = 1.125L up to 10L
    // At 50L: 1.125L + 30% of 40L = 13.125L. Surcharge = 0. Total = 13.125L
    // At 1Cr: 13.125L + 30% of 50L = 28.125L. Surcharge @ 10% = 2.8125L. Total = 30.9375L
    // At 2Cr: 13.125L + 30% of 1.5Cr = 58.125L. Surcharge @ 15% = 8.71875L. Total = 66.84375L
    // At 5Cr: 13.125L + 30% of 4.5Cr = 148.125L. Surcharge @ 25% = 37.03125L. Total = 185.15625L
    if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
      rate = 0.1;
      threshold = 5000000;
      baseTaxAtThreshold = 1312500;
      surchargeAtThreshold = 0;
    } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
      rate = 0.15;
      threshold = 10000000;
      baseTaxAtThreshold = 2812500;
      surchargeAtThreshold = 281250;
    } else if (taxableIncome > 20000000 && taxableIncome <= 50000000) {
      rate = 0.25;
      threshold = 20000000;
      baseTaxAtThreshold = 5812500;
      surchargeAtThreshold = 871875;
    } else {
      rate = 0.37;
      threshold = 50000000;
      baseTaxAtThreshold = 14812500;
      surchargeAtThreshold = 3703125;
    }
  }

  const rawSurcharge = baseTax * rate;
  let marginalRelief = 0;

  const excessIncome = taxableIncome - threshold;
  const totalTaxAtThreshold = baseTaxAtThreshold + surchargeAtThreshold;
  const maxAllowableTaxAndSurcharge = totalTaxAtThreshold + excessIncome;
  const currentTotal = baseTax + rawSurcharge;

  if (currentTotal > maxAllowableTaxAndSurcharge && excessIncome > 0) {
    marginalRelief = currentTotal - maxAllowableTaxAndSurcharge;
  }

  const finalSurcharge = Math.max(0, rawSurcharge - marginalRelief);

  return {
    surchargeAmount: finalSurcharge,
    surchargeRatePercent: rate * 100,
    marginalRelief: Math.max(0, marginalRelief),
    thresholdPassed: threshold,
  };
}

/**
 * 4. Compute Old Tax Regime Liability
 */
export function computeOldTax(
  breakdown: CompensationBreakdown,
  inputs: CompensationInputs
): TaxCalculationResult {
  const grossIncome = breakdown.grossSalaryAnnual + breakdown.retiralPerquisiteTaxable;
  const standardDeduction = STATUTORY_LIMITS.OLD_REGIME_STANDARD_DEDUCTION;
  const profTax = breakdown.professionalTaxAnnual;

  // HRA Exemption
  const isMetro = inputs.cityTier === 'metro';
  const annualRent = (inputs.monthlyRentPaid || 0) * 12;
  const { exemption: hraExemption, stateNuanceNote } = computeHRAExemption(
    breakdown.basicAnnual,
    breakdown.hraAnnual,
    annualRent,
    isMetro,
    inputs.selectedCity
  );

  // LTA & Meal Coupons (Rule 3(7)(iii)) Exemption
  const ltaExemption = Math.min(breakdown.ltaAnnual, inputs.ltaAnnual || 0);
  const mealCouponExemption = Math.min(
    STATUTORY_LIMITS.MEAL_COUPON_ANNUAL_EXEMPT_LIMIT,
    breakdown.foodCouponAnnual
  );

  // Chapter VI-A Deductions
  // Statutory 80C Pool: Employee PF + VPF + Employee NPS Tier-1 (80CCD(1)) + user 80C
  const statutory80CFromPF =
    breakdown.employeePFAnnual + breakdown.employeeVPFAnnual + breakdown.employeeNpsTier1Annual;
  const user80C = Math.max(0, inputs.deduction80C || 0);
  const chapterVIA80CDeduction = Math.min(
    STATUTORY_LIMITS.SECTION_80C_MAX,
    Math.max(statutory80CFromPF, user80C)
  );

  const chapterVIA80DDeduction = Math.min(
    STATUTORY_LIMITS.SECTION_80D_SELF_MAX + STATUTORY_LIMITS.SECTION_80D_PARENTS_MAX,
    Math.max(0, inputs.deduction80D || 0)
  );

  // Additional Self NPS under Section 80CCD(1B) (exclusive of 80C)
  const chapterVIA80CCD1BDeduction = Math.min(
    STATUTORY_LIMITS.SECTION_80CCD1B_NPS_MAX,
    Math.max(0, inputs.deduction80CCD1B || 0)
  );

  // Employer NPS under Section 80CCD(2)
  const employerNPSDeduction80CCD2 = breakdown.employerNPSAnnual;

  const homeLoanDeductionSec24b = Math.min(
    STATUTORY_LIMITS.SECTION_24B_HOME_LOAN_MAX,
    Math.max(0, inputs.deductionHomeLoanInterest || 0)
  );

  const deduction80TTA = Math.min(
    STATUTORY_LIMITS.SECTION_80TTA_MAX,
    Math.max(0, inputs.deduction80TTA || 0)
  );

  const otherDeductions =
    homeLoanDeductionSec24b +
    deduction80TTA +
    Math.max(0, inputs.deduction80E || 0) +
    Math.max(0, inputs.otherExemptionsOldRegime || 0);

  const totalDeductionsAndExemptions =
    standardDeduction +
    profTax +
    hraExemption +
    ltaExemption +
    mealCouponExemption +
    chapterVIA80CDeduction +
    chapterVIA80DDeduction +
    chapterVIA80CCD1BDeduction +
    employerNPSDeduction80CCD2 +
    otherDeductions;

  const netTaxableIncome = Math.max(0, grossIncome - totalDeductionsAndExemptions);

  const slabBreakdown: TaxSlabDetail[] = [];
  let slabTax = 0;

  const slab1Taxable = Math.min(netTaxableIncome, 250000);
  slabBreakdown.push({
    slabRange: '₹0 - ₹2,50,000',
    rate: 0,
    taxableInSlab: slab1Taxable,
    taxAmount: 0,
  });

  if (netTaxableIncome > 250000) {
    const slab2Taxable = Math.min(netTaxableIncome - 250000, 250000);
    const slab2Tax = slab2Taxable * 0.05;
    slabTax += slab2Tax;
    slabBreakdown.push({
      slabRange: '₹2,50,001 - ₹5,00,000',
      rate: 5,
      taxableInSlab: slab2Taxable,
      taxAmount: slab2Tax,
    });
  }

  if (netTaxableIncome > 500000) {
    const slab3Taxable = Math.min(netTaxableIncome - 500000, 500000);
    const slab3Tax = slab3Taxable * 0.2;
    slabTax += slab3Tax;
    slabBreakdown.push({
      slabRange: '₹5,00,001 - ₹10,00,000',
      rate: 20,
      taxableInSlab: slab3Taxable,
      taxAmount: slab3Tax,
    });
  }

  if (netTaxableIncome > 1000000) {
    const slab4Taxable = netTaxableIncome - 1000000;
    const slab4Tax = slab4Taxable * 0.3;
    slabTax += slab4Tax;
    slabBreakdown.push({
      slabRange: '> ₹10,00,000',
      rate: 30,
      taxableInSlab: slab4Taxable,
      taxAmount: slab4Tax,
    });
  }

  let section87ARebate = 0;
  if (netTaxableIncome <= STATUTORY_LIMITS.OLD_REGIME_87A_INCOME_LIMIT) {
    section87ARebate = Math.min(slabTax, STATUTORY_LIMITS.OLD_REGIME_87A_MAX_REBATE);
  }

  const taxAfterRebate = Math.max(0, slabTax - section87ARebate);

  const { surchargeAmount, surchargeRatePercent, marginalRelief } = computeSurchargeAndRelief(
    netTaxableIncome,
    taxAfterRebate,
    false
  );

  const taxBeforeCess = taxAfterRebate + surchargeAmount;
  const healthAndEduCess = taxBeforeCess * STATUTORY_LIMITS.CESS_RATE;
  const totalTaxLiabilityAnnual = taxBeforeCess + healthAndEduCess;
  const totalTaxLiabilityMonthly = totalTaxLiabilityAnnual / 12;

  const effectiveTaxRatePercent = grossIncome > 0 ? (totalTaxLiabilityAnnual / grossIncome) * 100 : 0;

  const annualInHandSalary =
    grossIncome -
    totalTaxLiabilityAnnual -
    breakdown.employeePFAnnual -
    breakdown.employeeVPFAnnual -
    breakdown.employeeNpsTier1Annual -
    breakdown.employeeNpsTier2Annual -
    profTax;
  const monthlyInHandSalary = annualInHandSalary / 12;

  return {
    regime: 'old',
    grossTotalIncome: grossIncome,
    standardDeduction,
    hraExemption,
    hraExemptionStateNote: stateNuanceNote,
    ltaExemption,
    mealCouponExemption,
    chapterVIA80CDeduction,
    chapterVIA80DDeduction,
    chapterVIA80CCD1BDeduction,
    employerNPSDeduction80CCD2,
    otherDeductions,
    totalDeductionsAndExemptions,
    netTaxableIncome,
    slabTax,
    slabBreakdown,
    section87ARebate,
    taxAfterRebate,
    surchargeAmount,
    surchargeRatePercent,
    marginalRelief,
    healthAndEduCess,
    totalTaxLiabilityAnnual,
    totalTaxLiabilityMonthly,
    effectiveTaxRatePercent,
    annualInHandSalary,
    monthlyInHandSalary,
  };
}

/**
 * 5. Compute New Tax Regime Liability (Section 115BAC - Revised FY 2024-25 / FY 2025-26)
 */
export function computeNewTax(
  breakdown: CompensationBreakdown,
  inputs: CompensationInputs
): TaxCalculationResult {
  const grossIncome = breakdown.grossSalaryAnnual + breakdown.retiralPerquisiteTaxable;
  const standardDeduction = STATUTORY_LIMITS.NEW_REGIME_STANDARD_DEDUCTION; // ₹75,000

  const employerNPSDeduction80CCD2 = breakdown.employerNPSAnnual;
  const totalDeductionsAndExemptions = standardDeduction + employerNPSDeduction80CCD2;
  const netTaxableIncome = Math.max(0, grossIncome - totalDeductionsAndExemptions);

  const slabBreakdown: TaxSlabDetail[] = [];
  let slabTax = 0;

  // Slab 1: 0 to 3L (0%)
  const s1 = Math.min(netTaxableIncome, 300000);
  slabBreakdown.push({ slabRange: '₹0 - ₹3,00,000', rate: 0, taxableInSlab: s1, taxAmount: 0 });

  // Slab 2: 3L to 7L (5%)
  if (netTaxableIncome > 300000) {
    const s2 = Math.min(netTaxableIncome - 300000, 400000);
    const tax2 = s2 * 0.05;
    slabTax += tax2;
    slabBreakdown.push({ slabRange: '₹3,00,001 - ₹7,00,000', rate: 5, taxableInSlab: s2, taxAmount: tax2 });
  }

  // Slab 3: 7L to 10L (10%)
  if (netTaxableIncome > 700000) {
    const s3 = Math.min(netTaxableIncome - 700000, 300000);
    const tax3 = s3 * 0.1;
    slabTax += tax3;
    slabBreakdown.push({ slabRange: '₹7,00,001 - ₹10,00,000', rate: 10, taxableInSlab: s3, taxAmount: tax3 });
  }

  // Slab 4: 10L to 12L (15%)
  if (netTaxableIncome > 1000000) {
    const s4 = Math.min(netTaxableIncome - 1000000, 200000);
    const tax4 = s4 * 0.15;
    slabTax += tax4;
    slabBreakdown.push({ slabRange: '₹10,00,001 - ₹12,00,000', rate: 15, taxableInSlab: s4, taxAmount: tax4 });
  }

  // Slab 5: 12L to 15L (20%)
  if (netTaxableIncome > 1200000) {
    const s5 = Math.min(netTaxableIncome - 1200000, 300000);
    const tax5 = s5 * 0.2;
    slabTax += tax5;
    slabBreakdown.push({ slabRange: '₹12,00,001 - ₹15,00,000', rate: 20, taxableInSlab: s5, taxAmount: tax5 });
  }

  // Slab 6: > 15L (30%)
  if (netTaxableIncome > 1500000) {
    const s6 = netTaxableIncome - 1500000;
    const tax6 = s6 * 0.3;
    slabTax += tax6;
    slabBreakdown.push({ slabRange: '> ₹15,00,000', rate: 30, taxableInSlab: s6, taxAmount: tax6 });
  }

  let section87ARebate = 0;
  if (netTaxableIncome <= STATUTORY_LIMITS.NEW_REGIME_87A_INCOME_LIMIT) {
    section87ARebate = Math.min(slabTax, STATUTORY_LIMITS.NEW_REGIME_87A_MAX_REBATE);
  }

  let taxAfterRebate = Math.max(0, slabTax - section87ARebate);
  if (netTaxableIncome > 700000 && netTaxableIncome < 727777) {
    const excessOver7L = netTaxableIncome - 700000;
    if (taxAfterRebate > excessOver7L) {
      taxAfterRebate = excessOver7L;
    }
  }

  const { surchargeAmount, surchargeRatePercent, marginalRelief } = computeSurchargeAndRelief(
    netTaxableIncome,
    taxAfterRebate,
    true
  );

  const taxBeforeCess = taxAfterRebate + surchargeAmount;
  const healthAndEduCess = taxBeforeCess * STATUTORY_LIMITS.CESS_RATE;
  const totalTaxLiabilityAnnual = taxBeforeCess + healthAndEduCess;
  const totalTaxLiabilityMonthly = totalTaxLiabilityAnnual / 12;

  const effectiveTaxRatePercent = grossIncome > 0 ? (totalTaxLiabilityAnnual / grossIncome) * 100 : 0;

  const profTax = breakdown.professionalTaxAnnual;
  const annualInHandSalary =
    grossIncome -
    totalTaxLiabilityAnnual -
    breakdown.employeePFAnnual -
    breakdown.employeeVPFAnnual -
    breakdown.employeeNpsTier1Annual -
    breakdown.employeeNpsTier2Annual -
    profTax;
  const monthlyInHandSalary = annualInHandSalary / 12;

  return {
    regime: 'new',
    grossTotalIncome: grossIncome,
    standardDeduction,
    hraExemption: 0,
    ltaExemption: 0,
    mealCouponExemption: 0,
    chapterVIA80CDeduction: 0,
    chapterVIA80DDeduction: 0,
    chapterVIA80CCD1BDeduction: 0,
    employerNPSDeduction80CCD2,
    otherDeductions: 0,
    totalDeductionsAndExemptions,
    netTaxableIncome,
    slabTax,
    slabBreakdown,
    section87ARebate,
    taxAfterRebate,
    surchargeAmount,
    surchargeRatePercent,
    marginalRelief,
    healthAndEduCess,
    totalTaxLiabilityAnnual,
    totalTaxLiabilityMonthly,
    effectiveTaxRatePercent,
    annualInHandSalary,
    monthlyInHandSalary,
  };
}

/**
 * 6. Compare Old vs New Tax Regimes
 */
export function compareRegimes(
  oldResult: TaxCalculationResult,
  newResult: TaxCalculationResult
): RegimeComparison {
  const taxDifferenceAnnual = oldResult.totalTaxLiabilityAnnual - newResult.totalTaxLiabilityAnnual;
  const monthlyTakeHomeDifference = newResult.monthlyInHandSalary - oldResult.monthlyInHandSalary;

  let recommendedRegime: TaxRegime = 'new';
  let summaryReason = '';

  if (taxDifferenceAnnual > 100) {
    recommendedRegime = 'new';
    summaryReason = `New Tax Regime saves you ₹${new Intl.NumberFormat('en-IN').format(
      Math.round(taxDifferenceAnnual)
    )} in annual tax (+₹${Math.round(monthlyTakeHomeDifference).toLocaleString(
      'en-IN'
    )}/mo in take-home pay) due to lower slab rates & ₹75k standard deduction.`;
  } else if (taxDifferenceAnnual < -100) {
    recommendedRegime = 'old';
    summaryReason = `Old Tax Regime saves you ₹${new Intl.NumberFormat('en-IN').format(
      Math.round(Math.abs(taxDifferenceAnnual))
    )} in annual tax due to your substantial itemized deductions (HRA, 80C, 80D, Home Loan interest).`;
  } else {
    recommendedRegime = 'new';
    summaryReason =
      'Both regimes yield virtually identical tax liabilities. The New Regime is recommended for simpler tax filing with zero documentation burden.';
  }

  return {
    oldRegime: oldResult,
    newRegime: newResult,
    recommendedRegime,
    taxDifferenceAnnual,
    monthlyTakeHomeDifference,
    summaryReason,
  };
}

/**
 * 7. Compute Employer Corporate Tax Shield & Effective Net Outlay
 * Includes Base Tax + Corporate Surcharge + 4% Higher Education Cess
 */
export function computeEmployerShield(
  breakdown: CompensationBreakdown,
  policy: CompanyPolicy
): EmployerTaxShield {
  const profileKey = policy.corporateTaxProfile || 'sec_115baa';
  const profileConfig = CORPORATE_TAX_PROFILES[profileKey];

  const baseCorporateTaxRate = profileConfig ? profileConfig.baseRate : policy.corporateBaseRate || 22;
  const surchargeRatePercent = profileConfig ? profileConfig.surchargeRate : policy.corporateSurchargeRate || 10;
  const cessRatePercent = profileConfig ? profileConfig.cessRate : policy.corporateCessRate || 4;
  const corporateTaxRate = profileConfig ? profileConfig.effectiveRate : policy.corporateTaxRate || 25.17;
  const taxProfileName = profileConfig ? profileConfig.name : 'Custom Domestic Profile';

  const basicAndAllowances =
    breakdown.basicAnnual +
    breakdown.hraAnnual +
    breakdown.specialAllowanceAnnual +
    breakdown.ltaAnnual +
    breakdown.otherAllowancesAnnual +
    breakdown.variablePayAnnual;

  const employerPF = breakdown.employerPFAnnual;
  const gratuity = breakdown.gratuityAnnual;
  const employerNPS = breakdown.employerNPSAnnual;

  let rsuCrossChargeDeductible = 0;
  let rsuNonDeductible = 0;

  if (breakdown.rsuVestedAnnual > 0) {
    if (policy.rsuCrossChargedToLocalEntity) {
      rsuCrossChargeDeductible = breakdown.rsuVestedAnnual;
    } else {
      rsuNonDeductible = breakdown.rsuVestedAnnual;
    }
  }

  const totalDeductible =
    basicAndAllowances +
    employerPF +
    gratuity +
    employerNPS +
    rsuCrossChargeDeductible;

  const totalNonDeductible = rsuNonDeductible;
  const corporateTaxShieldAmount = totalDeductible * (corporateTaxRate / 100);
  const effectiveEmployerNetCost = breakdown.ctcAnnual - corporateTaxShieldAmount;
  const taxSavingsPercentOfCTC =
    breakdown.ctcAnnual > 0 ? (corporateTaxShieldAmount / breakdown.ctcAnnual) * 100 : 0;

  return {
    grossCTC: breakdown.ctcAnnual,
    deductibleExpenses: {
      basicAndAllowances,
      employerPF,
      gratuity,
      employerNPS,
      rsuCrossChargeDeductible,
      totalDeductible,
    },
    nonDeductibleExpenses: {
      rsuNonDeductible,
      otherNonDeductible: 0,
      totalNonDeductible,
    },
    taxProfileName,
    baseCorporateTaxRate,
    surchargeRatePercent,
    cessRatePercent,
    corporateTaxRate,
    corporateTaxShieldAmount,
    effectiveEmployerNetCost,
    taxSavingsPercentOfCTC,
  };
}

/**
 * 8. Comprehensive RSU / ESOP Taxation Engine
 * Models:
 * 1. Vesting Schedules
 * 2. Stage 1 Perquisite Valuation & Startup ESOP Deferral under Sec 80-IAC / 192(1C)
 * 3. Capital Gains (Stage 2) & Disqualifying Dispositions
 * 4. Reload RSUs
 */
export function computeRSUTaxation(
  details: RSUTaxDetails,
  applicableIncomeTaxRatePercent: number
): RSUTaxCalculationResult {
  const totalUnits = details.totalGrantedUnits > 0 ? details.totalGrantedUnits : details.unitsVested;
  const durationYears = Math.max(1, details.vestingDurationYears || 4);
  const currentYearNum = Math.min(durationYears, Math.max(1, details.currentTaxYearNumber || 1));

  // 1. Compute Vesting Schedule Breakdown across years
  const scheduleBreakdown: VestingYearDetail[] = [];
  let currentYearVestPercent = 25;

  if (details.vestingScheduleType === 'cliff') {
    for (let yr = 1; yr <= durationYears; yr++) {
      const isCliffYear = yr === durationYears;
      const pct = isCliffYear ? 100 : 0;
      const units = (totalUnits * pct) / 100;
      const fmvINR = details.fmvAtVestingUSD * details.usdToInrRate;
      scheduleBreakdown.push({
        year: yr,
        vestingDate: `Year ${yr} (${isCliffYear ? 'Cliff Vest' : 'Locked'})`,
        vestPercentage: pct,
        unitsVesting: units,
        fmvAtVestingUSD: details.fmvAtVestingUSD,
        perquisiteINR: units * fmvINR,
        isCurrentTaxYear: yr === currentYearNum,
      });
      if (yr === currentYearNum) currentYearVestPercent = pct;
    }
  } else if (details.vestingScheduleType === 'graded_backloaded') {
    const backloadedWeights = [10, 20, 30, 40, 50].slice(0, durationYears);
    const sumWeights = backloadedWeights.reduce((a, b) => a + b, 0);
    for (let yr = 1; yr <= durationYears; yr++) {
      const pct = Math.round((backloadedWeights[yr - 1] / sumWeights) * 100);
      const units = (totalUnits * pct) / 100;
      const fmvINR = details.fmvAtVestingUSD * details.usdToInrRate;
      scheduleBreakdown.push({
        year: yr,
        vestingDate: `Year ${yr} (Backloaded ${pct}%)`,
        vestPercentage: pct,
        unitsVesting: units,
        fmvAtVestingUSD: details.fmvAtVestingUSD,
        perquisiteINR: units * fmvINR,
        isCurrentTaxYear: yr === currentYearNum,
      });
      if (yr === currentYearNum) currentYearVestPercent = pct;
    }
  } else if (details.vestingScheduleType === 'custom' && details.customVestingPercentages?.length) {
    for (let yr = 1; yr <= durationYears; yr++) {
      const pct = details.customVestingPercentages[yr - 1] || 0;
      const units = (totalUnits * pct) / 100;
      const fmvINR = details.fmvAtVestingUSD * details.usdToInrRate;
      scheduleBreakdown.push({
        year: yr,
        vestingDate: `Year ${yr} (Custom ${pct}%)`,
        vestPercentage: pct,
        unitsVesting: units,
        fmvAtVestingUSD: details.fmvAtVestingUSD,
        perquisiteINR: units * fmvINR,
        isCurrentTaxYear: yr === currentYearNum,
      });
      if (yr === currentYearNum) currentYearVestPercent = pct;
    }
  } else {
    const equalPct = 100 / durationYears;
    for (let yr = 1; yr <= durationYears; yr++) {
      const units = (totalUnits * equalPct) / 100;
      const fmvINR = details.fmvAtVestingUSD * details.usdToInrRate;
      scheduleBreakdown.push({
        year: yr,
        vestingDate: `Year ${yr} (${equalPct.toFixed(0)}% Graded)`,
        vestPercentage: equalPct,
        unitsVesting: units,
        fmvAtVestingUSD: details.fmvAtVestingUSD,
        perquisiteINR: units * fmvINR,
        isCurrentTaxYear: yr === currentYearNum,
      });
      if (yr === currentYearNum) currentYearVestPercent = equalPct;
    }
  }

  // 2. Stage 1: Current Tax Year Vesting & Perquisite
  const unitsVestingCurrentFY = (totalUnits * currentYearVestPercent) / 100;
  const fmvVestingINR = details.fmvAtVestingUSD * details.usdToInrRate;
  const perquisiteValueINR = unitsVestingCurrentFY * fmvVestingINR;
  const perquisiteTaxINR = perquisiteValueINR * (applicableIncomeTaxRatePercent / 100);

  // Startup ESOP Deferral (Section 80-IAC / Section 192(1C))
  const isStartupEligible = Boolean(details.isDPIITStartupEligible);
  let isTdsDeferred = false;
  let tdsDeferredAmountINR = 0;
  let immediateTdsPayableINR = perquisiteTaxINR;
  let deferralDueDateNote = 'Stage 1 TDS withheld at vesting.';

  if (isStartupEligible) {
    isTdsDeferred = true;
    tdsDeferredAmountINR = perquisiteTaxINR;
    immediateTdsPayableINR = 0;
    deferralDueDateNote = `TDS deferred under Section 192(1C) for up to ${
      details.deferralYearsLimit || 5
    } years from end of relevant FY or until share sale / resignation.`;
  }

  // 3. Stage 2: Disposition / Sale & Disqualifying Disposition Evaluation
  let soldUnits = 0;
  if (details.dispositionAction === 'sell_all') {
    soldUnits = unitsVestingCurrentFY;
  } else if (details.dispositionAction === 'sell_partial') {
    soldUnits = Math.min(unitsVestingCurrentFY, Math.max(0, details.soldUnits || 0));
  } else {
    soldUnits = 0;
  }

  const costOfAcquisitionPerUnitINR = fmvVestingINR;
  const totalCostOfAcquisitionSoldINR = soldUnits * costOfAcquisitionPerUnitINR;
  const salePriceINR = details.salePriceUSD * details.usdToInrRate;
  const totalSaleProceedsINR = soldUnits * salePriceINR;
  const capitalGainsINR = Math.max(0, totalSaleProceedsINR - totalCostOfAcquisitionSoldINR);

  let isLTCG = false;
  let isDisqualifyingDisposition = false;
  let capitalGainsTaxRatePercent = 0;
  const preferentialLTCGRate = 12.5;

  if (details.isDomesticListed) {
    isLTCG = details.holdingPeriodMonths >= 12;
    isDisqualifyingDisposition = !isLTCG && soldUnits > 0;
    capitalGainsTaxRatePercent = isLTCG ? 12.5 : 20.0;
  } else {
    isLTCG = details.holdingPeriodMonths >= 24;
    isDisqualifyingDisposition = !isLTCG && soldUnits > 0;
    capitalGainsTaxRatePercent = isLTCG ? 12.5 : applicableIncomeTaxRatePercent;
  }

  const capitalGainsTaxINR = capitalGainsINR * (capitalGainsTaxRatePercent / 100);

  const hypotheticalLTCGTax = capitalGainsINR * (preferentialLTCGRate / 100);
  const disqualifyingTaxPenaltyINR = isDisqualifyingDisposition
    ? Math.max(0, capitalGainsTaxINR - hypotheticalLTCGTax)
    : 0;

  // 4. Reload RSU Feature
  let reloadUnitsAwarded = 0;
  let reloadGrossValueINR = 0;
  let reloadPerquisiteFutureEstimateINR = 0;
  let reloadExplanation = 'Reload RSU feature is not enabled for this grant.';

  if (details.hasReloadFeature) {
    const sharesWithheldForTax = fmvVestingINR > 0 ? perquisiteTaxINR / fmvVestingINR : 0;
    const reloadRatio = (details.reloadGrantRatioPercent || 100) / 100;
    reloadUnitsAwarded = Math.round(sharesWithheldForTax * reloadRatio);

    const reloadFMVUSD = details.reloadFMVUSD > 0 ? details.reloadFMVUSD : details.fmvAtVestingUSD;
    const reloadFMVINR = reloadFMVUSD * details.usdToInrRate;
    reloadGrossValueINR = reloadUnitsAwarded * reloadFMVINR;
    reloadPerquisiteFutureEstimateINR = reloadGrossValueINR * (applicableIncomeTaxRatePercent / 100);

    reloadExplanation = `Reload Triggered: ${sharesWithheldForTax.toFixed(
      1
    )} units withheld to pay Stage 1 TDS triggered a reload grant of ${reloadUnitsAwarded} new RSUs at $${reloadFMVUSD}/share (Gross value: ₹${Math.round(
      reloadGrossValueINR
    ).toLocaleString('en-IN')}). These will vest in ${
      details.reloadVestingPeriodMonths || 12
    } months, generating future taxable salary perquisite.`;
  }

  const totalTaxPaidINR = immediateTdsPayableINR + capitalGainsTaxINR;
  const retainedUnsoldUnits = Math.max(0, unitsVestingCurrentFY - soldUnits);
  const retainedValueINR = retainedUnsoldUnits * fmvVestingINR;
  const netRealizedGainINR = totalSaleProceedsINR + retainedValueINR - totalTaxPaidINR;

  return {
    unitsVestingCurrentFY,
    perquisiteValueINR,
    perquisiteTaxINR,
    effectiveMarginalTaxRate: applicableIncomeTaxRatePercent,
    isTdsDeferred,
    tdsDeferredAmountINR,
    immediateTdsPayableINR,
    deferralDueDateNote,
    vestingScheduleBreakdown: scheduleBreakdown,
    soldUnits,
    costOfAcquisitionPerUnitINR,
    totalCostOfAcquisitionSoldINR,
    totalSaleProceedsINR,
    capitalGainsINR,
    isLTCG,
    isDisqualifyingDisposition,
    capitalGainsTaxRatePercent,
    capitalGainsTaxINR,
    disqualifyingTaxPenaltyINR,
    reloadUnitsAwarded,
    reloadGrossValueINR,
    reloadPerquisiteFutureEstimateINR,
    reloadExplanation,
    totalTaxPaidINR,
    netRealizedGainINR,
  };
}

/**
 * 9. Real-time Compliance, Guardrails & Smart Alerts
 * Brutally pruned to show only critical guardrails without fluff or filler!
 */
export function computeComplianceAlerts(
  breakdown: CompensationBreakdown,
  inputs: CompensationInputs,
  policy: CompanyPolicy
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];

  // 1. Over-allocation Error (Critical blocker)
  if (breakdown.isOverAllocated) {
    alerts.push({
      id: 'over-allocation-error',
      type: 'error',
      title: 'CTC Over-Allocated',
      message: `Total components exceed CTC by ₹${Math.round(Math.abs(breakdown.unallocatedSpillover)).toLocaleString(
        'en-IN'
      )}. Reduce component percentages or allowances.`,
      sectionReference: 'Auto-Balancing',
    });
  }

  // 2. Section 17(2)(vii) Retiral Perquisite Cap (> ₹7.5 Lakhs)
  const combinedRetirals =
    breakdown.employerPFAnnual + breakdown.employerNPSAnnual + breakdown.superannuationAnnual;
  if (combinedRetirals > STATUTORY_LIMITS.RETIRAL_PERQUISITE_ANNUAL_CAP) {
    const excess = combinedRetirals - STATUTORY_LIMITS.RETIRAL_PERQUISITE_ANNUAL_CAP;
    alerts.push({
      id: 'sec-17-2-vii-perquisite',
      type: 'warning',
      title: 'Retiral Perquisite Tax Triggered',
      message: `Employer PF + NPS + Superannuation total ₹${(combinedRetirals / 100000).toFixed(
        2
      )}L (exceeds ₹7.50L cap). Excess ₹${(excess / 100000).toFixed(2)}L added to taxable salary.`,
      sectionReference: 'Sec 17(2)(vii)',
    });
  }

  // 3. Non-deductible RSU Alert for Employer
  if (!policy.rsuCrossChargedToLocalEntity && breakdown.rsuVestedAnnual > 0) {
    alerts.push({
      id: 'rsu-cross-charge-nondeductible',
      type: 'warning',
      title: 'RSU Not Cross-Charged to Entity',
      message: `RSU perquisite of ₹${(breakdown.rsuVestedAnnual / 100000).toFixed(
        2
      )}L is not tax deductible by the local entity because cross-charging is disabled.`,
      sectionReference: 'Sec 37(1)',
    });
  }

  return alerts;
}
