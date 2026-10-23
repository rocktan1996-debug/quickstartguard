export declare function isInside(root: string, candidate: string): boolean;
export declare function relativePath(value: string, label: string): string;
export declare function insideExisting(root: string, value: string, kind: 'file' | 'directory'): Promise<string>;
export declare function readLimited(file: string, maximum: number): Promise<string>;
export declare function reportPath(root: string, value: string, extension: '.json' | '.md'): Promise<string>;
export declare function writeReport(root: string, value: string, content: string, extension: '.json' | '.md'): Promise<void>;
