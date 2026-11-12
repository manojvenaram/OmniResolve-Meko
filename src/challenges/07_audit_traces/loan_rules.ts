export interface LoanApplication {
  id: string;
  applicantName: string;
  creditScore: number;
  monthlyIncome: number;
  monthlyDebtPayments: number;
  loanAmountRequested: number;
  employmentYears: number;
  purpose: 'home_mortgage' | 'small_business' | 'debt_consolidation';
}

export const SYNTHETIC_LOAN_APPLICANTS: LoanApplication[] = [
  { id: 'app_101', applicantName: 'Sophia Martinez', creditScore: 780, monthlyIncome: 12000, monthlyDebtPayments: 2400, loanAmountRequested: 350000, employmentYears: 6, purpose: 'home_mortgage' },
  { id: 'app_102', applicantName: 'David Kim', creditScore: 610, monthlyIncome: 4500, monthlyDebtPayments: 2600, loanAmountRequested: 40000, employmentYears: 1, purpose: 'debt_consolidation' },
  { id: 'app_103', applicantName: 'Emily Chen', creditScore: 720, monthlyIncome: 8500, monthlyDebtPayments: 2800, loanAmountRequested: 75000, employmentYears: 4, purpose: 'small_business' },
  { id: 'app_104', applicantName: 'Marcus Johnson', creditScore: 690, monthlyIncome: 6500, monthlyDebtPayments: 2800, loanAmountRequested: 220000, employmentYears: 3, purpose: 'home_mortgage' },
  { id: 'app_105', applicantName: 'Priya Patel', creditScore: 810, monthlyIncome: 15000, monthlyDebtPayments: 1800, loanAmountRequested: 500000, employmentYears: 8, purpose: 'home_mortgage' },
  { id: 'app_106', applicantName: 'Lucas Silva', creditScore: 580, monthlyIncome: 3800, monthlyDebtPayments: 2100, loanAmountRequested: 30000, employmentYears: 0.5, purpose: 'debt_consolidation' },
  { id: 'app_107', applicantName: 'Aisha Al-Mansoor', creditScore: 740, monthlyIncome: 9200, monthlyDebtPayments: 2300, loanAmountRequested: 120000, employmentYears: 5, purpose: 'small_business' },
  { id: 'app_108', applicantName: 'Brian O\'Connor', creditScore: 660, monthlyIncome: 5500, monthlyDebtPayments: 1900, loanAmountRequested: 180000, employmentYears: 2, purpose: 'home_mortgage' },
  { id: 'app_109', applicantName: 'Zoe Washington', creditScore: 795, monthlyIncome: 11000, monthlyDebtPayments: 1500, loanAmountRequested: 60000, employmentYears: 7, purpose: 'debt_consolidation' },
  { id: 'app_110', applicantName: 'Carlos Gomez', creditScore: 635, monthlyIncome: 4800, monthlyDebtPayments: 2500, loanAmountRequested: 50000, employmentYears: 1.5, purpose: 'small_business' }
];
