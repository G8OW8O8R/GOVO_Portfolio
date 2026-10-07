import { offerSchema } from "./schema";

const t = (pl: string, en: string) => ({ pl, en });

/**
 * Services and Process tabs of the Offer window (text approved by the owner).
 * Service cards come from the packages in pricing.ts – no prices here.
 */
export const offer = offerSchema.parse({
  servicesLead: t(
    "Strony dla firm i marek – od prostej wizytówki po stronę, którą się zapamiętuje.",
    "Websites for businesses and brands – from a simple business card site to a website people remember.",
  ),
  process: [
    {
      title: t("Rozmowa i wycena", "Conversation and quote"),
      text: t(
        "Krótka rozmowa o celu i zakresie. Dokładną wycenę dostajesz zwykle w ciągu doby.",
        "A short conversation about the goal and scope. You usually get an exact quote within a day.",
      ),
    },
    {
      title: t("Treści i zdjęcia", "Copy and photos"),
      text: t(
        "Zbieramy teksty i zdjęcia; jeśli ich nie masz, pomogę je przygotować. Od tego momentu liczę czas realizacji.",
        "We gather the copy and photos; if you don't have them, I'll help you prepare them. The timeline starts from this point.",
      ),
    },
    {
      title: t("Projekt i kod", "Design and code"),
      text: t(
        "Widzisz postęp na bieżąco, nie dopiero na końcu – pokazuję działające wersje, nie tylko makiety.",
        "You see progress as it happens, not only at the end – I show working versions, not just mockups.",
      ),
    },
    {
      title: t("Poprawki", "Revisions"),
      text: t(
        "Poprawki są w cenie. Dopracowujemy szczegóły, aż strona będzie gotowa do publikacji.",
        "Revisions are included. We refine the details until the website is ready to go live.",
      ),
    },
    {
      title: t("Wdrożenie", "Launch"),
      text: t(
        "Publikuję stronę i pomagam wybrać i skonfigurować domenę i hosting. Przy redesignie: przekierowania 301 ze starych adresów.",
        "I publish the website and help you choose and set up the domain and hosting. For a redesign: 301 redirects from the old addresses.",
      ),
    },
    {
      title: t("Opieka (opcjonalnie)", "Care (optional)"),
      text: t(
        "Aktualizacje, kopie zapasowe, drobne zmiany treści i monitoring działania.",
        "Updates, backups, small content changes and uptime monitoring.",
      ),
    },
  ],
});
