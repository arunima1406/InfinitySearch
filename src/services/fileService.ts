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
  key?: string;
  url?: string;
}

export interface UploadResult{
  success: boolean;
  fileId: string;
  key?: string;
  url?: string;
  error?: string;
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

  private readonly API_BASE_URL = 'http://your-backend-url:8000';
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


  async uploadFiles(
    files: LocalFile[],
    userId: string,
    projectId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      try {
        onProgress?.({ fileId: file.id, fileName: file.name, progress: 0, status: 'uploading' });

        const formData = new FormData();

        const fileBlob = await this.uriToBlob(file.uri, file.mimeType);

         formData.append('file', fileBlob as any);
        formData.append('userId', userId);
        formData.append('originalName', file.name);
        formData.append('fileType', file.type);

         if (projectId) {
          formData.append('projectId', projectId);
        }

         const response = await fetch(`${this.API_BASE_URL}/upload-file/`, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();


              

        onProgress?.({ fileId: file.id, fileName: file.name, progress: 100, status: 'completed', key:result.key, url:result.url });
         results.push({
          success: true,
          fileId: file.id,
          key: result.key,
          url: result.url
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        onProgress?.({ fileId: file.id, fileName: file.name, progress: 0, status: 'error' });
        results.push({
          success: false,
          fileId: file.id,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }
    return results;
  }

  private async uriToBlob(uri: string, mimeType: string = ''): Promise<Blob> {
    try {
      const response = await fetch(uri);
      return await response.blob();
    } catch (error) {
      console.error('Error converting URI to blob:', error);
      throw error;
    }
  }

   async uploadMultipleFiles(
    files: LocalFile[],
    userId: string,
    projectId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ results: UploadResult[], combinedResult?: any }> {
    try {
      const formData = new FormData();
      
      // Append all files and metadata
      files.forEach((file, index) => {
        // We'll handle individual file uploads for better progress tracking
        // This method is kept for potential batch optimization
      });

      // For now, use individual uploads for better progress tracking
      const results = await this.uploadFiles(files, userId, projectId, onProgress);

      // Get combined knowledge graph result
      const combinedResponse = await fetch(
        `${this.API_BASE_URL}/s3/users/${userId}/files?limit=100`
      );
      
      const combinedResult = combinedResponse.ok ? await combinedResponse.json() : null;

      return {
        results,
        combinedResult
      };

    } catch (error) {
      console.error('Error in batch upload:', error);
      throw error;
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
