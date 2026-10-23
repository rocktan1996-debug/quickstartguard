import { Worker } from 'node:worker_threads';
import type { Project } from './types.js';
import { QsgError, errorMessage } from './errors.js';
export function loadProjectIsolated(configFile: string): Promise<Project> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./planner-worker.js', import.meta.url), {
      workerData: {configFile}, resourceLimits: {maxOldGenerationSizeMb: 96, stackSizeMb: 4},
    });
    let settled = false;
    const finish = (error?: Error, project?: Project) => {
      if (settled) return; settled = true; clearTimeout(timer); void worker.terminate();
      if (error) reject(error); else resolve(project!);
    };
    const timer = setTimeout(() => finish(new QsgError('PARSER_TIMEOUT', 'Input parsing exceeded 5 seconds. No commands executed.')), 5000);
    worker.once('message', (message) => message.ok ? finish(undefined, message.project) : finish(new QsgError(message.code, message.message)));
    worker.once('error', (error) => finish(new QsgError('PARSER_ERROR', errorMessage(error))));
    worker.once('exit', (code) => { if (!settled) finish(new QsgError('PARSER_ERROR', `Parser exited unexpectedly (${code}).`)); });
  });
}
