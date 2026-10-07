import { Download, ExternalLink } from "lucide-react";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";
import { CV_PATH } from "@/lib/site";
import { ui } from "./ui";

/** CV.pdf: preview (desktop) and download. Rendered only when the file exists. */
export function CvWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap justify-center gap-2 border-b border-win-line px-4 py-3">
        <a href={CV_PATH} download="CV.pdf" className={ui.primary}>
          <Download className="size-4.5" aria-hidden="true" />
          {dict.cv.download}
        </a>
        <a href={CV_PATH} target="_blank" rel="noopener" className={ui.secondary}>
          <ExternalLink className="size-4.5" aria-hidden="true" />
          {dict.cv.openTab}
        </a>
      </div>
      {/* Phones rarely render PDFs inline: they get the two buttons only. */}
      <iframe
        src={`${CV_PATH}#view=FitH&toolbar=0`}
        title={dict.cv.preview}
        loading="lazy"
        className="hidden min-h-[480px] w-full flex-1 border-0 bg-win-card desk:block"
      />
    </div>
  );
}
