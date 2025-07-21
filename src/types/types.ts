export interface Document {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: 'Approved' | 'Pending' | 'Rejected';
    content: string;
  }
  
  