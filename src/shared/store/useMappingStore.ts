// src/shared/store/useMappingStore.ts
import { create } from 'zustand';
import { type OutputNode, type ObjectNode, type ValidationIssue, type MappingTemplate } from '../types';

interface MappingState {
  config: OutputNode;
  previewJson: unknown[];
  validationIssues: ValidationIssue[];
  activeNodeId: string | null;
  isAdvancedMode: boolean;
  reconciliationNeeded: {
    template: MappingTemplate;
    missingIds: string[];
  } | null;

  // Tree mutators
  updateNode: (nodeId: string, updates: Partial<OutputNode>) => void;
  addChild: (parentId: string, type: 'scalar' | 'object' | 'array') => void;
  removeNode: (nodeId: string) => void;
  mapColumnToNode: (nodeId: string, columnId: string) => void;

  // General setters
  setPreviewJson: (json: unknown[], issues: ValidationIssue[]) => void;
  setActiveNodeId: (nodeId: string | null) => void;
  setAdvancedMode: (isAdvanced: boolean) => void;
  setConfig: (config: OutputNode) => void;

  // Reconciliation
  setReconciliationNeeded: (data: { template: MappingTemplate; missingIds: string[] } | null) => void;
  applyReconciliation: (mappedIds: Record<string, string>) => void;
}

const createDefaultConfig = (): ObjectNode => ({
  id: 'root',
  key: 'root',
  type: 'object',
  children: [{ id: 'node_1', key: 'id', type: 'scalar', sourceColumnId: null }],
});

const mapTree = (node: OutputNode, fn: (n: OutputNode) => OutputNode | null): OutputNode | null => {
  const updated = fn(node);
  if (!updated) return null;

  if (updated.type === 'object') {
    return {
      ...updated,
      children: updated.children.map((c) => mapTree(c, fn)).filter(Boolean) as OutputNode[],
    };
  }
  if (updated.type === 'array') {
    return {
      ...updated,
      itemSchema: updated.itemSchema ? mapTree(updated.itemSchema, fn) : null,
    };
  }
  return updated;
};

export const useMappingStore = create<MappingState>()((set) => ({
  config: createDefaultConfig(),
  previewJson: [],
  validationIssues: [],
  activeNodeId: null,
  isAdvancedMode: false,
  reconciliationNeeded: null,

  updateNode: (nodeId, updates) =>
    set((state) => ({
      config: mapTree(state.config, (n) => (n.id === nodeId ? ({ ...n, ...updates } as OutputNode) : n))!,
    })),

  addChild: (parentId, type) =>
    set((state) => ({
      config: mapTree(state.config, (n) => {
        // Adding a child to an Object
        if (n.id === parentId && n.type === 'object') {
          const newNodeId = `node_${Date.now()}`;
          let newNode: OutputNode;

          if (type === 'scalar')
            newNode = {
              id: newNodeId,
              key: 'new_field',
              type: 'scalar',
              sourceColumnId: null,
            };
          else if (type === 'object')
            newNode = {
              id: newNodeId,
              key: 'new_object',
              type: 'object',
              children: [],
            };
          else
            newNode = {
              id: newNodeId,
              key: 'new_array',
              type: 'array',
              itemSchema: null,
            };

          return { ...n, children: [...n.children, newNode] };
        }

        // Setting the schema for an Array
        if (n.id === parentId && n.type === 'array') {
          const newNodeId = `node_${Date.now()}`;
          let itemSchema: OutputNode;

          if (type === 'scalar')
            itemSchema = {
              id: newNodeId,
              key: 'item',
              type: 'scalar',
              sourceColumnId: null,
            };
          else if (type === 'object')
            itemSchema = {
              id: newNodeId,
              key: 'item',
              type: 'object',
              children: [],
            };
          else
            itemSchema = {
              id: newNodeId,
              key: 'item',
              type: 'array',
              itemSchema: null,
            };

          return { ...n, itemSchema };
        }

        return n;
      })!,
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      config: mapTree(state.config, (n) => (n.id === nodeId ? null : n))!,
    })),

  mapColumnToNode: (nodeId, columnId) =>
    set((state) => ({
      config: mapTree(state.config, (n) => (n.id === nodeId && n.type === 'scalar' ? { ...n, sourceColumnId: columnId } : n))!,
    })),

  setPreviewJson: (json, issues) => set({ previewJson: json, validationIssues: issues }),
  setActiveNodeId: (id) => set({ activeNodeId: id }),
  setAdvancedMode: (isAdvanced) => set({ isAdvancedMode: isAdvanced }),
  setConfig: (config) => set({ config, activeNodeId: null, validationIssues: [] }),
  setReconciliationNeeded: (data) => set({ reconciliationNeeded: data }),

  applyReconciliation: (mappedIds) =>
    set((state) => {
      if (!state.reconciliationNeeded) return state;

      // Deeply and immutably traverse and replace sourceColumnIds
      const replaceIds = (node: OutputNode): OutputNode => {
        const newConditions = node.conditions?.map((c) => ({
          ...c,
          sourceColumnId: mappedIds[c.sourceColumnId] || c.sourceColumnId,
          actionPayload:
            c.action === 'setValueFromColumn' && typeof c.actionPayload === 'string' && mappedIds[c.actionPayload]
              ? mappedIds[c.actionPayload]
              : c.actionPayload,
        }));

        if (node.type === 'scalar') {
          return {
            ...node,
            conditions: newConditions,
            sourceColumnId: node.sourceColumnId && mappedIds[node.sourceColumnId] ? mappedIds[node.sourceColumnId] : node.sourceColumnId,
          };
        }

        if (node.type === 'object') {
          return {
            ...node,
            conditions: newConditions,
            children: node.children.map(replaceIds),
          };
        }

        if (node.type === 'array') {
          return {
            ...node,
            conditions: newConditions,
            itemSchema: node.itemSchema ? replaceIds(node.itemSchema) : null,
          };
        }

        return { ...node, conditions: newConditions };
      };

      const newConfig = replaceIds(state.reconciliationNeeded.template.mappingConfig);
      return {
        config: newConfig,
        reconciliationNeeded: null,
        activeNodeId: null,
        validationIssues: [],
      };
    }),
}));
