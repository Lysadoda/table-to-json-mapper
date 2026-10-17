// src/features/advanced/JsonConfigEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';
import { z } from 'zod';
import { useMappingStore } from '../../shared/store/useMappingStore';
import { outputNodeSchema } from '../../shared/lib/schemas';

const JsonConfigEditor: React.FC = () => {
  const { config, setConfig } = useMappingStore();
  const [localValue, setLocalValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Track initialization to prevent the cursor from jumping while typing
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      setLocalValue(JSON.stringify(config, null, 2));
      isInitialized.current = true;
    }
  }, [config]);

  const handleChange = (val: string) => {
    setLocalValue(val);
    try {
      const parsed = JSON.parse(val);
      const validated = outputNodeSchema.parse(parsed);
      setConfig(validated);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.errors[0];
        const path = firstIssue.path.length > 0 ? `[${firstIssue.path.join('.')}]` : 'Root';
        setError(`Schema Error at ${path}: ${firstIssue.message}`);
      } else if (err instanceof SyntaxError) {
        setError(`Syntax Error: ${err.message}`);
      } else {
        setError('Invalid Configuration Format');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center text-sm">
        <span className="font-semibold text-foreground">Raw Configuration AST</span>
        {error ? (
          <span className="text-destructive font-medium truncate max-w-2xl px-2 py-0.5 bg-destructive/10 rounded border border-destructive/20">{error}</span>
        ) : (
          <span className="text-green-600 font-medium px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">Valid AST</span>
        )}
      </div>
      <div className="flex-1 overflow-auto bg-[#1e1e1e]">
        <CodeMirror
          value={localValue}
          height="100%"
          theme="dark"
          extensions={[json(), linter(jsonParseLinter())]}
          onChange={handleChange}
          className="text-[13px] font-mono h-full"
        />
      </div>
    </div>
  );
};

export default JsonConfigEditor;
