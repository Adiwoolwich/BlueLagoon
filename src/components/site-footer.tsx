import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-center gap-3 text-[11px] leading-none text-muted",
        className,
      )}
    >
      <a href="/impressum" className="hover:text-fg">
        Impressum
      </a>
      <span aria-hidden className="text-subtle">
        ·
      </span>
      <a href="/datenschutz" className="hover:text-fg">
        Datenschutz
      </a>
    </footer>
  );
}
