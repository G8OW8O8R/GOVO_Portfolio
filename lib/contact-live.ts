import * as z from "zod/mini";
import { LIMITS, contactErrors, contactInput, oneLine, budgetIds, subjectIds, type ContactData, type ContactResult } from "./contact";

/**
 * The same rules as contact-schema.ts in Zod Mini, for live validation in the
 * browser (a few KB instead of the whole of Zod). The server checks again
 * with the full schema; contact.test.ts keeps both in step.
 */
const liveSchema = z.pipe(
  z.object({
    name: z.pipe(z.pipe(z.string(), z.transform(oneLine)), z.string().check(z.minLength(LIMITS.name[0]), z.maxLength(LIMITS.name[1]))),
    email: z.pipe(z.string().check(z.trim(), z.maxLength(LIMITS.email[1])), z.email()),
    subject: z.enum(subjectIds),
    budget: z.catch(z.optional(z.enum(budgetIds)), undefined),
    message: z.string().check(z.trim(), z.minLength(LIMITS.message[0]), z.maxLength(LIMITS.message[1])),
    lang: z.catch(z.enum(["pl", "en"]), "pl"),
  }),
  // a job offer has no budget
  z.transform((v): ContactData => (v.subject === "praca" ? { ...v, budget: undefined } : v)),
);

/** Raw form values → validated data or one error code per field. */
export function checkContact(raw: Record<string, unknown>): ContactResult {
  const input = contactInput(raw);
  const result = liveSchema.safeParse(input);
  return result.success ? { ok: true, data: result.data } : { ok: false, errors: contactErrors(result.error.issues, input) };
}
