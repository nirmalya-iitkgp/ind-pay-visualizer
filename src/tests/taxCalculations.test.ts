import { describe, it, expect } from 'vitest';
import {
  computeCompensationBreakdown,
  computeHRAExemption,
  computeOldTax,
  computeNewTax,
  computeEmployerShield,
  computeRetiralPerquisite,
  computeRSUTaxation,
  computeStateProfessionalTax,
  computeSurchargeAndRelief,
} from '../utils/taxCalculations';
import {
  DEFAULT_COMPANY_POLICY,
  DEFAULT_COMPENSATION_INPUTS,
  STATUTORY_LIMITS,
  STATE_PT_CONFIGS,
  CITY_HRA_NUANCES,
  CORPORATE_TAX_PROFILES,
} from '../utils/constants';

describe('Indian Tax & Compensation Engine Tests', () => {
  it('should auto-balance CTC components into Special Allowance', () => {
    const inputs = {
      ...DEFAULT_COMPENSATION_INPUTS,
      ctcAnnual: 2000000, // 20 LPA
      basicPercentOfCTC: 40, // Basic = 8,00,000
      hraPercentOfBasic: 50, // HRA = 4,00,000
      ltaAnnual: 50000,
      otherFlexiAnnual: 50000,
      foodCouponAnnual: 24000,
      booksAndPeriodicalsAnnual: 24000,
      communicationAnnual: 24000,
      variablePayAnnual: 200000,
      rsuVestedValueAnnual: 0,
      rsuUnvestedGrantAnnual: 0,
    };

    const breakdown = computeCompensationBreakdown(inputs, DEFAULT_COMPANY_POLICY);

    expect(breakdown.basicAnnual).toBe(800000);
    expect(breakdown.hraAnnual).toBe(400000);
    expect(breakdown.employerPFAnnual).toBe(21600);
    expect(breakdown.gratuityAnnual).toBeCloseTo(38480, -1);
    expect(breakdown.totalAllocated).toBe(2000000);
    expect(breakdown.isOverAllocated).toBe(false);
    expect(breakdown.specialAllowanceAnnual).toBeGreaterThan(0);
  });

  it('should accurately calculate State-specific Professional Tax (PT)', () => {
    const karnatakaPT = computeStateProfessionalTax(50000, 'karnataka');
    expect(karnatakaPT.annualTax).toBe(2400);

    const maharashtraPT = computeStateProfessionalTax(50000, 'maharashtra');
    expect(maharashtraPT.annualTax).toBe(2500);

    const delhiPT = computeStateProfessionalTax(100000, 'delhi');
    expect(delhiPT.annualTax).toBe(0);

    const telanganaPT = computeStateProfessionalTax(80000, 'telangana');
    expect(telanganaPT.annualTax).toBe(2400);
  });

  it('should accurately calculate HRA Exemption and note city nuances', () => {
    const basic = 600000;
    const hraReceived = 300000;
    const rentPaidAnnual = 240000;

    const metroRes = computeHRAExemption(basic, hraReceived, rentPaidAnnual, true, 'Mumbai');
    expect(metroRes.exemption).toBe(180000);
    expect(metroRes.criteria.rentMinus10PercentBasic).toBe(180000);

    const bangaloreRes = computeHRAExemption(basic, hraReceived, rentPaidAnnual, false, 'Bangalore');
    expect(bangaloreRes.exemption).toBe(180000);
    expect(bangaloreRes.stateNuanceNote).toBeDefined();

    const zeroExemption = computeHRAExemption(basic, hraReceived, 50000, false);
    expect(zeroExemption.exemption).toBe(0);
  });

  it('should calculate New Regime Tax with ₹75k Standard Deduction & Sec 87A zero tax up to ₹7.75L CTC', () => {
    const inputs = {
      ...DEFAULT_COMPENSATION_INPUTS,
      ctcAnnual: 775000,
      basicPercentOfCTC: 50,
      hraPercentOfBasic: 50,
      variablePayAnnual: 0,
      ltaAnnual: 0,
      foodCouponAnnual: 0,
      booksAndPeriodicalsAnnual: 0,
      communicationAnnual: 0,
      otherFlexiAnnual: 0,
    };

    const policy = {
      ...DEFAULT_COMPANY_POLICY,
      pfCapAtStatutoryLimit: true,
      gratuityIncludedInCTC: false,
    };

    const breakdown = computeCompensationBreakdown(inputs, policy);
    const newTaxRes = computeNewTax(breakdown, inputs);

    expect(newTaxRes.standardDeduction).toBe(75000);
    expect(newTaxRes.netTaxableIncome).toBeLessThanOrEqual(700000);
    expect(newTaxRes.totalTaxLiabilityAnnual).toBe(0);
  });

  it('should calculate exact Surcharge and Marginal Relief in New Regime above ₹50L', () => {
    // In New Regime, tax on ₹50,00,000 = ₹11,90,000 with 0 surcharge.
    // For ₹51,00,000 (₹1L excess income):
    // Base tax = ₹11,90,000 + 30% of 1L = ₹12,20,000.
    // Raw 10% surcharge = ₹1,22,000 -> Total = ₹13,42,000.
    // Max allowable tax = Tax on 50L (11.9L) + Excess income (1L) = ₹12,90,000.
    // Marginal relief = 13,42,000 - 12,90,000 = ₹52,000.
    // Net surcharge = 1,22,000 - 52,000 = ₹70,000.
    // Net tax before cess = 12,20,000 + 70,000 = ₹12,90,000.
    const taxableIncome = 5100000;
    const baseTax = 1220000;
    const { surchargeAmount, surchargeRatePercent, marginalRelief } = computeSurchargeAndRelief(
      taxableIncome,
      baseTax,
      true
    );

    expect(surchargeRatePercent).toBe(10);
    expect(marginalRelief).toBe(52000);
    expect(surchargeAmount).toBe(70000);
    expect(baseTax + surchargeAmount).toBe(1290000);
  });

  it('should factor in Employee NPS Tier-I (80CCD(1)) and Tier-II liquid investments', () => {
    const inputs = {
      ...DEFAULT_COMPENSATION_INPUTS,
      ctcAnnual: 1500000,
      basicPercentOfCTC: 40, // Basic = 6,00,000
      employeeNpsTier1Percent: 10, // 10% of 6L = 60,000
      employeeNpsTier2Annual: 50000, // 50,000 liquid layer
    };

    const breakdown = computeCompensationBreakdown(inputs, DEFAULT_COMPANY_POLICY);
    expect(breakdown.employeeNpsTier1Annual).toBe(60000);
    expect(breakdown.employeeNpsTier2Annual).toBe(50000);

    const oldTax = computeOldTax(breakdown, inputs);
    // 80C deduction should factor in statutory PF + NPS Tier 1
    expect(oldTax.chapterVIA80CDeduction).toBeGreaterThanOrEqual(60000);
    // In-hand pay must subtract both employee NPS Tier-1 and Tier-2 deductions
    expect(oldTax.annualInHandSalary).toBeLessThan(1500000);
  });

  it('should exempt Meal Coupons up to statutory cap (Rule 3(7)(iii)) in Old Regime only', () => {
    const inputs = {
      ...DEFAULT_COMPENSATION_INPUTS,
      ctcAnnual: 1200000,
      foodCouponAnnual: 26400, // ₹2,200/month
    };

    const breakdown = computeCompensationBreakdown(inputs, DEFAULT_COMPANY_POLICY);
    const oldTax = computeOldTax(breakdown, inputs);
    const newTax = computeNewTax(breakdown, inputs);

    // Old Regime allows meal coupon tax exemption
    expect(oldTax.mealCouponExemption).toBe(26400);
    // New Regime disallows meal coupon exemption (taxed as salary)
    expect(newTax.mealCouponExemption).toBe(0);
  });

  it('should defer ESOP perquisite TDS for eligible DPIIT Startups under Section 80-IAC / 192(1C)', () => {
    const startupESOPDetails = {
      grantPriceUSD: 10,
      usdToInrRate: 85,
      fmvAtVestingUSD: 50,
      unitsVested: 200,
      totalGrantedUnits: 800,
      vestingDurationYears: 4,
      currentTaxYearNumber: 1,
      vestingScheduleType: 'graded_equal' as const,
      holdingPeriodMonths: 0,
      salePriceUSD: 50,
      dispositionAction: 'hold' as const,
      isDomesticListed: false,
      isDPIITStartupEligible: true,
      deferralYearsLimit: 5,
    };

    const result = computeRSUTaxation(startupESOPDetails, 30);
    expect(result.isTdsDeferred).toBe(true);
    expect(result.tdsDeferredAmountINR).toBeGreaterThan(0);
    expect(result.immediateTdsPayableINR).toBe(0); // ₹0 cash outflow today
    expect(result.deferralDueDateNote).toContain('deferred under Section 192(1C)');
  });

  it('should compute Corporate Tax Shield factoring in Higher Education Cess and turnover surcharges', () => {
    const inputs = {
      ...DEFAULT_COMPENSATION_INPUTS,
      ctcAnnual: 3000000, // 30 LPA
      rsuVestedValueAnnual: 500000,
    };

    const policy = {
      ...DEFAULT_COMPANY_POLICY,
      corporateTaxProfile: 'sec_115baa' as const,
      corporateBaseRate: 22,
      corporateSurchargeRate: 10,
      corporateCessRate: 4,
      corporateTaxRate: 25.17,
      rsuCrossChargedToLocalEntity: true,
    };

    const breakdown = computeCompensationBreakdown(inputs, policy);
    const shield = computeEmployerShield(breakdown, policy);

    expect(shield.baseCorporateTaxRate).toBe(22);
    expect(shield.surchargeRatePercent).toBe(10);
    expect(shield.cessRatePercent).toBe(4);
    expect(shield.corporateTaxRate).toBeCloseTo(25.17, 1);
    expect(shield.corporateTaxShieldAmount).toBeGreaterThan(0);
  });

  it('should trigger Section 17(2)(vii) retiral perquisite when retiral contributions exceed ₹7.5 Lakhs', () => {
    const inputs = {
      ...DEFAULT_COMPENSATION_INPUTS,
      ctcAnnual: 10000000, // 1 Crore
      basicPercentOfCTC: 50, // Basic = 50 Lakhs
    };

    const policy = {
      ...DEFAULT_COMPANY_POLICY,
      pfCapAtStatutoryLimit: false, // 12% of 50L = 6,00,000
      employerNpsEnabled: true,
      employerNpsPercent: 10, // 10% of 50L = 5,00,000
    };

    const breakdown = computeCompensationBreakdown(inputs, policy);
    expect(breakdown.employerPFAnnual).toBe(600000);
    expect(breakdown.employerNPSAnnual).toBe(500000);
    expect(breakdown.retiralPerquisiteTaxable).toBe(350000);
  });
});
