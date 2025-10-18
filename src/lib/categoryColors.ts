const CATEGORY_COLORS = [
  '#e57452', // coral-orange (primary)
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
];

const categoryColorMap = new Map<string, string>();
let colorIndex = 0;

export function getCategoryColor(categoryName: string): string {
  if (categoryColorMap.has(categoryName)) {
    return categoryColorMap.get(categoryName)!;
  }
  
  const color = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
  categoryColorMap.set(categoryName, color);
  colorIndex++;
  
  return color;
}

export function setCategoryColor(categoryName: string, color: string): void {
  categoryColorMap.set(categoryName, color);
}
