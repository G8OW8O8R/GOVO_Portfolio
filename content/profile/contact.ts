/**
 * Contact details. The e-mail address is stored in parts and assembled in
 * the browser (components/ui/Email.tsx), so it never appears as plain text in
 * the server-rendered HTML. Never hard-code it in components.
 */
export const emailParts = { user: "piotrgoworek05", domain: "gmail.com" } as const;

export function assembleEmail(parts: { user: string; domain: string } = emailParts): string {
  return [parts.user, parts.domain].join("@");
}

/** Budget options of the contact form (task 5); `?budzet=<id>` preselects one. */
export const budgets = [
  { id: "do-1000", label: { pl: "Do 1 000 zł", en: "Up to PLN 1,000" } },
  { id: "1-3-tys", label: { pl: "1–3 tys.", en: "PLN 1–3k" } },
  { id: "3-8-tys", label: { pl: "3–8 tys.", en: "PLN 3–8k" } },
  { id: "8-tys", label: { pl: "8 tys.+", en: "PLN 8k+" } },
  { id: "nie-wiem", label: { pl: "Nie wiem jeszcze", en: "Not sure yet" } },
] as const;

export type BudgetId = (typeof budgets)[number]["id"];
export const BUDGET_PARAM = "budzet";

export function findBudget(id: string | null) {
  return budgets.find((b) => b.id === id) ?? null;
}
