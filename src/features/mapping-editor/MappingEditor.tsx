// src/features/mapping-editor/MappingEditor.tsx
import React, { useEffect } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useAppStore } from '../../shared/store/useAppStore';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { DraggableColumn } from './DraggableColumn';
import { TreeBuilder } from './TreeBuilder';
import { NodeConfigurator } from '../conditions/NodeConfigurator';
import { AdvancedModeView } from '../advanced/AdvancedModeView';
import { getWorker } from '../../shared/lib/worker';
import { type WorkerResponse } from '../../shared/types';
import { AlertTriangle } from 'lucide-react';

export const MappingEditor: React.FC = () => {
  const { fileMetadata, sampleRows } = useAppStore();
  const { config, previewJson, validationIssues, mapColumnToNode, setPreviewJson, isAdvancedMode, setAdvancedMode } = useMappingStore();

  useEffect(() => {
    if (!fileMetadata) return;
    const worker = getWorker();

    const handleMessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'PREVIEW_SUCCESS') {
        setPreviewJson(e.data.payload.previewJson, e.data.payload.validationIssues);
      }
    };

    worker.addEventListener('message', handleMessage);

    const timer = setTimeout(() => {
      worker.postMessage({
        type: 'GENERATE_PREVIEW',
        payload: { config, rows: sampleRows, columns: fileMetadata.columns },
      });
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timer);
      worker.removeEventListener('message', handleMessage);
    };
  }, [config, sampleRows, fileMetadata, setPreviewJson]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && over.data.current?.type === 'scalar_target') {
      mapColumnToNode(over.id as string, active.id as string);
    }
  };

  if (!fileMetadata) return null;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <NodeConfigurator />

      <div className="flex justify-end mt-4 mb-2">
        <label className="flex items-center gap-2 cursor-pointer group">
          <span className={`text-sm font-semibold transition-colors ${isAdvancedMode ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
            Advanced Mode
          </span>
          <div
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isAdvancedMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <input type="checkbox" className="sr-only" checked={isAdvancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} />
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isAdvancedMode ? 'translate-x-4.5' : 'translate-x-1'}`}
            />
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE: Always Visible */}
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-14rem)] border border-border bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-foreground">Source Columns</h3>
            <p className="text-xs text-muted-foreground mt-1">Drag to map</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {fileMetadata.columns.map((col) => (
              <DraggableColumn key={col.id} column={col} />
            ))}
          </div>
        </div>

        {isAdvancedMode ? (
          <div className="lg:col-span-9 h-[calc(100vh-14rem)] shadow-sm rounded-xl overflow-hidden">
            <AdvancedModeView />
          </div>
        ) : (
          <>
            {/* CENTER PANE */}
            <div className="lg:col-span-5 flex flex-col h-[calc(100vh-14rem)] border border-border bg-card rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-foreground">Target Structure</h3>
                <p className="text-xs text-muted-foreground mt-1">Define JSON schema for a single row</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono">
                <TreeBuilder node={config} />
              </div>
            </div>

            {/* RIGHT PANE: Live Preview */}
            <div className="lg:col-span-4 flex flex-col h-[calc(100vh-14rem)] border border-border bg-card rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Live Preview</h3>
                  <p className="text-xs text-muted-foreground mt-1">First {previewJson.length} records</p>
                </div>
                {validationIssues && validationIssues.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {validationIssues.length} issues
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-[#1e1e1e] text-green-400">
                <pre className="text-[13px] font-mono whitespace-pre-wrap leading-relaxed">{JSON.stringify(previewJson, null, 2)}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </DndContext>
  );
};
