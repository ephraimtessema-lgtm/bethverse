import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { db, exportBackup, importBackup, type Poem, type Collection } from '@/lib/db';
import { usePinLock } from '@/context/PinLockContext';
import { useAppTheme } from '@/context/ThemeContext';
import { storage } from '@/lib/storage';
import { filterSavedPoems } from '@/lib/poemUtils';
import { FixedHeaderScreen } from '@/components/FixedHeaderScreen';
import { AppSwitch } from '@/components/AppSwitch';
import { SetPinModal, type PinModalMode } from '@/components/SetPinModal';
import { SettingGroup, SettingRow } from '@/components/SettingGroup';
import { OCR_LANGUAGES, OCR_QUALITY, type ThemeMode, type FontStyle } from '@/lib/theme';

const THEME_OPTIONS: { value: ThemeMode; labelKey: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', labelKey: 'light', icon: 'sunny-outline' },
  { value: 'dark', labelKey: 'dark', icon: 'moon-outline' },
  { value: 'system', labelKey: 'system', icon: 'phone-portrait-outline' },
];

const FONT_OPTIONS: { value: FontStyle; labelKey: 'amharicFont' | 'serif' | 'modern' | 'classic'; sample: string }[] = [
  { value: 'amharic', labelKey: 'amharicFont', sample: 'Noto Ethiopic' },
  { value: 'serif', labelKey: 'serif', sample: 'Lora' },
  { value: 'modern', labelKey: 'modern', sample: 'Inter' },
  { value: 'classic', labelKey: 'classic', sample: 'Playfair' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { colors, fonts, theme, fontStyle, t, amharicUi, setTheme, setFontStyle, setAmharicUi } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const { pin, biometricEnabled, lockOnLaunch, setBiometric, setLockOnLaunch } = usePinLock();

  const [pinModalMode, setPinModalMode] = useState<PinModalMode | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [ocrLang, setOcrLang] = useState('amharic');
  const [ocrQuality, setOcrQuality] = useState('balanced');
  const [langModal, setLangModal] = useState(false);
  const [qualityModal, setQualityModal] = useState(false);

  const { data: poemsData } = useQuery<Poem[]>({
    queryKey: ['poems'],
    queryFn: async () => filterSavedPoems(await db.entities.Poem.list()),
  });
  const { data: collectionsData } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list(),
  });
  const poems: Poem[] = poemsData ?? [];
  const collections: Collection[] = collectionsData ?? [];

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setBiometricAvailable);
    storage.getOcrLang().then(setOcrLang);
    storage.getOcrQuality().then(setOcrQuality);
  }, []);

  const exportJson = async () => {
    const data = await exportBackup();
    const path = `${FileSystem.cacheDirectory}bethverse-backup.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    }
  };

  const exportTxt = async () => {
    const lines = poems
      .filter((p) => !p.is_archived)
      .map((p) => `${p.title || t.noTitle}\n${'—'.repeat(30)}\n${p.plain_text || ''}\n`)
      .join('\n');
    const path = `${FileSystem.cacheDirectory}bethverse-poems.txt`;
    await FileSystem.writeAsStringAsync(path, lines);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'text/plain' });
    }
  };

  const importJson = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled || !result.assets[0]) return;
    const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const data = JSON.parse(content);
    const count = await importBackup(data);
    qc.invalidateQueries({ queryKey: ['poems'] });
    qc.invalidateQueries({ queryKey: ['collections'] });
    Alert.alert(t.imported, `${count} ${t.poemsRestored}`);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const totalWords = poems.reduce((s, p) => s + (p.word_count || 0), 0);
  const ocrLangLabel = OCR_LANGUAGES.find((l) => l.value === ocrLang)?.label ?? 'Amharic';
  const ocrQualityLabel = OCR_QUALITY.find((q) => q.value === ocrQuality)?.label ?? 'Balanced';

  const header = (
    <Text style={styles.h1}>{t.settings}</Text>
  );

  return (
    <FixedHeaderScreen header={header}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}>
        <SettingGroup title={t.appearance}>
          <SettingRow
            icon="language-outline"
            label={t.amharicUi}
            description={t.amharicUiDesc}
            action={<AppSwitch value={amharicUi} onValueChange={setAmharicUi} />}
          />
          <View style={styles.themeBlock}>
            <Text style={styles.blockLabel}>{t.theme}</Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setTheme(opt.value)}
                  style={[styles.themeBtn, theme === opt.value && styles.themeBtnActive]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={theme === opt.value ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.themeBtnText, theme === opt.value && styles.themeBtnTextActive]}>
                    {t[opt.labelKey]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </SettingGroup>

        <SettingGroup title={t.typography}>
          <View style={styles.themeBlock}>
            <Text style={styles.blockLabel}>{t.fontStyle}</Text>
            <View style={styles.fontRow}>
              {FONT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setFontStyle(opt.value)}
                  style={[styles.fontBtn, fontStyle === opt.value && styles.themeBtnActive]}
                >
                  <Text style={[styles.fontLabel, fontStyle === opt.value && styles.themeBtnTextActive]}>
                    {opt.labelKey === 'amharicFont' ? t.amharicFont : opt.sample.split(' ')[0]}
                  </Text>
                  <Text style={styles.fontSample}>{opt.sample}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </SettingGroup>

        <SettingGroup title={t.security}>
          {!pin ? (
            <SettingRow
              icon="lock-closed-outline"
              label={t.setPin}
              description={t.setPinDesc}
              onPress={() => setPinModalMode('set')}
            />
          ) : (
            <>
              <SettingRow icon="key-outline" label={t.changePin} description={t.changePinDesc} onPress={() => setPinModalMode('change')} />
              <SettingRow icon="lock-open-outline" label={t.disablePin} description={t.disablePinDesc} onPress={() => setPinModalMode('disable')} />
              <SettingRow
                icon="enter-outline"
                label={t.lockOnLaunch}
                description={t.lockOnLaunchDesc}
                action={<AppSwitch value={lockOnLaunch} onValueChange={setLockOnLaunch} />}
              />
              {biometricAvailable ? (
                <SettingRow
                  icon="finger-print-outline"
                  label={t.biometricUnlock}
                  description={t.biometricDesc}
                  action={<AppSwitch value={biometricEnabled} onValueChange={setBiometric} />}
                />
              ) : null}
            </>
          )}
        </SettingGroup>

        <SettingGroup title={t.scanSection}>
          <SettingRow icon="camera-outline" label={t.openOcr} description={t.openOcrDesc} onPress={() => router.push('/ocr')} />
          <SettingRow
            icon="language-outline"
            label={t.ocrLanguage}
            description={t.ocrLanguageDesc}
            action={<Text style={styles.pickerValue}>{ocrLangLabel}</Text>}
            onPress={() => setLangModal(true)}
          />
          <SettingRow
            icon="speedometer-outline"
            label={t.ocrQuality}
            description={t.ocrQualityDesc}
            action={<Text style={styles.pickerValue}>{ocrQualityLabel}</Text>}
            onPress={() => setQualityModal(true)}
          />
        </SettingGroup>

        <SettingGroup title={t.backup}>
          <SettingRow icon="code-slash-outline" label={t.exportJson} description={t.exportJsonDesc} onPress={exportJson} />
          <SettingRow icon="document-text-outline" label={t.exportTxt} description={t.exportTxtDesc} onPress={exportTxt} />
          <SettingRow icon="cloud-upload-outline" label={t.importBackup} description={t.importBackupDesc} onPress={importJson} />
        </SettingGroup>

        <SettingGroup title={t.storage}>
          <View style={styles.storageBlock}>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>{t.totalPoems}</Text>
              <Text style={styles.storageValue}>{poems.length}</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>{t.collections}</Text>
              <Text style={styles.storageValue}>{collections.length}</Text>
            </View>
            <View style={styles.storageRow}>
              <Text style={styles.storageLabel}>{t.totalWords}</Text>
              <Text style={styles.storageValue}>{totalWords.toLocaleString()}</Text>
            </View>
          </View>
        </SettingGroup>

        <View style={styles.about}>
          <Text style={styles.aboutSection}>{t.aboutDeveloper}</Text>
          <Text style={styles.aboutTitle}>{t.developerName}</Text>
          <Text style={styles.aboutSub}>{t.developerRole}</Text>
          <View style={styles.contactBlock}>
            <Pressable style={styles.contactRow} onPress={() => openLink('tel:+251938126346')}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={styles.contactText}>{t.phone}: +251938126346</Text>
            </Pressable>
            <Pressable style={styles.contactRow} onPress={() => openLink('https://t.me/ephion_dev')}>
              <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
              <Text style={styles.contactText}>{t.telegram}: @ephion_dev</Text>
            </Pressable>
            <Pressable style={styles.contactRow} onPress={() => openLink('mailto:ephraimtessema@gmail.com')}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <Text style={styles.contactText}>ephraimtessema@gmail.com</Text>
            </Pressable>
          </View>
          <Text style={styles.aboutSub}>{t.appName} · {t.version}</Text>
        </View>
      </ScrollView>

      <SetPinModal
        visible={pinModalMode !== null}
        mode={pinModalMode ?? 'set'}
        onClose={() => setPinModalMode(null)}
      />

      <PickerModal
        visible={langModal}
        title={t.ocrLanguage}
        options={OCR_LANGUAGES}
        value={ocrLang}
        onSelect={async (v) => {
          setOcrLang(v);
          await storage.setOcrLang(v);
          setLangModal(false);
        }}
        onClose={() => setLangModal(false)}
        colors={colors}
        fonts={fonts}
      />
      <PickerModal
        visible={qualityModal}
        title={t.ocrQuality}
        options={OCR_QUALITY}
        value={ocrQuality}
        onSelect={async (v) => {
          setOcrQuality(v);
          await storage.setOcrQuality(v);
          setQualityModal(false);
        }}
        onClose={() => setQualityModal(false)}
        colors={colors}
        fonts={fonts}
      />
    </FixedHeaderScreen>
  );
}

function PickerModal({
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

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    h1: {
      fontFamily: fonts.display,
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
    },
    themeBlock: { padding: 16 },
    blockLabel: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 12 },
    themeRow: { flexDirection: 'row', gap: 8 },
    fontRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    themeBtn: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: '30%',
    },
    themeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    themeBtnText: { fontSize: 12, color: colors.muted, fontWeight: '500' },
    themeBtnTextActive: { color: colors.primary },
    fontBtn: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fontLabel: { fontSize: 12, fontWeight: '500', color: colors.muted },
    fontSample: { fontSize: 10, color: colors.muted, marginTop: 2 },
    pickerValue: { fontSize: 13, color: colors.primary, fontWeight: '500' },
    storageBlock: { padding: 16 },
    storageRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    storageLabel: { fontSize: 14, color: colors.muted },
    storageValue: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Inter_600SemiBold' },
    about: {
      alignItems: 'center',
      marginTop: 24,
      padding: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    aboutSection: {
      fontFamily: fonts.heading,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    aboutTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: '600', color: colors.text },
    aboutSub: { fontSize: 12, color: colors.muted, textAlign: 'center' },
    contactBlock: { width: '100%', marginTop: 8, gap: 10 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    contactText: { fontSize: 14, color: colors.text, flex: 1 },
    modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modal: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 36,
    },
    modalTitle: { fontFamily: fonts.heading, fontSize: 18, fontWeight: '600', marginBottom: 16, color: colors.text },
    input: {
      backgroundColor: colors.mutedBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      textAlign: 'center',
      fontSize: 18,
      color: colors.text,
    },
    btn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnText: { color: colors.onPrimary, fontWeight: '600' },
    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancel: { color: colors.muted },
  });
}
