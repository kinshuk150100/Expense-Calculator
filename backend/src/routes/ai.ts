import { Router, type Request, type Response } from 'express';
import { validateExpensesArray } from '../middleware/validation.js';
import { aiService } from '../services/aiService.js';
import type { ApiResponse, Expense, AIInsightsResponse } from '@splitwise/shared';

const router = Router();

/**
 * POST /ai/insights
 * 
 * Generates AI-powered insights from a list of expenses.
 * Uses OpenAI API if OPENAI_API_KEY is set, otherwise returns mock insights.
 * 
 * Request body:
 * {
 *   "expenses": [
 *     {
 *       "id": "string",
 *       "amount": number,
 *       "category": "string",
 *       "note": "string",
 *       "date": "string (ISO)",
 *       "createdAt": "string (ISO)"
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "insights": [
 *       {
 *         "type": "overspending" | "savings_suggestion" | "trend" | "recommendation",
 *         "category": "string (optional)",
 *         "title": "string",
 *         "description": "string",
 *         "severity": "low" | "medium" | "high" (optional)
 *       }
 *     ],
 *     "summary": "string",
 *     "generatedAt": "string (ISO)"
 *   }
 * }
 */
router.post('/insights', validateExpensesArray, async (req: Request, res: Response) => {
  try {
    const { expenses } = req.body as { expenses: Expense[] };

    // Generate AI insights
    const insights = await aiService.generateInsights(expenses);

    const response: ApiResponse<AIInsightsResponse> = {
      success: true,
      data: insights,
      message: aiService.isAvailable() 
        ? 'AI insights generated successfully' 
        : 'Mock insights generated (OpenAI API key not configured)'
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insights'
    };
    res.status(500).json(response);
  }
});

export default router;


