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

/**
 * Sends an instant payment receipt and login credentials to a school subscriber upon M-Pesa or Card payment.
 */
export const sendSubscriptionReceiptEmail = async (params: {
    recipientEmail: string;
    schoolName: string;
    plan: string;
    billingCycle: string;
    amount: number;
    receiptNumber: string;
    transactionCode: string;
    paymentMethod: string;
    temporaryPassword?: string;
}): Promise<{ success: boolean; message: string }> => {
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
    const subject = `Official Payment Receipt & Portal Credentials - ${params.schoolName}`;
    const body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #047857; color: #ffffff; padding: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a7f3d0; font-weight: bold; margin-bottom: 4px;">Official Payment Confirmation</div>
                <h2 style="margin: 0; font-size: 22px; color: #ffffff;">Payment Verified & Account Activated</h2>
                <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">Welcome to SaasLink Technologies Education Cloud</p>
            </div>
            
            <div style="padding: 24px;">
                <p>Dear Administrator,</p>
                <p>We are delighted to confirm that your subscription payment for <strong>${params.schoolName}</strong> has been successfully processed and verified. Your institutional account is now <strong>INSTANTLY ACTIVE</strong>.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0;">
                    <div style="font-size: 13px; font-weight: bold; color: #047857; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Payment & Receipt Details</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 150px;">Receipt Number:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.receiptNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Transaction Code:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #047857;">${params.transactionCode}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Payment Method:</td>
                            <td style="padding: 6px 0; font-weight: 600;">${params.paymentMethod}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Plan & Cycle:</td>
                            <td style="padding: 6px 0; font-weight: 600;">${params.plan} (${params.billingCycle})</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #0f172a; font-size: 16px;">KES ${params.amount.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px; margin: 20px 0;">
                    <div style="font-size: 13px; font-weight: bold; color: #1d4ed8; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Your Lead Administrator Credentials</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 150px;">Login URL:</td>
                            <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">${loginUrl}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Login Email:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.recipientEmail}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Temporary Password:</td>
                            <td style="padding: 6px 0; font-family: monospace; font-weight: bold; font-size: 15px; color: #1e3a8a;">${params.temporaryPassword || 'Admin@2026'}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 14px; text-align: center;">
                        <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 14px;">Sign In to Portal</a>
                    </div>
                </div>

                <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
                    Need technical onboarding assistance? Contact our technical team on WhatsApp/Tel: <strong>+254 720 935 895</strong> or email <strong>billing@saaslink.com</strong>.
                </p>
                <p style="margin-top: 20px; font-size: 13px; color: #0f172a;">
                    Warm regards,<br/>
                    <strong>SaasLink Technologies Ltd - Cloud Operations & Billing</strong>
                </p>
            </div>
        </div>
    `;
    return sendEmail({ to: params.recipientEmail, subject, body });
};

/**
 * Sends proforma invoice and bank wire transfer instructions when subscriber chooses Wire Transfer.
 */
export const sendWireTransferInvoiceEmail = async (params: {
    recipientEmail: string;
    schoolName: string;
    contactName: string;
    plan: string;
    billingCycle: string;
    amount: number;
    invoiceNumber: string;
    wireDetails: {
        bankName: string;
        accountName: string;
        accountNumber: string;
        branch: string;
        swiftCode?: string;
    };
}): Promise<{ success: boolean; message: string }> => {
    const subject = `Subscription Request Received & Proforma Invoice ${params.invoiceNumber} - ${params.schoolName}`;
    const body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0f172a; color: #ffffff; padding: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #93c5fd; font-weight: bold; margin-bottom: 4px;">Official Proforma Invoice</div>
                <h2 style="margin: 0; font-size: 22px; color: #ffffff;">Subscription Request Submitted</h2>
                <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">SaasLink Technologies Ltd - Cloud Operations</p>
            </div>
            
            <div style="padding: 24px;">
                <p>Dear <strong>${params.contactName}</strong>,</p>
                
                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; margin: 16px 0;">
                    <strong style="color: #92400e; font-size: 14px;">Subscription request submitted. Wait for an activation email.</strong>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #b45309;">
                        We have recorded your institutional registration for <strong>${params.schoolName}</strong>. Please find your Proforma Invoice below. When payment is made as per the wire transfer details, our Super Administrator will verify and manually activate your account, and your initial login details will be dispatched immediately.
                    </p>
                </div>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                    <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Proforma Invoice Details</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 140px;">Invoice Number:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.invoiceNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Selected Plan:</td>
                            <td style="padding: 6px 0; font-weight: 600;">${params.plan} (${params.billingCycle})</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Amount Payable:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #0f172a; font-size: 16px;">KES ${params.amount.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                    <div style="font-size: 13px; font-weight: bold; color: #166534; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Official Wire Transfer Details (Super Admin)</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 5px 0; color: #166534; width: 140px;">Bank Name:</td>
                            <td style="padding: 5px 0; font-weight: bold; color: #0f172a;">${params.wireDetails.bankName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #166534;">Account Name:</td>
                            <td style="padding: 5px 0; font-weight: bold; color: #0f172a;">${params.wireDetails.accountName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #166534;">Account Number:</td>
                            <td style="padding: 5px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #047857;">${params.wireDetails.accountNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #166534;">Branch:</td>
                            <td style="padding: 5px 0; font-weight: 600;">${params.wireDetails.branch}</td>
                        </tr>
                        ${params.wireDetails.swiftCode ? `
                        <tr>
                            <td style="padding: 5px 0; color: #166534;">SWIFT / BIC Code:</td>
                            <td style="padding: 5px 0; font-family: monospace; font-weight: bold;">${params.wireDetails.swiftCode}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 5px 0; color: #166534;">Payment Reference:</td>
                            <td style="padding: 5px 0; font-weight: bold; color: #b91c1c;">${params.invoiceNumber}</td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 13px; color: #64748b;">
                    Once payment is sent, you can notify our billing department by sending the transfer slip to <strong>billing@saaslink.com</strong> or via WhatsApp at <strong>+254 720 935 895</strong> for instant manual verification.
                </p>
                <p style="margin-top: 20px; font-size: 13px; color: #0f172a;">
                    Warm regards,<br/>
                    <strong>SaasLink Technologies Ltd - Financial Administration</strong>
                </p>
            </div>
        </div>
    `;
    return sendEmail({ to: params.recipientEmail, subject, body });
};

/**
 * Sends initial login credentials and welcome instructions when Super Admin manually activates a wire-transfer school.
 */
export const sendSchoolActivationEmail = async (params: {
    recipientEmail: string;
    schoolName: string;
    plan: string;
    temporaryPassword: string;
    endDate?: string;
}): Promise<{ success: boolean; message: string }> => {
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
    const subject = `Account Activated - Official Login Credentials for ${params.schoolName}`;
    const body = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #2563eb; color: #ffffff; padding: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #bfdbfe; font-weight: bold; margin-bottom: 4px;">Institutional Activation Confirmed</div>
                <h2 style="margin: 0; font-size: 22px; color: #ffffff;">Your School Portal is Live & Activated</h2>
                <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">Wire transfer payment has been confirmed by our Super Administrator</p>
            </div>
            
            <div style="padding: 24px;">
                <p>Dear Administrator,</p>
                <p>We are pleased to inform you that your wire transfer payment for <strong>${params.schoolName}</strong> has been confirmed and verified. Your institutional account has been <strong>MANUALLY ACTIVATED</strong> by our Super Administrator.</p>
                
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                    <div style="font-size: 13px; font-weight: bold; color: #166534; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Your Official Access Credentials</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 150px;">Portal Web Address:</td>
                            <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">${loginUrl}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Administrator Email:</td>
                            <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${params.recipientEmail}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Initial Password:</td>
                            <td style="padding: 6px 0; font-family: monospace; font-weight: bold; font-size: 15px; color: #1e3a8a;">${params.temporaryPassword}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Provisioned Plan:</td>
                            <td style="padding: 6px 0; font-weight: 600; color: #047857;">${params.plan} Active License</td>
                        </tr>
                        ${params.endDate ? `
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Valid Until:</td>
                            <td style="padding: 6px 0; font-weight: 600;">${params.endDate}</td>
                        </tr>
                        ` : ''}
                    </table>
                    <div style="margin-top: 14px; text-align: center;">
                        <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 14px;">Access Portal Now</a>
                    </div>
                </div>

                <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
                    We recommend changing your initial password upon your first login. For any setup assistance or staff training, contact our onboarding team at <strong>+254 720 935 895</strong>.
                </p>
                <p style="margin-top: 20px; font-size: 13px; color: #0f172a;">
                    Warm regards,<br/>
                    <strong>Platform Super Administrator & SaasLink Operations</strong>
                </p>
            </div>
        </div>
    `;
    return sendEmail({ to: params.recipientEmail, subject, body });
};