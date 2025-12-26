// types/goal.ts

export type AccessLevel = 'public' | 'user' | 'plus' | 'premium';

export interface MacroCategory {
  id: number;
  name: string;
  name_en?: string | null;
  description?: string | null;
  color?: string | null;
  order?: number | null;
}

export interface Category {
  id: number;
  name: string;

  // compat: alguns lugares usam snake_case, outros camelCase
  name_en?: string | null;
  nameEn?: string | null;

  color?: string | null;
  order?: number | null;

  macroCategoryId?: number | null;
  macroCategory?: MacroCategory | null;

  // compat: contadores
  goalsCount?: number;
  count?: number;
}

export interface GoalCategory {
  goalId: number;
  categoryId: number;
  category: Category;
}

export interface Goal {
  id: number;
  title: string;
  title_en?: string | null;

  description?: string | null;
  description_en?: string | null;

  category: Category;

  // múltiplas categorias (tabela pivô)
  categories?: GoalCategory[];

  isTopTen?: boolean;
  isPremium?: boolean;

  local?: string | null;
  local_en?: string | null;

  imageUrl?: string | null;

  accessLevel?: AccessLevel;

  // quando vem do Prisma em JSON
  createdAt?: string;
  updatedAt?: string;
}
