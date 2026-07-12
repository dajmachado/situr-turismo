import { NextResponse } from "next/server";
import { getExpenses, saveExpenses } from "@/lib/db";
import { newId } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/types";

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("tripId");
  const all = await getExpenses();
  return NextResponse.json(tripId ? all.filter((e) => e.tripId === tripId) : all);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Expense>;
  const description = body.description?.trim();
  const tripId = body.tripId;

  if (!tripId || !description) {
    return NextResponse.json(
      { error: "Informe a viagem e a descrição da despesa." },
      { status: 400 }
    );
  }

  const category: ExpenseCategory = CATEGORIES.includes(
    body.category as ExpenseCategory
  )
    ? (body.category as ExpenseCategory)
    : "outros";

  const now = new Date().toISOString();
  const expense: Expense = {
    id: newId(),
    tripId,
    description,
    category,
    amount: Number(body.amount) || 0,
    date: body.date?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const expenses = await getExpenses();
  expenses.push(expense);
  await saveExpenses(expenses);
  return NextResponse.json(expense, { status: 201 });
}
