import { Platform } from 'react-native';

// Conditionally import InAppPurchases only if module exists
let InAppPurchases;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.warn('expo-in-app-purchases not available - using mock implementation');
  InAppPurchases = null;
}

// Product IDs for your subscriptions
// These MUST match exactly what you configure in Google Play Console and App Store Connect
export const SUBSCRIPTION_PRODUCTS = {
  EXTENDED_MONTHLY: 'scheduhub_extended_monthly',
  EXTENDED_ANNUAL: 'scheduhub_extended_annual',
  UNLIMITED_MONTHLY: 'scheduhub_unlimited_monthly',
  UNLIMITED_ANNUAL: 'scheduhub_unlimited_annual',
};

// Map product IDs to your subscription tiers
export const PRODUCT_TO_TIER = {
  [SUBSCRIPTION_PRODUCTS.EXTENDED_MONTHLY]: 'extended',
  [SUBSCRIPTION_PRODUCTS.EXTENDED_ANNUAL]: 'extended',
  [SUBSCRIPTION_PRODUCTS.UNLIMITED_MONTHLY]: 'unlimited',
  [SUBSCRIPTION_PRODUCTS.UNLIMITED_ANNUAL]: 'unlimited',
};

// Billing periods
export const BILLING_PERIOD = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
};

/**
 * Initialize the in-app purchase connection
 */
export const initializePurchases = async () => {
  if (!InAppPurchases) {
    console.warn('In-app purchases not available in this environment');
    return false;
  }

  try {
    await InAppPurchases.connectAsync();
    console.log('Connected to in-app purchases');
    return true;
  } catch (error) {
    console.error('Failed to connect to in-app purchases:', error);
    return false;
  }
};

/**
 * Disconnect from in-app purchases (call on unmount)
 */
export const disconnectPurchases = async () => {
  if (!InAppPurchases) return;

  try {
    await InAppPurchases.disconnectAsync();
    console.log('Disconnected from in-app purchases');
  } catch (error) {
    console.error('Failed to disconnect from in-app purchases:', error);
  }
};

/**
 * Get available products from the stores
 */
export const getProducts = async () => {
  if (!InAppPurchases) {
    console.warn('In-app purchases not available - returning empty products');
    return [];
  }

  try {
    const productIds = Object.values(SUBSCRIPTION_PRODUCTS);
    const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('Products fetched:', results);
      return results;
    } else {
      console.error('Failed to fetch products. Response code:', responseCode);
      return [];
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * Purchase a subscription
 */
export const purchaseSubscription = async (productId) => {
  if (!InAppPurchases) {
    console.warn('In-app purchases not available');
    return { success: false, error: 'In-app purchases not available in this environment' };
  }

  try {
    const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('Purchase successful:', results);
      return { success: true, purchase: results[0] };
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('User canceled the purchase');
      return { success: false, canceled: true };
    } else {
      console.error('Purchase failed. Response code:', responseCode);
      return { success: false, error: 'Purchase failed' };
    }
  } catch (error) {
    console.error('Error during purchase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get purchase history for the user
 */
export const getPurchaseHistory = async () => {
  if (!InAppPurchases) {
    console.warn('In-app purchases not available - returning empty history');
    return [];
  }

  try {
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('Purchase history:', results);
      return results;
    } else {
      console.error('Failed to fetch purchase history. Response code:', responseCode);
      return [];
    }
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    return [];
  }
};

/**
 * Restore previous purchases (iOS mainly, but Android too)
 */
export const restorePurchases = async () => {
  try {
    const purchaseHistory = await getPurchaseHistory();

    // Filter for active subscriptions
    const activeSubscriptions = purchaseHistory.filter(purchase => {
      // Check if subscription is still valid
      // This is a simplified check - you should verify with your backend
      return purchase.acknowledged === true;
    });

    return activeSubscriptions;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return [];
  }
};

/**
 * Set up purchase listener for processing purchases
 */
export const setPurchaseListener = (callback) => {
  if (!InAppPurchases) {
    console.warn('In-app purchases not available - purchase listener not set');
    return null;
  }

  return InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      results.forEach(purchase => {
        if (!purchase.acknowledged) {
          // Process the purchase
          callback(purchase);

          // Acknowledge the purchase after processing
          InAppPurchases.finishTransactionAsync(purchase, true);
        }
      });
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('User canceled purchase');
    } else {
      console.error('Purchase error:', errorCode);
    }
  });
};

/**
 * Finish a transaction (acknowledge it)
 */
export const finishTransaction = async (purchase, consumeOnAndroid = false) => {
  if (!InAppPurchases) {
    console.warn('In-app purchases not available');
    return false;
  }

  try {
    await InAppPurchases.finishTransactionAsync(purchase, consumeOnAndroid);
    console.log('Transaction finished');
    return true;
  } catch (error) {
    console.error('Error finishing transaction:', error);
    return false;
  }
};
