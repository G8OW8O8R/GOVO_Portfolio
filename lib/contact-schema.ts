import { z } from "zod";
import { LIMITS, contactErrors, contactInput, oneLine, budgetIds, subjectIds, type ContactData, type ContactResult } from "./contact";

/** The contact form schema checked by the server action (full Zod). */
export const contactSchema = z
  .object({
    name: z.string().transform(oneLine).pipe(z.string().min(LIMITS.name[0]).max(LIMITS.name[1])),
    email: z.string().trim().max(LIMITS.email[1]).pipe(z.email()),
    subject: z.enum(subjectIds),
    budget: z.enum(budgetIds).optional().catch(undefined),
    message: z.string().trim().min(LIMITS.message[0]).max(LIMITS.message[1]),
    lang: z.enum(["pl", "en"]).catch("pl"),
  })
  // a job offer has no budget
  .transform((v): ContactData => (v.subject === "praca" ? { ...v, budget: undefined } : v));

/** Raw form values → validated data or one error code per field. */
export function validateContact(raw: Record<string, unknown>): ContactResult {
  const input = contactInput(raw);
  const result = contactSchema.safeParse(input);
  return result.success ? { ok: true, data: result.data } : { ok: false, errors: contactErrors(result.error.issues, input) };
}
