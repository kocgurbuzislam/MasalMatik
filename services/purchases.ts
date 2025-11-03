import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import { getAppUserId } from './userId';

let configured = false;

export async function configureRevenueCat(): Promise<void> {
  if (configured) return;
  const anyConst: any = Constants as any;
  const apiKey: string | undefined = anyConst?.expoConfig?.extra?.rcAndroidKey || process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
  if (!apiKey) return; // silently skip if key not set
  const appUserId = await getAppUserId();
  await Purchases.setDebugLogsEnabled(true);
  await Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
}

export async function getOfferPackages(): Promise<PurchasesPackage[]> {
  await configureRevenueCat();
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return [];
  const packs: PurchasesPackage[] = [];
  if (current.availablePackages) packs.push(...current.availablePackages);
  return packs;
}

export async function purchase(pack: PurchasesPackage): Promise<CustomerInfo> {
  await configureRevenueCat();
  const { customerInfo } = await Purchases.purchasePackage(pack);
  return customerInfo;
}

export async function restore(): Promise<CustomerInfo> {
  await configureRevenueCat();
  const info = await Purchases.restorePurchases();
  return info;
}

export async function isPremium(): Promise<boolean> {
  await configureRevenueCat();
  const info = await Purchases.getCustomerInfo();
  const entitlements = info?.entitlements?.active || {};
  return Object.keys(entitlements).some((k) => k.toLowerCase().includes('premium'));
}

