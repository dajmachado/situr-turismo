import { NextResponse } from "next/server";
import { getExpenses, saveExpenses } from "@/lib/db";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/types";

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Expense>;
  const expenses = await getExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
  }

  const current = expenses[index];
  const category = CATEGORIES.includes(body.category as ExpenseCategory)
    ? (body.category as ExpenseCategory)
    : current.category;

  expenses[index] = {
    ...current,
    description: body.description?.trim() || current.description,
    category,
    amount: body.amount !== undefined ? Number(body.amount) || 0 : current.amount,
    date: body.date?.trim() ?? current.date,
    notes: body.notes?.trim() ?? current.notes,
    updatedAt: new Date().toISOString(),
  };
  await saveExpenses(expenses);
  return NextResponse.json(expenses[index]);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const expenses = await getExpenses();
  const filtered = expenses.filter((e) => e.id !== id);
  if (filtered.length === expenses.length) {
    return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
  }
  await saveExpenses(filtered);
  return NextResponse.json({ ok: true });
}
