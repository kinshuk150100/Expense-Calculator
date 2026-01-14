'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Expense, AIInsightsResponse } from '@splitwise/shared';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import InsightCard from './ui/InsightCard';

interface AIInsightsProps {
  expenses: Expense[];
  onGetInsights: (expenses: Expense[]) => Promise<AIInsightsResponse>;
}

export default function AIInsights({ expenses, onGetInsights }: AIInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);

  const handleGetInsights = async () => {
    if (expenses.length === 0) {
      toast.error('Please add some expenses first');
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      const result = await onGetInsights(expenses);
      setInsights(result);
      toast.success('AI insights generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI insights';
      toast.error(errorMessage);
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="gradient"
        onClick={handleGetInsights}
        isLoading={isLoading}
        disabled={expenses.length === 0}
        className="w-full py-3"
      >
        <span className="flex items-center justify-center gap-2">
          🤖 Get AI Insights
        </span>
      </Button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">AI Insights</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {isLoading && (
                <LoadingSpinner size="lg" text="Analyzing your expenses..." />
              )}

              {insights && !isLoading && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Summary</h3>
                        <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Insights List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Insights ({insights.insights.length})
                    </h3>
                    {insights.insights.map((insight, index) => (
                      <InsightCard key={index} insight={insight} index={index} />
                    ))}
                  </div>

                  {/* Generated At */}
                  <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
                    Generated at: {new Date(insights.generatedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

