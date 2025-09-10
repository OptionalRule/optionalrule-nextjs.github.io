/**
 * Convert potion ingredient names to controlled ingredient IDs.
 *
 * - Validates that every potion ingredient name exists in ingredients.json
 * - If validation passes, rewrites potions.json replacing items[].name with items[].id
 * - Creates a one-time backup at public/tools/kcd2_alchemy/potions.backup.json if not present
 *
 * Usage:
 *   node --import tsx/esm scripts/convert-ingredients-to-ids.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';

type Ingredient = {
  id: string; // slug/id (string)
  name: string;
};

type PotionItemByName = { name: string; quantity: number };
type PotionItemById = { id: string; quantity: number };

type Potion = {
  id: string;
  name: string;
  ingredients: {
    liquid: string; // unchanged in this conversion
    items: PotionItemByName[] | PotionItemById[];
  };
  instructions: {
    default: string[];
    optimized?: {
      minLevel: number;
      steps: string[];
    };
  };
  quantity: {
    base: number;
    withSecretOfMatterI: number;
    withSecretOfMatterII: number;
    withBothSecrets: number;
    withSecretOfSecrets?: Record<string, number>;
  };
  effects: Array<{ quality: string; description: string }>;
  notes?: string | null;
};

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'public', 'tools', 'kcd2_alchemy');
const POTIONS_PATH = path.join(DATA_DIR, 'potions.json');
const POTIONS_BACKUP_PATH = path.join(DATA_DIR, 'potions.backup.json');
const INGREDIENTS_PATH = path.join(DATA_DIR, 'ingredients.json');

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, data: unknown) {
  const json = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(filePath, json, 'utf8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('• Loading data…');

  const [ingredients, potions] = await Promise.all([
    readJson<Ingredient[]>(INGREDIENTS_PATH),
    readJson<Potion[]>(POTIONS_PATH),
  ]);

  // Build lookup maps by name and by id (future-friendly)
  const byName = new Map<string, Ingredient>();
  const byId = new Set<string>();
  for (const ing of ingredients) {
    byName.set(normalizeName(ing.name), ing);
    byId.add(ing.id);
  }

  console.log(`• Ingredients loaded: ${ingredients.length}`);
  console.log(`• Potions loaded: ${potions.length}`);

  // Collect missing ingredient names across all potions
  const missing: Array<{ potionId: string; potionName: string; ingredient: string }> = [];

  for (const potion of potions) {
    for (const item of potion.ingredients.items as Array<PotionItemByName | PotionItemById>) {
      // If already using id, skip
      if ('id' in item && !('name' in item)) continue;
      const name = (item as PotionItemByName).name;
      const key = normalizeName(name);
      if (!byName.has(key)) {
        missing.push({ potionId: potion.id, potionName: potion.name, ingredient: name });
      }
    }
  }

  if (missing.length > 0) {
    console.error('\n✖ Validation failed: some potion ingredients were not found in ingredients.json');
    const grouped = new Map<string, Array<{ ingredient: string }>>();
    for (const m of missing) {
      const k = `${m.potionId} — ${m.potionName}`;
      const arr = grouped.get(k) || [];
      arr.push({ ingredient: m.ingredient });
      grouped.set(k, arr);
    }
    for (const [key, list] of grouped) {
      console.error(`  • ${key}`);
      for (const { ingredient } of list) {
        console.error(`    - ${ingredient}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log('• Validation passed: all potion ingredients are present.');

  // One-time backup
  if (!(await fileExists(POTIONS_BACKUP_PATH))) {
    await writeJson(POTIONS_BACKUP_PATH, potions);
    console.log(`• Backup written: ${path.relative(ROOT, POTIONS_BACKUP_PATH)}`);
  } else {
    console.log('• Backup exists, skipping backup write.');
  }

  // Transform items[].name -> items[].id
  const transformed: Potion[] = potions.map((p) => {
    const items = (p.ingredients.items as Array<PotionItemByName | PotionItemById>).map((item) => {
      if ('id' in item && !('name' in item)) {
        return item as PotionItemById; // already converted
      }
      const key = normalizeName((item as PotionItemByName).name);
      const ing = byName.get(key)!;
      return { id: ing.id, quantity: (item as PotionItemByName).quantity };
    });
    return {
      ...p,
      ingredients: {
        ...p.ingredients,
        items: items as PotionItemById[],
      },
    };
  });

  await writeJson(POTIONS_PATH, transformed);
  console.log(`• Updated: ${path.relative(ROOT, POTIONS_PATH)}`);
  console.log('✔ Conversion complete.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});

