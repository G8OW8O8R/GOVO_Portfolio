"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Mail } from "lucide-react";
import { BUDGET_PARAM, findBudget } from "@/content/profile/contact";
import { EmailText, mailto, useEmail } from "@/components/ui/Email";
import type { Locale } from "@/lib/i18n";
import { ui } from "./ui";

type Labels = { emailLabel: string; write: string; copy: string; copied: string; budget: string };

/** Reads ?budzet= (needs a Suspense boundary on static pages). */
export function ContactEmailWithBudget({ lang, labels }: { lang: Locale; labels: Labels }) {
  const params = useSearchParams();
  const budget = findBudget(params.get(BUDGET_PARAM))?.label[lang] ?? null;
  return <ContactEmail labels={labels} budget={budget} />;
}

/**
 * E-mail card: the address is assembled in the browser. A budget chosen in
 * Pricing (?budzet=) is shown and goes into the e-mail subject.
 */
export function ContactEmail({ labels, budget = null }: { labels: Labels; budget?: string | null }) {
  const email = useEmail();
  const [copied, setCopied] = useState(false);
  const subject = budget ? `${labels.budget}: ${budget}` : undefined;

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
    <div className={`${ui.card} mt-7 p-5 text-center desk:p-6`}>
      {budget && (
        <p className="mb-3 inline-flex rounded-full bg-accent-soft px-3 py-1 text-[13.5px] font-medium text-ink">
          {labels.budget}: {budget}
        </p>
      )}
      <p className={ui.eyebrow}>{labels.emailLabel}</p>
      <EmailText className="mt-1 block select-all text-[20px] font-medium tracking-[-0.01em] text-ink desk:text-[22px]" />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <a className={ui.primary} href={email ? mailto(email, subject) : undefined} aria-disabled={!email || undefined}>
          <Mail className="size-4.5" aria-hidden="true" />
          {labels.write}
        </a>
        <button type="button" className={ui.secondary} onClick={copy} disabled={!email}>
          {copied ? <Check className="size-4.5" aria-hidden="true" /> : <Copy className="size-4.5" aria-hidden="true" />}
          <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
        </button>
      </div>
    </div>
  );
}
