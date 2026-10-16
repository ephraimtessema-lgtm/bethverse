import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/api/localDb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart, Check, Undo2, Redo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import CollectionPicker from '@/components/editor/CollectionPicker';
import EditorToolbar from '@/components/editor/EditorToolbar';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contentRef = useRef(null);
  const saveTimerRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const { data: poem, isLoading } = useQuery({
    queryKey: ['poem', id],
    queryFn: () => db.entities.Poem.filter({ id }),
    enabled: !!id,
    select: (data) => data?.[0],
  });

  useEffect(() => {
    if (poem) {
      setTitle(poem.title || '');
      setContent(poem.content || '');
      if (contentRef.current && poem.content) {
        contentRef.current.innerHTML = poem.content;
      }
    }
  }, [poem]);

  const updateMutation = useMutation({
    mutationFn: (data) => db.entities.Poem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poems'] });
      queryClient.invalidateQueries({ queryKey: ['poem', id] });
    },
  });

  const getPlainText = useCallback(() => {
    return contentRef.current?.innerText || '';
  }, []);

  const getStats = useCallback(() => {
    const text = getPlainText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTime };
  }, [getPlainText]);

  const autoSave = useCallback(() => {
    if (!id) return;
    const htmlContent = contentRef.current?.innerHTML || '';
    const plainText = getPlainText();
    const stats = getStats();

    setIsSaving(true);
    updateMutation.mutate({
      title,
      content: htmlContent,
      plain_text: plainText,
      word_count: stats.words,
      char_count: stats.chars,
      edit_count: (poem?.edit_count || 0) + 1,
    }, {
      onSettled: () => {
        setIsSaving(false);
        setHasChanges(false);
      },
    });
  }, [id, title, poem, getPlainText, getStats, updateMutation]);

  const scheduleAutoSave = useCallback(() => {
    setHasChanges(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(autoSave, 2000);
  }, [autoSave]);

  // Save on title change
  useEffect(() => {
    if (poem && title !== poem.title) {
      scheduleAutoSave();
    }
  }, [title]);

  const handleContentInput = () => {
    const html = contentRef.current?.innerHTML || '';
    undoStackRef.current.push(html);
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    scheduleAutoSave();
  };

  const handleUndo = () => {
    if (undoStackRef.current.length > 1) {
      const current = undoStackRef.current.pop();
      redoStackRef.current.push(current);
      const prev = undoStackRef.current[undoStackRef.current.length - 1];
      if (contentRef.current) contentRef.current.innerHTML = prev;
      scheduleAutoSave();
    }
  };

  const handleRedo = () => {
    if (redoStackRef.current.length > 0) {
      const next = redoStackRef.current.pop();
      undoStackRef.current.push(next);
      if (contentRef.current) contentRef.current.innerHTML = next;
      scheduleAutoSave();
    }
  };

  const handleFavorite = () => {
    if (!id) return;
    updateMutation.mutate({ is_favorite: !poem?.is_favorite });
  };

  // Save before leaving
  const handleBack = () => {
    if (hasChanges) {
      autoSave();
    }
    navigate(-1);
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="text-xs text-muted-foreground animate-pulse">Saving…</span>
            ) : hasChanges ? (
              <span className="text-xs text-muted-foreground">Unsaved</span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            <button onClick={handleFavorite} className="p-2 rounded-full hover:bg-muted">
              <Heart className={cn('w-5 h-5', poem?.is_favorite ? 'text-primary fill-primary' : 'text-muted-foreground')} />
            </button>
          </div>
        </div>

        {/* Collection picker */}
        <div className="px-4 pb-2">
          <CollectionPicker
            value={poem?.collection || ''}
            onChange={(col) => {
              updateMutation.mutate({ collection: col });
            }}
          />
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 px-5 py-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Poem title"
          className="border-0 p-0 text-2xl font-heading font-bold placeholder:text-muted-foreground/40 focus-visible:ring-0 h-auto mb-6"
        />
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          onFocus={() => setShowToolbar(true)}
          onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
          className="min-h-[50vh] text-base leading-relaxed focus:outline-none poetry-content text-foreground/90 placeholder:text-muted-foreground/30"
          data-placeholder="Begin writing your verse…"
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>

      {/* Bottom stats bar */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/50 px-5 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{stats.words} words</span>
            <span>{stats.chars} chars</span>
            <span>~{stats.readingTime} min read</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleUndo} className="p-2 rounded-full hover:bg-muted" title="Undo">
              <Undo2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={handleRedo} className="p-2 rounded-full hover:bg-muted" title="Redo">
              <Redo2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <EditorToolbar visible={showToolbar} />
      </div>
    </motion.div>
  );
}