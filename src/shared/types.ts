// src/shared/types.ts
// --- SOURCE DATA ---
export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'empty' | 'unknown';

export interface SourceColumn {
  id: string; // e.g., "col_0" or the header name safely slugified
  index: number;
  name: string;
  inferredType: DataType;
  sampleValues: (string | number | boolean | null)[];
  fillRate: number; // 0.0 to 1.0
}

export interface FileMetadata {
  filename: string;
  rowCount: number;
  columns: SourceColumn[];
}

// --- MAPPING & OUTPUT ---
export type OutputNodeType = 'object' | 'array' | 'scalar' | 'constant';

export type Transformation = 
  | 'trim' | 'lowercase' | 'uppercase' | 'split' | 'join' 
  | 'toNumber' | 'toDate' | 'emptyToNull';

export interface BaseNode {
  id: string;
  key: string; 
  type: OutputNodeType;
  conditions?: Condition[];
}

export interface ObjectNode extends BaseNode {
  type: 'object';
  children: OutputNode[];
}

export interface ArrayNode extends BaseNode {
  type: 'array';
  // Arrays in tabular mapping usually repeat a single schema for grouped rows
  itemSchema: OutputNode | null; 
}

export interface ScalarNode extends BaseNode {
  type: 'scalar';
  sourceColumnId: string | null; // null if unmapped
  transformations?: Transformation[];
  fallbackValue?: string | number | boolean | null;
}

export interface ConstantNode extends BaseNode {
  type: 'constant';
  value: string | number | boolean | null;
}

export type OutputNode = ObjectNode | ArrayNode | ScalarNode | ConstantNode;

// --- CONDITIONS ---
export type Operator = 
  | 'isEmpty' | 'isNotEmpty' | 'equals' | 'notEquals' 
  | 'contains' | 'notContains' | 'matchesRegex' 
  | 'greaterThan' | 'lessThan';

export type ActionType = 
  | 'include' | 'exclude' | 'setConstant' | 'setValueFromColumn' 
  | 'markInvalid' | 'addWarning';

export interface Condition {
  id: string;
  sourceColumnId: string;
  operator: Operator;
  targetValue?: string | number;
  action: ActionType;
  actionPayload?: string | number | boolean;
}

// --- WORKER MESSAGING ---
export type WorkerRequest = 
  | { type: 'PARSE_FILE'; payload: { file: File } };

export type WorkerResponse =
  | { type: 'PARSE_SUCCESS'; payload: { metadata: FileMetadata; sampleRows: unknown[] } }
  | { type: 'PARSE_ERROR'; payload: { error: string } };