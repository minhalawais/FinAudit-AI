import { Document } from './types.ts';

export const getDummyDocuments = (): Document[] => {
  const documentTypes = ['PDF', 'DOCX', 'XLSX', 'PPTX'];
  const statuses: ('Approved' | 'Pending' | 'Rejected')[] = ['Approved', 'Pending', 'Rejected'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `doc-${i + 1}`,
    name: `Document ${i + 1}`,
    type: documentTypes[Math.floor(Math.random() * documentTypes.length)],
    size: `${Math.floor(Math.random() * 10) + 1} MB`,
    uploadDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    content: `This is the content of Document ${i + 1}. It contains important financial information.`,
  }));
};

