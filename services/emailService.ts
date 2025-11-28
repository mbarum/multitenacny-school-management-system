// services/emailService.ts

/**
 * Sends an email by making an API call to the backend server.
 * @param payload The email details.
 * @returns A promise that resolves with the server's response.
 */
const sendEmail = async (payload: { to: string | string[], subject: string, body: string }): Promise<{ success: boolean; message: string }> => {
    const response = await fetch('/api/communications/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send email.');
    }
    return responseData;
};


/**
 * Sends a password reset email via the backend.
 * @param email The recipient's email address.
 */
export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    // The backend handles the token generation and email template.
    // The frontend just needs to tell the backend which user needs a reset.
    const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    
    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.message || 'Failed to request password reset.');
    }
    return responseData;
};

/**
 * Sends a bulk email to multiple recipients via the backend.
 * @param recipients An array of email addresses.
 * @param subject The email subject.
 * @param message The email body content (plain text).
 */
export const sendBulkEmail = async (recipients: string[], subject: string, message: string): Promise<{ success: boolean; message: string }> => {
    const body = `<p>${message.replace(/\n/g, '<br>')}</p>`;
    return sendEmail({ to: recipients, subject, body });
};
