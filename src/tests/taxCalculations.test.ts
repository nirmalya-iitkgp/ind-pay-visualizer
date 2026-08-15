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
} from '../utils/taxCalculations';
import {
  DEFAULT_COMPANY_POLICY,
  DEFAULT_COMPENSATION_INPUTS,
  STATUTORY_LIMITS,
  STATE_PT_CONFIGS,
  CITY_HRA_NUANCES,
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

    // Check Basic
    expect(breakdown.basicAnnual).toBe(800000);
    // Check HRA
    expect(breakdown.hraAnnual).toBe(400000);
    // Capped PF (12% of 15k*12) = 21600
    expect(breakdown.employerPFAnnual).toBe(21600);
    // Gratuity (4.81% of 8L) = 38480
    expect(breakdown.gratuityAnnual).toBeCloseTo(38480, -1);

    // Total Allocated + Special Allowance should equal CTC
    expect(breakdown.totalAllocated).toBe(2000000);
    expect(breakdown.isOverAllocated).toBe(false);
    expect(breakdown.specialAllowanceAnnual).toBeGreaterThan(0);
  });

  it('should accurately calculate State-specific Professional Tax (PT)', () => {
    // Karnataka: ₹200/mo = ₹2400/yr for gross > 25k/mo
    const karnatakaPT = computeStateProfessionalTax(50000, 'karnataka');
    expect(karnatakaPT.annualTax).toBe(2400);

    // Maharashtra: ₹200 for 11 months + ₹300 for Feb = ₹2500/yr
    const maharashtraPT = computeStateProfessionalTax(50000, 'maharashtra');
    expect(maharashtraPT.annualTax).toBe(2500);

    // Delhi: No Professional Tax
    const delhiPT = computeStateProfessionalTax(100000, 'delhi');
    expect(delhiPT.annualTax).toBe(0);

    // Telangana: ₹200/mo = ₹2400/yr for gross > 20k/mo
    const telanganaPT = computeStateProfessionalTax(80000, 'telangana');
    expect(telanganaPT.annualTax).toBe(2400);
  });

  it('should accurately calculate HRA Exemption and note city nuances (e.g., Bangalore as non-metro)', () => {
    const basic = 600000; // 6 LPA
    const hraReceived = 300000; // 3 LPA
    const rentPaidAnnual = 240000; // 20,000/mo = 2.4 LPA

    // Statutory Metro (Mumbai):
    // 1. Actual HRA = 3,00,000
    // 2. Rent - 10% of basic = 2,40,000 - 60,000 = 1,80,000
    // 3. 50% of Basic = 3,00,000
    // Min = 1,80,000
    const metroRes = computeHRAExemption(basic, hraReceived, rentPaidAnnual, true, 'Mumbai');
    expect(metroRes.exemption).toBe(180000);
    expect(metroRes.criteria.rentMinus10PercentBasic).toBe(180000);

    // Non-Metro Tech Hub (Bangalore): 40% cap applies (40% of 6L = 2,40,000)
    // Min(300k, 180k, 240k) = 180k
    const bangaloreRes = computeHRAExemption(basic, hraReceived, rentPaidAnnual, false, 'Bangalore');
    expect(bangaloreRes.exemption).toBe(180000);
    expect(bangaloreRes.stateNuanceNote).toBeDefined();

    // Non-Metro with lower rent
    // Rent = 50,000/year (less than 10% of 600k = 60k)
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

    // Standard deduction is 75,000
    expect(newTaxRes.standardDeduction).toBe(75000);

    // Taxable income is <= 7,00,000 -> full rebate u/s 87A, 0 tax
    expect(newTaxRes.netTaxableIncome).toBeLessThanOrEqual(700000);
    expect(newTaxRes.totalTaxLiabilityAnnual).toBe(0);
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
    // Combined PF (6L) + NPS (5L) = 11 Lakhs
    // Cap is 7.5L, so taxable perquisite = 3.5 Lakhs
    expect(breakdown.employerPFAnnual).toBe(600000);
    expect(breakdown.employerNPSAnnual).toBe(500000);
    expect(breakdown.retiralPerquisiteTaxable).toBe(350000);
  });

  it('should compute Corporate Tax Shield and Effective Net Outlay for Employer', () => {
    const inputs = {
      ...DEFAULT_COMPENSATION_INPUTS,
      ctcAnnual: 3000000, // 30 LPA
      rsuVestedValueAnnual: 500000,
    };

    const policy = {
      ...DEFAULT_COMPANY_POLICY,
      corporateTaxRate: 25,
      rsuCrossChargedToLocalEntity: true,
    };

    const breakdown = computeCompensationBreakdown(inputs, policy);
    const shield = computeEmployerShield(breakdown, policy);

    // 25% of deductible 30L = 7.5L tax shield
    expect(shield.corporateTaxShieldAmount).toBeCloseTo(750000, -2);
    expect(shield.effectiveEmployerNetCost).toBeCloseTo(2250000, -2);
  });

  it('should correctly calculate comprehensive RSU taxation with vesting schedules and reload grants', () => {
    const rsuDetails = {
      grantPriceUSD: 50,
      usdToInrRate: 85,
      fmvAtVestingUSD: 100,
      unitsVested: 100,
      totalGrantedUnits: 400,
      vestingDurationYears: 4,
      currentTaxYearNumber: 1,
      vestingScheduleType: 'graded_equal' as const,
      holdingPeriodMonths: 15,
      salePriceUSD: 120,
      dispositionAction: 'sell_all' as const,
      isDomesticListed: true,
      hasReloadFeature: true,
      reloadGrantRatioPercent: 100,
      reloadFMVUSD: 100,
      reloadVestingPeriodMonths: 12,
    };

    const rsuRes = computeRSUTaxation(rsuDetails, 30);
    // 100 units vesting in Year 1 * $100 * 85 = ₹8,50,000
    expect(rsuRes.unitsVestingCurrentFY).toBe(100);
    expect(rsuRes.perquisiteValueINR).toBe(850000);
    expect(rsuRes.perquisiteTaxINR).toBe(255000); // 30% TDS
    expect(rsuRes.capitalGainsINR).toBe(170000); // (120-100) * 100 * 85
    expect(rsuRes.isLTCG).toBe(true);
    expect(rsuRes.capitalGainsTaxRatePercent).toBe(12.5); // Domestic > 12m = 12.5% LTCG
    expect(rsuRes.reloadUnitsAwarded).toBeGreaterThan(0);
  });

  it('should identify disqualifying disposition when foreign RSUs sold in under 24 months', () => {
    const foreignRSU = {
      grantPriceUSD: 50,
      usdToInrRate: 85,
      fmvAtVestingUSD: 100,
      unitsVested: 100,
      totalGrantedUnits: 100,
      vestingDurationYears: 1,
      currentTaxYearNumber: 1,
      vestingScheduleType: 'cliff' as const,
      holdingPeriodMonths: 6, // < 24 months for unlisted/foreign equity
      salePriceUSD: 150,
      dispositionAction: 'sell_all' as const,
      isDomesticListed: false,
    };

    const result = computeRSUTaxation(foreignRSU, 30);
    expect(result.isLTCG).toBe(false);
    expect(result.isDisqualifyingDisposition).toBe(true);
    expect(result.capitalGainsTaxRatePercent).toBe(30); // Taxed at slab rate
    expect(result.disqualifyingTaxPenaltyINR).toBeGreaterThan(0);
  });
});
