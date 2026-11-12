export interface HouseholdFinancialState {
  householdName: string;
  annualIncome: number;
  monthlyExpenses: number;
  emergencyFund: number;
  studentLoanDebt: number;
  retirementSavings: number;
  hasDependents: boolean;
  dependentCount: number;
  primaryGoal: string;
}

export const INITIAL_HOUSEHOLD_STATE: HouseholdFinancialState = {
  householdName: 'Alex & Morgan Rivera',
  annualIncome: 160000,
  monthlyExpenses: 7200,
  emergencyFund: 25000,
  studentLoanDebt: 32000,
  retirementSavings: 85000,
  hasDependents: false,
  dependentCount: 0,
  primaryGoal: 'Aggressive Student Debt Payoff & Home Downpayment'
};
