import type { Expense, Transaction } from '../types';

/**
 * Generates a financial summary by calling a secure backend endpoint.
 * The backend is responsible for calling the Gemini API with the stored API key.
 * @param payments A list of payment transactions.
 * @param expenses A list of expense records.
 * @returns A promise that resolves with the AI-generated summary string.
 */
export const generateFinancialSummary = async (payments: Transaction[], expenses: Expense[]): Promise<string> => {
  try {
    // This request is proxied to our NestJS backend by vite.config.ts
    const response = await fetch('/api/ai/financial-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payments, expenses }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred on the server.'}));
        throw new Error(errorData.message || 'Failed to generate financial summary from the backend.');
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error generating financial summary via backend:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return `An error occurred while generating the financial summary: ${errorMessage}`;
  }
};
