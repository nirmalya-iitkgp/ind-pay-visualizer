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
import { STATUTORY_LIMITS, STATE_PT_CONFIGS, CITY_HRA_NUANCES } from './constants';

/**
 * Helper to compute State-specific Professional Tax
 * Based on monthly gross salary and state-mandated slabs.
 */
export function computeStateProfessionalTax(
  monthlyGrossSalary: number,
  state: IndianState,
  manualOverride?: number,
  isOverridden?: boolean
): { annualTax: number; monthlyTax: number; stateConfig: (typeof STATE_PT_CONFIGS)[IndianState] } {
  const stateConfig = STATE_PT_CONFIGS[state] || STATE_PT_CONFIGS.other;

  if (isOverridden && manualOverride !== undefined && manualOverride >= 0) {
    const cappedAnnual = Math.min(2500, manualOverride); // Max Article 276(2) Constitution cap
    return {
      annualTax: cappedAnnual,
      monthlyTax: cappedAnnual / 12,
      stateConfig,
    };
  }

  if (!stateConfig.hasProfessionalTax) {
    return { annualTax: 0, monthlyTax: 0, stateConfig };
  }

  // Find matching slab
  const matchedSlab = stateConfig.slabs.find(
    (slab) => monthlyGrossSalary >= slab.minMonthlySalary && monthlyGrossSalary <= slab.maxMonthlySalary
  );

  let monthlyTax = matchedSlab ? matchedSlab.monthlyTax : 0;
  let annualTax = 0;

  // Month-by-month calculation to account for February specific taxes (like Maharashtra)
  for (let month = 1; month <= 12; month++) {
    if (matchedSlab?.specialMonthTax && matchedSlab.specialMonthTax.month === month) {
      annualTax += matchedSlab.specialMonthTax.tax;
    } else {
      annualTax += monthlyTax;
    }
  }

  // Constitutional upper limit under Article 276(2)
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

  // 1. Basic Pay Calculation
  let basicAnnual =
    inputs.customBasicAnnual !== undefined && inputs.customBasicAnnual > 0
      ? inputs.customBasicAnnual
      : (ctc * Math.max(0, inputs.basicPercentOfCTC)) / 100;
  basicAnnual = Math.min(ctc, Math.max(0, basicAnnual));

  // 2. HRA Calculation
  const hraPercent = Math.max(0, inputs.hraPercentOfBasic || policy.defaultHraPercentOfBasic);
  const hraAnnual = Math.min(ctc, (basicAnnual * hraPercent) / 100);

  // 3. Employer Retirals Calculation
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
  const isOverAllocated = unallocatedSpillover < -1; // tolerance
  const specialAllowanceAnnual = Math.max(0, unallocatedSpillover);
  const totalAllocated = fixedAllocated + specialAllowanceAnnual;

  // 6. Gross Salary (Cash earnings subject to income tax per pay slip)
  const grossSalaryAnnual =
    basicAnnual +
    hraAnnual +
    specialAllowanceAnnual +
    ltaAnnual +
    otherAllowancesAnnual +
    variablePayAnnual +
    rsuVestedAnnual;

  // 7. State Professional Tax Calculation
  const monthlyGross = grossSalaryAnnual / 12;
  const ptResult = computeStateProfessionalTax(
    monthlyGross,
    inputs.state || 'karnataka',
    inputs.professionalTaxAnnual,
    inputs.customProfessionalTaxOverride
  );
  const professionalTaxAnnual = ptResult.annualTax;
  const professionalTaxMonthly = ptResult.monthlyTax;

  // 8. Employee Pay Slip Deductions
  const employeePFAnnual = employerPFAnnual;
  const employeeVPFAnnual = policy.enableVPF ? (basicAnnual * Math.max(0, policy.vpfPercentage || 0)) / 100 : 0;
  const employeeNPSAnnual = 0;

  // 9. Sec 17(2)(vii) Retiral Perquisite Check:
  const combinedRetirals = employerPFAnnual + employerNPSAnnual + superannuationAnnual;
  const retiralPerquisiteTaxable = Math.max(0, combinedRetirals - STATUTORY_LIMITS.RETIRAL_PERQUISITE_ANNUAL_CAP);

  return {
    ctcAnnual: ctc,
    basicAnnual,
    hraAnnual,
    specialAllowanceAnnual,
    ltaAnnual,
    otherAllowancesAnnual,
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
    employeeNPSAnnual,
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
 * 3. Compute Surcharge & Marginal Relief
 */
export function computeSurchargeAndRelief(
  taxableIncome: number,
  baseTax: number,
  isNewRegime: boolean
): { surchargeAmount: number; surchargeRatePercent: number; marginalRelief: number } {
  if (taxableIncome <= 5000000 || baseTax <= 0) {
    return { surchargeAmount: 0, surchargeRatePercent: 0, marginalRelief: 0 };
  }

  let rate = 0;
  let threshold = 5000000;

  if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
    rate = 0.1;
    threshold = 5000000;
  } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
    rate = 0.15;
    threshold = 10000000;
  } else if (taxableIncome > 20000000 && taxableIncome <= 50000000) {
    rate = 0.25;
    threshold = 20000000;
  } else if (taxableIncome > 50000000) {
    rate = isNewRegime ? 0.25 : 0.37;
    threshold = 50000000;
  }

  let surchargeAmount = baseTax * rate;
  let marginalRelief = 0;

  const excessIncome = taxableIncome - threshold;
  const approxThresholdTax = baseTax * (threshold / taxableIncome);
  const maxAllowableTaxAndSurcharge = approxThresholdTax + excessIncome;
  const currentTotal = baseTax + surchargeAmount;

  if (currentTotal > maxAllowableTaxAndSurcharge && excessIncome > 0) {
    marginalRelief = currentTotal - maxAllowableTaxAndSurcharge;
    surchargeAmount = Math.max(0, surchargeAmount - marginalRelief);
  }

  return {
    surchargeAmount: Math.max(0, surchargeAmount),
    surchargeRatePercent: rate * 100,
    marginalRelief: Math.max(0, marginalRelief),
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

  const ltaExemption = Math.min(breakdown.ltaAnnual, inputs.ltaAnnual || 0);

  // Chapter VI-A Deductions
  const statutory80CFromPF = breakdown.employeePFAnnual + breakdown.employeeVPFAnnual;
  const user80C = Math.max(0, inputs.deduction80C || 0);
  const chapterVIA80CDeduction = Math.min(
    STATUTORY_LIMITS.SECTION_80C_MAX,
    Math.max(statutory80CFromPF, user80C)
  );

  const chapterVIA80DDeduction = Math.min(
    STATUTORY_LIMITS.SECTION_80D_SELF_MAX + STATUTORY_LIMITS.SECTION_80D_PARENTS_MAX,
    Math.max(0, inputs.deduction80D || 0)
  );

  const chapterVIA80CCD1BDeduction = Math.min(
    STATUTORY_LIMITS.SECTION_80CCD1B_NPS_MAX,
    Math.max(0, inputs.deduction80CCD1B || 0)
  );

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
    grossIncome - totalTaxLiabilityAnnual - breakdown.employeePFAnnual - breakdown.employeeVPFAnnual - profTax;
  const monthlyInHandSalary = annualInHandSalary / 12;

  return {
    regime: 'old',
    grossTotalIncome: grossIncome,
    standardDeduction,
    hraExemption,
    hraExemptionStateNote: stateNuanceNote,
    ltaExemption,
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
    grossIncome - totalTaxLiabilityAnnual - breakdown.employeePFAnnual - breakdown.employeeVPFAnnual - profTax;
  const monthlyInHandSalary = annualInHandSalary / 12;

  return {
    regime: 'new',
    grossTotalIncome: grossIncome,
    standardDeduction,
    hraExemption: 0,
    ltaExemption: 0,
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
 */
export function computeEmployerShield(
  breakdown: CompensationBreakdown,
  policy: CompanyPolicy
): EmployerTaxShield {
  const corpTaxRate = policy.corporateTaxRate || 25.17;

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
  const corporateTaxShieldAmount = totalDeductible * (corpTaxRate / 100);
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
    corporateTaxRate: corpTaxRate,
    corporateTaxShieldAmount,
    effectiveEmployerNetCost,
    taxSavingsPercentOfCTC,
  };
}

/**
 * 8. Comprehensive RSU / ESOP Taxation Engine
 * Models:
 * 1. Vesting Schedules (Cliff, Graded Equal, Graded Backloaded, Custom) across FYs
 * 2. Perquisite Tax at Vesting (Stage 1)
 * 3. Capital Gains (Stage 2) & Disqualifying Dispositions (STCG vs LTCG)
 * 4. Reload RSUs (Automatic re-grant upon tax withholding)
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

  const totalTaxPaidINR = perquisiteTaxINR + capitalGainsTaxINR;
  const retainedUnsoldUnits = Math.max(0, unitsVestingCurrentFY - soldUnits);
  const retainedValueINR = retainedUnsoldUnits * fmvVestingINR;
  const netRealizedGainINR = totalSaleProceedsINR + retainedValueINR - totalTaxPaidINR;

  return {
    unitsVestingCurrentFY,
    perquisiteValueINR,
    perquisiteTaxINR,
    effectiveMarginalTaxRate: applicableIncomeTaxRatePercent,
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
 */
export function computeComplianceAlerts(
  breakdown: CompensationBreakdown,
  inputs: CompensationInputs,
  policy: CompanyPolicy
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];

  // 1. Over-allocation Error
  if (breakdown.isOverAllocated) {
    alerts.push({
      id: 'over-allocation-error',
      type: 'error',
      title: 'CTC Over-Allocated',
      message: `Total components exceed CTC by ${new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Math.abs(breakdown.unallocatedSpillover))}. Please reduce component percentages or allowances.`,
      sectionReference: 'Auto-Balancing',
    });
  }

  // 2. Code on Wages Guideline (Basic Pay < 50% CTC)
  const basicRatio = breakdown.ctcAnnual > 0 ? (breakdown.basicAnnual / breakdown.ctcAnnual) * 100 : 0;
  if (basicRatio < 50) {
    alerts.push({
      id: 'code-on-wages-warning',
      type: 'warning',
      title: 'Code on Wages Advisory',
      message: `Basic Pay is ${basicRatio.toFixed(
        1
      )}% of CTC. The recommended Indian wage practice under the Code on Wages suggests Basic Pay ≥ 50% to prevent excessive gratuity & retiral restructuring.`,
      sectionReference: 'Code on Wages, 2019',
    });
  }

  // 3. Section 17(2)(vii) Retiral Perquisite Cap (> ₹7.5 Lakhs)
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
      )}L, exceeding the ₹7.50L statutory ceiling. The excess ₹${(excess / 100000).toFixed(
        2
      )}L is added to taxable salary as perquisite under Sec 17(2)(vii).`,
      sectionReference: 'Income Tax Act Sec 17(2)(vii)',
    });
  }

  // 4. State Professional Tax Status Alert
  const stateConfig = STATE_PT_CONFIGS[inputs.state || 'karnataka'];
  if (!stateConfig.hasProfessionalTax) {
    alerts.push({
      id: 'state-pt-exempt-alert',
      type: 'success',
      title: `${stateConfig.stateName}: Zero Professional Tax`,
      message: `Employees based in ${stateConfig.stateName} are exempt from Professional Tax deductions, maximizing monthly in-hand cash.`,
      sectionReference: stateConfig.legalAct,
    });
  } else {
    alerts.push({
      id: 'state-pt-active-alert',
      type: 'info',
      title: `${stateConfig.stateName}: Professional Tax Applied`,
      message: `${stateConfig.description} (Annual deduction: ₹${breakdown.professionalTaxAnnual.toLocaleString(
        'en-IN'
      )}). Deductible under Sec 16(iii) in Old Tax Regime.`,
      sectionReference: stateConfig.legalAct,
    });
  }

  // 5. City HRA Nuance Alert
  if (inputs.selectedCity) {
    const cityNuance = CITY_HRA_NUANCES.find((c) =>
      c.cityName.toLowerCase().includes(inputs.selectedCity!.toLowerCase())
    );
    if (cityNuance && !cityNuance.isStatutoryMetro && cityNuance.isTechHubHighRent) {
      alerts.push({
        id: 'city-hra-nuance-alert',
        type: 'info',
        title: `HRA Classification Nuance: ${cityNuance.cityName}`,
        message: `${cityNuance.nuanceExplanation} HRA statutory cap is calculated strictly at ${cityNuance.hraCapPercent}% of Basic Pay.`,
        sectionReference: 'Income Tax Rule 2A',
      });
    }
  }

  // 6. HRA Rent Exemption Info
  const annualRent = (inputs.monthlyRentPaid || 0) * 12;
  const basic10Percent = breakdown.basicAnnual * 0.1;
  if (inputs.selectedRegime === 'old') {
    if (annualRent <= 0) {
      alerts.push({
        id: 'hra-zero-rent',
        type: 'info',
        title: 'HRA Exemption Inactive',
        message: 'No rent paid is specified. HRA received is 100% taxable under Old Tax Regime.',
        sectionReference: 'Sec 10(13A)',
      });
    } else if (annualRent <= basic10Percent) {
      alerts.push({
        id: 'hra-rent-under-10-percent',
        type: 'info',
        title: 'Rent ≤ 10% of Basic Pay',
        message: `Annual rent (₹${(annualRent / 1000).toFixed(0)}k) is less than 10% of Basic (₹${(
          basic10Percent / 1000
        ).toFixed(0)}k). Under Rule 2A, HRA exemption is ₹0.`,
        sectionReference: 'Rule 2A',
      });
    }
  }

  // 7. Statutory PF Cap status
  if (
    policy.pfCapAtStatutoryLimit &&
    breakdown.basicAnnual / 12 > STATUTORY_LIMITS.PF_MONTHLY_WAGE_CEILING
  ) {
    alerts.push({
      id: 'pf-capped-active',
      type: 'info',
      title: 'Statutory PF Cap Enforced',
      message: `PF contribution is capped at 12% of ₹15,000/mo (₹1,800/mo = ₹21,600/yr), maximizing employee monthly cash take-home pay.`,
      sectionReference: 'EPF Scheme Sec 26A',
    });
  }

  // 8. RSU Cross-charge Shield Alert for Employer
  if (!policy.rsuCrossChargedToLocalEntity && breakdown.rsuVestedAnnual > 0) {
    alerts.push({
      id: 'rsu-cross-charge-nondeductible',
      type: 'warning',
      title: 'RSU Not Cross-Charged to Entity',
      message: `RSU perquisite value of ₹${(breakdown.rsuVestedAnnual / 100000).toFixed(
        2
      )}L cannot be claimed as a deductible corporate expense because parent cross-charging is disabled.`,
      sectionReference: 'Sec 37(1) Deductibility',
    });
  }

  return alerts;
}
