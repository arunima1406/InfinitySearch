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
  SignIn: undefined;
  FilePreview: { fileId: string; fileName: string; fileType: string; };
};

export interface ScanProgress {
  current: number;
  total: number;
  currentFile: string;
}

// Auth-related types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export interface AuthState {
  isSignedIn: boolean;
  user: User | null;
  isLoaded: boolean;
}
