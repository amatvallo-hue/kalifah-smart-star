import kalifahIcon from "@/assets/kalifah-icon.svg";

interface KalifahLogoProps {
  /** Tailwind height classes for the icon, e.g. "h-8 md:h-9" */
  className?: string;
  /** Tailwind text-size classes for the wordmark */
  textClassName?: string;
}

/**
 * Official Kalifah.my brand lockup: icon mark + wordmark.
 * The icon SVG keeps its natural square ratio (h-* + w-auto only — never a
 * fixed width or aspect box), the wordmark is real text so it never renders
 * as a cropped/empty vector box.
 */
export function KalifahLogo({
  className = "h-8 md:h-9",
  textClassName = "text-xl md:text-2xl",
}: KalifahLogoProps) {
  return (
    <span className="flex items-center gap-2">
      <img
        src={kalifahIcon}
        alt="Kalifah.my"
        className={`${className} w-auto rounded-[22%]`}
      />
      <span
        className={`font-display font-extrabold tracking-tight text-foreground ${textClassName}`}
      >
        kalifah<span className="text-primary">.my</span>
      </span>
    </span>
  );
}

export default KalifahLogo;
