import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-28">
        <Outlet />
      </main>
      <button
        onClick={() => {
          // Home has the real handler; this button is just for layout.
          const el = document.querySelector('[data-bethverse-new-poem]');
          if (el) el.click();
        }}
        data-bethverse-fab
        className="fixed right-6 bottom-20 z-50 max-w-lg mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center"
        aria-label="New poem"
      >
        <span className="text-2xl leading-none">+</span>
      </button>
      <BottomNav />
    </div>
  );
}