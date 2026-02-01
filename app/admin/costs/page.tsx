'use client';

import { useState, useEffect } from 'react';

interface CostSummary {
  period: string;
  total_cost: number;
  services: Array<{
    service: string;
    total_cost: number;
    request_count: number;
    avg_cost_per_request: number;
  }>;
  budget_limit: number;
  budget_remaining: number;
  budget_percentage: number;
}

interface DailyCost {
  date: string;
  service: string;
  total_cost: number;
  request_count: number;
}

export default function CostsPage() {
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'daily'>('week');

  useEffect(() => {
    fetchCosts();
  }, [period]);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/costs?period=${period}`);
      const data = await response.json();
      
      if (period === 'week') {
        setCosts(data);
      } else {
        setCosts({
          period: 'daily',
          total_cost: data.total_cost,
          services: [],
          budget_limit: data.budget_limit,
          budget_remaining: data.budget_remaining,
          budget_percentage: data.budget_percentage,
        });
        setDailyCosts(data.daily_breakdown || []);
      }
    } catch (error) {
      console.error('Error fetching costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const getServiceColor = (service: string) => {
    const colors: Record<string, string> = {
      'gemini': 'bg-blue-100 text-blue-800',
      'google-maps': 'bg-green-100 text-green-800',
      'youtube': 'bg-red-100 text-red-800',
      'open-meteo': 'bg-gray-100 text-gray-800',
      'rss': 'bg-purple-100 text-purple-800',
    };
    return colors[service] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💰</div>
            <p className="text-gray-600">Loading cost data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!costs) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-gray-600">Failed to load cost data</p>
          </div>
        </div>
      </div>
    );
  }

  const isOverBudget = costs.budget_percentage >= 100;
  const isWarning = costs.budget_percentage >= 80;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">API Costs Dashboard</h1>
          <p className="text-lg text-gray-600">
            Track your API spending to stay under budget
          </p>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Weekly Budget</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  period === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod('daily')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  period === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Spent</div>
              <div className={`text-3xl font-bold ${
                isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-900'
              }`}>
                {formatCurrency(costs.total_cost)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Budget Limit</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(costs.budget_limit)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Remaining</div>
              <div className={`text-3xl font-bold ${
                costs.budget_remaining < 4 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(costs.budget_remaining)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Usage</div>
              <div className="text-3xl font-bold text-gray-900">
                {costs.budget_percentage.toFixed(1)}%
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isOverBudget
                      ? 'bg-red-600'
                      : isWarning
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, costs.budget_percentage)}%` }}
                />
              </div>
            </div>
          </div>

          {isOverBudget && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">
                ⚠️ Over Budget! You've exceeded your weekly limit of ${costs.budget_limit}.
              </p>
            </div>
          )}

          {isWarning && !isOverBudget && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-semibold">
                ⚠️ Warning: You're at {costs.budget_percentage.toFixed(1)}% of your weekly budget.
              </p>
            </div>
          )}
        </div>

        {/* Service Breakdown */}
        {period === 'week' && costs.services && costs.services.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cost by Service</h2>
            <div className="space-y-4">
              {costs.services.map((service) => (
                <div
                  key={service.service}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getServiceColor(service.service)}`}>
                      {service.service}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(service.total_cost)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {service.request_count.toLocaleString()} requests
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Avg per request</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(service.avg_cost_per_request)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Breakdown */}
        {period === 'daily' && dailyCosts.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Daily Breakdown</h2>
            <div className="space-y-2">
              {dailyCosts.map((item, index) => (
                <div
                  key={`${item.date}-${item.service}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-24">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getServiceColor(item.service)}`}>
                      {item.service}
                    </span>
                    <div className="text-sm text-gray-600">
                      {item.request_count} requests
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(item.total_cost)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Cost Tracking Info</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Costs are tracked automatically for all API calls</li>
            <li>• Gemini: ~$0.0001 per 1K input tokens, ~$0.0004 per 1K output tokens</li>
            <li>• Google Maps: $0.017 per Nearby Search, $0.005 per Directions request</li>
            <li>• YouTube: Free tier (essentially $0 for low usage)</li>
            <li>• Open-Meteo & RSS: Free</li>
            <li>• Budget resets weekly (Monday)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
