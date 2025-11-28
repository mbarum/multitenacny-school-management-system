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

/**
 * Sends a welcome email with login credentials to a new parent user.
 * @param parentName The name of the parent.
 * @param parentEmail The email of the parent.
 * @param defaultPassword The default password for their new account.
 */
export const sendParentWelcomeEmail = async (parentName: string, parentEmail: string, defaultPassword: string): Promise<{ success: boolean; message: string }> => {
    const subject = "Welcome to the School Portal!";
    const body = `
        <p>Dear ${parentName},</p>
        <p>A parent portal account has been created for you. You can use these credentials to log in and view your child's information.</p>
        <ul>
            <li><strong>Username:</strong> ${parentEmail}</li>
            <li><strong>Password:</strong> ${defaultPassword}</li>
        </ul>
        <p>We strongly recommend that you change your password after your first login.</p>
        <p>Thank you,</p>
        <p>School Administration</p>
    `;
    return sendEmail({ to: parentEmail, subject, body });
};