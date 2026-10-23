import type { CheckResult, PlannedCheck, ProcessResult } from './types.js';
export declare function normaliseOutput(text: string): string;
export declare function evaluate(check: PlannedCheck, result: ProcessResult): CheckResult;
