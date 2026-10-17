// src/features/conditions/NodeConfigurator.tsx
import React from 'react';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { useAppStore } from '../../shared/store/useAppStore';
import { type OutputNode, type ScalarNode, type Transformation, type Condition, type Operator } from '../../shared/types';
import { X, Plus, Trash2, Settings2 } from 'lucide-react';

const availableTransformations: Transformation[] = ['trim', 'lowercase', 'uppercase', 'split', 'join', 'toNumber', 'toDate', 'emptyToNull'];

export const NodeConfigurator: React.FC = () => {
  const { config, activeNodeId, setActiveNodeId, updateNode } = useMappingStore();
  const fileMetadata = useAppStore((s) => s.fileMetadata);

  if (!activeNodeId) return null;

  const findNode = (n: OutputNode): OutputNode | null => {
    if (n.id === activeNodeId) return n;
    if (n.type === 'object') {
      for (const c of n.children) {
        const found = findNode(c);
        if (found) return found;
      }
    }
    if (n.type === 'array' && n.itemSchema) return findNode(n.itemSchema);
    return null;
  };

  const activeNode = findNode(config);
  if (!activeNode) return null;

  const isScalar = activeNode.type === 'scalar';
  const scalarNode = activeNode as ScalarNode;

  const handleAddTransformation = (t: Transformation) => {
    if (!isScalar) return;
    const current = scalarNode.transformations || [];
    if (!current.includes(t)) updateNode(activeNode.id, { transformations: [...current, t] });
  };

  const handleRemoveTransformation = (t: Transformation) => {
    if (!isScalar) return;
    updateNode(activeNode.id, {
      transformations: (scalarNode.transformations || []).filter((x) => x !== t),
    });
  };

  const handleAddCondition = () => {
    const newCond: Condition = {
      id: `cond_${crypto.randomUUID()}`,
      sourceColumnId: fileMetadata?.columns[0]?.id || '',
      operator: 'isEmpty',
      action: 'exclude',
    };
    updateNode(activeNode.id, {
      conditions: [...(activeNode.conditions || []), newCond],
    });
  };

  const updateCondition = (condId: string, updates: Partial<Condition>) => {
    const updated = (activeNode.conditions || []).map((c) => (c.id === condId ? { ...c, ...updates } : c));
    updateNode(activeNode.id, { conditions: updated });
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40" onClick={() => setActiveNodeId(null)} />
      <div className="fixed inset-y-0 right-0 w-[28rem] bg-card border-l border-border shadow-2xl flex flex-col z-50 transform transition-transform">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Configure: <span className="font-mono">{activeNode.key}</span>
            </h3>
          </div>
          <button onClick={() => setActiveNodeId(null)} className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {isScalar && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Transformations</h4>

              <div className="flex flex-wrap gap-2">
                {(scalarNode.transformations || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20"
                  >
                    {t}
                    <button onClick={() => handleRemoveTransformation(t)} className="hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <select
                className="w-full text-sm p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                onChange={(e) => {
                  if (e.target.value) handleAddTransformation(e.target.value as Transformation);
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  + Add Transformation...
                </option>
                {availableTransformations
                  .filter((t) => !(scalarNode.transformations || []).includes(t))
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </select>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Fallback Value (if empty)</label>
                <input
                  type="text"
                  placeholder="e.g. N/A or 0"
                  value={(scalarNode.fallbackValue as string) || ''}
                  onChange={(e) => updateNode(activeNode.id, { fallbackValue: e.target.value })}
                  className="w-full text-sm p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="text-sm font-semibold text-foreground">Conditions / Rules</h4>
              <button
                onClick={handleAddCondition}
                className="text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>

            {(activeNode.conditions || []).map((cond) => (
              <div key={cond.id} className="p-4 bg-muted/30 border border-border rounded-lg space-y-3 relative group">
                <button
                  onClick={() =>
                    updateNode(activeNode.id, {
                      conditions: (activeNode.conditions || []).filter((c) => c.id !== cond.id),
                    })
                  }
                  className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-muted-foreground text-xs w-8">IF</span>
                  <select
                    className="flex-1 p-1.5 border border-border rounded bg-background"
                    value={cond.sourceColumnId}
                    onChange={(e) =>
                      updateCondition(cond.id, {
                        sourceColumnId: e.target.value,
                      })
                    }
                  >
                    {fileMetadata?.columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 pl-11">
                  <select
                    className="w-full p-1.5 border border-border rounded bg-background text-sm"
                    value={cond.operator}
                    onChange={(e) =>
                      updateCondition(cond.id, {
                        operator: e.target.value as Operator,
                      })
                    }
                  >
                    <option value="isEmpty">is empty</option>
                    <option value="isNotEmpty">is not empty</option>
                    <option value="equals">equals</option>
                    <option value="notEquals">does not equal</option>
                    <option value="contains">contains</option>
                    <option value="notContains">does not contain</option>
                    <option value="matchesRegex">matches regex</option>
                    <option value="greaterThan">is greater than</option>
                    <option value="lessThan">is less than</option>
                  </select>
                  {!['isEmpty', 'isNotEmpty'].includes(cond.operator) && (
                    <input
                      type="text"
                      className="w-full p-1.5 border border-border rounded bg-background text-sm"
                      placeholder="Target value..."
                      value={cond.targetValue || ''}
                      onChange={(e) =>
                        updateCondition(cond.id, {
                          targetValue: e.target.value,
                        })
                      }
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm pt-2 border-t border-border/50">
                  <span className="font-bold text-muted-foreground text-xs w-8">THEN</span>
                  <select
                    className="flex-1 p-1.5 border border-border rounded bg-background text-sm"
                    value={cond.action}
                    onChange={(e) =>
                      updateCondition(cond.id, {
                        action: e.target.value as Condition['action'],
                      })
                    }
                  >
                    <option value="exclude">Exclude this field</option>
                    <option value="setConstant">Set constant value</option>
                    <option value="setValueFromColumn">Set value from column</option>
                    <option value="markInvalid">Mark row as invalid</option>
                    <option value="addWarning">Add warning</option>
                  </select>
                </div>

                {cond.action === 'setConstant' && (
                  <div className="pl-11">
                    <input
                      type="text"
                      className="w-full p-1.5 border border-border rounded bg-background text-sm"
                      placeholder="Constant value..."
                      value={(cond.actionPayload as string) || ''}
                      onChange={(e) =>
                        updateCondition(cond.id, {
                          actionPayload: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {cond.action === 'setValueFromColumn' && (
                  <div className="pl-11">
                    <select
                      className="w-full p-1.5 border border-border rounded bg-background text-sm"
                      value={(cond.actionPayload as string) || ''}
                      onChange={(e) =>
                        updateCondition(cond.id, {
                          actionPayload: e.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Select target column...
                      </option>
                      {fileMetadata?.columns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}

            {(!activeNode.conditions || activeNode.conditions.length === 0) && (
              <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/10 rounded border border-dashed border-border">
                No conditions applied.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
