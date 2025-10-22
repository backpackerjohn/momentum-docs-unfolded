import { memo } from 'react';
import { getCategoryColor } from '@/lib/categoryColors';

interface CategoryBadgeProps {
  name: string;
  color: string | null;
  className?: string;
  onClick?: () => void;
}

export const CategoryBadge = memo(({ name, color, className = '', onClick }: CategoryBadgeProps) => {
  const bgColor = color || getCategoryColor(name);
  
  return (
    <span
      className={`px-2 py-1 rounded-full text-ui-label text-white ${className}`}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      {name}
    </span>
  );
});

CategoryBadge.displayName = 'CategoryBadge';
