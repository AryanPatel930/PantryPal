//src/screens/Inventory.tsx
import React, { useState } from 'react';
import { 
  SafeAreaView, 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  RefreshControl,
  Platform,
  SectionList,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Image,
  FlatList
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, typography } from '../utils/theme';
import { usePantryData, PantryItem } from '../hooks/usePantryData';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('InventoryScreen');

type SortOption = 'category' | 'expiration' | 'name' | 'recent';

interface SectionData {
  title: string;
  data: PantryItem[];
}

interface SortOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onSort: (option: SortOption) => void;
    currentSortBy: SortOption;
    sortAscending: boolean;
    onToggleDirection: () => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Category", value: "category" },
  { label: "Name", value: "name" },
  { label: "Expiration Date", value: "expiration" },
  { label: "Recently Added", value: "recent" },
];

const SortOptionsModal = ({
  visible,
  onClose,
  onSort,
  currentSortBy,
  sortAscending,
  onToggleDirection,
}: SortOptionsModalProps) => {
  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "80%",
      backgroundColor: "white",
      borderRadius: 12,
      padding: 16,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.h3,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeText: {
      ...typography.h3,
      color: colors.gray,
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    selectedOption: {
      backgroundColor: colors.light,
      borderRadius: 8,
    },
    optionText: {
      ...typography.body,
      color: colors.text,
    },
    selectedOptionText: {
      fontWeight: 'bold',
      color: colors.primary,
    },
    checkmark: {
      ...typography.body,
      color: colors.primary,
      fontWeight: 'bold',
    },
    directionContainer: {
      marginTop: spacing.md,
      alignItems: 'center',
    },
    directionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    directionText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    cancelButton: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    cancelText: {
      ...typography.body,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalTitle: {
      ...typography.h3,
      fontWeight: 'bold',
      marginBottom: spacing.md,
      textAlign: 'center',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={modalStyles.modalContainer}>
              <View style={modalStyles.header}>
                <Text style={modalStyles.modalTitle}>Sort by</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                  <Text style={modalStyles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={SORT_OPTIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      modalStyles.option,
                      currentSortBy === item.value && modalStyles.selectedOption,
                    ]}
                    onPress={() => onSort(item.value)}
                  >
                    <Text
                      style={[
                        modalStyles.optionText,
                        currentSortBy === item.value && modalStyles.selectedOptionText,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {currentSortBy === item.value && (
                      <Text style={modalStyles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />

              <View style={modalStyles.directionContainer}>
                <TouchableOpacity onPress={onToggleDirection} style={modalStyles.directionButton}>
                  <Text style={modalStyles.directionText}>
                    {sortAscending ? 'Ascending' : 'Descending'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={onClose} style={modalStyles.cancelButton}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};


const getShortName = (name: string, wordLimit: number = 3) => {
  const words = name.split(' ');
  if (words.length > wordLimit) {
    return words.slice(0, wordLimit).join(' ') + '...';
  }
  return name;
};

export default function InventoryScreen({ navigation }: { navigation: any }) {
  const { items, loading, error, refresh, deleteItem, updateItem } = usePantryData();
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [sortAscending, setSortAscending] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteItem(itemId);
              Alert.alert('Success', `"${itemName}" has been deleted.`);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleMarkExpired = async (itemId: string, itemName: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      await updateItem(itemId, { isExpired: newStatus });
      const statusText = newStatus ? 'expired' : 'fresh';
      Alert.alert('Updated', `"${itemName}" has been marked as ${statusText}.`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update item status.');
    }
  };

  const isExpiringSoon = (expirationDate?: Date) => {
    if (!expirationDate) return false;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expirationDate > now && expirationDate <= sevenDaysFromNow;
  };
  
  const getFilteredItems = () => {
    if (!searchQuery) {
      return items;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowercasedQuery) ||
      item.category.toLowerCase().includes(lowercasedQuery) ||
      item.unit?.toLowerCase().includes(lowercasedQuery) ||
      item.notes?.toLowerCase().includes(lowercasedQuery)
    );
  };

  const getSortedAndGroupedItems = () => {
    const filteredItems = getFilteredItems();
    const sorted = [...filteredItems];
    
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'expiration':
        sorted.sort((a, b) => {
          const aDate = a.expirationDate?.getTime() || Infinity;
          const bDate = b.expirationDate?.getTime() || Infinity;
          return aDate - bDate;
        });
        break;
      case 'recent':
        sorted.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
        break;
    }

    const finalSortedItems = sortAscending ? sorted : [...sorted].reverse();

    if (sortBy === 'category') {
        const groupedData = finalSortedItems.reduce((acc: Record<string, PantryItem[]>, item) => {
          const category = item.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {});
    
        return Object.keys(groupedData).map(category => ({
          title: category,
          data: groupedData[category],
        }));
    }
    
    return [{ title: 'All Items', data: finalSortedItems }];
  };
  
  const sections = getSortedAndGroupedItems();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: PantryItem }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{getShortName(item.name)}</Text>
        <Text style={styles.itemQuantity}>
          {item.quantity} {item.unit || ''}
        </Text>
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemCategory}>{item.category}</Text>
        {item.expirationDate && (
          <Text style={styles.expiryDate}>
            Expires: {item.expirationDate.toLocaleDateString()}
          </Text>
        )}
      </View>
      
      <View style={styles.badgeContainer}>
        {item.isExpired && (
          <View style={[styles.expiryBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.expiryText}>Expired</Text>
          </View>
        )}
        
        {!item.isExpired && isExpiringSoon(item.expirationDate) && (
          <View style={[styles.expiryBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.expiryText}>Expiring Soon</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.isExpired ? colors.accent : colors.warning }]}
          onPress={() => handleMarkExpired(item.id, item.name, item.isExpired)}
        >
          <Text style={styles.actionButtonText}>
            {item.isExpired ? 'Mark Fresh' : 'Mark Expired'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={() => handleDeleteItem(item.id, item.name)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your pantry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.error }}>Error loading inventory</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        
        <View style={styles.searchSortContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search pantry..."
              placeholderTextColor={colors.lightText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.sortIconsContainer}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.sortIcon}>⇅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortAscending(!sortAscending)}
            >
              <Text style={styles.sortIcon}>
                {sortAscending ? '↑' : '↓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <SortOptionsModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSort={setSortBy}
        currentSortBy={sortBy}
        sortAscending={sortAscending}
        onToggleDirection={() => setSortAscending(!sortAscending)}
      />

      {items.length === 0 && !searchQuery ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your pantry is empty</Text>
          <Text style={styles.emptySubtext}>Add items to get started</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddItem')}
          >
            <Text style={styles.addButtonText}>Add Your First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            sortBy === 'category' ? (
                <Text style={styles.sectionHeader}>{section.title}</Text>
            ) : null
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            items.length > 0 && searchQuery.length > 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No matching items found</Text>
                    <Text style={styles.emptySubtext}>Try a different search term</Text>
                </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadingText: {
        ...typography.body,
        color: colors.text,
        marginTop: spacing.md,
      },
      header: {
        backgroundColor: 'white',
        paddingTop: Platform.OS === 'android' ? spacing.md : 0,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      title: {
        ...typography.h2,
        color: colors.text,
        padding: spacing.md,
        textAlign: 'center',
        fontWeight: 'bold',
      },
      searchSortContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
      },
      searchBar: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 8,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
        height: 40,
      },
      searchInput: {
        ...typography.body,
        color: colors.text,
        flex: 1,
      },
      sortIconsContainer: {
        flexDirection: 'row',
      },
      sortButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 8,
        marginLeft: spacing.sm,
      },
      sortIcon: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
      },
      sectionHeader: {
        ...typography.h3,
        color: colors.text,
        backgroundColor: colors.light,
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: spacing.md,
        marginHorizontal: spacing.md,
        borderRadius: 8,
        overflow: 'hidden',
      },
      item: {
        backgroundColor: 'white',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
      },
      itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
      },
      itemName: {
        ...typography.body,
        color: colors.text,
        flex: 1,
        fontWeight: '600',
      },
      itemQuantity: {
        ...typography.body,
        color: colors.accent,
        fontWeight: '500',
        fontSize: 16,
      },
      itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
      },
      itemCategory: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '500',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        backgroundColor: colors.light,
        borderRadius: 10,
        overflow: 'hidden',
      },
      expiryDate: {
        ...typography.caption,
        color: colors.lightText,
      },
      badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.sm,
      },
      expiryBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: 12,
        marginRight: spacing.xs,
        marginBottom: spacing.xs / 2,
      },
      expiryText: {
        ...typography.caption,
        color: 'white',
        fontWeight: '600',
        fontSize: 11,
      },
      actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
      },
      actionButton: {
        flex: 0.48,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 6,
        alignItems: 'center',
      },
      actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
      },
      emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      emptyText: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.sm,
      },
      emptySubtext: {
        ...typography.body,
        color: colors.lightText,
        textAlign: 'center',
        marginBottom: spacing.lg,
      },
      addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 8,
      },
      addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: spacing.lg,
    backgroundColor: 'white',
    borderRadius: 20,
    width: '80%',
    padding: spacing.md,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  picker: {
    height: 200,
    width: '100%',
    backgroundColor: 'white',
  },

  pickerItem: {
    fontSize: typography.body.fontSize,
  },
  modalActions: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  directionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  directionButtonText: {
    color: 'white',
    ...typography.body,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOption: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: "#007aff",
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#007aff",
  },
  checkmark: {
    fontSize: 16,
    color: "#007aff",
    fontWeight: "600",
  },
});