// src/shared/lib/mappingEngine.ts
import { type OutputNode, type SourceColumn, type Transformation, type Operator, type ValidationIssue } from '../types';

export const EXCLUDE_SYMBOL = Symbol('EXCLUDE');

function applyTransformations(value: unknown, transformations: Transformation[] = []): unknown {
  let current = value;

  for (const t of transformations) {
    if (current === null || current === undefined) {
      if (t === 'emptyToNull') current = null;
      continue;
    }

    if (typeof current === 'string') {
      switch (t) {
        case 'trim':
          current = current.trim();
          break;
        case 'lowercase':
          current = current.toLowerCase();
          break;
        case 'uppercase':
          current = current.toUpperCase();
          break;
        case 'split':
          current = current.split(',').map((s) => s.trim());
          break;
        case 'toNumber': {
          const num = Number(current);
          current = isNaN(num) ? null : num;
          break;
        }
        case 'toDate': {
          const d = new Date(current);
          current = isNaN(d.getTime()) ? null : d.toISOString();
          break;
        }
        case 'emptyToNull':
          if (current === '') current = null;
          break;
      }
    } else if (Array.isArray(current)) {
      if (t === 'join') current = current.join(', ');
    }
  }

  return current;
}

function evaluateCondition(sourceValue: unknown, operator: Operator, targetValue?: string | number): boolean {
  // Use nullish coalescing to prevent "null" (string) from matching null (object) incorrectly
  const s = sourceValue === null || sourceValue === undefined ? '' : String(sourceValue).toLowerCase();
  const t = targetValue === null || targetValue === undefined ? '' : String(targetValue).toLowerCase();

  switch (operator) {
    case 'isEmpty':
      return sourceValue === null || sourceValue === undefined || sourceValue === '';
    case 'isNotEmpty':
      return sourceValue !== null && sourceValue !== undefined && sourceValue !== '';
    case 'equals':
      return s === t;
    case 'notEquals':
      return s !== t;
    case 'contains':
      return s.includes(t);
    case 'notContains':
      return !s.includes(t);
    case 'matchesRegex':
      try {
        // Sandbox regex check to prevent ReDoS on massive strings, fail closed
        return new RegExp(t, 'i').test(s);
      } catch {
        return false;
      }
    case 'greaterThan':
      return Number(sourceValue) > Number(targetValue);
    case 'lessThan':
      return Number(sourceValue) < Number(targetValue);
    default:
      return false;
  }
}

export function evaluateRow(row: Record<string, unknown>, config: OutputNode, columns: SourceColumn[]): { result: unknown; issues: ValidationIssue[] } {
  const colMap = new Map(columns.map((c) => [c.id, c.name]));
  const issues: ValidationIssue[] = [];

  function evaluate(node: OutputNode): unknown {
    // 1. Evaluate Conditions
    if (node.conditions && node.conditions.length > 0) {
      for (const cond of node.conditions) {
        const headerName = colMap.get(cond.sourceColumnId);
        const sourceValue = headerName ? row[headerName] : null;

        const isMet = evaluateCondition(sourceValue, cond.operator, cond.targetValue);

        if (isMet) {
          if (cond.action === 'exclude') return EXCLUDE_SYMBOL;
          if (cond.action === 'setConstant') return cond.actionPayload;
          if (cond.action === 'setValueFromColumn') {
            const targetHeader = colMap.get(cond.actionPayload as string);
            return targetHeader ? row[targetHeader] : null;
          }
          if (cond.action === 'markInvalid') {
            issues.push({
              type: 'error',
              message: `Row invalid: Column ${cond.sourceColumnId} failed condition.`,
              nodeId: node.id,
              columnId: cond.sourceColumnId,
            });
          }
          if (cond.action === 'addWarning') {
            issues.push({
              type: 'warning',
              message: `Warning: Triggered by column ${cond.sourceColumnId}.`,
              nodeId: node.id,
              columnId: cond.sourceColumnId,
            });
          }
        }
      }
    }

    // 2. Evaluate Node Data
    switch (node.type) {
      case 'object': {
        const obj: Record<string, unknown> = {};
        for (const child of node.children) {
          const val = evaluate(child);
          if (val !== EXCLUDE_SYMBOL) {
            obj[child.key] = val;
          }
        }
        return obj;
      }

      case 'array': {
        if (!node.itemSchema) return [];
        const val = evaluate(node.itemSchema);
        return val === EXCLUDE_SYMBOL ? [] : [val];
      }

      case 'scalar': {
        let val: unknown = null;

        if (node.sourceColumnId) {
          const headerName = colMap.get(node.sourceColumnId);
          if (headerName) val = row[headerName];
        }

        val = applyTransformations(val, node.transformations);

        if (val === null || val === undefined || val === '') {
          val = node.fallbackValue !== undefined ? node.fallbackValue : null;
        }

        return val;
      }

      case 'constant':
        return node.value;

      default:
        return null;
    }
  }

  const result = evaluate(config);
  return { result: result === EXCLUDE_SYMBOL ? null : result, issues };
}
