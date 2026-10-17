// src/shared/store/useAppStore.ts
import { create } from 'zustand';
import { type FileMetadata, type WorkerResponse } from '../types';
import { getWorker } from '../lib/worker';

interface AppState {
  isParsing: boolean;
  parseError: string | null;
  fileMetadata: FileMetadata | null;
  sampleRows: Record<string, unknown>[];
  parseFile: (file: File) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()((set) => {
  const worker = getWorker();

  // Attach listener once inside store initialization using safe addEventListener
  worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
    const response = e.data;
    if (response.type === 'PARSE_SUCCESS') {
      set({
        isParsing: false,
        fileMetadata: response.payload.metadata,
        sampleRows: response.payload.sampleRows as Record<string, unknown>[],
        parseError: null,
      });
    } else if (response.type === 'PARSE_ERROR') {
      set({ isParsing: false, parseError: response.payload.error });
    }
  });

  return {
    isParsing: false,
    parseError: null,
    fileMetadata: null,
    sampleRows: [],

    parseFile: (file: File) => {
      set({ isParsing: true, parseError: null, fileMetadata: null });
      worker.postMessage({ type: 'PARSE_FILE', payload: { file } });
    },

    reset: () =>
      set({
        isParsing: false,
        parseError: null,
        fileMetadata: null,
        sampleRows: [],
      }),
  };
});
