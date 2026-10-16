import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, ImagePlus, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { extractTextFromImage } from '@/lib/ocr';

const LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
];

const QUALITY_OPTIONS = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'accurate', label: 'Accurate' },
];

export default function OcrExtractModal({
  open,
  onClose,
  onExtracted,
  defaultLanguage = 'auto',
  defaultQuality = 'balanced',
}) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [language, setLanguage] = useState(defaultLanguage);
  const [quality, setQuality] = useState(defaultQuality);
  const [status, setStatus] = useState('idle'); // idle | extracting | done | error
  const [confidence, setConfidence] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const fileRef = useRef();
  const cameraRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setStatus('idle');
    setExtractedText('');
    setConfidence(null);
  };

  const handleExtract = async () => {
    if (!image) return;
    setStatus('extracting');
    try {
      const result = await extractTextFromImage(image, { language, quality });
      setExtractedText(result.text || '');
      setConfidence(result.confidence ?? null);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleUseText = () => {
    onExtracted(extractedText);
    onClose();
    resetState();
  };

  const resetState = () => {
    setImage(null);
    setImageUrl(null);
    setStatus('idle');
    setExtractedText('');
    setConfidence(null);
  };

  const confidenceColor = confidence >= 80 ? 'text-emerald-500' : confidence >= 50 ? 'text-amber-500' : 'text-destructive';
  const confidenceLabel = confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetState(); } }}>
      <DialogContent className="max-w-sm mx-auto rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Scan poetry (offline)
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4 mt-4">

          <div
            onClick={() => status === 'idle' && fileRef.current?.click()}
            className={cn(
              'relative rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all',
              imageUrl ? 'h-44 border-primary/30' : 'h-36 border-border cursor-pointer hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Selected" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm">Tap to select image</span>
              </div>
            )}
            {status === 'extracting' && (
              <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Reading text on device…</span>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />

          {!imageUrl && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => cameraRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" /> Camera
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" /> Gallery
              </Button>
            </div>
          )}

          {status !== 'done' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Language hint</p>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full text-sm bg-muted rounded-xl px-3 py-2 border-0 outline-none"
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Scan quality</p>
                <select
                  value={quality}
                  onChange={e => setQuality(e.target.value)}
                  className="w-full text-sm bg-muted rounded-xl px-3 py-2 border-0 outline-none"
                >
                  {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                </select>
              </div>
            </div>
          )}

          <AnimatePresence>
            {status === 'done' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Text extracted</span>
                  </div>
                  {confidence !== null && (
                    <span className={cn('text-xs font-medium', confidenceColor)}>
                      {confidenceLabel} confidence ({Math.round(confidence)}%)
                    </span>
                  )}
                </div>
                <textarea
                  value={extractedText}
                  onChange={e => setExtractedText(e.target.value)}
                  className="w-full h-36 text-sm bg-muted rounded-xl p-3 resize-none border-0 outline-none font-body leading-relaxed"
                  placeholder="Extracted text will appear here…"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 pt-1">
            {status !== 'done' ? (
              <Button
                className="flex-1 rounded-xl"
                disabled={!image || status === 'extracting'}
                onClick={handleExtract}
              >
                {status === 'extracting' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extracting…</> : 'Extract Text'}
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={resetState}>Retry</Button>
                <Button className="flex-1 rounded-xl" onClick={handleUseText}>Open in Editor</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
