import React from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, Quote, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
  { icon: Bold, command: 'bold', label: 'Bold' },
  { icon: Italic, command: 'italic', label: 'Italic' },
  { icon: Underline, command: 'underline', label: 'Underline' },
  { icon: Heading1, command: 'formatBlock', arg: 'h2', label: 'Heading' },
  { icon: Heading2, command: 'formatBlock', arg: 'h3', label: 'Subheading' },
  { icon: Quote, command: 'formatBlock', arg: 'blockquote', label: 'Quote' },
  { icon: Minus, command: 'insertHorizontalRule', label: 'Divider' },
];

export default function EditorToolbar({ visible }) {
  const execCommand = (command, arg) => {
    document.execCommand(command, false, arg || null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1 py-2 overflow-x-auto"
        >
          {tools.map((tool) => (
            <button
              key={tool.label}
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand(tool.command, tool.arg);
              }}
              className="p-2 rounded-lg hover:bg-muted shrink-0 transition-colors"
              title={tool.label}
            >
              <tool.icon className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}