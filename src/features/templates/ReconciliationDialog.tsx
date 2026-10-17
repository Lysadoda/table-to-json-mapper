// src/features/templates/ReconciliationDialog.tsx
import React, { useState } from 'react';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { useAppStore } from '../../shared/store/useAppStore';

export const ReconciliationDialog: React.FC = () => {
  const { reconciliationNeeded, applyReconciliation, setReconciliationNeeded } = useMappingStore();
  const { fileMetadata } = useAppStore();

  const [mappings, setMappings] = useState<Record<string, string>>({});

  if (!reconciliationNeeded || !fileMetadata) return null;

  const { template, missingIds } = reconciliationNeeded;

  const handleConfirm = () => {
    applyReconciliation(mappings);
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border shadow-2xl rounded-xl z-[70] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold text-foreground">Map Missing Columns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The imported template expects columns that aren't in your current file. Please map them to continue.
          </p>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {missingIds.map((missingId) => {
            const oldCol = template.sourceMetadata.columns.find((c: { id: string; name: string }) => c.id === missingId);
            return (
              <div key={missingId} className="flex flex-col gap-1.5 bg-muted/20 p-3 rounded-lg border border-border">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>Missing Template Column:</span>
                  <span className="font-mono text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded border border-destructive/20">
                    {oldCol?.name || missingId}
                  </span>
                </label>
                <select
                  className="w-full mt-1 p-2 text-sm border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={mappings[missingId] || ''}
                  onChange={(e) => setMappings((p) => ({ ...p, [missingId]: e.target.value }))}
                >
                  <option value="" disabled>
                    Select matching column from current file...
                  </option>
                  {fileMetadata.columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            onClick={() => setReconciliationNeeded(null)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel Import
          </button>
          <button
            onClick={handleConfirm}
            disabled={Object.keys(mappings).length !== missingIds.length}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
          >
            Apply & Import
          </button>
        </div>
      </div>
    </>
  );
};
