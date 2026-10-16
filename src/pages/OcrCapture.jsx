import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/api/localDb';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import OcrExtractor from '@/components/ocr/OcrExtractor';

export default function OcrCapture() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Poem.create(data),
    onSuccess: (poem) => {
      queryClient.invalidateQueries({ queryKey: ['poems'] });
      navigate(`/editor/${poem.id}`);
    },
  });

  const handleExtracted = ({ text }) => {
    // Convert plain text to basic HTML preserving line breaks
    const html = text
      .split('\n')
      .map(line => `<p>${line || '<br>'}</p>`)
      .join('');

    const words = text.trim().split(/\s+/).filter(Boolean).length;

    createMutation.mutate({
      title: 'Untitled (from image)',
      content: html,
      plain_text: text,
      word_count: words,
      char_count: text.length,
      edit_count: 0,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-lg font-semibold">OCR Extraction</h1>
          <p className="text-xs text-muted-foreground">Extract poetry from an image</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pb-8"
      >
        <OcrExtractor
          onExtracted={handleExtracted}
          onClose={() => navigate(-1)}
          defaultLanguage={localStorage.getItem('bethverse_ocr_lang') || 'auto'}
          defaultQuality={localStorage.getItem('bethverse_ocr_quality') || 'balanced'}
        />
      </motion.div>
    </div>
  );
}