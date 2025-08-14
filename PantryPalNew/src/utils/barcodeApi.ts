import { Alert } from 'react-native';
import { DebugLogger } from './debugLogger';

const logger = new DebugLogger('BarcodeAPI');

export interface BarcodeProduct {
    name: string;
    category: string;
    imageUrl?: string;
    quantity?: string;
}

export const fetchProductInfo = async (barcode: string): Promise<BarcodeProduct | null> => {
    if (!barcode || barcode.length < 8) {
        logger.warn('Invalid barcode provided for lookup');
        return null;
    }

    const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    logger.log(`Fetching product info for barcode: ${barcode}`);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        const data = await response.json();

        if (data.status === 1 && data.product) {
            logger.success('Product found', { productName: data.product.product_name });
            const product = data.product;

            return {
                name: product.product_name || 'Unknown Product',
                category: product.categories_tags?.[0]?.split(':')?.[1]?.replace(/-/g, ' ') || 'Uncategorized',
                imageUrl: product.image_url,
                quantity: product.quantity,
            };
        } else {
            logger.log('Product not found for barcode');
            return null;
        }
    } catch (error) {
        logger.error('Error fetching product from API', error);
        Alert.alert('Error', 'Failed to fetch product information. Please try again.');
        return null;
    }
};