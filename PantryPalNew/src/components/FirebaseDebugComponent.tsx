// src/components/FirebaseDebugComponent.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import { collection, getDocs, doc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import { colors, spacing, typography } from '../utils/theme';

export const FirebaseDebugComponent = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addDebugLine = (line: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${line}`;
    setDebugInfo(prev => [...prev, logLine]);
    console.log(`🔧 DEBUG: ${logLine}`);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  const testFirebaseConnection = async () => {
    setDebugInfo([]);
    
    try {
      addDebugLine(`🔐 User authenticated: ${!!user}`);
      if (user) {
        addDebugLine(`👤 User ID: ${user.uid}`);
        addDebugLine(`📧 User email: ${user.email || 'No email'}`);
      }

      if (!user) {
        addDebugLine('❌ ERROR: No authenticated user - this is likely your main issue!');
        return;
      }

      // Test 1: Check if we can read from the collection
      addDebugLine('📖 Testing read access to pantryItems collection...');
      const pantryRef = collection(db, 'users', user.uid, 'pantryItems');
      addDebugLine(`📁 Collection path: ${pantryRef.path}`);
      
      const snapshot = await getDocs(pantryRef);
      addDebugLine(`📊 Collection exists, documents count: ${snapshot.size}`);
      
      if (snapshot.size === 0) {
        addDebugLine('⚠️ Collection is empty - this might be why you see no data');
      }
      
      let docIndex = 0;
      snapshot.forEach((doc) => {
        docIndex++;
        addDebugLine(`📄 Document ${docIndex} ID: ${doc.id}`);
        const data = doc.data();
        addDebugLine(`📄 Document ${docIndex} data keys: ${Object.keys(data).join(', ')}`);
        
        // Check for required fields
        const requiredFields = ['name', 'quantity', 'category', 'addedAt'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
          addDebugLine(`⚠️ Document ${docIndex} missing fields: ${missingFields.join(', ')}`);
        }
      });

      // Test 2: Try to add a test document
      addDebugLine('✏️ Testing write access...');
      const testDocRef = doc(pantryRef, 'debug-test-item-' + Date.now());
      await setDoc(testDocRef, {
        name: 'Debug Test Item',
        quantity: 1,
        category: 'Debug',
        isExpired: false,
        addedAt: Timestamp.now()
      });
      addDebugLine('✅ Test document created successfully');

      // Test 3: Read again to verify
      const newSnapshot = await getDocs(pantryRef);
      addDebugLine(`📊 After adding test item, collection size: ${newSnapshot.size}`);

      // Test 4: Clean up test document
      addDebugLine('🧹 Cleaning up test document...');
      await deleteDoc(testDocRef);
      addDebugLine('✅ Test document deleted successfully');

      addDebugLine('🎉 All Firebase tests passed! Your connection is working.');

    } catch (error: any) {
      addDebugLine(`❌ ERROR: ${error.message}`);
      addDebugLine(`❌ Error code: ${error.code || 'Unknown'}`);
      
      if (error.code === 'permission-denied') {
        addDebugLine('🔒 This is likely a Firestore security rules issue');
      } else if (error.code === 'unavailable') {
        addDebugLine('🌐 This is likely a network connectivity issue');
      }
      
      console.error('🔧 Firebase test error:', error);
    }
  };

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  if (!isVisible) {
    return (
      <View style={styles.toggleContainer}>
        <Button 
          title="🔧 Show Firebase Debug" 
          onPress={() => setIsVisible(true)}
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Firebase Debug Panel</Text>
        <Button 
          title="Hide" 
          onPress={() => setIsVisible(false)}
          color={colors.error}
        />
      </View>
      
      <View style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <Button 
            title="Test Connection" 
            onPress={testFirebaseConnection}
            color={colors.primary}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button 
            title="Clear Log" 
            onPress={clearDebugInfo}
            color={colors.accent}
          />
        </View>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {debugInfo.length === 0 ? (
          <Text style={styles.noLogsText}>No debug information yet. Tap "Test Connection" to start.</Text>
        ) : (
          debugInfo.map((line, index) => (
            <Text key={index} style={styles.logLine}>
              {line}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  container: {
    backgroundColor: '#f8f9fa',
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  title: {
    ...typography.body,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#000',
    padding: spacing.sm,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  noLogsText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.md,
  },
  logLine: {
    fontSize: 11,
    color: '#00ff00',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});