import OpenAI from 'openai';
import type { Expense, AIInsightsResponse } from '@splitwise/shared';
import { logger } from '../utils/logger.js';

/**
 * AI Service for generating expense insights
 * Uses OpenAI API if available, otherwise returns mock data
 */
class AIService {
  private openai: OpenAI | null = null;
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    
    // Initialize OpenAI client if API key is available
    if (this.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
    }
  }

  /**
   * Check if OpenAI API is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Generate AI insights from expenses using OpenAI API
   */
  async generateInsights(expenses: Expense[]): Promise<AIInsightsResponse> {
    // If OpenAI is not available, return mock insights
    if (!this.openai) {
      return this.generateMockInsights(expenses);
    }

    try {
      return await this.generateOpenAIInsights(expenses);
    } catch (error) {
      logger.error('OpenAI API error', { error });
      // Fallback to mock insights on error
      logger.warn('Falling back to mock insights');
      return this.generateMockInsights(expenses);
    }
  }

  /**
   * Generate insights using OpenAI API
   */
  private async generateOpenAIInsights(expenses: Expense[]): Promise<AIInsightsResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    // Calculate category totals for context
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    for (const expense of expenses) {
      total += expense.amount;
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    }

    // Prepare expense summary for the prompt
    const expenseSummary = Object.entries(categoryTotals)
      .map(([category, amount]) => `- ${category}: ₹${amount.toFixed(2)}`)
      .join('\n');

    const prompt = `You are a financial advisor analyzing expense data. Analyze the following expenses and provide insights:

Total Expenses: ₹${total.toFixed(2)}
Category Breakdown:
${expenseSummary}

Number of expenses: ${expenses.length}

Please provide:
1. Overspending categories (categories where spending seems excessive)
2. Savings suggestions (practical ways to reduce expenses)
3. Any spending trends or patterns you notice
4. Recommendations for better financial management

Format your response as JSON with this structure:
{
  "insights": [
    {
      "type": "overspending" | "savings_suggestion" | "trend" | "recommendation",
      "category": "category name if applicable",
      "title": "Brief title",
      "description": "Detailed description",
      "severity": "low" | "medium" | "high" (for overspending)
    }
  ],
  "summary": "A brief overall summary of the spending patterns"
}

Be concise but helpful. Focus on actionable insights.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial advisor that provides clear, actionable insights about spending patterns. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(responseContent);
      return {
        insights: parsed.insights || [],
        summary: parsed.summary || 'No summary available',
        generatedAt: new Date().toISOString(),
      };
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response', { error: parseError });
      // Fallback to mock if parsing fails
      return this.generateMockInsights(expenses);
    }
  }

  /**
   * Generate mock insights when OpenAI is not available
   */
  private generateMockInsights(expenses: Expense[]): AIInsightsResponse {
    // Calculate category totals
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    for (const expense of expenses) {
      total += expense.amount;
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    }

    // Find the category with highest spending
    const topCategory = Object.entries(categoryTotals).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );

    const insights: AIInsightsResponse['insights'] = [];

    // Generate overspending insight if top category is significant
    if (topCategory[1] > total * 0.4) {
      insights.push({
        type: 'overspending',
        category: topCategory[0],
        title: `High spending in ${topCategory[0]}`,
        description: `You've spent ₹${topCategory[1].toFixed(2)} on ${topCategory[0]}, which is ${((topCategory[1] / total) * 100).toFixed(1)}% of your total expenses. Consider reviewing this category for potential savings.`,
        severity: topCategory[1] > total * 0.5 ? 'high' : 'medium',
      });
    }

    // Generate savings suggestions
    if (total > 0) {
      insights.push({
        type: 'savings_suggestion',
        title: 'Review recurring expenses',
        description: `Consider reviewing your recurring expenses. With a total of ₹${total.toFixed(2)} across ${expenses.length} expenses, you might find opportunities to consolidate or eliminate some recurring costs.`,
      });

      insights.push({
        type: 'savings_suggestion',
        title: 'Set category budgets',
        description: `Based on your spending patterns, consider setting monthly budgets for each category. This will help you track and control your expenses more effectively.`,
      });
    }

    // Generate trend insight
    if (expenses.length > 5) {
      insights.push({
        type: 'trend',
        title: 'Multiple expense entries detected',
        description: `You have ${expenses.length} expense entries. This shows active expense tracking. Continue monitoring your spending to identify patterns over time.`,
      });
    }

    // Generate recommendation
    insights.push({
      type: 'recommendation',
      title: 'Regular expense review',
      description: 'Review your expenses weekly or monthly to identify trends and opportunities for savings. Consistent tracking leads to better financial decisions.',
    });

    return {
      insights,
      summary: `Analyzed ${expenses.length} expenses totaling ₹${total.toFixed(2)}. ${insights.length} insights generated to help optimize your spending.`,
      generatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

