import { type Capture, type PlannedCheck, type ProcessResult, type Shell } from './types.js';
export declare function preflightShell(shell: Shell, env: NodeJS.ProcessEnv): string;
export declare function shellScript(shell: Shell, code: string): string;
export declare class OutputCapture {
    private limit;
    private chunks;
    private retained;
    bytesSeen: number;
    constructor(limit?: number);
    add(chunk: Buffer): boolean;
    finish(): Capture;
}
export declare function runProcess(check: PlannedCheck, env: NodeJS.ProcessEnv, signal?: AbortSignal): Promise<ProcessResult>;
