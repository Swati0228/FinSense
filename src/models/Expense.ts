export interface Expense {
  date: string; // Date of the expense
  amount: number; // Amount spent
  merchant: string; // Merchant name
  category: string; // Category of the expense
  notes?: string; // Optional notes about the expense
  recurring: boolean; // Whether the expense is recurring
}