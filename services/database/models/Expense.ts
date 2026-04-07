import { Model } from '@nozbe/watermelondb';
import { field, text, date, writer } from '@nozbe/watermelondb/decorators';

export default class Expense extends Model {
  static table = 'expenses';

  @field('amount') amount!: number;
  @text('description') description?: string;
  @text('category') category!: string;
  @text('date') date!: string;
  @text('type') type!: 'expense' | 'income';
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @writer
  async createExpense(fields: {
    amount: number;
    description?: string;
    category: string;
    type: 'expense' | 'income';
  }) {
    return this.collections.get<Expense>('expenses').create((expense) => {
      expense.amount = fields.amount;
      expense.description = fields.description || '';
      expense.category = fields.category;
      expense.type = fields.type;
      expense.date = new Date().toISOString().split('T')[0];
      expense.createdAt = new Date();
      expense.updatedAt = new Date();
    });
  }
}