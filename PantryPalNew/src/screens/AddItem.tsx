// src/screens/AddItem.tsx
import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../utils/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../auth/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { DebugLogger } from '../utils/debugLogger';
import { fetchProductInfo } from '../utils/barcodeApi';
import { useIsFocused } from '@react-navigation/native';

const logger = new DebugLogger('AddItemScreen');

const parseDateString = (dateString: string): Date | null => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  let year = parseInt(parts[2], 10);
  if (year < 100) {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    year = currentCentury + year;
    if (year > currentYear + 50) {
        year -= 100;
    }
  }

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};


export default function AddItemScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastScanResult, setLastScanResult] = useState<string>('');
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const isFocused = useIsFocused();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: '',
    purchaseDate: '',
    expirationDate: '',
    barcode: '',
    notes: '',
  });

  useEffect(() => {
    if (isFocused) {
        setFeedbackMessage({ type: '', text: '' });
        setIsSubmitted(false);
        setFormData({
            name: '',
            quantity: '',
            unit: '',
            category: '',
            purchaseDate: '',
            expirationDate: '',
            barcode: '',
            notes: '',
        });
        setImage(null);
    }
  }, [isFocused]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (feedbackMessage.type === 'success' && feedbackMessage.text) {
      timer = setTimeout(() => {
        setFeedbackMessage({ type: '', text: '' });
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [feedbackMessage]);


  const handleInputChange = (field: string, value: string) => {
    setFeedbackMessage({ type: '', text: '' });
    logger.log(`Input changed: ${field} = ${value}`);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBarcodeScan = async () => {
    logger.log('Barcode scan initiated');

    if (!permission) {
      logger.error('Camera permissions are loading...');
      setFeedbackMessage({ type: 'error', text: 'Camera permissions are loading...' });
      return;
    }

    if (!permission.granted) {
      logger.log('Requesting camera permission');
      const response = await requestPermission();
      if (!response.granted) {
        logger.error('Camera permission denied');
        setFeedbackMessage({ type: 'error', text: 'Camera permission is needed to scan barcodes' });
        return;
      }
      logger.log('Camera permission granted');
    }

    setScanning(true);
    setScanned(false);
    setScanAttempts(0);
    logger.log('Camera scanner opened');
  };

  const handleBarcodeLookup = async (barcode: string) => {
    setLastScanResult(barcode);
    setIsFetchingBarcode(true);

    try {
      const productInfo = await fetchProductInfo(barcode);
      if (productInfo) {
        setFormData(prev => ({ 
          ...prev, 
          name: productInfo.name,
          category: productInfo.category,
          quantity: productInfo.quantity?.split(' ')?.[0] || '',
          unit: productInfo.quantity?.split(' ')?.[1] || '',
          barcode: barcode
        }));
        if (productInfo.imageUrl) {
          setImage(productInfo.imageUrl);
        }
        setFeedbackMessage({ type: 'success', text: `Product found! Form autofilled for "${productInfo.name}".` });
      } else {
        setFormData(prev => ({ ...prev, barcode: barcode }));
        setFeedbackMessage({ type: 'warning', text: 'Product not found. Barcode saved, please fill out the form manually.' });
      }
    } catch (error) {
        setFormData(prev => ({ ...prev, barcode: barcode }));
        setFeedbackMessage({ type: 'error', text: 'Failed to lookup product info. Please fill out the form manually.' });
    } finally {
        setIsFetchingBarcode(false);
    }
  };

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    const currentAttempt = scanAttempts + 1;
    setScanAttempts(currentAttempt);
    logger.log(`Barcode scan attempt #${currentAttempt}`, { data: data, type: type });

    if (scanned) return;

    const barcodeData = data?.toString().trim();
    if (!barcodeData || barcodeData.length < 8) {
      logger.warn(`Invalid barcode length: ${barcodeData?.length || 0}`);
      return;
    }
    const validBarcodeRegex = /^[0-9]{8,14}$/;
    if (!validBarcodeRegex.test(barcodeData)) {
      logger.warn(`Invalid barcode format: ${barcodeData}`);
      return;
    }
    if (lastScanResult === barcodeData) return;

    setScanning(false);
    setScanned(true);
    handleBarcodeLookup(barcodeData);
  };


  const handleImagePicker = async () => {
    logger.log('Image picker initiated');
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setFeedbackMessage({ type: 'error', text: 'Permission required to access camera roll.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        logger.log('Image selected', { uri: result.assets[0].uri });
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      setFeedbackMessage({ type: 'error', text: 'Failed to pick image.' });
    }
  };

  const handleTakePhoto = async () => {
    logger.log('Take photo initiated');
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setFeedbackMessage({ type: 'error', text: 'Permission required to access camera.' });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        logger.log('Photo taken', { uri: result.assets[0].uri });
      }
    } catch (error) {
      logger.error('Error taking photo:', error);
      setFeedbackMessage({ type: 'error', text: 'Failed to take photo.' });
    }
  };

  const handleSubmit = async () => {
    logger.log('Form submission initiated', formData);

    if (!user) {
      setFeedbackMessage({ type: 'error', text: 'You must be logged in to add items.' });
      return;
    }

    if (!formData.name.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Item name is required.' });
      return;
    }
    
    const expirationDate = formData.expirationDate ? parseDateString(formData.expirationDate) : null;
    const purchaseDate = formData.purchaseDate ? parseDateString(formData.purchaseDate) : null;
    
    if (formData.expirationDate && !expirationDate) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid expiration date in MM/DD/YYYY format.' });
      return;
    }
    if (formData.purchaseDate && !purchaseDate) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid purchase date in MM/DD/YYYY format.' });
      return;
    }

    try {
      setUploading(true);
      
      let imageUrl = null;
      if (image) {
        logger.log('Uploading image...');
        imageUrl = await uploadImageToCloudinary(image);
        logger.log('Image uploaded successfully', { imageUrl });
      }

      const isExpired = expirationDate ? expirationDate < new Date() : false;
      
      const itemData: any = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        imageUrl,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isExpired: isExpired,
      };

      if (expirationDate) {
        itemData.expirationDate = expirationDate;
      }
      if (purchaseDate) {
        itemData.purchaseDate = purchaseDate;
      }

      await addDoc(collection(db, 'items'), itemData);
      logger.success('Item added successfully');
      setFeedbackMessage({ type: 'success', text: `Item "${itemData.name}" added successfully!` });
      
      setFormData({
        name: '',
        quantity: '',
        unit: '',
        category: '',
        purchaseDate: '',
        expirationDate: '',
        barcode: '',
        notes: '',
      });
      setImage(null);
      // ⬇️ REFACTORED: Navigate away immediately after a successful database write
      navigation.navigate('Home');
      
    } catch (error) {
      logger.error('Error adding item:', error);
      setFeedbackMessage({ type: 'error', text: 'Failed to add item. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13', 'ean8', 'upc_a', 'upc_e', 'code39',
              'code93', 'code128', 'codabar', 'itf14', 'pdf417'
            ],
          }}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTopSection}>
              <Text style={styles.scannerText}>Point camera at barcode</Text>
              <Text style={styles.scannerSubText}>
                Scan attempts: {scanAttempts}
              </Text>
            </View>

            <View style={styles.scannerTargetBox} />

            <View style={styles.scannerBottomSection}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setScanning(false);
                  logger.log('Scanner closed by user');
                }}
              >
                <Text style={styles.closeButtonText}>Close Scanner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualEntryButton}
                onPress={() => {
                  setScanning(false);
                  logger.log('User chose manual barcode entry');
                  setFormData(prev => ({ ...prev, barcode: '' }));
                }}
              >
                <Text style={styles.closeButtonText}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  const getFeedbackStyle = () => {
    switch (feedbackMessage.type) {
      case 'success':
        return { color: 'white', backgroundColor: colors.success };
      case 'error':
        return { color: 'white', backgroundColor: colors.error };
      case 'warning':
        return { color: 'white', backgroundColor: colors.warning };
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {isFetchingBarcode && (
        <View style={styles.fetchingBarcodeContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.fetchingBarcodeText}>Fetching product details...</Text>
        </View>
      )}

      {feedbackMessage.text ? (
        <View style={[styles.feedbackContainer, getFeedbackStyle()]}>
          <Text style={[styles.feedbackText, { color: getFeedbackStyle()?.color }]}>{feedbackMessage.text}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholder="Enter item name"
          placeholderTextColor={colors.lightText}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={formData.quantity}
            onChangeText={(value) => handleInputChange('quantity', value)}
            placeholder="Enter quantity"
            placeholderTextColor={colors.lightText}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>Unit</Text>
          <TextInput
            style={styles.input}
            value={formData.unit}
            onChangeText={(value) => handleInputChange('unit', value)}
            placeholder="e.g., pieces, kg, lbs"
            placeholderTextColor={colors.lightText}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(value) => handleInputChange('category', value)}
            placeholder="e.g., Fruits, Dairy, Meat"
            placeholderTextColor={colors.lightText}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Purchase Date</Text>
          <TextInput
            style={styles.input}
            value={formData.purchaseDate}
            onChangeText={(value) => handleInputChange('purchaseDate', value)}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={colors.lightText}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>Expiration Date</Text>
          <TextInput
            style={styles.input}
            value={formData.expirationDate}
            onChangeText={(value) => handleInputChange('expirationDate', value)}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={colors.lightText}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Barcode</Text>
        <View style={styles.barcodeContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={formData.barcode}
            onChangeText={(value) => handleInputChange('barcode', value)}
            placeholder="Scan or enter barcode"
            placeholderTextColor={colors.lightText}
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => formData.barcode ? handleBarcodeLookup(formData.barcode) : handleBarcodeScan()}
          >
            <Text style={styles.scanButtonText}>
              {formData.barcode ? 'Look Up' : 'Scan'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(value) => handleInputChange('notes', value)}
          placeholder="Additional notes about the item"
          placeholderTextColor={colors.lightText}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Photo</Text>
        <View style={styles.imageContainer}>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImage(null);
                  logger.log('Image removed');
                }}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No image selected</Text>
            </View>
          )}
          <View style={styles.imageButtonContainer}>
            <TouchableOpacity
              style={[styles.imageButton, { marginRight: spacing.sm }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={handleImagePicker}
            >
              <Text style={styles.imageButtonText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (uploading || isFetchingBarcode) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={uploading || isFetchingBarcode}
      >
        {uploading || isFetchingBarcode ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator color="white" />
            <Text style={styles.submitButtonText}>
                {isFetchingBarcode ? 'Fetching Product...' : 'Adding Item...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>Add Item</Text>
        )}
      </TouchableOpacity>

      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(formData, null, 2)}
          </Text>
          {image && (
            <Text style={styles.debugText}>Image: {image}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  scannerTopSection: {
    alignItems: 'center',
  },
  scannerText: {
    fontSize: 18,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.md,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scannerSubText: {
    fontSize: 14,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.sm,
    borderRadius: 6,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  scannerTargetBox: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  scannerBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: 8,
    flex: 0.45,
  },
  manualEntryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    flex: 0.45,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  fetchingBarcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fetchingBarcodeText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  feedbackContainer: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  feedbackText: {
    ...typography.body,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white'
  },
  successMessage: {
    backgroundColor: colors.success,
  },
  errorMessage: {
    backgroundColor: colors.error,
  },
  warningMessage: {
    backgroundColor: colors.warning,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginLeft: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageContainer: {
    marginTop: spacing.sm,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noImageContainer: {
    height: 100,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  noImageText: {
    color: colors.lightText,
    fontSize: 16,
  },
  imageButtonContainer: {
    flexDirection: 'row',
  },
  imageButton: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightText,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  debugText: {
    fontSize: 12,
    color: colors.lightText,
    fontFamily: 'monospace',
  },
});