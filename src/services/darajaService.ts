export interface StkPushSuccessResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

/**
 * Formats Kenyan phone numbers to the required 254XXXXXXXXX format.
 */
export const formatPhoneNumber = (phone: string): string | null => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
    if ((cleaned.startsWith('07') || cleaned.startsWith('01')) && cleaned.length === 10) return `254${cleaned.substring(1)}`;
    if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) return `254${cleaned}`;
    return null;
};

/**
 * Initiates an M-Pesa STK Push via the backend.
 * 
 * @param amount Total KES amount
 * @param phoneNumber Payer's phone number
 * @param accountReference The account identifier (e.g., Admission Number)
 * @param type 'SUBSCRIPTION' for platform revenue or 'FEES' for school revenue
 */
export const initiateSTKPush = async (
    amount: number, 
    phoneNumber: string, 
    accountReference: string,
    type: 'SUBSCRIPTION' | 'FEES' = 'FEES'
): Promise<StkPushSuccessResponse> => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        throw new Error(`Invalid Safaricom number: ${phoneNumber}. Please use 07XXXXXXXX format.`);
    }
    
    if (amount < 1) {
        throw new Error("Transaction amount must be at least KES 1.");
    }

    // Determine the correct endpoint based on payment context
    const endpoint = type === 'SUBSCRIPTION' ? '/api/super-admin/payments/stk-push' : '/api/mpesa/stk-push';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
            amount: Math.round(amount),
            phone: formattedPhone,
            accountReference: accountReference.substring(0, 12), // Safaricom limit
            description: type === 'SUBSCRIPTION' ? 'Saaslink License' : 'School Fee Payment'
        }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.message || 'The M-Pesa gateway rejected the request. Please check your credentials.');
    }

    return responseData;
};