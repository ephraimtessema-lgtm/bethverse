export type ThemeColors = {
  primary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  mutedBg: string;
  destructive: string;
  primarySoft: string;
  onPrimary: string;
};

/** Gold accent palette */
export const lightColors: ThemeColors = {
  primary: '#C9A227',
  accent: '#E8C45C',
  background: '#F9F9FB',
  card: '#FFFFFF',
  text: '#0F1729',
  muted: '#64748B',
  border: '#E2E8F0',
  mutedBg: '#F1F3F6',
  destructive: '#EF4444',
  primarySoft: '#C9A2271A',
  onPrimary: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  primary: '#D4AF37',
  accent: '#E8C872',
  background: '#0A0E1A',
  card: '#121828',
  text: '#F1F5F9',
  muted: '#94A3B8',
  border: '#1E293B',
  mutedBg: '#151D2E',
  destructive: '#F87171',
  primarySoft: '#D4AF3728',
  onPrimary: '#FFFFFF',
};

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontStyle = 'amharic' | 'serif' | 'modern' | 'classic';

export type AppFonts = {
  display: string;
  heading: string;
  body: string;
};

export const FONT_FAMILIES: Record<FontStyle, AppFonts> = {
  amharic: {
    display: 'NotoSansEthiopic_700Bold',
    heading: 'NotoSansEthiopic_600SemiBold',
    body: 'NotoSansEthiopic_400Regular',
  },
  serif: {
    display: 'PlayfairDisplay_700Bold',
    heading: 'PlayfairDisplay_600SemiBold',
    body: 'Lora_400Regular',
  },
  modern: {
    display: 'Inter_700Bold',
    heading: 'Inter_600SemiBold',
    body: 'Inter_400Regular',
  },
  classic: {
    display: 'PlayfairDisplay_700Bold',
    heading: 'PlayfairDisplay_600SemiBold',
    body: 'PlayfairDisplay_400Regular',
  },
};

export const COLLECTION_COLORS = ['#10B981', '#D4AF37', '#3B82F6', '#F43F5E', '#F59E0B', '#EC4899'];

export const SORT_OPTIONS = [
  { value: '-created_date', label: 'Newest' },
  { value: 'created_date', label: 'Oldest' },
  { value: 'title', label: 'A → Z' },
  { value: '-updated_date', label: 'Recently Edited' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

export const OCR_LANGUAGES = [
  { value: 'amharic', label: 'Amharic (አማርኛ)' },
  { value: 'auto', label: 'Auto Detect' },
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
];

export const OCR_QUALITY = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'accurate', label: 'Accurate' },
];
