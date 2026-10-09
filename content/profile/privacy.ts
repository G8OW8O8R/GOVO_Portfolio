import { privacySchema } from "./schema";

const t = (pl: string, en: string) => ({ pl, en });

/**
 * Privacy page (/pl/prywatnosc, /en/privacy): what the contact form collects
 * and what happens to it, plus the visit statistics. Plain and short; no
 * cookie clauses – the site sets none.
 */
export const privacy = privacySchema.parse({
  lead: t(
    "Zbieram tylko to, co wpiszesz w formularzu kontaktu, i tylko po to, żeby odpowiedzieć. Statystyki odwiedzin są anonimowe.",
    "I only collect what you type into the contact form, and only to reply. Visit statistics are anonymous.",
  ),
  updated: "2026-10-09",
  rows: [
    {
      id: "administrator",
      title: t("Administrator", "Controller"),
      text: t("Piotr Goworek (GOVO DIGITAL). Kontakt: {email}.", "Piotr Goworek (GOVO DIGITAL). Contact: {email}."),
    },
    {
      id: "dane",
      title: t("Jakie dane", "What data"),
      text: t(
        "Z formularza kontaktu: imię, adres e-mail, temat, budżet (jeśli go wybierzesz) i treść wiadomości.",
        "From the contact form: your name, email address, topic, budget (if you choose one) and the message.",
      ),
    },
    {
      id: "cel",
      title: t("Po co", "Why"),
      text: t(
        "Żeby odpowiedzieć na wiadomość i, jeśli o to prosisz, przygotować ofertę.",
        "To reply to your message and, if you ask for one, to prepare a quote.",
      ),
    },
    {
      id: "podstawa",
      title: t("Podstawa", "Legal basis"),
      text: t(
        "Twoja zgoda, wyrażona wysłaniem formularza (art. 6 ust. 1 lit. a RODO), a przy zapytaniu o projekt także działania na Twoje żądanie przed zawarciem umowy (art. 6 ust. 1 lit. b RODO). Zgodę możesz wycofać w każdej chwili.",
        "Your consent, given by sending the form (Art. 6(1)(a) GDPR), and for a project enquiry also steps taken at your request before entering into a contract (Art. 6(1)(b) GDPR). You can withdraw your consent at any time.",
      ),
    },
    {
      id: "odbiorcy",
      title: t("Kto je widzi", "Who receives it"),
      text: t(
        "Resend (wysyłka wiadomości z formularza), Google (skrzynka Gmail, na którą trafia wiadomość) i Vercel (hosting strony). Te firmy działają także poza Europejskim Obszarem Gospodarczym; dane przekazywane są na podstawie mechanizmów przewidzianych w RODO (standardowe klauzule umowne lub EU-US Data Privacy Framework).",
        "Resend (sends the form's message), Google (the Gmail inbox the message arrives in) and Vercel (hosts the site). These companies also operate outside the European Economic Area; data is transferred under mechanisms provided for by the GDPR (standard contractual clauses or the EU-US Data Privacy Framework).",
      ),
    },
    {
      id: "jak-dlugo",
      title: t("Jak długo", "How long"),
      text: t(
        "Przez czas naszej korespondencji, potem usuwam wiadomość. Jeśli dojdzie do współpracy, przechowuję ją tak długo, jak wymaga tego umowa i przepisy.",
        "For as long as we write to each other, then I delete the message. If we end up working together, I keep it for as long as the contract and the law require.",
      ),
    },
    {
      id: "prawa",
      title: t("Twoje prawa", "Your rights"),
      text: t(
        "Możesz poprosić o dostęp do swoich danych, ich poprawienie lub usunięcie, wnieść sprzeciw albo wycofać zgodę – wystarczy e-mail. Masz też prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).",
        "You can ask for access to your data, to correct or delete it, object to its use or withdraw your consent – an email is enough. You can also lodge a complaint with the Polish data protection authority (President of the Personal Data Protection Office, uodo.gov.pl) or the authority in your country.",
      ),
    },
    {
      id: "statystyki",
      title: t("Statystyki", "Statistics"),
      text: t(
        "Odwiedziny liczę w Umami: anonimowo i bez cookies. Widzę tylko zbiorcze liczby – odwiedzone podstrony, skąd przyszło wejście, kraj, rodzaj urządzenia i przeglądarkę – z których nie da się ustalić, kim jesteś.",
        "I count visits with Umami: anonymously and without cookies. I only see totals – pages visited, where a visit came from, country, device type and browser – which can't tell me who you are.",
      ),
    },
    {
      id: "cookies",
      title: t("Cookies", "Cookies"),
      text: t(
        "Strona nie używa cookies. W pamięci przeglądarki zapisuje tylko ustawienia pulpitu: położenie przesuniętych plików i to, że intro było już pokazane.",
        "The site uses no cookies. It only keeps desktop settings in your browser's storage: where you moved the files and whether you've seen the intro.",
      ),
    },
  ],
});
