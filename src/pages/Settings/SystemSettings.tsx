import React, { useState } from 'react';

const SystemSettings: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [fiscalYearEnd, setFiscalYearEnd] = useState('');
  const [currency, setCurrency] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add system settings update logic here
    console.log('System Settings Update:', { companyName, fiscalYearEnd, currency });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-secondary-800">System Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-secondary-700">Company Name</label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="fiscalYearEnd" className="block text-sm font-medium text-secondary-700">Fiscal Year End</label>
            <input
              type="date"
              id="fiscalYearEnd"
              value={fiscalYearEnd}
              onChange={(e) => setFiscalYearEnd(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-secondary-700">Default Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select Currency</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Update System Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;

