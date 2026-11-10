export function isChatGPT(): boolean;
export function useIsChatGPT(): boolean;
export function useOpenAiGlobal<T = unknown>(key: string): T | undefined;
export function useWidgetState<S = unknown>(): [S | undefined, (v: S) => void];
export function useUploadFile(): (file: File) => Promise<{ fileId: string } | null>;
export function useRequestModal(): (opts: Record<string, unknown>) => Promise<unknown>;
export function useUserAgent(): unknown;
