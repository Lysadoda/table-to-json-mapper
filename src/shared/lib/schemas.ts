// src/shared/lib/schemas.ts
import { z } from 'zod';
import { type OutputNode } from '../types';

const transformationSchema = z.enum(['trim', 'lowercase', 'uppercase', 'split', 'join', 'toNumber', 'toDate', 'emptyToNull']);

const operatorSchema = z.enum(['isEmpty', 'isNotEmpty', 'equals', 'notEquals', 'contains', 'notContains', 'matchesRegex', 'greaterThan', 'lessThan']);

const actionSchema = z.enum(['include', 'exclude', 'setConstant', 'setValueFromColumn', 'markInvalid', 'addWarning']);

const conditionSchema = z.object({
  id: z.string(),
  sourceColumnId: z.string(),
  operator: operatorSchema,
  targetValue: z.union([z.string(), z.number()]).optional(),
  action: actionSchema,
  actionPayload: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const baseNodeSchema = z.object({
  id: z.string(),
  key: z.string(),
  conditions: z.array(conditionSchema).optional(),
});

export const outputNodeSchema: z.ZodType<OutputNode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    baseNodeSchema.extend({
      type: z.literal('object'),
      children: z.array(outputNodeSchema),
    }),
    baseNodeSchema.extend({
      type: z.literal('array'),
      itemSchema: outputNodeSchema.nullable(),
    }),
    baseNodeSchema.extend({
      type: z.literal('scalar'),
      sourceColumnId: z.string().nullable(),
      transformations: z.array(transformationSchema).optional(),
      fallbackValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    }),
    baseNodeSchema.extend({
      type: z.literal('constant'),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    }),
  ]),
);

export const templateSchema = z
  .object({
    format: z.literal('table-to-json-mapper-template'),
    version: z.number(),
    sourceMetadata: z
      .object({
        columns: z.array(
          z
            .object({
              id: z.string(),
              name: z.string(),
              inferredType: z.string(),
            })
            .passthrough(),
        ),
      })
      .passthrough(),
    mappingConfig: outputNodeSchema,
  })
  .passthrough();
