// src/hooks/usePantryData.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  doc, 
  deleteDoc, 
  updateDoc, 
  Timestamp,
  getDocs,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('usePantryData');

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  expirationDate?: Date;
  isExpired: boolean;
  addedAt: Date;
  createdAt: Date;
  updatedAt?: Date;
  imageUrl?: string;
  barcode?: string;
  notes?: string;
  userId?: string;
}

interface PantryStats {
  totalItems: number;
  expiredCount: number;
  expiringSoonCount: number;
  lowQuantityCount: number;
  categories: string[];
  recentlyAdded: PantryItem[];
}

interface PantryDataResponse {
  items: PantryItem[];
  stats: PantryStats;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
}

const convertToDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'string') {
    const parsedDate = new Date(value);
    return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
};


const processDocumentData = (docSnapshot: any): PantryItem | null => {
  try {
    const data = docSnapshot.data();
    
    if (!data) {
      logger.error(`Document ${docSnapshot.id} has no data`);
      return null;
    }
    if (!data.name || typeof data.name !== 'string') {
      logger.error(`Document ${docSnapshot.id} missing valid name field`);
      return null;
    }

    const expirationDate = convertToDate(data.expirationDate);
    const isExpired = data.isExpired !== undefined ? data.isExpired : (expirationDate ? expirationDate < new Date() : false);
    const category = (data.category || 'Uncategorized').toUpperCase();

    const item: PantryItem = {
      id: docSnapshot.id,
      name: data.name,
      quantity: typeof data.quantity === 'number' ? data.quantity : parseInt(data.quantity) || 0,
      unit: data.unit || undefined,
      category: category,
      expirationDate: expirationDate,
      isExpired: isExpired,
      addedAt: convertToDate(data.createdAt) || new Date(),
      createdAt: convertToDate(data.createdAt) || new Date(),
      updatedAt: convertToDate(data.updatedAt),
      imageUrl: data.imageUrl || undefined,
      barcode: data.barcode || undefined,
      notes: data.notes || undefined,
      userId: data.userId || undefined
    };

    logger.log(`Successfully processed item: ${item.name} with quantity: ${item.quantity}`);
    return item;
  } catch (error) {
    logger.error(`Error processing document ${docSnapshot.id}: ${(error as Error).message}`);
    return null;
  }
};

export const usePantryData = (): PantryDataResponse => {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [stats, setStats] = useState<PantryStats>({
    totalItems: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    lowQuantityCount: 0,
    categories: [],
    recentlyAdded: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const calculateStats = useCallback((items: PantryItem[]): PantryStats => {
    logger.log(`Calculating stats for ${items.length} items`);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let lowQuantityCount = 0;
    const categoriesSet = new Set<string>();
    
    items.forEach((item) => {
      if (item.isExpired) {
        expiredCount++;
      } else if (item.expirationDate && item.expirationDate <= sevenDaysFromNow) {
        expiringSoonCount++;
      }
      if (item.quantity <= 2) {
        lowQuantityCount++;
      }
      categoriesSet.add(item.category);
    });

    const recentlyAdded = [...items]
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, 5);

    const statsResult: PantryStats = {
      totalItems: items.length,
      expiredCount,
      expiringSoonCount,
      lowQuantityCount,
      categories: Array.from(categoriesSet).sort(),
      recentlyAdded
    };

    logger.log(`Calculated stats: ${JSON.stringify({
      totalItems: statsResult.totalItems,
      expiredCount: statsResult.expiredCount,
      expiringSoonCount: statsResult.expiringSoonCount,
      lowQuantityItems: statsResult.lowQuantityCount,
      categoriesCount: statsResult.categories.length
    })}`);
    
    return statsResult;
  }, []);

  const refresh = useCallback(async () => {
    logger.log('Manual refresh triggered');
    if (!user) {
      logger.log('No user authenticated, skipping refresh');
      setItems([]);
      setStats({
        totalItems: 0,
        expiredCount: 0,
        expiringSoonCount: 0,
        lowQuantityCount: 0,
        categories: [],
        recentlyAdded: []
      });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      logger.log(`Refreshing data for user: ${user.uid}`);
      const itemsRef = collection(db, 'items');
      const q = query(itemsRef, 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      logger.log(`Retrieved ${querySnapshot.size} documents from Firestore`);
      
      const fetchedItems: PantryItem[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const item = processDocumentData(docSnapshot);
        if (item) fetchedItems.push(item);
      });

      logger.log(`Successfully processed ${fetchedItems.length} items`);
      setItems(fetchedItems);
      setStats(calculateStats(fetchedItems));
    } catch (err) {
      const error = err as Error;
      logger.error(`Error in refresh: ${error.message}`);
      console.error('Full error details:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [user, calculateStats]);

  const deleteItem = async (id: string) => {
    if (!user) {
      const error = new Error('No authenticated user');
      logger.error(error.message);
      throw error;
    }
    try {
      logger.log(`Deleting item: ${id}`);
      await deleteDoc(doc(db, 'items', id));
      logger.log('Item deleted successfully');
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (err) {
      const error = err as Error;
      logger.error(`Error deleting item: ${error.message}`);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<PantryItem>) => {
    if (!user) {
      const error = new Error('No authenticated user');
      logger.error(error.message);
      throw error;
    }
    try {
      logger.log(`Updating item: ${id}`, updates);
      const firestoreUpdates: any = { ...updates };
      if (updates.expirationDate) {
        firestoreUpdates.expirationDate = Timestamp.fromDate(updates.expirationDate);
      }
      firestoreUpdates.updatedAt = Timestamp.now();
      await updateDoc(doc(db, 'items', id), firestoreUpdates);
      logger.log('Item updated successfully');
    } catch (err) {
      const error = err as Error;
      logger.error(`Error updating item: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    logger.log(`Setting up listener for user: ${user ? user.uid : 'null'}`);
    if (!user) {
      logger.log('No authenticated user, clearing data');
      setItems([]);
      setStats({
        totalItems: 0,
        expiredCount: 0,
        expiringSoonCount: 0,
        lowQuantityCount: 0,
        categories: [],
        recentlyAdded: []
      });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const itemsRef = collection(db, 'items');
      const q = query(itemsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      logger.log(`Setting up real-time listener for collection: items with userId == ${user.uid}`);
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          logger.log(`Snapshot received with ${querySnapshot.size} documents`);
          const fetchedItems: PantryItem[] = [];
          let processedCount = 0;
          let errorCount = 0;
          
          querySnapshot.forEach((docSnapshot) => {
            const item = processDocumentData(docSnapshot);
            if (item) {
              fetchedItems.push(item);
              processedCount++;
            } else {
              errorCount++;
            }
          });

          logger.log(`Processed ${processedCount} items successfully, ${errorCount} errors`);
          setItems(fetchedItems);
          setStats(calculateStats(fetchedItems));
          setLoading(false);
        },
        (error) => {
          logger.error(`Snapshot error: ${error.message}`);
          console.error('Full snapshot error:', error);
          setError(error);
          setLoading(false);
        }
      );

      logger.log('Real-time listener established successfully');
      return unsubscribe;
    } catch (setupError) {
      const error = setupError as Error;
      logger.error(`Error setting up listener: ${error.message}`);
      console.error('Full setup error:', setupError);
      setError(error);
      setLoading(false);
    }
  }, [user, calculateStats]);

  useEffect(() => {
    if (__DEV__) {
      logger.log(`State update - Items: ${items.length}, Loading: ${loading}, Error: ${error?.message || 'none'}, User: ${user?.uid || 'none'}`);
    }
  }, [items.length, loading, error, user]);

  return { items, stats, loading, error, refresh, deleteItem, updateItem };
};