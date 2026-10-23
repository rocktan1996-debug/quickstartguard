import { parentPort, workerData } from 'node:worker_threads';
import { loadProject } from './planner.js';
import { QsgError, errorMessage } from './errors.js';
if (parentPort) {
    try {
        parentPort.postMessage({ ok: true, project: await loadProject(workerData.configFile) });
    }
    catch (error) {
        parentPort.postMessage({ ok: false, code: error instanceof QsgError ? error.code : 'INPUT_ERROR', message: errorMessage(error) });
    }
}
//# sourceMappingURL=planner-worker.js.map