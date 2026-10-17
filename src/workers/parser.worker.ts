// src/workers/parser.worker.ts
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { type DataType, type SourceColumn, type WorkerRequest, type WorkerResponse } from '../shared/types';
import { evaluateRow } from '../shared/lib/mappingEngine';

// Module-level cache for the full dataset to prevent passing 100k+ rows over postMessage
let cachedDataset: Record<string, unknown>[] = [];

self.addEventListener('message', async (e: MessageEvent<WorkerRequest>) => {
  const { type, payload } = e.data;

  if (type === 'PARSE_FILE') {
    try {
      const { file } = payload;
      const extension = file.name.split('.').pop()?.toLowerCase();
      let rawData: Record<string, unknown>[] = [];

      if (extension === 'xlsx') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      } else if (['csv', 'tsv', 'txt'].includes(extension || '')) {
        rawData = await new Promise((resolve, reject) => {
          Papa.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
              if (results.errors.length > 0 && results.data.length === 0) {
                reject(new Error(results.errors[0].message));
              } else {
                resolve(results.data);
              }
            },
            error: (err) => reject(new Error(err.message)),
          });
        });
      } else {
        throw new Error('Unsupported file type. Please upload .xlsx, .csv, or .tsv.');
      }

      if (rawData.length === 0) throw new Error('File is empty or contains no valid rows.');

      cachedDataset = rawData; // Cache the full dataset
      const columns = detectColumns(rawData);
      const sampleRows = rawData.slice(0, 25);

      self.postMessage({
        type: 'PARSE_SUCCESS',
        payload: {
          metadata: { filename: file.name, rowCount: rawData.length, columns },
          sampleRows,
        },
      } satisfies WorkerResponse);
    } catch (error: unknown) {
      self.postMessage({
        type: 'PARSE_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown parsing error',
        },
      } satisfies WorkerResponse);
    }
  }

  if (type === 'GENERATE_PREVIEW') {
    try {
      const { config, rows, columns } = payload;
      const previewResults = rows.map((row: Record<string, unknown>) => evaluateRow(row, config, columns));

      const previewJson = previewResults.map((r) => r.result);
      const validationIssues = previewResults.flatMap((r) => r.issues);

      self.postMessage({
        type: 'PREVIEW_SUCCESS',
        payload: { previewJson, validationIssues },
      } satisfies WorkerResponse);
    } catch (error: unknown) {
      console.error('Preview generation failed:', error);
    }
  }

  if (type === 'GENERATE_EXPORT') {
    try {
      const { config, columns, errorStrategy, format } = payload;
      const finalOutput: unknown[] = [];
      let errorsCount = 0;

      for (const row of cachedDataset) {
        const { result, issues } = evaluateRow(row, config, columns);
        const hasErrors = issues.some((i) => i.type === 'error');

        if (hasErrors) {
          errorsCount++;
          if (errorStrategy === 'abort') {
            const firstError = issues.find((i) => i.type === 'error')?.message || 'Unknown error';
            throw new Error(`Export aborted: Validation error on a row. Details: ${firstError}`);
          }
          if (errorStrategy === 'skip') continue;
          if (errorStrategy === 'null') {
            finalOutput.push(null);
            continue;
          }
          // 'warning' strategy pushes the result regardless
        }
        finalOutput.push(result);
      }

      // Stringify and convert immediately to Blob in the worker to save main-thread memory
      const jsonString = JSON.stringify(finalOutput, null, format ? 2 : undefined);
      const blob = new Blob([jsonString], { type: 'application/json' });

      self.postMessage({
        type: 'EXPORT_SUCCESS',
        payload: {
          blob,
          stats: {
            total: cachedDataset.length,
            exported: finalOutput.length,
            errors: errorsCount,
          },
        },
      } satisfies WorkerResponse);
    } catch (error: unknown) {
      self.postMessage({
        type: 'EXPORT_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Export failed',
        },
      } satisfies WorkerResponse);
    }
  }
});

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2}))?$/;

function detectColumns(data: Record<string, unknown>[]): SourceColumn[] {
  const headers = Object.keys(data[0] || {});

  return headers.map((header, index) => {
    let emptyCount = 0;
    const sampleValues: (string | number | boolean | null)[] = [];
    const typeSet = new Set<string>();
    let isDateLikely = false;

    const sampleSize = Math.min(data.length, 50);

    for (let i = 0; i < sampleSize; i++) {
      const val = data[i][header];
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
        emptyCount++;
        continue;
      }

      if (sampleValues.length < 5) sampleValues.push(val as string | number | boolean);
      typeSet.add(typeof val);

      if (typeof val === 'string' && ISO_DATE_REGEX.test(val)) isDateLikely = true;
      else if (val instanceof Date) isDateLikely = true;
    }

    const fillRate = sampleSize > 0 ? (sampleSize - emptyCount) / sampleSize : 0;
    let inferredType: DataType;

    if (emptyCount === sampleSize) inferredType = 'empty';
    else if (isDateLikely) inferredType = 'date';
    else if (typeSet.has('number') && !typeSet.has('string')) inferredType = 'number';
    else if (typeSet.has('boolean') && !typeSet.has('string') && !typeSet.has('number')) inferredType = 'boolean';
    else inferredType = 'string';

    return {
      id: `col_${index}_${header.replace(/\W/g, '_').toLowerCase()}`,
      index,
      name: header,
      inferredType,
      sampleValues,
      fillRate,
    };
  });
}
