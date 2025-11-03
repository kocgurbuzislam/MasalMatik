import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { configureRevenueCat, getOfferPackages, purchase, restore, isPremium } from '../services/purchases';

export default function Paywall({ onClose, onPurchased }: { onClose?: () => void; onPurchased?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await configureRevenueCat();
        const packs = await getOfferPackages();
        setPackages(packs);
      } catch (e: any) {
        setError(e?.message || 'Paketler yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = async (pack: PurchasesPackage) => {
    try {
      setLoading(true);
      await purchase(pack);
      const premium = await isPremium();
      if (premium) {
        onPurchased?.();
        onClose?.();
      } else {
        Alert.alert('Bilgi', 'Satın alma tamamlandıysa birkaç saniye içinde etkinleşir.');
      }
    } catch (e: any) {
      Alert.alert('Satın alma başarısız', e?.message || 'Tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      await restore();
      const premium = await isPremium();
      if (premium) {
        onPurchased?.();
        onClose?.();
      } else {
        Alert.alert('Bilgi', 'Geri yükleme tamamlandı, premium bulunamadı.');
      }
    } catch (e: any) {
      Alert.alert('Geri yükleme başarısız', e?.message || 'Tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MasalMatik Premium</Text>
      <Text style={styles.subtitle}>Sınırsız hikaye ve görsel üretimi</Text>

      {loading && <ActivityIndicator size="large" color="#7c3aed" />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={packages}
        keyExtractor={(p) => p.identifier}
        renderItem={({ item }) => (
          <Pressable style={styles.pack} onPress={() => handlePurchase(item)}>
            <Text style={styles.packTitle}>{item.product.title}</Text>
            <Text style={styles.packPrice}>{item.product.priceString}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.muted}>Paket bulunamadı</Text> : null}
      />

      <View style={styles.row}>
        <Pressable style={styles.secondary} onPress={onClose}>
          <Text style={styles.secondaryText}>Kapat</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={handleRestore}>
          <Text style={styles.secondaryText}>Satın Alımları Geri Yükle</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { color: '#6b7280', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  secondary: { paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#7c3aed', borderRadius: 10 },
  secondaryText: { color: '#7c3aed', fontWeight: '700' },
  pack: { padding: 14, borderRadius: 12, backgroundColor: 'white', borderColor: '#e5e7eb', borderWidth: 1, marginVertical: 6 },
  packTitle: { fontWeight: '700', color: '#111827' },
  packPrice: { color: '#374151', marginTop: 4 },
  error: { color: '#b91c1c' },
  muted: { color: '#6b7280' },
});

