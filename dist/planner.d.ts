import { type Project } from './types.js';
export declare function loadProject(configFile: string): Promise<Project>;
export declare function selectChecks(project: Project, platform: string, id?: string): Project['checks'];
