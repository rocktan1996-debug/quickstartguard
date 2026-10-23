import type { CheckResult, RunReport } from './types.js';
export declare function plain(text: string): string;
export declare function safeConsole(text: string): string;
export declare function escapeData(text: string): string;
export declare function escapeProperty(text: string): string;
export declare function annotation(result: CheckResult, filePrefix?: string): string;
export declare function consoleReport(report: RunReport, verbose?: boolean): string;
export declare function summaryReport(report: RunReport): string;
export declare function jsonReport(report: RunReport, includeOutput?: boolean): string;
