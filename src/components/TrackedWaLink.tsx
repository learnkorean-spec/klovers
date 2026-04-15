import { ReactNode } from "react";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

interface TrackedWaLinkProps {
  href: string;
  ctaLabel: string;
  metadata?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

/**
 * Drop-in replacement for `<a href="https://wa.me/...">`.
 * Logs a lead_events row before opening the link in a new tab.
 *
 * Use this anywhere on the user-facing site that links to WhatsApp so we
 * capture pre-signup interest signals consistently.
 */
const TrackedWaLink = ({
  href,
  ctaLabel,
  metadata,
  className,
  children,
  ariaLabel,
}: TrackedWaLinkProps) => {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    trackAndOpenWhatsApp(href, { cta_label: ctaLabel, metadata });
  };

  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
};

export default TrackedWaLink;
