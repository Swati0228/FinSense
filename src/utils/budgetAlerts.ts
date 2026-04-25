import { sendEmail } from './mailer';
import { IUser } from '@/models/User';

export const checkBudgetAndNotify = async (user: IUser, category: string, newAmount: number) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2024-04"
    
    // Find the budget plan for this month
    const plan = user.monthlyPlans.find(p => p.month === currentMonth);
    if (!plan) return;

    // Normalize category name to match ICategoryBudgets keys
    const catKey = category.toLowerCase() as keyof typeof plan.categoryBudgets;
    const categoryBudget = plan.categoryBudgets[catKey];

    if (!categoryBudget || categoryBudget === 0) return;

    // Calculate total spent in this category for this month
    const totalSpent = user.expenses
      .filter(e => e.category.toLowerCase() === catKey && e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);

    const percentage = (totalSpent / categoryBudget) * 100;
    const previousSpent = totalSpent - newAmount;
    const previousPercentage = (previousSpent / categoryBudget) * 100;

    let alertType = '';
    if (percentage >= 100 && previousPercentage < 100) {
      alertType = 'Limit Exceeded 🚨';
    } else if (percentage >= 80 && previousPercentage < 80) {
      alertType = 'Budget Warning ⚠️';
    }

    if (alertType) {
      const subject = `FinSense Alert: ${alertType} for ${category}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0d9488;">FinSense Budget Alert</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>This is an automated alert regarding your <strong>${category}</strong> budget for <strong>${currentMonth}</strong>.</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
            <p style="margin: 5px 0;"><strong>Monthly Budget:</strong> ₹${categoryBudget}</p>
            <p style="margin: 5px 0;"><strong>Current Spending:</strong> ₹${totalSpent}</p>
            <p style="margin: 5px 0;"><strong>Usage:</strong> ${Math.round(percentage)}%</p>
          </div>
          <p>${percentage >= 100 ? "You have exceeded your planned budget for this category." : "You have reached 80% of your planned budget for this category."}</p>
          <p>Stay mindful of your spending!</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated notification from your FinSense Dashboard.</p>
        </div>
      `;
      
      await sendEmail(user.email, subject, html);
      console.log(`Budget alert (${alertType}) sent to ${user.email} for ${category}`);
    }
  } catch (error) {
    console.error('Error in checkBudgetAndNotify:', error);
  }
};
