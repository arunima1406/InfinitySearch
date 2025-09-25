export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  extension: string;
  content?: string;
  modificationTime: number;
}

export interface SearchResult {
  file: FileInfo;
  score: number;
  matchedText?: string;
}

export type RootStackParamList = {
  Loading: undefined;
  Search: undefined;
  FilePreview: { file: FileInfo };
};

export interface ScanProgress {
  current: number;
  total: number;
  currentFile: string;
}