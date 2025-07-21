export const getDummyDocument = (id: string) => ({
  id,
  name: 'Q4 Financial Report 2025',
  type: 'PDF',
  size: '2.5 MB',
  url: 'https://www.rd.usda.gov/sites/default/files/pdf-sample_0.pdf', // Replace with actual PDF for testing
  uploadDate: '2025-03-15T10:30:00Z',
  author: 'John Doe',
  version: '1.2',
  status: 'Under Review',
  aiAnalysis: {
    keyInsights: [
      'Revenue increased by 15% compared to Q3',
      'Operating expenses reduced by 8%',
      'New product line contributed to 20% of total sales'
    ],
    sentiment: {
      positive: 65,
      neutral: 25,
      negative: 10
    },
    financialMetrics: {
      revenue: '$10.5M',
      expenses: '$7.2M',
      profit: '$3.3M',
      cashFlow: '$2.1M'
    }
  },
  annotations: [
    { id: 1, text: 'Please review the revenue projections on page 5', user: 'Alice Smith' },
    { id: 2, text: 'The expense breakdown looks good', user: 'Bob Johnson' }
  ],
  versions: [
    { id: 1, version: '1.0', date: '2025-03-10T09:00:00Z', changes: ['Initial draft'] },
    { id: 2, version: '1.1', date: '2025-03-12T14:30:00Z', changes: ['Updated financial figures', 'Added executive summary'] },
    { id: 3, version: '1.2', date: '2025-03-15T10:30:00Z', changes: ['Incorporated feedback from CFO', 'Finalized Q4 projections'] }
  ],
  relatedDocuments: [
    { id: '2', name: 'Q3 Financial Report 2025', type: 'PDF', size: '2.3 MB' },
    { id: '3', name: 'Annual Budget 2025', type: 'XLSX', size: '1.8 MB' },
    { id: '4', name: 'Q4 Sales Breakdown', type: 'PPTX', size: '3.1 MB' }
  ],
  activityLog: [
    { action: 'Document uploaded', user: 'John Doe', timestamp: '2025-03-15T10:30:00Z' },
    { action: 'Started review process', user: 'Alice Smith', timestamp: '2025-03-15T11:15:00Z' },
    { action: 'Added annotation', user: 'Bob Johnson', timestamp: '2025-03-15T14:45:00Z' },
    { action: 'Updated to version 1.2', user: 'John Doe', timestamp: '2025-03-15T16:30:00Z' }
  ]
});