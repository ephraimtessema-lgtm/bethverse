import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';
import { PinLockProvider, usePinLock } from '@/lib/PinLockContext';
import PinLockScreen from '@/components/security/PinLockScreen';

import AppShell from '@/components/layout/AppShell';
import Home from '@/pages/Home';
import Editor from '@/pages/Editor';
import Collections from '@/pages/Collections';
import CollectionDetail from '@/pages/CollectionDetail';
import Favorites from '@/pages/Favorites';
import Insights from '@/pages/Insights';
import Settings from '@/pages/Settings';
import OcrCapture from '@/pages/OcrCapture';

const PinGuard = ({ children }) => {
  const { pin, isLocked } = usePinLock();
  if (pin && isLocked) return <PinLockScreen />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <PinLockProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <PinGuard>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/collection/:id" element={<CollectionDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="/editor/:id" element={<Editor />} />
                <Route path="/ocr" element={<OcrCapture />} />
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </PinGuard>
          </Router>
          <Toaster />
          <Sonner position="top-center" richColors />
        </QueryClientProvider>
      </PinLockProvider>
    </ThemeProvider>
  )
}

export default App
