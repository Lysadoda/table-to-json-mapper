// src/features/templates/TemplateManager.tsx
import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { z } from 'zod';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { useAppStore } from '../../shared/store/useAppStore';
import { templateSchema } from '../../shared/lib/schemas';
import { type OutputNode, type MappingTemplate } from '../../shared/types';

export const TemplateManager: React.FC = () => {
  const { config, setConfig, setReconciliationNeeded } = useMappingStore();
  const { fileMetadata } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTemplate = () => {
    if (!fileMetadata) return;
    const template: MappingTemplate = {
      format: 'table-to-json-mapper-template',
      version: 1,
      sourceMetadata: {
        columns: fileMetadata.columns.map((c) => ({
          id: c.id,
          name: c.name,
          inferredType: c.inferredType,
        })),
      },
      mappingConfig: config,
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapper-template-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileMetadata) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const parsed = templateSchema.parse(json);

        // Traverse to find all used column IDs in the imported template
        const usedIds = new Set<string>();
        const traverse = (n: OutputNode) => {
          if (n.type === 'scalar' && n.sourceColumnId) usedIds.add(n.sourceColumnId);
          n.conditions?.forEach((c) => {
            usedIds.add(c.sourceColumnId);
            if (c.action === 'setValueFromColumn' && typeof c.actionPayload === 'string') usedIds.add(c.actionPayload);
          });
          if (n.type === 'object') n.children.forEach(traverse);
          if (n.type === 'array' && n.itemSchema) traverse(n.itemSchema);
        };
        traverse(parsed.mappingConfig);

        const currentIds = new Set(fileMetadata.columns.map((c) => c.id));
        const missingIds = Array.from(usedIds).filter((id) => !currentIds.has(id));

        if (missingIds.length > 0) {
          setReconciliationNeeded({
            template: parsed as MappingTemplate,
            missingIds,
          });
        } else {
          setConfig(parsed.mappingConfig);
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          const firstIssue = err.errors[0];
          const path = firstIssue.path.length > 0 ? `[${firstIssue.path.join('.')}]` : 'Root';
          alert(`Template Validation Error at ${path}: ${firstIssue.message}`);
          console.error('Validation errors:', err.errors);
        } else {
          alert('Failed to read file as valid JSON.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  return (
    <div className="flex items-center gap-2">
      <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportTemplate} />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs font-medium bg-muted/50 text-foreground hover:bg-muted px-3 py-1.5 rounded-md border border-border transition-colors shadow-sm"
      >
        <Upload className="w-3.5 h-3.5" /> Load Template
      </button>
      <button
        onClick={handleExportTemplate}
        className="flex items-center gap-1.5 text-xs font-medium bg-muted/50 text-foreground hover:bg-muted px-3 py-1.5 rounded-md border border-border transition-colors shadow-sm"
      >
        <Download className="w-3.5 h-3.5" /> Save Template
      </button>
    </div>
  );
};
