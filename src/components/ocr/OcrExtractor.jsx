import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, Sparkles, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { extractTextFromImage } from '@/lib/ocr';

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

const QUALITY_OPTIONS = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'accurate', label: 'Accurate' },
];

export default function OcrExtractor({
  onExtracted,
  onClose,
  defaultLanguage = 'auto',
  defaultQuality = 'balanced',
}) {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [language, setLanguage] = useState(defaultLanguage);
  const [quality, setQuality] = useState(defaultQuality);
  const [isExtracting, setIsExtracting] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const galleryRef = useRef();
  const cameraRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setExtractedText(null);
    setConfidence(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!imageFile) return;
    setIsExtracting(true);
    try {
      const result = await extractTextFromImage(imageFile, { language, quality });
      setExtractedText(result.text || '');
      setConfidence(result.confidence ?? 85);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUse = () => {
    onExtracted({ text: extractedText, confidence });
  };

  const confidenceColor = confidence >= 85 ? 'text-green-600' : confidence >= 60 ? 'text-amber-500' : 'text-destructive';
  const confidenceLabel = confidence >= 85 ? 'High confidence' : confidence >= 60 ? 'Medium confidence' : 'Low confidence';

  return (
    <div className="flex flex-col gap-4">
      {!imagePreview ? (
        <div className="flex gap-3">
          <button onClick={() => galleryRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all">
            <ImagePlus className="w-7 h-7 text-primary" />
            <span className="text-sm font-medium text-primary">Gallery</span>
          </button>
          <button onClick={() => cameraRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all">
            <Camera className="w-7 h-7 text-primary" />
            <span className="text-sm font-medium text-primary">Camera</span>
          </button>
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
        </div>
      ) : (
        <div className="relative">
          <img src={imagePreview} alt="Selected" className="w-full rounded-2xl object-cover max-h-48" />
          <button onClick={() => { setImagePreview(null); setImageFile(null); setExtractedText(null); setConfidence(null); }}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="rounded-xl h-9 text-xs">
          <SelectValue placeholder="Language hint" />
        </SelectTrigger>
        <SelectContent>
          {OCR_LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={quality} onValueChange={setQuality}>
        <SelectTrigger className="rounded-xl h-9 text-xs">
          <SelectValue placeholder="Scan quality" />
        </SelectTrigger>
        <SelectContent>
          {QUALITY_OPTIONS.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {imagePreview && extractedText === null && (
        <Button onClick={handleExtract} disabled={isExtracting} className="rounded-full w-full">
          {isExtracting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading on device…</> : <><Sparkles className="w-4 h-4 mr-2" /> Extract Text</>}
        </Button>
      )}

      <AnimatePresence>
        {extractedText !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              {confidence >= 85 ? <Check className="w-3.5 h-3.5 text-green-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
              <span className={cn('font-medium', confidenceColor)}>{confidenceLabel}</span>
              {confidence != null && (
                <span className="text-muted-foreground">({Math.round(confidence)}%)</span>
              )}
            </div>

            <textarea
              value={extractedText}
              onChange={e => setExtractedText(e.target.value)}
              className="w-full min-h-[120px] bg-muted/40 rounded-2xl p-3 text-sm font-body resize-none border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="Extracted text will appear here…"
            />

            <Button onClick={handleUse} className="rounded-full w-full">
              <Check className="w-4 h-4 mr-2" /> Open in Editor
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
