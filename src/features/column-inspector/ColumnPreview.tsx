// src/features/column-inspector/ColumnPreview.tsx
import React from 'react';
import { useAppStore } from '../../shared/store/useAppStore';
import { FileSpreadsheet, XCircle } from 'lucide-react';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'string':
      return 'bg-blue-100 text-blue-800';
    case 'number':
      return 'bg-green-100 text-green-800';
    case 'boolean':
      return 'bg-purple-100 text-purple-800';
    case 'date':
      return 'bg-orange-100 text-orange-800';
    case 'empty':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export const ColumnPreview: React.FC = () => {
  const { fileMetadata, reset } = useAppStore();

  if (!fileMetadata) return null;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-card shadow-sm rounded-xl border border-border">
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <FileSpreadsheet className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-bold text-foreground">{fileMetadata.filename}</h2>
        <span className="ml-2 bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
          {fileMetadata.rowCount.toLocaleString()} rows
        </span>
        <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <XCircle className="h-4 w-4" />
          Clear File
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {fileMetadata.columns.map((col) => (
          <div key={col.id} className="p-4 border border-border rounded-lg bg-muted/30 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3 gap-2">
              <h4 className="font-semibold text-foreground truncate" title={col.name}>
                {col.name}
              </h4>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-medium flex-shrink-0 ${getTypeColor(col.inferredType)}`}>
                {col.inferredType}
              </span>
            </div>

            <div className="text-xs text-muted-foreground mb-3 font-medium">Fill rate: {Math.round(col.fillRate * 100)}%</div>

            <div className="bg-background p-2 rounded border border-border text-xs text-muted-foreground flex-grow overflow-y-auto max-h-32">
              <strong className="block mb-1.5 text-foreground">Sample Values:</strong>
              {col.sampleValues.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1">
                  {col.sampleValues.map((val, i) => (
                    <li key={i} className="truncate" title={String(val)}>
                      {val === null || val === undefined ? <em className="text-muted-foreground/50">null</em> : String(val)}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground/50 italic">No data</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
