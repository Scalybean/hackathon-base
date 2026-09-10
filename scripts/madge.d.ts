/**
 * Minimal types for madge, which ships none. Only the surface
 * scripts/generate-graph.ts actually uses is declared.
 */
declare module 'madge' {
  export type MadgeConfig = {
    baseDir?: string;
    fileExtensions?: string[];
    tsConfig?: string;
    detectiveOptions?: Record<string, unknown>;
  };

  export type MadgeInstance = {
    /** Adjacency list: module path -> the modules it imports. */
    obj(): Record<string, string[]>;
    /** Each entry is one cycle, as the chain of modules forming it. */
    circular(): string[][];
    /** Modules nothing else imports. */
    orphans(): string[];
  };

  export default function madge(
    path: string | string[],
    config?: MadgeConfig,
  ): Promise<MadgeInstance>;
}
