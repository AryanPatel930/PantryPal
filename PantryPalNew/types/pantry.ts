// src/types/pantry.ts
export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  expirationDate?: Date;
  isExpired: boolean;
  addedAt: Date;
  updatedAt?: Date;
  imageUrl?: string;
  barcode?: string;
  notes?: string;
}

export interface PantryStats {
  totalItems: number;
  expiredCount: number;
  expiringSoonCount: number;
  lowQuantityCount: number;
  categories: string[];
  recentlyAdded: PantryItem[];
}

export interface PantryDataResponse {
  items: PantryItem[];
  stats: PantryStats;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}