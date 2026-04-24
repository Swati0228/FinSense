import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense {
  _id?: mongoose.Types.ObjectId;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes: string;
  recurring: boolean;
}

export interface ICategoryBudgets {
  food: number;
  travel: number;
  bills: number;
  shopping: number;
  entertainment: number;
  others: number;
}

export interface IMonthlyPlan {
  _id?: mongoose.Types.ObjectId;
  month: string;
  totalBudget: number;
  categoryBudgets: ICategoryBudgets;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  profileImage?: string;
  refreshToken?: string;
  expenses: IExpense[];
  monthlyPlans: IMonthlyPlan[];
}

const expenseSchema = new Schema<IExpense>({
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  merchant: { type: String, required: true },
  category: { type: String, required: true },
  notes: { type: String, default: '' },
  recurring: { type: Boolean, required: true },
});

const categoryBudgetSchema = new Schema<ICategoryBudgets>({
  food: { type: Number, default: 0 },
  travel: { type: Number, default: 0 },
  bills: { type: Number, default: 0 },
  shopping: { type: Number, default: 0 },
  entertainment: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
});

const monthlyPlanSchema = new Schema<IMonthlyPlan>({
  month: { type: String, required: true },
  totalBudget: { type: Number, required: true },
  categoryBudgets: { type: categoryBudgetSchema, default: () => ({}) },
}, { timestamps: true });

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  expenses: [expenseSchema],
  monthlyPlans: [monthlyPlanSchema],
});

// Avoid OverwriteModelError in hot reload environments (Next.js)
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
