// Types for KCD2 Alchemy Scholar tool

export type IngredientId = string | number;

export interface Ingredient {
  id: IngredientId;
  name: string;
}

export interface PotionItem {
  id: IngredientId;
  quantity: number;
}

export interface PotionInstructionsOptimized {
  minLevel: number;
  steps: string[];
}

export interface PotionInstructions {
  default: string[];
  optimized?: PotionInstructionsOptimized;
}

export interface PotionQuantity {
  base: number;
  withSecretOfMatterI: number;
  withSecretOfMatterII: number;
  withBothSecrets: number;
  withSecretOfSecrets?: Record<string, number>;
}

export interface PotionEffect {
  quality: string;
  description: string;
}

export interface PotionRecipe {
  id: string;
  name: string;
  // Base shop price/value of the potion (from CSV). Defaults to 0 if unknown.
  baseValue: number;
  ingredients: {
    liquid: string;
    items: PotionItem[];
  };
  instructions: PotionInstructions;
  quantity: PotionQuantity;
  effects: PotionEffect[];
  notes?: string | null;
}

// Normalized shapes for UI
export interface ResolvedPotionItem extends PotionItem {
  name: string; // resolved from ingredient catalog
}

export interface NormalizedPotionRecipe extends Omit<PotionRecipe, 'ingredients'> {
  ingredients: {
    liquid: string;
    items: ResolvedPotionItem[];
  };
}

