import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  variant: "momentum" | "progress" | "brainDump" | "today" | "scheduler";
  title: string;
  subtitle: string | ReactNode;
  links?: Array<{ text: string; href?: string; onClick?: () => void }>;
  icon?: LucideIcon;
  className?: string;
}

const variantStyles = {
  momentum: {
    bg: "bg-gradient-momentum",
    text: "text-white",
    linkBorder: "border-white/30",
    linkText: "text-white",
    linkHover: "hover:bg-white/10 hover:border-white/50",
  },
  progress: {
    bg: "bg-gradient-progress",
    text: "text-dashboard-momentum",
    linkBorder: "border-dashboard-momentum/30",
    linkText: "text-dashboard-momentum",
    linkHover: "hover:bg-dashboard-momentum/10 hover:border-dashboard-momentum/50",
  },
  brainDump: {
    bg: "bg-gradient-brain-dump",
    text: "text-white",
    linkBorder: "border-white/30",
    linkText: "text-white",
    linkHover: "hover:bg-white/10 hover:border-white/50",
  },
  today: {
    bg: "bg-gradient-today",
    text: "text-dashboard-momentum",
    linkBorder: "border-dashboard-momentum/30",
    linkText: "text-dashboard-momentum",
    linkHover: "hover:bg-dashboard-momentum/10 hover:border-dashboard-momentum/50",
  },
  scheduler: {
    bg: "bg-gradient-scheduler",
    text: "text-white",
    linkBorder: "border-white/30",
    linkText: "text-white",
    linkHover: "hover:bg-white/10 hover:border-white/50",
  },
};

export function DashboardCard({
  variant,
  title,
  subtitle,
  links = [],
  icon: Icon,
  className,
}: DashboardCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-card p-6 sm:p-8 md:p-10 lg:p-12 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl",
        styles.bg,
        styles.text,
        className
      )}
      role="group"
      tabIndex={0}
    >
      <div className="space-y-4 md:space-y-6">
        {/* Icon */}
        {Icon && (
          <div className="flex justify-start">
            <Icon className="h-8 w-8 md:h-10 md:w-10 opacity-80" aria-hidden="true" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-wider leading-tight">
          {title}
        </h2>

        {/* Subtitle */}
        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-light opacity-90">
          {subtitle}
        </div>

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={link.onClick}
                className={cn(
                  "inline-flex items-center px-4 py-2 rounded-card border transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "text-sm md:text-base font-medium",
                  styles.linkBorder,
                  styles.linkText,
                  styles.linkHover
                )}
                aria-label={link.text}
              >
                {link.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
