// src/features/mapping-editor/TreeBuilder.tsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { type OutputNode, type ObjectNode, type ScalarNode, type ArrayNode } from '../../shared/types';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { useAppStore } from '../../shared/store/useAppStore';
import { Plus, Trash2, Link, Braces, Brackets, Settings2 } from 'lucide-react';

const ScalarNodeEditor: React.FC<{ node: ScalarNode }> = ({ node }) => {
  const { updateNode, removeNode, setActiveNodeId } = useMappingStore();
  const fileMetadata = useAppStore((s) => s.fileMetadata);

  const { isOver, setNodeRef } = useDroppable({
    id: node.id,
    data: { type: 'scalar_target', node },
  });

  const mappedColumn = fileMetadata?.columns.find((c) => c.id === node.sourceColumnId);

  return (
    <div className="flex items-center gap-2 mb-2 pl-6 group">
      <input
        type="text"
        value={node.key}
        onChange={(e) => updateNode(node.id, { key: e.target.value })}
        aria-label="Field key"
        className="text-sm border-b border-dashed border-border bg-transparent focus:outline-none focus:border-primary px-1 w-32 truncate"
      />
      <span className="text-muted-foreground text-sm">:</span>

      <div
        ref={setNodeRef}
        className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
          isOver
            ? 'bg-primary/10 border-primary border-dashed ring-2 ring-primary/20'
            : mappedColumn
              ? 'bg-primary/5 border-primary/30 text-foreground'
              : 'bg-muted/30 border-dashed border-border text-muted-foreground'
        }`}
      >
        <Link className={`w-3.5 h-3.5 flex-shrink-0 ${mappedColumn ? 'text-primary' : 'text-muted-foreground/50'}`} />
        <span className="truncate">{mappedColumn ? mappedColumn.name : 'Drag column here...'}</span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => setActiveNodeId(node.id)}
          aria-label="Configure field"
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
        >
          <Settings2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => removeNode(node.id)}
          aria-label="Remove field"
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const TreeBuilder: React.FC<{ node: OutputNode }> = ({ node }) => {
  const { addChild, updateNode, removeNode, setActiveNodeId } = useMappingStore();

  if (node.type === 'object') {
    const objNode = node as ObjectNode;
    return (
      <div className="ml-4 border-l-2 border-border/50 pl-4 py-2 relative group/obj">
        <div className="flex items-center gap-2 mb-3">
          {node.id !== 'root' && (
            <>
              <input
                type="text"
                value={objNode.key}
                onChange={(e) => updateNode(node.id, { key: e.target.value })}
                className="text-sm font-semibold border-b border-transparent hover:border-border focus:border-primary bg-transparent focus:outline-none px-1"
              />
              <span className="text-muted-foreground text-sm">:</span>
            </>
          )}
          <span className="text-muted-foreground flex items-center gap-1">
            <Braces className="w-3.5 h-3.5" /> {'{'}
          </span>

          {node.id !== 'root' && (
            <div className="ml-auto flex items-center opacity-0 group-hover/obj:opacity-100 transition-opacity">
              <button
                onClick={() => setActiveNodeId(node.id)}
                aria-label="Configure object"
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeNode(node.id)}
                aria-label="Remove object"
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {objNode.children.map((child) => (
          <TreeBuilder key={child.id} node={child} />
        ))}

        <div className="pl-6 flex gap-2 mt-2">
          <button
            onClick={() => addChild(node.id, 'scalar')}
            className="text-xs flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Field
          </button>
          <button
            onClick={() => addChild(node.id, 'object')}
            className="text-xs flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Object
          </button>
          <button
            onClick={() => addChild(node.id, 'array')}
            className="text-xs flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Array
          </button>
        </div>
        <div className="text-muted-foreground text-sm mt-2">{'}'}</div>
      </div>
    );
  }

  if (node.type === 'array') {
    const arrNode = node as ArrayNode;
    return (
      <div className="ml-4 border-l-2 border-border/50 pl-4 py-2 relative group/arr">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={arrNode.key}
            onChange={(e) => updateNode(node.id, { key: e.target.value })}
            className="text-sm font-semibold border-b border-transparent hover:border-border focus:border-primary bg-transparent focus:outline-none px-1"
          />
          <span className="text-muted-foreground text-sm">:</span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Brackets className="w-3.5 h-3.5" /> {'['}
          </span>

          <div className="ml-auto flex items-center opacity-0 group-hover/arr:opacity-100 transition-opacity">
            <button
              onClick={() => setActiveNodeId(node.id)}
              aria-label="Configure array"
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => removeNode(node.id)}
              aria-label="Remove array"
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="pl-2">
          {arrNode.itemSchema ? (
            <TreeBuilder node={arrNode.itemSchema} />
          ) : (
            <div className="pl-4 flex gap-2">
              <button
                onClick={() => addChild(node.id, 'scalar')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 py-1 border border-dashed border-border rounded transition-colors"
              >
                <Plus className="w-3 h-3" /> Set Item Field
              </button>
              <button
                onClick={() => addChild(node.id, 'object')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 py-1 border border-dashed border-border rounded transition-colors"
              >
                <Plus className="w-3 h-3" /> Set Item Object
              </button>
            </div>
          )}
        </div>
        <div className="text-muted-foreground text-sm mt-2">{']'}</div>
      </div>
    );
  }

  if (node.type === 'scalar') return <ScalarNodeEditor node={node as ScalarNode} />;

  return null;
};
