// src/features/mapping-editor/DraggableColumn.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { type SourceColumn } from '../../shared/types';

export const DraggableColumn: React.FC<{ column: SourceColumn }> = ({ column }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: column.id,
    data: { type: 'column', column },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-3 bg-card border rounded-md shadow-sm cursor-grab active:cursor-grabbing transition-colors ${
        isDragging ? 'opacity-100 border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1 min-w-0 pointer-events-none">
        <div className="text-sm font-medium text-foreground truncate">{column.name}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{column.inferredType}</div>
      </div>
    </div>
  );
};
