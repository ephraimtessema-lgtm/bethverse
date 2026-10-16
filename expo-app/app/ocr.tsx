import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  AppState,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '@/lib/storage';
import { setEditorDraft } from '@/lib/editorDraft';
import { extractTextFromImageUri } from '@/lib/ocr';
import { suppressPinLockFor, setOcrSessionActive } from '@/lib/pinLockGuard';
import { useAppTheme } from '@/context/ThemeContext';
import { OCR_LANGUAGES, OCR_QUALITY } from '@/lib/theme';
import { IconButton } from '@/components/IconButton';

function OptionModal({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  colors,
  fonts,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  fonts: ReturnType<typeof useAppTheme>['fonts'];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 36,
          }}
          onPress={() => {}}
        >
          <Text style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            {title}
          </Text>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                minHeight: 48,
              }}
            >
              <Text style={{ fontSize: 16, color: value === opt.value ? colors.primary : colors.text, fontWeight: value === opt.value ? '600' : '400' }}>
                {opt.label}
              </Text>
              {value === opt.value ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function OcrScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const [uri, setUri] = useState<string | null>(typeof params.uri === 'string' ? params.uri : null);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('amharic');
  const [quality, setQuality] = useState('balanced');
  const [langModal, setLangModal] = useState(false);
  const [qualityModal, setQualityModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    storage.getOcrLang().then(setLanguage);
    storage.getOcrQuality().then(setQuality);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setOcrSessionActive(true);
      suppressPinLockFor(60000);
      return () => setOcrSessionActive(false);
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') suppressPinLockFor(30000);
    });
    return () => sub.remove();
  }, []);

  const runOcr = useCallback(
    async (imageUri: string) => {
      setExtracting(true);
      setConfidence(null);
      try {
        const result = await extractTextFromImageUri(imageUri, { language, quality });
        setText(result.text);
        setConfidence(result.confidence);
        if (!result.text) {
          Alert.alert('No text found', 'Could not read text from this image. Try a clearer photo or type manually.');
        }
      } catch (err) {
        console.error(err);
        Alert.alert(
          'OCR unavailable',
          'Text recognition requires a built APK (not Expo Go). Install the release build, or paste text manually.',
        );
      } finally {
        setExtracting(false);
      }
    },
    [language, quality],
  );

  useEffect(() => {
    if (typeof params.uri === 'string' && params.uri.length > 0) {
      setUri(params.uri);
      runOcr(params.uri);
    }
  }, [params.uri, runOcr]);

  const pick = async (useCamera: boolean) => {
    suppressPinLockFor(45000);
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera or photos to scan poem images.');
      return;
    }
    suppressPinLockFor(45000);
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: false, mediaTypes: ['images'] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.9, allowsEditing: false, mediaTypes: ['images'] });
    suppressPinLockFor(30000);
    if (!result.canceled && result.assets[0]) {
      const assetUri = result.assets[0].uri;
      setUri(assetUri);
      await runOcr(assetUri);
    }
  };

  const useText = () => {
    if (!text.trim()) return;
    suppressPinLockFor(5000);
    setEditorDraft({ body: text.trim() });
    router.push('/editor/new');
  };

  const langLabel = OCR_LANGUAGES.find((l) => l.value === language)?.label ?? 'Amharic';
  const qualityLabel = OCR_QUALITY.find((q) => q.value === quality)?.label ?? 'Balanced';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()} size={44}>
          <Ionicons name="close" size={26} color={colors.text} />
        </IconButton>
        <View style={styles.headerCenter}>
          <Text style={styles.h1}>{t.scanPoetry}</Text>
          <Text style={styles.sub}>{t.openOcrDesc}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.imageBox} onPress={() => pick(false)} disabled={extracting}>
          {uri ? (
            <View>
              <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
              {extracting ? (
                <View style={styles.extractOverlay}>
                  <ActivityIndicator color={colors.primary} size="large" />
                  <Text style={styles.extractLabel}>Reading text…</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={40} color={colors.muted} />
              <Text style={styles.placeholderText}>Tap to select image</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.pickerRow}>
          <Pressable style={styles.pickBtn} onPress={() => pick(true)} disabled={extracting}>
            <Ionicons name="camera" size={22} color={colors.primary} />
            <Text style={styles.pickLabel}>Camera</Text>
          </Pressable>
          <Pressable style={styles.pickBtn} onPress={() => pick(false)} disabled={extracting}>
            <Ionicons name="images" size={22} color={colors.primary} />
            <Text style={styles.pickLabel}>Gallery</Text>
          </Pressable>
          {uri ? (
            <Pressable style={styles.pickBtn} onPress={() => runOcr(uri)} disabled={extracting}>
              <Ionicons name="refresh" size={22} color={colors.primary} />
              <Text style={styles.pickLabel}>Re-scan</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.settingsRow}>
          <Pressable style={styles.settingChip} onPress={() => setLangModal(true)}>
            <Text style={styles.chipLabel}>Language</Text>
            <Text style={styles.chipValue}>{langLabel}</Text>
          </Pressable>
          <Pressable style={styles.settingChip} onPress={() => setQualityModal(true)}>
            <Text style={styles.chipLabel}>Quality</Text>
            <Text style={styles.chipValue}>{qualityLabel}</Text>
          </Pressable>
        </View>

        {confidence !== null ? (
          <Text style={styles.confidence}>
            Confidence: {confidence}%
          </Text>
        ) : null}

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Extracted poem text appears here…"
          multiline
          style={styles.textArea}
          textAlignVertical="top"
          placeholderTextColor={colors.muted}
        />

        <Pressable
          style={[styles.btn, !text.trim() && styles.btnDisabled]}
          onPress={useText}
          disabled={!text.trim() || extracting}
        >
          {extracting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.btnText}>{t.openEditor}</Text>
          )}
        </Pressable>
      </ScrollView>

      <OptionModal
        visible={langModal}
        title="OCR Language"
        options={OCR_LANGUAGES}
        value={language}
        onSelect={async (v) => {
          setLanguage(v);
          await storage.setOcrLang(v);
          setLangModal(false);
          if (uri) runOcr(uri);
        }}
        onClose={() => setLangModal(false)}
        colors={colors}
        fonts={fonts}
      />
      <OptionModal
        visible={qualityModal}
        title="OCR Quality"
        options={OCR_QUALITY}
        value={quality}
        onSelect={async (v) => {
          setQuality(v);
          await storage.setOcrQuality(v);
          setQualityModal(false);
        }}
        onClose={() => setQualityModal(false)}
        colors={colors}
        fonts={fonts}
      />
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingBottom: 40 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    h1: { fontFamily: fonts.heading, fontSize: 18, fontWeight: '600', color: colors.text },
    sub: { fontSize: 12, color: colors.muted, marginTop: 2, textAlign: 'center' },
    imageBox: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    preview: { width: '100%', height: 180 },
    extractOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    extractLabel: { color: '#fff', fontSize: 13 },
    placeholder: {
      height: 160,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.mutedBg,
    },
    placeholderText: { fontSize: 13, color: colors.muted, marginTop: 8 },
    pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    pickBtn: {
      flex: 1,
      minWidth: '30%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 48,
      backgroundColor: colors.card,
    },
    pickLabel: { color: colors.primary, fontWeight: '600', fontSize: 12 },
    settingsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    settingChip: {
      flex: 1,
      backgroundColor: colors.mutedBg,
      borderRadius: 12,
      padding: 12,
      minHeight: 56,
    },
    chipLabel: { fontSize: 11, color: colors.muted },
    chipValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 4 },
    confidence: { fontSize: 12, color: colors.primary, marginBottom: 8 },
    textArea: {
      minHeight: 160,
      backgroundColor: colors.mutedBg,
      borderRadius: 16,
      padding: 16,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 16,
      color: colors.text,
      fontFamily: fonts.body,
    },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 16 },
  });
}
