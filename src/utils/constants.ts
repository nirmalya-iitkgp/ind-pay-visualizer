import { CompanyPolicy, CompensationInputs, PresetTemplate, IndianState } from '../types';

export interface PTSlabRule {
  minMonthlySalary: number;
  maxMonthlySalary: number;
  monthlyTax: number;
  specialMonthTax?: { month: number; tax: number }; // e.g. Feb in Maharashtra
}

export interface StatePTConfig {
  state: IndianState;
  stateName: string;
  hasProfessionalTax: boolean;
  slabs: PTSlabRule[];
  defaultAnnualTax: number;
  description: string;
  legalAct: string;
}

export const STATE_PT_CONFIGS: Record<IndianState, StatePTConfig> = {
  karnataka: {
    state: 'karnataka',
    stateName: 'Karnataka (Bangalore)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 24999, monthlyTax: 0 },
      { minMonthlySalary: 25000, maxMonthlySalary: Infinity, monthlyTax: 200 },
    ],
    defaultAnnualTax: 2400,
    description: 'Nil up to ₹24,999/mo; ₹200/mo above ₹25,000/mo (Karnataka Tax on Professions Act, 1976 amended).',
    legalAct: 'Karnataka Tax on Professions, Trades, Callings and Employments Act',
  },
  maharashtra: {
    state: 'maharashtra',
    stateName: 'Maharashtra (Mumbai, Pune)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 7500, monthlyTax: 0 },
      { minMonthlySalary: 7501, maxMonthlySalary: 10000, monthlyTax: 175 },
      { minMonthlySalary: 10001, maxMonthlySalary: Infinity, monthlyTax: 200, specialMonthTax: { month: 2, tax: 300 } }, // ₹300 in Feb
    ],
    defaultAnnualTax: 2500,
    description: 'Nil for men <= ₹7.5k (women <= ₹25k); ₹200/mo for 11 months + ₹300 in Feb = ₹2,500/year.',
    legalAct: 'Maharashtra State Tax on Professions Act, 1975',
  },
  telangana: {
    state: 'telangana',
    stateName: 'Telangana (Hyderabad)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 15000, monthlyTax: 0 },
      { minMonthlySalary: 15001, maxMonthlySalary: 20000, monthlyTax: 150 },
      { minMonthlySalary: 20001, maxMonthlySalary: Infinity, monthlyTax: 200 },
    ],
    defaultAnnualTax: 2400,
    description: 'Nil up to ₹15,000/mo; ₹150/mo up to ₹20,000; ₹200/mo above ₹20,000.',
    legalAct: 'Telangana Tax on Professions, Trades, Callings and Employments Act',
  },
  tamil_nadu: {
    state: 'tamil_nadu',
    stateName: 'Tamil Nadu (Chennai)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 21000, monthlyTax: 0 },
      { minMonthlySalary: 21001, maxMonthlySalary: 30000, monthlyTax: 135 },
      { minMonthlySalary: 30001, maxMonthlySalary: 45000, monthlyTax: 315 },
      { minMonthlySalary: 45001, maxMonthlySalary: 60000, monthlyTax: 690 },
      { minMonthlySalary: 60001, maxMonthlySalary: 75000, monthlyTax: 1025 },
      { minMonthlySalary: 75001, maxMonthlySalary: Infinity, monthlyTax: 1250 },
    ],
    defaultAnnualTax: 2500,
    description: 'Levied semi-annually (September & March). Max cap ₹2,500/year.',
    legalAct: 'Tamil Nadu Town Panchayats, Municipalities and Municipal Corporations PT Rules',
  },
  west_bengal: {
    state: 'west_bengal',
    stateName: 'West Bengal (Kolkata)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 10000, monthlyTax: 0 },
      { minMonthlySalary: 10001, maxMonthlySalary: 15000, monthlyTax: 110 },
      { minMonthlySalary: 15001, maxMonthlySalary: 25000, monthlyTax: 130 },
      { minMonthlySalary: 25001, maxMonthlySalary: 40000, monthlyTax: 150 },
      { minMonthlySalary: 40001, maxMonthlySalary: Infinity, monthlyTax: 200 },
    ],
    defaultAnnualTax: 2400,
    description: 'Graduated slabs starting from ₹110/mo up to ₹200/mo (> ₹40k/mo).',
    legalAct: 'West Bengal State Tax on Professions Act, 1979',
  },
  gujarat: {
    state: 'gujarat',
    stateName: 'Gujarat (Ahmedabad, Surat)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 11999, monthlyTax: 0 },
      { minMonthlySalary: 12000, maxMonthlySalary: Infinity, monthlyTax: 200 },
    ],
    defaultAnnualTax: 2400,
    description: 'Nil up to ₹11,999/mo; ₹200/mo for monthly gross salary ≥ ₹12,000.',
    legalAct: 'Gujarat Panchayats, Municipalities & Municipal Corporations PT Act',
  },
  andhra_pradesh: {
    state: 'andhra_pradesh',
    stateName: 'Andhra Pradesh (Visakhapatnam, Vijayawada)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 15000, monthlyTax: 0 },
      { minMonthlySalary: 15001, maxMonthlySalary: 20000, monthlyTax: 150 },
      { minMonthlySalary: 20001, maxMonthlySalary: Infinity, monthlyTax: 200 },
    ],
    defaultAnnualTax: 2400,
    description: 'Nil up to ₹15,000/mo; ₹150/mo up to ₹20k; ₹200/mo above ₹20k.',
    legalAct: 'Andhra Pradesh Tax on Professions Act, 1987',
  },
  kerala: {
    state: 'kerala',
    stateName: 'Kerala (Kochi, Thiruvananthapuram)',
    hasProfessionalTax: true,
    slabs: [
      { minMonthlySalary: 0, maxMonthlySalary: 1999, monthlyTax: 0 },
      { minMonthlySalary: 2000, maxMonthlySalary: 2999, monthlyTax: 20 },
      { minMonthlySalary: 3000, maxMonthlySalary: 4999, monthlyTax: 45 },
      { minMonthlySalary: 5000, maxMonthlySalary: 9999, monthlyTax: 75 },
      { minMonthlySalary: 10000, maxMonthlySalary: 14999, monthlyTax: 125 },
      { minMonthlySalary: 15000, maxMonthlySalary: Infinity, monthlyTax: 208 },
    ],
    defaultAnnualTax: 2500,
    description: 'Collected half-yearly; standard maximum ₹2,500/year for salaries ≥ ₹15k/mo.',
    legalAct: 'Kerala Municipalities (Tax on Profession) Rules',
  },
  delhi: {
    state: 'delhi',
    stateName: 'Delhi (NCT)',
    hasProfessionalTax: false,
    slabs: [{ minMonthlySalary: 0, maxMonthlySalary: Infinity, monthlyTax: 0 }],
    defaultAnnualTax: 0,
    description: 'No Professional Tax is levied on salaried employees in NCT of Delhi.',
    legalAct: 'N/A (Exempt in Delhi)',
  },
  haryana: {
    state: 'haryana',
    stateName: 'Haryana (Gurugram, Faridabad)',
    hasProfessionalTax: false,
    slabs: [{ minMonthlySalary: 0, maxMonthlySalary: Infinity, monthlyTax: 0 }],
    defaultAnnualTax: 0,
    description: 'No Professional Tax is levied on salaried employees in Haryana.',
    legalAct: 'N/A (Exempt in Haryana)',
  },
  uttar_pradesh: {
    state: 'uttar_pradesh',
    stateName: 'Uttar Pradesh (Noida, Lucknow)',
    hasProfessionalTax: false,
    slabs: [{ minMonthlySalary: 0, maxMonthlySalary: Infinity, monthlyTax: 0 }],
    defaultAnnualTax: 0,
    description: 'No active payroll professional tax deduction for private sector salaried employees in UP.',
    legalAct: 'N/A (Exempt in UP)',
  },
  other: {
    state: 'other',
    stateName: 'Other State / Union Territory',
    hasProfessionalTax: true,
    slabs: [{ minMonthlySalary: 0, maxMonthlySalary: Infinity, monthlyTax: 208.33 }],
    defaultAnnualTax: 2500,
    description: 'Standard statutory upper limit ceiling of ₹2,500/year as per Article 276(2) of Constitution of India.',
    legalAct: 'Constitution of India Art 276(2)',
  },
};

export interface CityHRANuance {
  cityName: string;
  state: IndianState;
  cityTier: 'metro' | 'non-metro';
  hraCapPercent: number; // 50% for 4 statutory metros, 40% for rest
  isStatutoryMetro: boolean; // Mumbai, Delhi, Kolkata, Chennai
  isTechHubHighRent: boolean; // Bangalore, Hyderabad, Pune, Gurugram, Noida
  nuanceExplanation: string;
}

export const CITY_HRA_NUANCES: CityHRANuance[] = [
  {
    cityName: 'Bangalore (Bengaluru)',
    state: 'karnataka',
    cityTier: 'non-metro',
    hraCapPercent: 40,
    isStatutoryMetro: false,
    isTechHubHighRent: true,
    nuanceExplanation:
      'Crucial Tax Nuance: Under statutory Rule 2A of Income Tax Rules 1962, Bangalore is legally classified as "Non-Metro" (40% Basic Pay cap), despite having Tier-1 metro rental rates equal to Mumbai/Delhi.',
  },
  {
    cityName: 'Hyderabad',
    state: 'telangana',
    cityTier: 'non-metro',
    hraCapPercent: 40,
    isStatutoryMetro: false,
    isTechHubHighRent: true,
    nuanceExplanation:
      'Under Rule 2A, Hyderabad qualifies for 40% Basic Pay HRA cap. High IT hub rental costs often exceed the 40% threshold, meaning the 40% cap frequently binds the exemption.',
  },
  {
    cityName: 'Pune',
    state: 'maharashtra',
    cityTier: 'non-metro',
    hraCapPercent: 40,
    isStatutoryMetro: false,
    isTechHubHighRent: true,
    nuanceExplanation:
      'Classified as 40% Non-Metro under IT Rule 2A, whereas Mumbai in the same state gets 50% Metro classification.',
  },
  {
    cityName: 'Gurugram (Gurgaon)',
    state: 'haryana',
    cityTier: 'non-metro',
    hraCapPercent: 40,
    isStatutoryMetro: false,
    isTechHubHighRent: true,
    nuanceExplanation:
      'Part of Delhi NCR but falls under Haryana state jurisdiction. Qualifies for 40% HRA cap under Rule 2A, unlike New Delhi proper (50%). Enjoys ₹0 Professional Tax.',
  },
  {
    cityName: 'Noida / Greater Noida',
    state: 'uttar_pradesh',
    cityTier: 'non-metro',
    hraCapPercent: 40,
    isStatutoryMetro: false,
    isTechHubHighRent: true,
    nuanceExplanation:
      'Part of Delhi NCR but administratively in Uttar Pradesh (40% HRA cap). Enjoys ₹0 Professional Tax for private sector.',
  },
  {
    cityName: 'Mumbai / Navi Mumbai',
    state: 'maharashtra',
    cityTier: 'metro',
    hraCapPercent: 50,
    isStatutoryMetro: true,
    isTechHubHighRent: true,
    nuanceExplanation:
      'Statutory 50% Metro city under Income Tax Rule 2A. Maharashtra Professional Tax applies at ₹200/mo (₹300 in February).',
  },
  {
    cityName: 'New Delhi (NCT)',
    state: 'delhi',
    cityTier: 'metro',
    hraCapPercent: 50,
    isStatutoryMetro: true,
    isTechHubHighRent: true,
    nuanceExplanation:
      'Statutory 50% Metro city under Income Tax Rule 2A. Zero Professional Tax for salaried employees in Delhi.',
  },
  {
    cityName: 'Chennai',
    state: 'tamil_nadu',
    cityTier: 'metro',
    hraCapPercent: 50,
    isStatutoryMetro: true,
    isTechHubHighRent: false,
    nuanceExplanation:
      'Statutory 50% Metro city under Rule 2A. Semi-annual professional tax collected under TN Municipal Act.',
  },
  {
    cityName: 'Kolkata',
    state: 'west_bengal',
    cityTier: 'metro',
    hraCapPercent: 50,
    isStatutoryMetro: true,
    isTechHubHighRent: false,
    nuanceExplanation:
      'Statutory 50% Metro city under Rule 2A. West Bengal graduated PT slabs apply.',
  },
  {
    cityName: 'Ahmedabad',
    state: 'gujarat',
    cityTier: 'non-metro',
    hraCapPercent: 40,
    isStatutoryMetro: false,
    isTechHubHighRent: false,
    nuanceExplanation: 'Classified as 40% Non-Metro under IT Rule 2A. Gujarat PT applies at ₹200/mo for gross >= ₹12k.',
  },
];

export const STATUTORY_LIMITS = {
  PF_MONTHLY_WAGE_CEILING: 15000, // ₹15,000/month
  PF_MONTHLY_MAX_CONTRIBUTION: 1800, // 12% of 15k
  PF_ANNUAL_MAX_STATUTORY: 21600, // ₹21,600/year
  PF_RATE: 0.12, // 12%
  GRATUITY_RATE: 0.0481, // 4.81% (15/26 of 1 month per year = ~4.81%)
  MAX_GRATUITY_TAX_EXEMPT: 2000000, // ₹20 Lakhs
  RETIRAL_PERQUISITE_ANNUAL_CAP: 750000, // ₹7,50,000 Sec 17(2)(vii) (Employer PF + NPS + Superannuation)
  
  // Tax Deductions Limits
  OLD_REGIME_STANDARD_DEDUCTION: 50000,
  NEW_REGIME_STANDARD_DEDUCTION: 75000, // Union Budget revised for FY 24-25/25-26
  SECTION_80C_MAX: 150000,
  SECTION_80CCD1B_NPS_MAX: 50000,
  SECTION_80D_SELF_MAX: 25000,
  SECTION_80D_PARENTS_MAX: 50000, // Senior citizens
  SECTION_24B_HOME_LOAN_MAX: 200000,
  SECTION_80TTA_MAX: 10000,
  PROFESSIONAL_TAX_ANNUAL_DEFAULT: 2400,

  // Sec 87A Rebate Thresholds
  OLD_REGIME_87A_INCOME_LIMIT: 500000,
  OLD_REGIME_87A_MAX_REBATE: 12500,
  NEW_REGIME_87A_INCOME_LIMIT: 700000, // Zero tax up to 7L taxable (7.75L with standard deduction)
  NEW_REGIME_87A_MAX_REBATE: 25000,

  // Health & Education Cess
  CESS_RATE: 0.04, // 4%
};

export const DEFAULT_COMPANY_POLICY: CompanyPolicy = {
  pfCapAtStatutoryLimit: true,
  enableVPF: false,
  vpfPercentage: 0,
  gratuityIncludedInCTC: true,
  gratuityRatePercent: 4.81,
  defaultHraPercentOfBasic: 50,
  employerNpsEnabled: false,
  employerNpsPercent: 10,
  superannuationEnabled: false,
  superannuationPercent: 0,
  rsuCrossChargedToLocalEntity: true,
  corporateTaxRate: 25.17, // Standard effective corporate tax (22% base + 10% surcharge + 4% cess)
};

export const DEFAULT_COMPENSATION_INPUTS: CompensationInputs = {
  ctcAnnual: 1800000, // ₹18,00,000 (18 LPA)
  basicPercentOfCTC: 40,
  hraPercentOfBasic: 50,
  ltaAnnual: 60000,
  foodCouponAnnual: 26400, // ₹2,200/month
  booksAndPeriodicalsAnnual: 24000,
  communicationAnnual: 24000,
  otherFlexiAnnual: 0,
  variablePayAnnual: 150000,
  rsuVestedValueAnnual: 0,
  rsuUnvestedGrantAnnual: 0,
  state: 'karnataka',
  cityTier: 'non-metro',
  selectedCity: 'Bangalore (Bengaluru)',
  monthlyRentPaid: 25000,
  selectedRegime: 'new',
  deduction80C: 150000,
  deduction80D: 25000,
  deduction80CCD1B: 50000,
  deduction80E: 0,
  deduction80TTA: 10000,
  deductionHomeLoanInterest: 0,
  otherExemptionsOldRegime: 0,
  professionalTaxAnnual: 2400,
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'standard-tech-startup',
    name: 'Tech Startup (High Equity & Flexi)',
    description: 'Modern product firm: lean basic, high equity (RSU/ESOP), aggressive flexi allowances, statutory capped PF.',
    iconName: 'Rocket',
    ctc: 3200000, // ₹32 LPA
    basicPercent: 35,
    hraPercent: 50,
    variablePercent: 10,
    rsuVestedPercent: 20,
    rsuUnvestedPercent: 40,
    lta: 80000,
    flexi: 120000,
  },
  {
    id: 'corporate-legacy',
    name: 'Corporate Legacy (High Retirals)',
    description: 'Traditional enterprise: high basic (50%), full 12% uncapped PF, gratuity, employer NPS (10%), robust insurance.',
    iconName: 'Building2',
    ctc: 2400000, // ₹24 LPA
    basicPercent: 50,
    hraPercent: 50,
    variablePercent: 12,
    rsuVestedPercent: 0,
    rsuUnvestedPercent: 0,
    lta: 60000,
    flexi: 50000,
  },
  {
    id: 'consulting-high-flexi',
    name: 'Consulting & Services (High Flexi)',
    description: 'Global consulting firm: standard basic, high special allowance, variable performance bonus, optimal cash take-home.',
    iconName: 'Briefcase',
    ctc: 1800000, // ₹18 LPA
    basicPercent: 40,
    hraPercent: 50,
    variablePercent: 15,
    rsuVestedPercent: 0,
    rsuUnvestedPercent: 0,
    lta: 50000,
    flexi: 80000,
  },
  {
    id: 'executive-leadership',
    name: 'Executive Leadership (High CTC)',
    description: 'Senior Management & CXO: multi-tier salary, high RSUs, retiral perquisite threshold tracking, NPS tax shield.',
    iconName: 'Crown',
    ctc: 7500000, // ₹75 LPA
    basicPercent: 45,
    hraPercent: 50,
    variablePercent: 25,
    rsuVestedPercent: 20,
    rsuUnvestedPercent: 50,
    lta: 150000,
    flexi: 250000,
  },
];

