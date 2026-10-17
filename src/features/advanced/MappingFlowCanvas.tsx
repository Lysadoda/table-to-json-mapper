// src/features/advanced/MappingFlowCanvas.tsx
import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, type Node as FlowNode, type Edge, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { useAppStore } from '../../shared/store/useAppStore';
import { type OutputNode } from '../../shared/types';

const MappingFlowCanvas: React.FC = () => {
  const { config } = useMappingStore();
  const { fileMetadata } = useAppStore();

  const { nodes, edges } = useMemo(() => {
    const flNodes: FlowNode[] = [];
    const flEdges: Edge[] = [];
    let currentY = 50;

    const traverse = (node: OutputNode, parentId: string | null = null, depth = 0) => {
      const x = depth * 280 + 50;
      const y = currentY;
      currentY += 75; // Step down for the next row to prevent overlaps

      const label = `${node.key}`;
      let subLabel = node.type;

      if (node.type === 'scalar' && node.sourceColumnId) {
        const colName = fileMetadata?.columns.find((c) => c.id === node.sourceColumnId)?.name;
        subLabel += ` ⬅ ${colName || 'Unmapped'}`;
      }

      flNodes.push({
        id: node.id,
        position: { x, y },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        data: {
          label: (
            <div className="flex flex-col text-left">
              <span className="font-bold text-gray-900 truncate w-48">{label}</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase truncate w-48">{subLabel}</span>
            </div>
          ),
        },
        style: {
          background: node.type === 'object' ? '#e0f2fe' : node.type === 'array' ? '#f3e8ff' : '#f0fdf4',
          border: `1px solid ${node.type === 'object' ? '#7dd3fc' : node.type === 'array' ? '#d8b4fe' : '#86efac'}`,
          borderRadius: '8px',
          width: 220,
          padding: '10px',
        },
      });

      if (parentId) {
        flEdges.push({
          id: `e-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          animated: node.type === 'scalar' && !!node.sourceColumnId,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        });
      }

      if (node.type === 'object') node.children.forEach((c) => traverse(c, node.id, depth + 1));
      if (node.type === 'array' && node.itemSchema) traverse(node.itemSchema, node.id, depth + 1);
    };

    traverse(config);
    return { nodes: flNodes, edges: flEdges };
  }, [config, fileMetadata]);

  return (
    <div className="w-full h-full bg-slate-50">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.1}>
        <Background color="#cbd5e1" gap={20} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default MappingFlowCanvas;
