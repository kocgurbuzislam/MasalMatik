import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Image, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { generateStoryAndImage } from './services/geminiService';
import type { Story } from './types';
 

export default function AppNative() {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setStory(null);
    try {
      const result = await generateStoryAndImage(prompt.trim());
      setStory(result);
      
    } catch (e: any) {
      setError(e?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const reset = () => {
    setStory(null);
    setError(null);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sihirli Hikayeler</Text>
        

        {!story && !loading && (
          <View style={styles.card}>
            <Text style={styles.label}>Ne hakkında bir hikaye istersin?</Text>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Örn: Uzayda macera yaşayan bir kedi..."
              style={styles.input}
              multiline
            />
            <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleGenerate}>
              <Text style={styles.buttonText}>Hikayeyi Oluştur</Text>
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

        {story && !loading && (
          <View style={styles.card}>
            {!!story.imageUrl && (
              <Image source={{ uri: story.imageUrl }} style={styles.image} resizeMode="cover" />
            )}
            <Text style={styles.storyText}>{story.text}</Text>
            <Pressable style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>Yeni Bir Hikaye Oluştur</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.footer}>Yapay zeka ile sihirli dünyalar yaratın.</Text>
      </ScrollView>
      
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3e8ff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginVertical: 12, color: '#111827' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  cardCenter: { backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', gap: 12 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#374151' },
  input: { minHeight: 100, borderWidth: 1, borderColor: '#c4b5fd', borderRadius: 12, padding: 12, textAlignVertical: 'top', fontSize: 16, color: '#111827' },
  button: { marginTop: 12, backgroundColor: '#ec4899', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: 'white', fontWeight: '800' },
  secondaryButton: { marginTop: 12, borderColor: '#7c3aed', borderWidth: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#7c3aed', fontWeight: '700' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 12, backgroundColor: '#f9fafb' },
  storyText: { fontSize: 16, lineHeight: 24, color: '#111827' },
  loadingText: { marginTop: 8, color: '#6b7280' },
  footer: { textAlign: 'center', marginTop: 16, color: '#6b7280' },
  errorText: { color: '#b91c1c' }
});


