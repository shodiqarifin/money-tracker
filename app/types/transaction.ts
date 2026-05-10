export interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    type: "income" | "expense";
  } | null;
}

export interface CreateTransactionInput {
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
}
