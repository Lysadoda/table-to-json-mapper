// src/shared/lib/worker.ts
let workerInstance: Worker | null = null;

export const getWorker = (): Worker => {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('../../workers/parser.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return workerInstance;
};
