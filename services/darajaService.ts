import type { DarajaSettings } from '../types';

export interface StkPushSuccessResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

export const formatPhoneNumber = (phone: string): string | null => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
    if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && cleaned.length === 10) return `254${cleaned.substring(1)}`;
    if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) return `254${cleaned}`;
    return null;
};

/**
 * Initiates an M-Pesa STK Push by calling the application's backend.
 * @param amount The amount to be paid.
 * @param phoneNumber The recipient's phone number.
 * @param accountReference A reference for the transaction, e.g., student admission number.
 * @returns A promise that resolves with the initial response from the backend.
 */
export const initiateSTKPush = async (
    amount: number, 
    phoneNumber: string, 
    accountReference: string
): Promise<StkPushSuccessResponse> => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        throw new Error(`Invalid phone number format: ${phoneNumber}. It must be a valid Safaricom number.`);
    }
    if (amount < 1) {
        throw new Error("Amount must be at least KES 1.");
    }

    // The frontend should NEVER have API keys. It calls its own backend, which securely holds the keys.
    const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Auth token would be sent automatically if using a shared fetch wrapper
        },
        body: JSON.stringify({
            amount,
            phone: formattedPhone,
            accountReference,
        }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.message || 'Failed to initiate STK Push.');
    }

    // The backend's response after successfully calling Daraja
    return responseData;
};
