// src/App.tsx
import React from 'react';
import { FileUploader } from './features/file-import/FileUploader';
import { ColumnPreview } from './features/column-inspector/ColumnPreview';
import { MappingEditor } from './features/mapping-editor/MappingEditor';
import { ExportPanel } from './features/export/ExportPanel';
import { TemplateManager } from './features/templates/TemplateManager';
import { ReconciliationDialog } from './features/templates/ReconciliationDialog';
import { useAppStore } from './shared/store/useAppStore';
import { FileSpreadsheet, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const { fileMetadata, reset } = useAppStore();
  const hasFile = !!fileMetadata;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-30 flex-shrink-0">
        <div className="max-w-[95rem] mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">Table-to-JSON Mapper</h1>
          {hasFile && (
            <div className="flex items-center gap-4">
              <TemplateManager />
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm bg-muted/30 px-3 py-1.5 rounded-md border border-border">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span className="font-medium truncate max-w-[200px]">{fileMetadata.filename}</span>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors ml-2"
              >
                <XCircle className="h-4 w-4" />
                Start Over
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col space-y-8">
        {!hasFile ? (
          <FileUploader />
        ) : (
          <>
            <ColumnPreview />
            <div className="h-px w-full bg-border" />
            <MappingEditor />
            <div className="h-px w-full bg-border" />
            <ExportPanel />

            {/* Global Modals */}
            <ReconciliationDialog />
          </>
        )}
      </main>
    </div>
  );
};

export default App;
