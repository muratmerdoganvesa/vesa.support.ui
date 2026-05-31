/**
 * Footer — Modern, production-grade
 * Tailwind CSS + shadcn/ui
 */

import { cn } from "lib/utils";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

interface FooterLink {
  href: string;
  name: string;
}

interface Props {
  company?: FooterLink;
  links?: FooterLink[];
}

const DEFAULT_COMPANY: FooterLink = {
  href: "https://vesacons.com/",
  name: "Vesacons",
};

const DEFAULT_LINKS: FooterLink[] = [
  { href: "https://vesacons.com/", name: "Vesacons" },
  { href: "https://vesacons.com/", name: "Hakkimizda" },
  { href: "https://vesacons.com/", name: "Blog" },
  { href: "https://vesacons.com/", name: "Lisans" },
];

const TRANSLATION_MAP = {
  Hakkimizda: "ns1:FooterPage.Hakkimizda",
  Blog: "ns1:FooterPage.Blog",
  Lisans: "ns1:FooterPage.Lisans",
} as const;

export default function Footer({
  company = DEFAULT_COMPANY,
  links = DEFAULT_LINKS,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const resolveLabel = (name: string): string => {
    if (name in TRANSLATION_MAP) {
      const key = name as keyof typeof TRANSLATION_MAP;
      return t(TRANSLATION_MAP[key]);
    }
    return name;
  };

  return (
    <footer
      className={cn(
        "relative mt-2 w-full shrink-0",
        "border-t border-border/40",
        "bg-background/60 backdrop-blur-sm",
      )}
    >
      {/* Subtle top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

      <div
        className={cn(
          "mx-auto flex w-full flex-col items-center justify-between gap-3 px-6 pt-4",
          "sm:flex-row sm:gap-4",
        )}
      >
        {/* Copyright block */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground/80 select-none">
          <span className="tabular-nums">&copy; {year}</span>
          <span className="text-border">·</span>
          <a
            href={company.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group inline-flex items-center gap-0.5 font-medium text-foreground/80",
              "transition-colors duration-200 hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm",
            )}
          >
            {t("ns1:FooterPage.VesaconsSoftwareDevelopment")}
            <ExternalLink
              className="size-3 opacity-0 -translate-y-px transition-all duration-200 group-hover:opacity-60"
              aria-hidden="true"
            />
          </a>
        </p>

        {/* Nav links */}
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
            {links.map((link, index) => (
              <li key={link.name} className="flex items-center">
                {index > 0 && (
                  <span
                    className="mr-1 text-border/60 text-xs select-none"
                    aria-hidden="true"
                  >
                    /
                  </span>
                )}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "relative text-xs text-muted-foreground/70 font-normal",
                    "transition-colors duration-200 hover:text-foreground",
                    "after:absolute after:inset-x-0 after:-bottom-px after:h-px",
                    "after:bg-primary/50 after:scale-x-0 after:origin-left",
                    "after:transition-transform after:duration-200 hover:after:scale-x-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm",
                    "px-0.5 py-0.5",
                  )}
                >
                  {resolveLabel(link.name)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}