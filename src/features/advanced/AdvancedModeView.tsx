// src/features/advanced/AdvancedModeView.tsx
import React, { Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load heavy dependencies to keep the initial Vite bundle tiny
const LazyJsonEditor = React.lazy(() => import('./JsonConfigEditor'));
const LazyFlowCanvas = React.lazy(() => import('./MappingFlowCanvas'));

export const AdvancedModeView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'json' | 'flow'>('json');

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex bg-muted/30 border-b border-border p-2 gap-2">
        <button
          onClick={() => setActiveTab('json')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'json' ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
        >
          JSON AST Editor
        </button>
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'flow' ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
        >
          Visual Graph
        </button>
      </div>

      <div className="flex-1 relative">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/10">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading advanced module...
            </div>
          }
        >
          {activeTab === 'json' ? <LazyJsonEditor /> : <LazyFlowCanvas />}
        </Suspense>
      </div>
    </div>
  );
};
