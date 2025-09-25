import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';

export interface LocalFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  mimeType?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

class FileService {
  private readonly supportedTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'image/*',
  ];

  /**
   * Scan device for images and documents
   */
  async scanLocalFiles(): Promise<LocalFile[]> {
    try {
      const allFiles: LocalFile[] = [];

      // Request permission for images
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const mediaFiles = await this.scanMediaLibrary();
        allFiles.push(...mediaFiles);
      }

      return allFiles;
    } catch (error) {
      console.error('Error scanning files', error);
      return [];
    }
  }

  /**
   * Scan MediaLibrary for images only
   */
  private async scanMediaLibrary(): Promise<LocalFile[]> {
    const files: LocalFile[] = [];

    try {
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      for (const asset of assets.assets) {
        files.push({
          id: `media-${asset.id}`,
          name: asset.filename,
          uri: asset.uri,
          type: 'image',
          size: (asset.width && asset.height ? asset.width * asset.height : 0),
          mimeType: asset.filename.endsWith('.png')
            ? 'image/png'
            : 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error scanning media library:', error);
    }

    return files;
  }

  /**
   * Allow users to pick multiple documents (PDF, DOCX, XLSX, TXT, CSV, etc.)
   */
  async pickMultipleFiles(): Promise<LocalFile[]> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: this.supportedTypes,
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return [];

      return result.assets.map((asset, index) => ({
        id: `picked-${Date.now()}-${index}`,
        name: asset.name,
        uri: asset.uri,
        type: this.getFileTypeFromName(asset.name),
        size: asset.size || 0,
        mimeType: asset.mimeType,
      }));
    } catch (error) {
      console.error('Error picking files:', error);
      throw new Error('Failed to pick files');
    }
  }

  /**
   * Upload files to backend (simulated)
   */
  async uploadFiles(
    files: LocalFile[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    for (const file of files) {
      try {
        onProgress?.({ fileId: file.id, fileName: file.name, progress: 0, status: 'uploading' });

        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          onProgress?.({ fileId: file.id, fileName: file.name, progress, status: 'uploading' });
        }

        onProgress?.({ fileId: file.id, fileName: file.name, progress: 100, status: 'completed' });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        onProgress?.({ fileId: file.id, fileName: file.name, progress: 0, status: 'error' });
      }
    }
  }

  /**
   * Get mock file content for preview
   */
  async getFileContent(fileId: string, fileType: string): Promise<string> {
    try {
      const mockContent = {
        pdf: 'This is extracted content from your PDF file.',
        txt: 'Text file content processed by backend.',
        docx: 'Document content from Word file.',
        xlsx: 'Spreadsheet data from Excel file.',
        csv: 'CSV file structured data.',
        image: 'Image file ready for preview or processing.',
      };
      return mockContent[fileType as keyof typeof mockContent] || 'File content processed by backend';
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw new Error('Failed to fetch file content');
    }
  }

  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      pdf: 'pdf',
      txt: 'txt',
      docx: 'docx',
      doc: 'doc',
      xlsx: 'xlsx',
      xls: 'xls',
      csv: 'csv',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
    };
    return typeMap[extension || ''] || 'unknown';
  }

  private getMimeTypeFromName(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    return mimeMap[extension || ''] || 'application/octet-stream';
  }
}

export const fileService = new FileService();
