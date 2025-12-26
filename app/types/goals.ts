// GUIDE: Tipos centrais utilizados em todo o projeto Destinote

export type AccessLevel = "public" | "user" | "plus" | "premium";

export interface GoalCategory {
  id: number;
  name: string;
  color?: string | null; // cor de categoria para futuro card holográfico
}

export interface Goal {
  id: number;
  title: string;
  title_en?: string | null;

  description?: string | null;
  description_en?: string | null;

  local?: string | null;
  local_en?: string | null;

  category: GoalCategory;

  isTopTen: boolean;
  imageUrl?: string | null;

  // GUIDE: Campos para futuro suporte multilíngue e expansão
  createdAt?: Date;
  updatedAt?: Date;
}
