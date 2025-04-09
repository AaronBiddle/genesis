export interface CategoryConfig {
    iconId: string; // Icon ID from svgIcons map
    // Add other category-specific config later if needed
    // e.g., defaultTitleBarColor?: string;
  }
  
  // Map category names (case-sensitive) to their configurations
  export const categoryConfigs: Record<string, CategoryConfig> = {
    Utilities: {
      iconId: 'utilities', // Assuming 'utilities' icon exists in svgIcons
    },
    // Add other categories here as needed
    // Example:
    // Development: {
    //   iconId: 'code',
    // }
  };
  
  export const defaultCategoryIcon = 'folder'; // Fallback icon ID