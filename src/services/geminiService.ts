
import type { Expense, Transaction } from '../types';

/**
 * Generates a financial summary by calling a secure backend endpoint.
 * The backend now fetches the data directly from the database.
 * @returns A promise that resolves with the AI-generated summary string.
 */
export const generateFinancialSummary = async (payments?: Transaction[], expenses?: Expense[]): Promise<string> => {
  try {
    const response = await fetch('/api/ai/financial-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({}), // No data payload needed
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
