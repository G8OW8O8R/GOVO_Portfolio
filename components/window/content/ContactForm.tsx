"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition, type FocusEvent, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { sendContact } from "@/app/[lang]/(desktop)/kontakt/actions";
import type { Dictionary } from "@/content/dictionaries";
import { BUDGET_PARAM, SUBJECT_PARAM, budgets, findBudget, findSubject, subjects } from "@/content/profile/contact";
import { track } from "@/components/analytics/track";
import { EmailText, useEmail } from "@/components/ui/Email";
import { WindowLink } from "@/components/window/WindowLink";
import { VIEWER, characterGaze } from "@/lib/character/look-at";
import {
  CONTACT_FIELDS,
  HONEYPOT,
  LIMITS,
  contactMailto,
  type ContactErrorCode,
  type ContactField,
  type ContactState,
} from "@/lib/contact";
import type { checkContact } from "@/lib/contact-live";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { ui } from "./ui";

type Labels = Dictionary["contact"];
type Values = Record<ContactField, string>;

const EMPTY: Values = { name: "", email: "", subject: "", budget: "", message: "" };
const IDLE: ContactState = { status: "idle" };

/** Reads ?temat= and ?budzet= (Pricing links); needs a Suspense boundary on static pages. */
export function ContactFormWithParams(props: { lang: Locale; labels: Labels }) {
  const params = useSearchParams();
  const initial = {
    ...EMPTY,
    subject: findSubject(params.get(SUBJECT_PARAM))?.id ?? "",
    budget: findBudget(params.get(BUDGET_PARAM))?.id ?? "",
  };
  return <ContactForm {...props} initial={initial} />;
}

function errorText(field: ContactField, code: ContactErrorCode, L: Labels): string {
  if (code === "long") return L.errors.tooLong;
  if (field === "subject") return L.errors.subjectInvalid;
  if (code === "required") return L.errors.required;
  if (field === "email") return L.errors.emailInvalid;
  if (field === "name") return L.errors.nameShort;
  if (field === "message") return L.errors.messageShort;
  return L.errors.required;
}

/**
 * Contact form: the same Zod schema validates here (live, after a field was
 * left) and in the server action. While someone types, the character looks at
 * the active field; after sending it looks at the visitor and the pendant
 * flashes.
 */
export function ContactForm({ lang, labels: L, initial = EMPTY }: { lang: Locale; labels: Labels; initial?: Values }) {
  // Without JavaScript the form posts to the server action itself (formAction);
  // with it the submit calls the action here, so a failed request (offline, the
  // server unreachable) becomes the "couldn't send" message, not a broken window.
  const [serverState, formAction, actionPending] = useActionState(sendContact, IDLE);
  const [clientState, setClientState] = useState<ContactState | null>(null);
  const [sending, startSending] = useTransition();
  const state = clientState ?? serverState;
  const pending = actionPending || sending;
  const [values, setValues] = useState<Values>(initial);
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const releaseGaze = useRef<(() => void) | null>(null);
  /** What the statistics get of a message: topic and budget ids, never what was typed; null = the honeypot was filled. */
  const sentEvent = useRef<{ topic: string; budget: string } | null>(null);
  const id = useId();

  // Live validation loads with the form, not with the desktop. Until it has
  // (a few ms after mounting), a submit goes straight to the server, which
  // checks anyway, and its answer marks the fields.
  const [checker, setChecker] = useState<typeof checkContact | null>(null);
  useEffect(() => {
    let alive = true;
    import("@/lib/contact-live").then((m) => alive && setChecker(() => m.checkContact));
    return () => {
      alive = false;
    };
  }, []);
  const check = checker?.({ ...values, lang }) ?? null;
  const errors = check ? (check.ok ? {} : check.errors) : state.status === "invalid" ? state.errors : {};
  const errorFor = (field: ContactField) =>
    (submitted || touched[field]) && errors[field] ? errorText(field, errors[field]!, L) : null;

  const job = values.subject === "praca";
  const sent = state.status === "sent" && state !== dismissed;

  // Sent: look at the visitor for a moment, flash the pendant.
  useEffect(() => {
    if (state.status !== "sent") return;
    if (sentEvent.current) track("contact-sent", sentEvent.current);
    characterGaze.flash();
    const release = characterGaze.lookAt(VIEWER);
    const t = setTimeout(release, 2600);
    return () => {
      clearTimeout(t);
      release();
    };
  }, [state]);

  useEffect(() => () => releaseGaze.current?.(), []);

  const set = (field: ContactField) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    e.preventDefault();
    if (!check || check.ok) {
      const trap = e.currentTarget.elements.namedItem(HONEYPOT);
      const bot = trap instanceof HTMLInputElement && trap.value !== "";
      sentEvent.current = bot ? null : { topic: values.subject, budget: (!job && values.budget) || "none" };
      const data = new FormData(e.currentTarget);
      startSending(async () => {
        const next = await sendContact(state, data).catch((): ContactState => ({ status: "error" }));
        startSending(() => setClientState(next));
      });
      return;
    }
    const first = CONTACT_FIELDS.find((f) => errors[f]);
    formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  };

  const sendAnother = () => {
    setDismissed(state);
    setValues({ ...EMPTY, subject: values.subject, budget: values.budget });
    setTouched({});
    setSubmitted(false);
  };

  if (sent) {
    return (
      <div className="py-4 text-center" role="status">
        <p className="text-28 font-semibold tracking-[-0.03em] text-ink">{L.sentTitle}</p>
        <p className={`mt-2 ${ui.body}`}>{L.sentText}</p>
        <button type="button" onClick={sendAnother} className={`mt-6 ${ui.secondary}`}>
          {L.sendAnother}
        </button>
      </div>
    );
  }

  const lookAtField = (e: FocusEvent<HTMLFormElement>) => {
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
    releaseGaze.current?.();
    releaseGaze.current = characterGaze.lookAt(e.target);
  };
  const lookAway = () => {
    releaseGaze.current?.();
    releaseGaze.current = null;
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      onFocus={lookAtField}
      onBlur={lookAway}
      noValidate
      className="grid gap-6"
      aria-describedby={`${id}-status`}
    >
      <input type="hidden" name="lang" value={lang} />
      {/* honeypot: off screen, skipped by keyboard and screen readers */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          {L.honeypot}
          <input type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid gap-6 desk:grid-cols-2 desk:gap-4">
        <Field id={`${id}-name`} label={L.name} error={errorFor("name")}>
          {(a) => (
            <input
              {...a}
              data-field="name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={LIMITS.name[1]}
              value={values.name}
              onChange={(e) => set("name")(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className={input}
            />
          )}
        </Field>
        <Field id={`${id}-email`} label={L.email} error={errorFor("email")}>
          {(a) => (
            <input
              {...a}
              data-field="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={LIMITS.email[1]}
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={input}
            />
          )}
        </Field>
      </div>

      <Choice
        name="subject"
        legend={L.subject}
        options={subjects.map((s) => ({ id: s.id, label: s.label[lang] }))}
        value={values.subject}
        onChange={(v) => {
          set("subject")(v);
          setTouched((t) => ({ ...t, subject: true }));
        }}
        error={errorFor("subject")}
      />

      {!job && (
        <Choice
          name="budget"
          legend={L.budget}
          hint={L.optional}
          options={budgets.map((b) => ({ id: b.id, label: b.label[lang] }))}
          value={values.budget}
          onChange={set("budget")}
          error={null}
        />
      )}

      <Field id={`${id}-message`} label={L.message} error={errorFor("message")}>
        {(a) => (
          <textarea
            {...a}
            data-field="message"
            name="message"
            rows={6}
            maxLength={LIMITS.message[1]}
            placeholder={L.messageHint[(values.subject || "strona") as keyof Labels["messageHint"]]}
            value={values.message}
            onChange={(e) => set("message")(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, message: true }))}
            className={`${input} h-auto min-h-36 resize-y py-3 leading-[1.5]`}
          />
        )}
      </Field>

      <div className="flex flex-col items-start gap-4 desk:flex-row desk:items-center">
        <button type="submit" className={`${ui.primary} disabled:opacity-60`} disabled={pending}>
          {pending ? L.sending : state.status === "error" ? L.retry : L.send}
        </button>
        <div id={`${id}-status`} aria-live="polite" className="text-15">
          {!pending && <Status state={state} values={values} lang={lang} L={L} />}
        </div>
      </div>

      <p className="-mt-2 text-13 text-ink-soft">
        {L.privacyNote}{" "}
        <WindowLink href={href(lang, "privacy")} className={ui.link}>
          {L.privacyLink}&nbsp;→
        </WindowLink>
      </p>
    </form>
  );
}

const input =
  "h-12 w-full rounded-field border border-win-line bg-win/70 px-3.5 text-17 text-ink transition-colors placeholder:text-ink-soft/80 hover:border-ink/25 focus:border-focus focus:bg-white aria-invalid:border-danger";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: (a: { id: string; "aria-invalid"?: true; "aria-describedby"?: string; required: true }) => ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={`mb-2 block ${ui.label}`}>
        {label}
      </label>
      {children({ id, required: true, ...(error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {}) })}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-13 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Choice({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  error,
}: {
  name: ContactField;
  legend: string;
  hint?: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}) {
  const errorId = `${name}-choice-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className={`mb-2 ${ui.label}`}>
        {legend}
        {hint && <span className="ml-2 font-mono text-13 font-normal text-ink-soft">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label
            key={o.id}
            className="relative inline-flex h-10 cursor-pointer items-center rounded-full border border-win-line bg-white px-4 text-15 text-ink transition-colors select-none hover:border-ink/30 has-checked:border-ink has-checked:bg-ink has-checked:text-white has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              data-field={i === 0 ? name : undefined}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-13 text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Status({ state, values, lang, L }: { state: ContactState; values: Values; lang: Locale; L: Labels }) {
  const email = useEmail();
  if (state.status === "error") return <p className="text-danger">{L.failed}</p>;
  if (state.status === "limited") return <p className="text-danger">{L.limited.replace("{min}", String(state.retryAfterMin))}</p>;
  if (state.status === "unavailable") {
    return (
      <p className="text-ink">
        {L.unavailable}{" "}
        {email && (
          <a className={ui.link} href={contactMailto(email, values, lang)}>
            {L.openEmail}
          </a>
        )}
      </p>
    );
  }
  return null;
}

/** "Prefer email?" line under the form: the address (assembled in the browser) and copy. */
export function PreferEmail({ labels: L }: { labels: Labels }) {
  const email = useEmail();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked: the address stays visible and selectable
    }
  };
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-15 text-ink-soft">
      <span>{L.preferEmail}</span>
      <EmailText className="select-all font-mono text-13 text-ink" />
      <button
        type="button"
        onClick={copy}
        disabled={!email}
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-13 text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
      >
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        <span aria-live="polite">{copied ? L.copied : L.copy}</span>
      </button>
    </p>
  );
}
