import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  DiscordIcon,
  Facebook02Icon,
  InstagramIcon,
  Linkedin02Icon,
  TwitterIcon,
  PinterestIcon,
  SlackIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

type PlatformIconProps = {
  platform: string;
  className?: string;
  size?: number;
};

export function PlatformIcon({ platform, className, size = 24 }: PlatformIconProps) {
  const p = platform.toLowerCase();

  let icon: IconSvgElement | null = null;

  switch (p) {
    case "instagram":
      icon = InstagramIcon;
      break;
    case "twitter":
    case "x":
      icon = TwitterIcon;
      break;
    case "linkedin":
      icon = Linkedin02Icon;
      break;
    case "facebook":
      icon = Facebook02Icon;
      break;
    case "youtube":
      icon = YoutubeIcon;
      break;
    case "tiktok":
      icon = TiktokIcon;
      break;
    case "pinterest":
      icon = PinterestIcon;
      break;
    case "discord":
      icon = DiscordIcon;
      break;
    case "slack":
      icon = SlackIcon;
      break;
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-colors duration-200", className)}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }

  return (
    <div className={cn("inline-flex items-center justify-center transition-colors duration-200", className)}>
      <HugeiconsIcon icon={icon} size={size} />
    </div>
  );
}
