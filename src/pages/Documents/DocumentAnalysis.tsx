import React, { useState } from 'react';
import { PieChart, Search, DollarSign, AlertCircle } from 'lucide-react';

const DocumentAnalysis: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState('');

  const documents = [
    { id: '1', name: 'Q4 Financial Report' },
    { id: '2', name: 'Employee Handbook' },
    { id: '3', name: 'Sales Projections' },
  ];

  const analysisResults = {
    documentType: 'Financial Report',
    keyInsights: [
      'Revenue increased by 15% compared to Q3',
      'Operating expenses reduced by 8%',
      'New product line contributed to 20% of total sales'
    ],
    sentimentAnalysis: {
      positive: 65,
      neutral: 25,
      negative: 10
    },
    financialMetrics: {
      revenue: '$10.5M',
      expenses: '$7.2M',
      profit: '$3.3M'
    },
    riskFactors: [
      'Market volatility',
      'Supply chain disruptions',
      'Regulatory changes'
    ]
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-secondary-800">Document Analysis</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-secondary-800">Select a Document</h2>
        <select
          value={selectedDocument}
          onChange={(e) => setSelectedDocument(e.target.value)}
          className="w-full p-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Choose a document</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>{doc.name}</option>
          ))}
        </select>
      </div>
      {selectedDocument && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-secondary-800 flex items-center">
              <Search className="w-6 h-6 mr-2 text-primary-600" />
              Document Overview
            </h2>
            <p><strong>Type:</strong> {analysisResults.documentType}</p>
            <h3 className="font-semibold mt-4 mb-2">Key Insights:</h3>
            <ul className="list-disc list-inside">
              {analysisResults.keyInsights.map((insight, index) => (
                <li key={index} className="text-secondary-600">{insight}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-secondary-800 flex items-center">
              <PieChart className="w-6 h-6 mr-2 text-primary-600" />
              Sentiment Analysis
            </h2>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysisResults.sentimentAnalysis.positive}%</div>
                <div className="text-sm text-secondary-600">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{analysisResults.sentimentAnalysis.neutral}%</div>
                <div className="text-sm text-secondary-600">Neutral</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analysisResults.sentimentAnalysis.negative}%</div>
                <div className="text-sm text-secondary-600">Negative</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-secondary-800 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-primary-600" />
              Financial Metrics
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-secondary-600">Revenue</p>
                <p className="text-lg font-semibold">{analysisResults.financialMetrics.revenue}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Expenses</p>
                <p className="text-lg font-semibold">{analysisResults.financialMetrics.expenses}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Profit</p>
                <p className="text-lg font-semibold">{analysisResults.financialMetrics.profit}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-secondary-800 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-primary-600" />
              Risk Factors
            </h2>
            <ul className="list-disc list-inside">
              {analysisResults.riskFactors.map((risk, index) => (
                <li key={index} className="text-secondary-600">{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysis;