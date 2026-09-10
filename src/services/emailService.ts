// services/emailService.ts
import * as api from './api';

/**
 * Sends an email by making an API call to the backend server.
 * @param payload The email details.
 * @returns A promise that resolves with the server's response.
 */
export const sendEmail = async (payload: { to: string | string[], subject: string, body: string }): Promise<{ success: boolean; message: string }> => {
    try {
        return await api.sendEmail(payload);
    } catch {
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
    }
};


/**
 * Sends a password reset email via the backend.
 * @param email The recipient's email address.
 */
export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
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
 * Sends a welcome email with login credentials to a new parent/guardian user upon enrollment.
 * @param parentName The name of the parent.
 * @param parentEmail The email of the parent.
 * @param defaultPassword The default password for their new account.
 * @param studentName The student who was just enrolled.
 */
export const sendParentWelcomeEmail = async (
    parentName: string, 
    parentEmail: string, 
    defaultPassword: string = 'Parent@2026',
    studentName?: string
): Promise<{ success: boolean; message: string }> => {
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
    const subject = studentName 
        ? `Parent Portal Credentials for ${studentName}`
        : "Welcome to the School Portal - Parent Credentials";
    const body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4f46e5; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; font-size: 20px;">Welcome to the Parent Portal</h2>
                <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Instant access to student performance, attendance & finances</p>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background-color: #ffffff;">
                <p>Dear <strong>${parentName}</strong>,</p>
                <p>We are pleased to confirm the formal enrollment of <strong>${studentName || 'your scholar'}</strong> in the institutional registry. An active Parent / Guardian account has been provisioned for you.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #0f172a;">Your Secure Login Credentials:</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 140px;">Portal Web Address:</td>
                            <td style="padding: 6px 0; font-weight: 600;"><a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Username / Email:</td>
                            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${parentEmail}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Default Password:</td>
                            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${defaultPassword}</td>
                        </tr>
                    </table>
                </div>
                <p><strong>What you can access in your portal:</strong></p>
                <ul style="color: #334155; padding-left: 20px; font-size: 14px;">
                    <li>Instant live term fee balances and M-Pesa / Card payment statements.</li>
                    <li>Digital end-of-term report cards & continuous academic assessments.</li>
                    <li>Daily attendance tracking and institutional announcements.</li>
                </ul>
                <p style="font-size: 13px; color: #64748b; margin-top: 24px;">For security reasons, we advise changing your temporary password immediately upon your first sign-in.</p>
                <p style="margin-top: 20px; font-size: 14px;">Warm regards,<br/><strong>Institutional Admissions & Administration</strong></p>
            </div>
        </div>
    `;
    return sendEmail({ to: parentEmail, subject, body });
};