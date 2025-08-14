// src/screens/Home.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Image, RefreshControl, Alert
} from 'react-native';
import { usePantryData, PantryItem } from '../hooks/usePantryData';
import { colors, spacing, typography } from '../utils/theme';
import { auth } from '../firebaseConfig';

const Home = () => {
  const { items, stats, loading, error, refresh, deleteItem } = usePantryData();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const uid = user.uid;
        setCurrentUserId(uid);
        console.log('Current User UID:', uid);
      } else {
        setCurrentUserId(null);
        console.log('No user signed in');
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (__DEV__) {
      console.log('Firestore Data Verification:');
      console.log('Current User UID:', currentUserId);
      console.log('Items Count:', items.length);
      console.log('Sample Item:', items.length > 0 ? items[0] : 'No items');
      console.log('Stats:', stats);
      if (error) console.error('Firestore Error:', error);
    }
  }, [items, stats, error, currentUserId]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteItem(id);
              console.log(`Deleted item ${id}`);
            } catch (err) {
              console.error('Delete failed:', err);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  const getShortName = (name: string, wordLimit: number = 3) => {
    const words = name.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return name;
  };

  const renderItem = ({ item }: { item: PantryItem }) => {
    return (
      <View style={styles.itemContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{getShortName(item.name)}</Text>
          <Text style={styles.itemMeta}>
            {item.quantity} {item.unit || 'unit(s)'} • {item.category}
          </Text>
          {item.expirationDate && (
            <Text style={[
              styles.expiration,
              item.isExpired && styles.expiredText
            ]}>
              {item.isExpired ? 'Expired' : 'Expires'} {item.expirationDate.toLocaleDateString()}
            </Text>
          )}
          {__DEV__ && (
            <Text style={styles.debugText}>
              Created: {item.createdAt?.toLocaleDateString?.() || 'N/A'}
              {item.userId && ` • User: ${item.userId.substring(0, 6)}...`}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!currentUserId) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authText}>Please sign in to view your pantry</Text>
      </View>
    );
  }

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading pantry items...</Text>
        <Text style={styles.debugUid}>User: {currentUserId.substring(0, 8)}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Permission Error</Text>
        <Text style={styles.errorText}>Failed to load pantry data</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <Text style={styles.debugUid}>User UID: {currentUserId}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={[styles.statCard, stats.expiredCount > 0 && styles.warningCard]}>
            <Text style={[styles.statNumber, stats.expiredCount > 0 && styles.warningNumber]}>
              {stats.expiredCount}
            </Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
          <View style={[styles.statCard, stats.lowQuantityCount > 0 && styles.warningCard]}>
            <Text style={[styles.statNumber, stats.lowQuantityCount > 0 && styles.warningNumber]}>
              {stats.lowQuantityCount}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Pantry Items Found</Text>
            <Text style={styles.emptyText}>
              {currentUserId
                ? "Add items to get started"
                : "Sign in to view your pantry"}
            </Text>
            {__DEV__ && (
              <Text style={styles.debugText}>
                Current Path: users/{currentUserId}/pantryItems
              </Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  authText: { fontSize: typography.h3.fontSize, color: colors.text, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { marginTop: spacing.md, fontSize: typography.body.fontSize, color: colors.lightText },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorTitle: { fontSize: typography.h3.fontSize, color: colors.danger, fontWeight: 'bold', marginBottom: spacing.sm },
  errorText: { fontSize: typography.body.fontSize, color: colors.text, marginBottom: spacing.xs },
  errorDetail: { fontSize: typography.caption.fontSize, color: colors.lightText, marginBottom: spacing.md, textAlign: 'center' },
  header: { paddingTop: spacing.md, marginBottom: spacing.md },
  title: { fontSize: typography.h1.fontSize, fontWeight: 'bold', color: colors.text, marginBottom: spacing.lg },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  statCard: { backgroundColor: colors.white, borderRadius: 8, padding: spacing.md, flex: 1, marginHorizontal: spacing.xs, alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  warningCard: { backgroundColor: colors.light },
  statNumber: { fontSize: typography.h2.fontSize, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  warningNumber: { color: colors.danger },
  statLabel: { fontSize: typography.caption.fontSize, color: colors.lightText },
  listContent: { paddingBottom: spacing.xl },
  itemContainer: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center', shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  itemImage: { width: 50, height: 50, borderRadius: 4, marginRight: spacing.md },
  imagePlaceholder: { width: 50, height: 50, borderRadius: 4, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  placeholderText: { color: colors.white, fontSize: typography.h2.fontSize, fontWeight: 'bold' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: typography.h3.fontSize, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  itemMeta: { fontSize: typography.body.fontSize, color: colors.lightText, marginBottom: spacing.xs },
  expiration: { fontSize: typography.caption.fontSize, color: colors.accent },
  expiredText: { color: colors.danger, fontWeight: 'bold' },
  deleteButton: { padding: spacing.sm },
  deleteButtonText: { fontSize: typography.h2.fontSize, color: colors.danger, fontWeight: 'bold' },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 8, marginTop: spacing.md },
  retryText: { color: colors.white, fontSize: typography.body.fontSize, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: typography.h3.fontSize, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body.fontSize, color: colors.lightText, textAlign: 'center' },
  debugText: { fontSize: typography.caption.fontSize, color: colors.lightText, marginTop: spacing.xs },
  debugUid: { fontSize: typography.caption.fontSize, color: colors.lightText, marginTop: spacing.sm },
});

export default Home;