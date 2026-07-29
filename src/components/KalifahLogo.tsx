import kalifahLogo from "@/assets/kalifah-logo.svg";

interface KalifahLogoProps {
  /** Tailwind height classes for the logo, e.g. "h-8 md:h-9" */
  className?: string;
}

/**
 * Official Kalifah.my brand lockup (icon + wordmark) as a single SVG.
 * Height-only sizing (h-* + w-auto) so the natural aspect ratio is kept.
 */
export function KalifahLogo({ className = "h-8 md:h-9" }: KalifahLogoProps) {
  return <img src={kalifahLogo} alt="Kalifah.my" className={`${className} w-auto`} />;
}

export default KalifahLogo;
