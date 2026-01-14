'use client';

import type { AIInsight } from '@splitwise/shared';
import { INSIGHT_TYPE_ICONS, INSIGHT_TYPE_LABELS } from '@/constants';

interface InsightCardProps {
  insight: AIInsight;
  index: number;
}

/**
 * InsightCard Component
 * 
 * Displays a single AI insight with appropriate styling based on type and severity.
 * 
 * Features:
 * - Color-coded borders based on severity (high/medium/low)
 * - Type-specific icons and labels
 * - Category and severity badges
 * - Responsive layout
 * 
 * @example
 * ```tsx
 * <InsightCard insight={insight} index={0} />
 * ```
 */
export default function InsightCard({ insight, index }: InsightCardProps) {
  /**
   * Gets the icon for an insight type
   * Falls back to info icon if type not found
   */
  const getInsightIcon = (type: AIInsight['type']): string => {
    return INSIGHT_TYPE_ICONS[type] || 'ℹ️';
  };

  const getSeverityColor = (severity?: string): string => {
    switch (severity) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  /**
   * Gets the display label for an insight type
   */
  const getTypeLabel = (type: AIInsight['type']): string => {
    return INSIGHT_TYPE_LABELS[type] || 'Insight';
  };

  return (
    <div
      className={`border-l-4 rounded-r-lg p-5 ${getSeverityColor(
        insight.severity
      )} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">{getInsightIcon(insight.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-lg">{insight.title}</h3>
              <span className="px-2 py-1 bg-white bg-opacity-80 rounded text-xs font-medium text-gray-700">
                {getTypeLabel(insight.type)}
              </span>
            </div>
          </div>
          
          {insight.category && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-80 text-gray-700">
                📁 {insight.category}
              </span>
              {insight.severity && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                  insight.severity === 'high' ? 'bg-red-100 text-red-800' :
                  insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insight.severity === 'high' ? '🔴 High' :
                   insight.severity === 'medium' ? '🟡 Medium' :
                   '🟢 Low'}
                </span>
              )}
            </div>
          )}
          
          <p className="text-gray-700 text-sm leading-relaxed mt-2">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}

