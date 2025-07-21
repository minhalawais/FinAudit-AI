import React, { useState } from 'react';
import { Zap, Copy, Clock, CheckCircle } from 'lucide-react';

const DocumentAutomation: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState('');

  const automationTasks = [
    { id: '1', name: 'Invoice Processing' },
    { id: '2', name: 'Contract Review' },
    { id: '3', name: 'Expense Report Generation' },
  ];

  const taskResults = {
    taskName: 'Invoice Processing',
    status: 'Completed',
    processedDocuments: 50,
    timeElapsed: '00:05:23',
    accuracy: '98.5%',
    keyFindings: [
      'Total invoice amount: $157,892.45',
      '3 invoices flagged for review',
      'Largest invoice: $42,500.00 from Supplier XYZ'
    ]
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-secondary-800">Document Automation</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-secondary-800">Select Automation Task</h2>
        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="w-full p-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Choose a task</option>
          {automationTasks.map((task) => (
            <option key={task.id} value={task.id}>{task.name}</option>
          ))}
        </select>
      </div>
      {selectedTask && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-secondary-800 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-primary-600" />
              Task Overview
            </h2>
            <p><strong>Task:</strong> {taskResults.taskName}</p>
            <p><strong>Status:</strong> <span className="text-green-600">{taskResults.status}</span></p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-secondary-600">Processed</p>
                <p className="text-lg font-semibold">{taskResults.processedDocuments}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Time Elapsed</p>
                <p className="text-lg font-semibold">{taskResults.timeElapsed}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Accuracy</p>
                <p className="text-lg font-semibold">{taskResults.accuracy}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-secondary-800 flex items-center">
              <Copy className="w-6 h-6 mr-2 text-primary-600" />
              Key Findings
            </h2>
            <ul className="list-disc list-inside">
              {taskResults.keyFindings.map((finding, index) => (
                <li key={index} className="text-secondary-600 mb-2">{finding}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
            <h2 className="text-xl font-semibold mb-4 text-secondary-800 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-primary-600" />
              Automation Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Task Initiated</p>
                  <p className="text-sm text-secondary-600">10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Document Processing</p>
                  <p className="text-sm text-secondary-600">10:02 AM - 10:04 AM</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Data Extraction</p>
                  <p className="text-sm text-secondary-600">10:04 AM - 10:05 AM</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Task Completed</p>
                  <p className="text-sm text-secondary-600">10:05 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAutomation;