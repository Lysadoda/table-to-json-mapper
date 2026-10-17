// src/features/export/ExportPanel.tsx
import React, { useState, useEffect } from 'react';
import { Download, Copy, Settings2, Loader2, Check } from 'lucide-react';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { useAppStore } from '../../shared/store/useAppStore';
import { type ErrorStrategy, type WorkerResponse } from '../../shared/types';
import { getWorker } from '../../shared/lib/worker';

export const ExportPanel: React.FC = () => {
  const { config } = useMappingStore();
  const { fileMetadata } = useAppStore();

  const [errorStrategy, setErrorStrategy] = useState<ErrorStrategy>('skip');
  const [format, setFormat] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    blobUrl: string;
    blob: Blob;
    stats: { total: number; exported: number; errors: number };
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const worker = getWorker();
    const handleMessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'EXPORT_SUCCESS') {
        const { blob, stats } = e.data.payload;
        setExportResult({ blobUrl: URL.createObjectURL(blob), blob, stats });
        setIsExporting(false);
      } else if (e.data.type === 'EXPORT_ERROR') {
        alert(e.data.payload.error);
        setIsExporting(false);
      }
    };
    worker.addEventListener('message', handleMessage);

    // Cleanup ObjectURLs on unmount
    return () => {
      worker.removeEventListener('message', handleMessage);
      setExportResult((prev) => {
        if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
        return null;
      });
    };
  }, []);

  const handleGenerate = () => {
    if (!fileMetadata) return;
    setIsExporting(true);
    setExportResult((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });

    getWorker().postMessage({
      type: 'GENERATE_EXPORT',
      payload: { config, columns: fileMetadata.columns, errorStrategy, format },
    });
  };

  const handleCopy = async () => {
    if (!exportResult) return;
    try {
      // For massive files, copy might fail or freeze the browser. Read as text safely.
      const text = await exportResult.blob.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      alert('File too large to copy to clipboard. Please download instead.');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-5 mt-6 mb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Error Strategy</label>
            <select
              value={errorStrategy}
              onChange={(e) => setErrorStrategy(e.target.value as ErrorStrategy)}
              className="text-sm p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="skip">Skip invalid rows</option>
              <option value="null">Output null for invalid rows</option>
              <option value="warning">Include row with warnings</option>
              <option value="abort">Abort if any row is invalid</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Output Format</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="formatToggle"
                checked={format}
                onChange={(e) => setFormat(e.target.checked)}
                className="rounded border-border w-4 h-4 text-primary focus:ring-primary"
              />
              <label htmlFor="formatToggle" className="text-sm font-medium text-foreground cursor-pointer">
                Pretty Print (Indented)
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!exportResult ? (
            <button
              onClick={handleGenerate}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
              {isExporting ? 'Generating JSON...' : 'Generate JSON'}
            </button>
          ) : (
            <>
              <div className="flex flex-col text-right mr-3">
                <span className="text-sm font-semibold text-foreground">
                  {exportResult.stats.exported.toLocaleString()} / {exportResult.stats.total.toLocaleString()} rows
                </span>
                <span className="text-xs font-medium text-destructive">{exportResult.stats.errors.toLocaleString()} validation errors</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-muted/50 border border-border rounded-lg hover:bg-muted text-sm font-semibold transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} Copy
              </button>

              <a
                href={exportResult.blobUrl}
                download={`export-${new Date().toISOString().split('T')[0]}.json`}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download
              </a>

              <button onClick={() => setExportResult(null)} className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline ml-2">
                Reset
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
