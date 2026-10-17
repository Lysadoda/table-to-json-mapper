// src/features/file-import/FileUploader.tsx
import React, { useCallback, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../shared/store/useAppStore';

export const FileUploader: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { parseFile, isParsing, parseError } = useAppStore();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        parseFile(files[0]);
      }
    },
    [parseFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        parseFile(files[0]);
      }
    },
    [parseFile],
  );

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-muted/30 hover:bg-muted/50'}
          ${isParsing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <h3 className="text-lg font-semibold text-foreground mb-1">{isParsing ? 'Parsing file...' : 'Upload Tabular Data'}</h3>
        <p className="text-sm text-muted-foreground mb-6">Drag and drop a .xlsx, .csv, or .tsv file here, or click to browse.</p>

        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
          Select File
          <input
            type="file"
            className="hidden"
            accept=".csv, .tsv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleChange}
          />
        </label>
      </div>

      {parseError && (
        <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{parseError}</p>
        </div>
      )}
    </div>
  );
};
