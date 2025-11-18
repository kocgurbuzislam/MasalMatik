import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Image, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { generateStoryAndImage } from './services/geminiService';
import { saveStory, getAllStories, deleteStory, getTodayStoryCount, DAILY_STORY_LIMIT } from './services/storageService';
import type { Story } from './types';
 

type View = 'home' | 'story' | 'history';

export default function AppNative() {
  const [view, setView] = useState<View>('home');
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState<Story | null>(null);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  const loadSavedStories = useCallback(async () => {
    const stories = await getAllStories();
    setSavedStories(stories);
    const count = await getTodayStoryCount();
    setTodayCount(count);
  }, []);

  useEffect(() => {
    loadSavedStories();
  }, [loadSavedStories]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    // Check daily limit before generating
    const currentCount = await getTodayStoryCount();
    if (currentCount >= DAILY_STORY_LIMIT) {
      Alert.alert(
        'Günlük Limit Doldu',
        `Bugün ${DAILY_STORY_LIMIT} hikaye oluşturdunuz. Yarın tekrar deneyebilirsiniz!`,
        [{ text: 'Tamam' }]
      );
      setTodayCount(currentCount);
      return;
    }

    setLoading(true);
    setError(null);
    setStory(null);
    try {
      const result = await generateStoryAndImage(prompt.trim());
      const storyWithMetadata: Story = {
        ...result,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        prompt: prompt.trim(),
        createdAt: Date.now(),
      };
      setStory(storyWithMetadata);
      await saveStory(storyWithMetadata);
      await loadSavedStories();
      setView('story');
    } catch (e: any) {
      setError(e?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [prompt, loadSavedStories]);

  const reset = () => {
    setStory(null);
    setError(null);
    setView('home');
  };

  const handleViewStory = (selectedStory: Story) => {
    setStory(selectedStory);
    setView('story');
  };

  const handleDeleteStory = useCallback(async (storyId: string) => {
    Alert.alert(
      'Hikayeyi Sil',
      'Bu hikayeyi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await deleteStory(storyId);
            await loadSavedStories();
            if (story?.id === storyId) {
              reset();
            }
          },
        },
      ]
    );
  }, [story, loadSavedStories]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {view !== 'home' && (
            <Pressable onPress={reset} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
          )}
          <Text style={styles.title}>Sihirli Hikayeler</Text>
          {view === 'home' && (
            <Pressable onPress={() => setView('history')} style={styles.historyButton}>
              <Text style={styles.historyButtonText}>📚</Text>
            </Pressable>
          )}
        </View>

        {view === 'home' && !loading && !error && (
          <View style={styles.card}>
            <View style={styles.limitContainer}>
              <Text style={styles.limitLabel}>Günlük Limit:</Text>
              <Text style={[styles.limitValue, todayCount >= DAILY_STORY_LIMIT && styles.limitValueReached]}>
                {DAILY_STORY_LIMIT - todayCount} / {DAILY_STORY_LIMIT} hikaye kaldı
              </Text>
            </View>
            {todayCount >= DAILY_STORY_LIMIT && (
              <View style={styles.limitWarning}>
                <Text style={styles.limitWarningText}>
                  Bugünlük limit doldu. Yarın tekrar deneyebilirsiniz!
                </Text>
              </View>
            )}
            <Text style={styles.label}>Ne hakkında bir hikaye istersin?</Text>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Örn: Uzayda macera yaşayan bir kedi..."
              style={[styles.input, todayCount >= DAILY_STORY_LIMIT && styles.inputDisabled]}
              multiline
              editable={todayCount < DAILY_STORY_LIMIT}
            />
            <Pressable 
              style={({ pressed }) => [
                styles.button, 
                pressed && styles.buttonPressed,
                todayCount >= DAILY_STORY_LIMIT && styles.buttonDisabled
              ]} 
              onPress={handleGenerate}
              disabled={todayCount >= DAILY_STORY_LIMIT}
            >
              <Text style={styles.buttonText}>
                {todayCount >= DAILY_STORY_LIMIT ? 'Günlük Limit Doldu' : 'Hikayeyi Oluştur'}
              </Text>
            </Pressable>
          </View>
        )}

        {loading && (
          <View style={styles.cardCenter}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingText}>Hikayen hazırlanıyor...</Text>
          </View>
        )}

        {error && (
          <View style={styles.cardCenter}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {view === 'story' && story && !loading && (
          <View style={styles.card}>
            {!!story.imageUrl && (
              <Image source={{ uri: story.imageUrl }} style={styles.image} resizeMode="cover" />
            )}
            <Text style={styles.storyText}>{story.text}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.secondaryButton} onPress={reset}>
                <Text style={styles.secondaryButtonText}>Yeni Bir Hikaye Oluştur</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteButton, ({ pressed }) => pressed && styles.buttonPressed]}
                onPress={() => handleDeleteStory(story.id)}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}

        {view === 'history' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Geçmiş Hikayeler</Text>
            {savedStories.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Henüz kaydedilmiş hikaye yok.</Text>
                <Text style={styles.emptyStateSubtext}>Yeni bir hikaye oluşturduğunuzda burada görünecek!</Text>
              </View>
            ) : (
              <ScrollView style={styles.historyList}>
                {savedStories.map((s) => (
                  <Pressable
                    key={s.id}
                    style={({ pressed }) => [
                      styles.historyItem,
                      pressed && styles.historyItemPressed,
                    ]}
                    onPress={() => handleViewStory(s)}
                  >
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemTitle} numberOfLines={2}>{s.prompt}</Text>
                      <Text style={styles.historyItemDate}>{formatDate(s.createdAt)}</Text>
                      <Text style={styles.historyItemPreview} numberOfLines={2}>{s.text}</Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(s.id);
                      }}
                      style={styles.historyDeleteButton}
                    >
                      <Text style={styles.historyDeleteText}>✕</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <Text style={styles.footer}>Yapay zeka ile sihirli dünyalar yaratın.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: 'bold',
  },
  historyButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  historyButtonText: {
    fontSize: 24,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    textAlign: 'center', 
    color: '#111827',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 24, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 20, 
    shadowOffset: { width: 0, height: 10 },
    elevation: 8, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardCenter: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center', 
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  limitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  limitLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  limitValue: { fontSize: 15, fontWeight: '900', color: '#059669', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  limitValueReached: { color: '#e11d48', backgroundColor: '#ffe4e6' },
  limitWarning: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fecaca',
    shadowColor: '#ef4444',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  limitWarningText: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '700',
  },
  label: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#111827' },
  input: { 
    minHeight: 120, 
    borderWidth: 2, 
    borderColor: '#c4b5fd', 
    borderRadius: 16, 
    padding: 16, 
    textAlignVertical: 'top', 
    fontSize: 16, 
    color: '#111827',
    backgroundColor: '#fafafa',
    shadowColor: '#a78bfa',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inputDisabled: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#6b7280' },
  button: { 
    marginTop: 16, 
    backgroundColor: '#6366f1', 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonDisabled: { backgroundColor: '#9ca3af', opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: '900', fontSize: 16 },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryButton: { flex: 1, borderColor: '#7c3aed', borderWidth: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#7c3aed', fontWeight: '700' },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  image: { 
    width: '100%', 
    aspectRatio: 1, 
    borderRadius: 20, 
    marginBottom: 16, 
    backgroundColor: '#f9fafb',
    borderWidth: 3,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  storyText: { 
    fontSize: 17, 
    lineHeight: 28, 
    color: '#111827',
    fontWeight: '500',
  },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 16, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: 24, color: '#6b7280', fontSize: 14, fontWeight: '600' },
  errorText: { color: '#b91c1c', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { 
    fontSize: 26, 
    fontWeight: '900', 
    marginBottom: 20, 
    color: '#111827',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 18, color: '#6b7280', marginBottom: 10, fontWeight: '700' },
  emptyStateSubtext: { fontSize: 15, color: '#9ca3af', textAlign: 'center', fontWeight: '500' },
  historyList: { maxHeight: 500 },
  historyItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  historyItemPressed: {
    backgroundColor: '#f3f4f6',
    transform: [{ scale: 0.98 }],
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  historyItemDate: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
    fontWeight: '600',
  },
  historyItemPreview: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    fontWeight: '500',
  },
  historyDeleteButton: {
    padding: 10,
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    marginLeft: 8,
  },
  historyDeleteText: {
    fontSize: 20,
  },
});


