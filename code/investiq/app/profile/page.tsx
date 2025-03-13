// app/profile/page.tsx
'use client';

import React, { useState } from 'react';
import { Target } from "lucide-react";

export default function Profile() {
  const [formData, setFormData] = useState({
    riskTolerance: '',
    budget: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.riskTolerance) {
      setError('Please select your risk tolerance');
      return;
    }

    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget < 0) {
      setError('Please enter a valid budget (must be positive)');
      return;
    }

    // Simulate successful save
    setSuccess(true);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Profile Setup</h2>
            <p className="text-gray-500">Configure your investment preferences</p>
          </div>
          <Target className="text-blue-600" size={24} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Tolerance
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.riskTolerance}
              onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
            >
              <option value="">Select Risk Level</option>
              <option value="low">Low - Conservative Growth</option>
              <option value="medium">Medium - Balanced Growth</option>
              <option value="high">High - Aggressive Growth</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your investment budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
              Profile saved successfully!
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}