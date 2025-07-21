export interface UploadedFile {
    id: string;
    file: File;
    progress: number;
    metadata: Record<string, string>;
    status: 'pending' | 'uploading' | 'uploaded' | 'error';
  }
  
  export interface Document {
    id: string
    title: string
    file_type: string
    file_size: number
    created_at: string
    workflow_status: string
  }