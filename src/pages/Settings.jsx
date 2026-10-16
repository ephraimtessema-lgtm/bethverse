import React, { useState } from 'react';
import { db, importBackup } from '@/api/localDb';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Upload, FileJson, FileText, ChevronRight, Lock, KeyRound, Fingerprint, ScanFace, Camera, Languages, Gauge } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { usePinLock } from '@/lib/PinLockContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import SetPinDialog from '@/components/security/SetPinDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

function SettingGroup({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{title}</h2>
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm divide-y divide-border/50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, description, action, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn('flex items-center gap-3 px-4 py-3.5 transition-colors text-left', onClick && 'hover:bg-muted/50 cursor-pointer')}
    >
      {Icon && <Icon className="w-5 h-5 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action !== undefined ? action : onClick ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /> : null}
    </div>
  );
}

const themeOptions = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

const fontOptions = [
  { value: 'serif', label: 'Serif', sample: 'Lora' },
  { value: 'modern', label: 'Modern', sample: 'Inter' },
  { value: 'classic', label: 'Classic', sample: 'Playfair' },
];

const OCR_QUALITY = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'accurate', label: 'Accurate' },
];

const OCR_LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const { theme, setTheme, fontStyle, setFontStyle } = useTheme();
  const { pin, biometricSupported, biometricEnabled, toggleBiometric } = usePinLock();
  const navigate = useNavigate();

  const [pinDialogMode, setPinDialogMode] = useState(null); // 'set' | 'change' | 'disable'
  const [ocrLang, setOcrLang] = useState(() => localStorage.getItem('bethverse_ocr_lang') || 'auto');
  const [ocrQuality, setOcrQuality] = useState(() => localStorage.getItem('bethverse_ocr_quality') || 'balanced');

  const handleOcrLang = (v) => { setOcrLang(v); localStorage.setItem('bethverse_ocr_lang', v); };
  const handleOcrQuality = (v) => { setOcrQuality(v); localStorage.setItem('bethverse_ocr_quality', v); };

  const { data: poems = [] } = useQuery({
    queryKey: ['poems'],
    queryFn: () => db.entities.Poem.list('-created_date', 500),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: () => db.entities.Collection.list('name', 100),
  });

  const handleExportJSON = () => {
    const data = { poems, collections, exportDate: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bethverse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exported successfully');
  };

  const handleExportTXT = () => {
    const lines = poems
      .filter(p => !p.is_archived)
      .map(p => `${p.title || 'Untitled'}\n${'—'.repeat(30)}\n${p.plain_text || ''}\n\n`)
      .join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bethverse-poems-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Poems exported as text');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      const count = await importBackup(data);
      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: ['poems'] });
        queryClient.invalidateQueries({ queryKey: ['collections'] });
        toast.success(`Imported ${count} poems`);
      }
    };
    input.click();
  };

  return (
    <div className="px-5 pt-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Settings</h1>
      </motion.div>

      {/* Appearance */}
      <SettingGroup title="Appearance">
        <div className="px-4 py-4">
          <p className="text-sm font-medium mb-3">Theme</p>
          <div className="flex gap-2">
            {themeOptions.map((opt) => (
              <button key={opt.value} onClick={() => setTheme(opt.value)}
                className={cn('flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all',
                  theme === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50')}>
                <opt.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </SettingGroup>

      {/* Typography */}
      <SettingGroup title="Typography">
        <div className="px-4 py-4">
          <p className="text-sm font-medium mb-3">Font Style</p>
          <div className="flex gap-2">
            {fontOptions.map((opt) => (
              <button key={opt.value} onClick={() => setFontStyle(opt.value)}
                className={cn('flex-1 py-3 rounded-xl border text-center transition-all',
                  fontStyle === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50')}>
                <span className="text-xs font-medium block">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.sample}</span>
              </button>
            ))}
          </div>
        </div>
      </SettingGroup>

      {/* Security */}
      <SettingGroup title="Security">
        {!pin ? (
          <SettingRow icon={Lock} label="Set PIN Lock" description="Protect your vault with a 4-digit PIN" onClick={() => setPinDialogMode('set')} />
        ) : (
          <>
            <SettingRow icon={KeyRound} label="Change PIN" description="Update your current PIN" onClick={() => setPinDialogMode('change')} />
            <SettingRow icon={Lock} label="Disable PIN" description="Remove PIN protection" onClick={() => setPinDialogMode('disable')} />
            {biometricSupported ? (
              <SettingRow
                icon={Fingerprint}
                label="Biometric Unlock"
                description="Use fingerprint or face to unlock"
                action={<Switch checked={biometricEnabled} onCheckedChange={toggleBiometric} />}
              />
            ) : (
              <SettingRow
                icon={ScanFace}
                label="Fingerprint / Face ID"
                description="Not available on this device"
                action={<span className="text-xs text-muted-foreground">Unavailable</span>}
              />
            )}
          </>
        )}
      </SettingGroup>

      {/* OCR Settings */}
      <SettingGroup title="Scan text (offline)">
        <SettingRow icon={Camera} label="Open OCR Extractor" description="Read poetry from a photo on this device" onClick={() => navigate('/ocr')} />
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Languages className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">OCR Language</p>
            <p className="text-xs text-muted-foreground">Language of text in images</p>
          </div>
          <Select value={ocrLang} onValueChange={handleOcrLang}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-xl border-0 bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCR_LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Gauge className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">OCR Quality</p>
            <p className="text-xs text-muted-foreground">Fast, balanced, or more accurate scanning</p>
          </div>
          <Select value={ocrQuality} onValueChange={handleOcrQuality}>
            <SelectTrigger className="w-32 h-8 text-xs rounded-xl border-0 bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCR_QUALITY.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </SettingGroup>

      {/* Backup & Restore */}
      <SettingGroup title="Backup & Restore">
        <SettingRow icon={FileJson} label="Export as JSON" description="Full backup with all data" onClick={handleExportJSON} />
        <SettingRow icon={FileText} label="Export as Text" description="Plain text version of all poems" onClick={handleExportTXT} />
        <SettingRow icon={Upload} label="Import Backup" description="Restore from a JSON backup file" onClick={handleImport} />
      </SettingGroup>

      {/* Storage Info */}
      <SettingGroup title="Storage">
        <div className="px-4 py-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Total Poems</span>
            <span className="font-medium">{poems.length}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Collections</span>
            <span className="font-medium">{collections.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Words</span>
            <span className="font-medium">{poems.reduce((s, p) => s + (p.word_count || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </SettingGroup>

      {/* About */}
      <div className="text-center mt-8">
        <p className="font-display text-lg font-semibold text-foreground">BethVerse</p>
        <p className="text-xs text-muted-foreground mt-1">Your personal poetry vault</p>
        <p className="text-xs text-muted-foreground mt-0.5">Version 1.0</p>
      </div>

      {/* PIN Dialog */}
      {pinDialogMode && (
        <SetPinDialog open={!!pinDialogMode} mode={pinDialogMode} onClose={() => setPinDialogMode(null)} />
      )}
    </div>
  );
}