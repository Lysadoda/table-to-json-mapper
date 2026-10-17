// src/shared/lib/mappingEngine.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateRow } from './mappingEngine';
import { type OutputNode, type SourceColumn } from '../types';

describe('mappingEngine.evaluateRow', () => {
  const columns: SourceColumn[] = [
    {
      id: 'col_A',
      index: 0,
      name: 'FirstName',
      inferredType: 'string',
      sampleValues: [],
      fillRate: 1,
    },
    {
      id: 'col_B',
      index: 1,
      name: 'Age',
      inferredType: 'number',
      sampleValues: [],
      fillRate: 1,
    },
  ];

  it('maps scalar columns correctly with transformations', () => {
    const row = { FirstName: '  John  ', Age: 30 };
    const config: OutputNode = {
      id: 'root',
      key: 'root',
      type: 'object',
      children: [
        {
          id: 'n1',
          key: 'name',
          type: 'scalar',
          sourceColumnId: 'col_A',
          transformations: ['trim', 'uppercase'],
        },
        { id: 'n2', key: 'age', type: 'scalar', sourceColumnId: 'col_B' },
      ],
    };

    const { result, issues } = evaluateRow(row, config, columns);
    expect(result).toEqual({ name: 'JOHN', age: 30 });
    expect(issues).toHaveLength(0);
  });

  it('evaluates conditions and excludes fields', () => {
    const row = { FirstName: '', Age: null };
    const config: OutputNode = {
      id: 'root',
      key: 'root',
      type: 'object',
      children: [
        {
          id: 'n1',
          key: 'age',
          type: 'scalar',
          sourceColumnId: 'col_B',
          conditions: [
            {
              id: 'c1',
              sourceColumnId: 'col_B',
              operator: 'isEmpty',
              action: 'exclude',
            },
          ],
        },
      ],
    };

    const { result } = evaluateRow(row, config, columns);
    expect(result).toEqual({}); // 'age' was conditionally excluded
  });

  it('safely handles missing data and applies fallbacks', () => {
    const row = { FirstName: '', Age: null };
    const config: OutputNode = {
      id: 'root',
      key: 'root',
      type: 'object',
      children: [
        {
          id: 'n1',
          key: 'status',
          type: 'scalar',
          sourceColumnId: 'col_missing',
          fallbackValue: 'Unknown',
        },
      ],
    };

    const { result } = evaluateRow(row, config, columns);
    expect(result).toEqual({ status: 'Unknown' });
  });
});
