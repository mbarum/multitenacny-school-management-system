import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import {
    initialSchoolInfo, initialPricing, initialUsers, initialStudents,
    initialClasses, initialSubjects, initialAssignments, initialTimetable,
    initialExams, initialGrades, initialAttendance, initialStaff,
    initialPayrollItems, initialPayrollHistory, initialTransactions,
    initialExpenses, initialAnnouncements, initialCommunicationLogs,
    initialGradingRules, initialFeeStructure, initialDarajaSettings, initialBooks,
    initialSchools, initialSaasInvoices, initialSaasReceipts,
    initialLmsAssignments, initialLmsSubmissions, initialLmsLiveClasses,
    initialEdTechArticles
} from '../data/mockData';
import { EXCHANGE_RATES } from '../utils/currency';
import { SubscriptionPlan, SubscriptionStatus, CommunicationType, Role, User } from '../types';
import { 
    sendProductionEmail, 
    getSmtpConfig, 
    verifySmtpConnection, 
    updateEnvSmtpConfig 
} from './emailTransporter';

// In-memory store for active password reset tokens: email -> { token, code, expiresAt }
const passwordResetTokens = new Map<string, { token: string; code: string; expiresAt: number }>();

const MEDIA_BASE_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload subdirectories exist for media
function ensureUploadDirs() {
    const subdirs = ['staff', 'students', 'users', 'logos', 'receipts', 'documents', 'media'];
    subdirs.forEach(sub => {
        const p = path.join(MEDIA_BASE_DIR, sub);
        if (!fs.existsSync(p)) {
            try {
                fs.mkdirSync(p, { recursive: true });
            } catch (err) {
                console.warn(`Could not create directory ${p}`, err);
            }
        }
    });
}
ensureUploadDirs();

function saveUploadedMedia(category: string, dataUrlOrBuffer: string | Buffer, originalFilename?: string): string {
    try {
        ensureUploadDirs();
        const targetDir = path.join(MEDIA_BASE_DIR, category);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        let buffer: Buffer;
        let ext = 'webp';

        if (typeof dataUrlOrBuffer === 'string') {
            if (dataUrlOrBuffer.startsWith('data:image/')) {
                const match = dataUrlOrBuffer.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
                if (match) {
                    ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                    buffer = Buffer.from(match[2], 'base64');
                } else {
                    return dataUrlOrBuffer;
                }
            } else if (dataUrlOrBuffer.startsWith('/public/uploads/') || dataUrlOrBuffer.startsWith('http')) {
                return dataUrlOrBuffer;
            } else {
                buffer = Buffer.from(dataUrlOrBuffer, 'base64');
            }
        } else if (Buffer.isBuffer(dataUrlOrBuffer)) {
            buffer = dataUrlOrBuffer;
            if (originalFilename) {
                const parsedExt = path.extname(originalFilename).replace(/^\./, '').toLowerCase();
                if (parsedExt) ext = parsedExt;
            }
        } else {
            return `/public/uploads/${category}/default.png`;
        }

        const safeFilename = `${category}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = path.join(targetDir, safeFilename);
        fs.writeFileSync(filePath, buffer);
        
        return `/public/uploads/${category}/${safeFilename}`;
    } catch (err) {
        console.error(`Failed to save media upload for ${category}:`, err);
        return typeof dataUrlOrBuffer === 'string' && dataUrlOrBuffer.startsWith('http') 
            ? dataUrlOrBuffer 
            : `/public/uploads/${category}/fallback.png`;
    }
}

export function viteApiPlugin(options?: { disabled?: boolean }): Plugin {
    // In-memory data store for dev server API
    let schoolInfo = { ...initialSchoolInfo };
    let pricing = { ...initialPricing };
    let users = [...initialUsers];
    let students = [...initialStudents];
    let classes = [...initialClasses];
    let subjects = [...initialSubjects];
    let assignments = [...initialAssignments];
    let timetable = [...initialTimetable];
    let exams = [...initialExams];
    let grades = [...initialGrades];
    let attendance = [...initialAttendance];
    let staff = [...initialStaff];
    let payrollItems = [...initialPayrollItems];
    let payrollHistory = [...initialPayrollHistory];
    let transactions = [...initialTransactions];
    let expenses = [...initialExpenses];
    let announcements = [...initialAnnouncements];
    let communicationLogs = [...initialCommunicationLogs];
    let gradingRules = [...initialGradingRules];
    let feeStructure = [...initialFeeStructure];
    let darajaSettings = { ...initialDarajaSettings };
    let books = [...initialBooks];
    let schools = [...initialSchools];
    let saasInvoices = [...initialSaasInvoices];
    let saasReceipts = [...initialSaasReceipts];
    let lmsAssignments = [...initialLmsAssignments];
    let lmsSubmissions = [...initialLmsSubmissions];
    let lmsLiveClasses = [...initialLmsLiveClasses];
    let edTechArticles = [...initialEdTechArticles];

    return {
        name: 'saaslink-mock-api-plugin',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (options?.disabled) {
                    return next();
                }

                const url = req.url || '';

                if (!url.startsWith('/api')) {
                    if (url.startsWith('/public/uploads/') || url.startsWith('/uploads/') || url.startsWith('/media/')) {
                        let cleanUrl = url.split('?')[0];
                        if (cleanUrl.startsWith('/uploads/')) {
                            cleanUrl = '/public' + cleanUrl;
                        } else if (cleanUrl.startsWith('/media/')) {
                            cleanUrl = '/public/uploads/media/' + cleanUrl.replace(/^\/media\/?/, '');
                        }
                        const localPath = path.join(process.cwd(), cleanUrl.replace(/^\//, ''));
                        const serverLocalPath = path.join(process.cwd(), 'server', cleanUrl.replace(/^\//, ''));
                        const fsPath = (fs.existsSync(localPath) && !fs.statSync(localPath).isDirectory()) ? localPath : 
                                       ((fs.existsSync(serverLocalPath) && !fs.statSync(serverLocalPath).isDirectory()) ? serverLocalPath : null);
                        if (fsPath) {
                            const ext = path.extname(fsPath).toLowerCase();
                            const mimeMap: Record<string, string> = {
                                '.png': 'image/png',
                                '.jpg': 'image/jpeg',
                                '.jpeg': 'image/jpeg',
                                '.webp': 'image/webp',
                                '.gif': 'image/gif',
                                '.svg': 'image/svg+xml',
                                '.pdf': 'application/pdf',
                                '.csv': 'text/csv'
                            };
                            res.writeHead(200, {
                                'Content-Type': mimeMap[ext] || 'application/octet-stream',
                                'Cache-Control': 'public, max-age=86400'
                            });
                            return fs.createReadStream(fsPath).pipe(res);
                        }
                    }
                    return next();
                }

                // Helper to read request body
                const readBody = (callback: (body: any) => void) => {
                    let data = '';
                    req.on('data', chunk => { data += chunk; });
                    req.on('end', () => {
                        try {
                            callback(data ? JSON.parse(data) : {});
                        } catch {
                            // Support multipart boundary extraction of dataUrl
                            const result: any = {};
                            const dataUrlMatch = data.match(/name="dataUrl"[\r\n\s]+(data:image\/[^\r\n]+)/);
                            if (dataUrlMatch && dataUrlMatch[1]) {
                                result.dataUrl = dataUrlMatch[1].trim();
                            }
                            const filenameMatch = data.match(/filename="([^"]+)"/);
                            if (filenameMatch) {
                                result.filename = filenameMatch[1];
                            }
                            callback(result);
                        }
                    });
                };

                const sendJson = (statusCode: number, data: any) => {
                    res.writeHead(statusCode, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                    });
                    res.end(JSON.stringify(data));
                };

                if (req.method === 'OPTIONS') {
                    res.writeHead(204, {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                    });
                    res.end();
                    return;
                }

                const path = url.split('?')[0];

                // Public endpoints
                if (path === '/api/settings/public/rates') {
                    sendJson(200, EXCHANGE_RATES);
                    return;
                }

                if (path === '/api/settings/public/pricing') {
                    sendJson(200, pricing);
                    return;
                }

                if (path === '/api/settings/public/school-info') {
                    sendJson(200, schoolInfo);
                    return;
                }

                // Auth
                if (path === '/api/auth/me') {
                    const authHeader = req.headers['authorization'] || '';
                    const token = authHeader.replace('Bearer ', '').trim();
                    if (!token || token === 'null' || token === 'undefined') {
                        sendJson(401, { message: 'Unauthorized' });
                        return;
                    }
                    const user = users.find(u => u.id === token);
                    if (!user) {
                        sendJson(401, { message: 'Session expired or user not found' });
                        return;
                    }
                    sendJson(200, user);
                    return;
                }

                if (path === '/api/auth/login') {
                    readBody(body => {
                        const email = (body.email || '').toLowerCase().trim();
                        const password = (body.password || '').trim();

                        if (!email || !password) {
                            sendJson(400, { message: 'Please enter both your email address and password.' });
                            return;
                        }

                        const user = users.find(u => u.email.toLowerCase() === email);

                        // Strictly reject non-existent users
                        if (!user) {
                            sendJson(401, { message: 'Invalid email or password. Please verify your credentials and try again.' });
                            return;
                        }

                        // Strictly verify password against user's specific stored password (no backdoor passwords)
                        const validPassword = user.password;
                        const isPasswordValid = validPassword && password === validPassword;
                        if (!isPasswordValid) {
                            sendJson(401, { message: 'Invalid email or password. Please verify your credentials and try again.' });
                            return;
                        }

                        if (user.status === 'Disabled') {
                            sendJson(403, { message: 'Your account has been disabled. Please contact the system administrator.' });
                            return;
                        }

                        sendJson(200, {
                            user,
                            token: user.id
                        });
                    });
                    return;
                }

                if (path === '/api/auth/logout') {
                    sendJson(200, { success: true });
                    return;
                }

                if (path === '/api/auth/request-password-reset') {
                    if (req.method === 'POST') {
                        readBody(async body => {
                            const email = (body.email || '').toLowerCase().trim();
                            if (!email) {
                                sendJson(400, { success: false, message: 'Email address is required.' });
                                return;
                            }

                            const existingUser = users.find(u => u.email.toLowerCase() === email);
                            const userRecipientName = existingUser ? existingUser.name : 'SaasLink User';
                            
                            // Generate 6-digit numeric verification code and secure token
                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                            const token = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                            const expiresAt = Date.now() + 60 * 60 * 1000; // 60 minutes
                            
                            passwordResetTokens.set(email, { token, code, expiresAt });

                            const smtpConfig = getSmtpConfig();
                            const emailHtml = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                                    <div style="text-align: center; margin-bottom: 24px;">
                                        <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">SAASLINK SCHOOL MANAGEMENT</h2>
                                        <p style="color: #64748b; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Security & Account Authentication</p>
                                    </div>
                                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                        <p style="margin: 0 0 12px 0; color: #1e293b; font-size: 14px;">Hello <strong>${userRecipientName}</strong>,</p>
                                        <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.5;">
                                            A request was made to reset the password for your account associated with <strong>${email}</strong>. 
                                            Use the verification code below to authorize your password update:
                                        </p>
                                        <div style="text-align: center; margin: 24px 0;">
                                            <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 6px; padding: 12px 32px; border-radius: 8px; font-family: monospace;">${code}</span>
                                        </div>
                                        <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                                            This verification code will expire in <strong>60 minutes</strong>.
                                        </p>
                                    </div>
                                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                                        If you did not request this password reset, no action is needed; your credentials remain secure.
                                    </p>
                                </div>
                            `;

                            // Attempt delivery through the configured production SMTP transport
                            const emailResult = await sendProductionEmail({
                                to: email,
                                subject: 'SaasLink Password Reset Code: ' + code,
                                html: emailHtml
                            });

                            const newLog = {
                                id: `log-${Date.now()}`,
                                recipient: email,
                                channel: 'Email',
                                message: `[Password Reset] Code dispatched to ${email}`,
                                status: emailResult.success ? 'Delivered' : 'Failed',
                                timestamp: new Date().toISOString()
                            };
                            communicationLogs.unshift(newLog);

                            sendJson(200, {
                                success: true,
                                message: emailResult.success
                                    ? `Password reset code sent to ${email}.`
                                    : `Password reset request generated. Delivery note: ${emailResult.message}`,
                                emailDelivered: emailResult.success,
                                token: token,
                                code: code
                            });
                        });
                        return;
                    }
                }

                if (path === '/api/auth/reset-password') {
                    if (req.method === 'POST') {
                        readBody(async body => {
                            const email = (body.email || '').toLowerCase().trim();
                            const tokenOrCode = (body.code || body.token || '').trim();
                            const newPassword = (body.newPassword || '').trim();

                            if (!email || !tokenOrCode || !newPassword) {
                                sendJson(400, { success: false, message: 'Email, verification code/token, and new password are required.' });
                                return;
                            }

                            const record = passwordResetTokens.get(email);
                            if (!record || (record.token !== tokenOrCode && record.code !== tokenOrCode)) {
                                sendJson(400, { success: false, message: 'Invalid or expired verification code.' });
                                return;
                            }

                            if (Date.now() > record.expiresAt) {
                                passwordResetTokens.delete(email);
                                sendJson(400, { success: false, message: 'Verification code has expired. Please request a new one.' });
                                return;
                            }

                            // Update user password in active users list
                            const targetUser = users.find(u => u.email.toLowerCase() === email);
                            if (targetUser) {
                                targetUser.password = newPassword;
                            }
                            passwordResetTokens.delete(email);

                            // Send confirmation email
                            await sendProductionEmail({
                                to: email,
                                subject: 'Your SaasLink Password Has Been Reset',
                                html: `
                                    <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                        <h3 style="color: #0f172a;">Password Successfully Updated</h3>
                                        <p style="color: #334155;">Your account password for <strong>${email}</strong> has been updated successfully. You can now log in with your new credentials.</p>
                                        <p style="color: #64748b; font-size: 12px;">If you did not perform this change, please immediately contact your school super administrator.</p>
                                    </div>
                                `
                            });

                            sendJson(200, { success: true, message: 'Password has been successfully updated.' });
                        });
                        return;
                    }
                }

                if (path === '/api/auth/register-school') {
                    readBody(body => {
                        const schoolId = `school-${Date.now()}`;
                        const isWire = body.paymentMethod === 'WIRE';
                        const isFree = body.plan === SubscriptionPlan.FREE;
                        const plan = (body.plan || SubscriptionPlan.BASIC) as SubscriptionPlan;
                        const cycle = (body.billingCycle === 'ANNUALLY' ? 'ANNUALLY' : 'MONTHLY') as 'ANNUALLY' | 'MONTHLY';
                        
                        const newSchool = {
                            ...schoolInfo,
                            id: schoolId,
                            name: body.schoolName || schoolInfo.name,
                            slug: (body.schoolName || 'school').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                            schoolCode: (body.schoolName || 'SCH').substring(0, 3).toUpperCase(),
                            email: body.adminEmail || body.email || schoolInfo.email,
                            phone: body.phone || schoolInfo.phone,
                            address: body.address || 'Nairobi, Kenya',
                            plan: plan,
                            subscriptionStatus: isWire ? SubscriptionStatus.PENDING_APPROVAL : (isFree ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE),
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date(Date.now() + (cycle === 'ANNUALLY' ? 365 : 30) * 86400000).toISOString().split('T')[0],
                            studentCount: Number(body.studentCount) || 50,
                            staffCount: 10,
                            billingCycle: cycle,
                            paymentMethod: body.paymentMethod || (isFree ? 'FREE' : 'MPESA'),
                            invoiceNumber: body.invoiceNumber || (isWire ? `INV-SAAS-${new Date().getFullYear()}-${String(saasInvoices.length + 1).padStart(3, '0')}` : undefined),
                            temporaryPassword: body.password || 'Admin@2026',
                            adminName: body.adminName,
                            remindersCount: 0
                        };

                        const newUser = {
                            id: `user-${Date.now()}`,
                            name: body.adminName || 'School Admin',
                            email: body.adminEmail || body.email || 'admin@school.com',
                            role: 'Admin' as any,
                            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
                            status: 'Active' as const,
                            schoolId: newSchool.id
                        };
                        users.push(newUser);
                        schoolInfo = newSchool;

                        // Add to subscribers directory
                        schools.unshift(newSchool as any);

                        // If wire transfer, create issued proforma invoice and log email
                        if (isWire) {
                            const planAnnual = plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumAnnualPrice || 60000) : (pricing?.basicAnnualPrice || 30000);
                            const planMonthly = plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumMonthlyPrice || 6000) : (pricing?.basicMonthlyPrice || 3000);
                            const baseAmount = cycle === 'ANNUALLY' ? planAnnual : planMonthly;
                            const totalAmount = baseAmount + Math.round(baseAmount * 0.16);

                            const newInv = {
                                id: `inv-saas-${Date.now()}`,
                                invoiceNumber: newSchool.invoiceNumber || `INV-SAAS-${new Date().getFullYear()}-${String(saasInvoices.length + 1).padStart(3, '0')}`,
                                schoolId: newSchool.id,
                                schoolName: newSchool.name,
                                schoolCode: newSchool.schoolCode,
                                recipientEmail: newSchool.email,
                                recipientPhone: newSchool.phone,
                                plan: newSchool.plan,
                                billingCycle: newSchool.billingCycle,
                                amount: totalAmount,
                                currency: 'KES',
                                issueDate: new Date().toISOString().split('T')[0],
                                dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                                status: 'ISSUED',
                                paymentMethod: 'Bank Wire',
                                notes: 'Subscription application submitted via Bank Wire. Awaiting manual payment confirmation from Super Administrator.'
                            };
                            saasInvoices.unshift(newInv as any);

                            // Email notification log for Wire Transfer Proforma Invoice
                            const wireSubject = `Subscription Request Received & Proforma Invoice ${newInv.invoiceNumber} - ${newSchool.name}`;
                            communicationLogs.unshift({
                                id: `log-${Date.now()}`,
                                studentId: newSchool.id,
                                type: CommunicationType.Email,
                                message: `[${wireSubject}] Subscription request submitted. Wait for an activation email. Proforma Ref: ${newInv.invoiceNumber} | Total: KES ${totalAmount.toLocaleString()} | Bank: ${pricing?.wireBankName || 'NCBA Bank Kenya PLC'} | Acc: ${pricing?.wireAccountNumber || '8809220019'} | Ref Code: ${newInv.invoiceNumber}. Once verified by Super Admin, your login credentials will be dispatched.`,
                                date: new Date().toISOString(),
                                sentBy: 'Platform System',
                                recipient: newSchool.email,
                                channel: 'Email',
                                status: 'Delivered',
                                timestamp: new Date().toISOString()
                            });
                        } else if (!isFree) {
                            // Instant payment via M-Pesa or Card: generate payment receipt and dispatch credentials email
                            const planAnnual = plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumAnnualPrice || 60000) : (pricing?.basicAnnualPrice || 30000);
                            const planMonthly = plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumMonthlyPrice || 6000) : (pricing?.basicMonthlyPrice || 3000);
                            const baseAmount = cycle === 'ANNUALLY' ? planAnnual : planMonthly;
                            const totalAmount = baseAmount + Math.round(baseAmount * 0.16);
                            const isCard = body.paymentMethod === 'CARD';
                            const txnCode = body.paymentIntentId || body.transactionRef || (isCard ? `CARD-STRIPE-${Date.now().toString().slice(-6)}` : `MPESA-QKD-${Date.now().toString().slice(-6)}`);

                            const newReceipt = {
                                id: `rec-saas-${Date.now()}`,
                                receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String(saasReceipts.length + 1).padStart(3, '0')}`,
                                invoiceId: '',
                                invoiceNumber: `INV-SAAS-${new Date().getFullYear()}-INSTANT`,
                                schoolId: newSchool.id,
                                schoolName: newSchool.name,
                                amount: totalAmount,
                                currency: 'KES',
                                paymentDate: new Date().toISOString().split('T')[0],
                                paymentMethod: isCard ? 'Stripe / Credit Card' : 'Lipa Na M-Pesa (STK Push)',
                                transactionCode: txnCode,
                                plan: newSchool.plan,
                                provisionedUntil: newSchool.endDate,
                                verifiedBy: 'Automated Payment Gateway'
                            };
                            saasReceipts.unshift(newReceipt as any);

                            // Email notification log for instant payment receipt
                            const receiptSubject = `Official Payment Receipt & Portal Credentials - ${newSchool.name}`;
                            communicationLogs.unshift({
                                id: `log-${Date.now()}`,
                                studentId: newSchool.id,
                                type: CommunicationType.Email,
                                message: `[${receiptSubject}] Payment verified! Receipt: ${newReceipt.receiptNumber} | Txn: ${txnCode} | Amount: KES ${totalAmount.toLocaleString()} | Method: ${newReceipt.paymentMethod} | Admin Login: ${newSchool.email} | Initial Password: ${newSchool.temporaryPassword}`,
                                date: new Date().toISOString(),
                                sentBy: 'Automated Payment Gateway',
                                recipient: newSchool.email,
                                channel: 'Email',
                                status: 'Delivered',
                                timestamp: new Date().toISOString()
                            });
                        }

                        sendJson(200, {
                            user: newUser,
                            token: newUser.id,
                            school: newSchool,
                            status: isWire ? 'PENDING' : 'ACTIVE'
                        });
                    });
                    return;
                }

                if (path === '/api/auth/create-payment-intent') {
                    sendJson(200, { clientSecret: 'mock_pi_secret_123', amount: 3000 });
                    return;
                }

                // Dashboard
                if (path === '/api/dashboard/stats') {
                    const totalRevenue = transactions
                        .filter(t => t.type === 'Payment')
                        .reduce((sum, t) => sum + t.amount, 0);
                    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
                    const totalProfit = totalRevenue - totalExpenses;
                    const feesOverdue = students.reduce((sum, s) => sum + Math.max(0, s.balance || 0), 0);

                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const now = new Date();
                    const monthlyData: { name: string; income: number; expenses: number }[] = [];
                    for (let i = 5; i >= 0; i--) {
                        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const mKey = d.toISOString().slice(0, 7);
                        const mName = monthNames[d.getMonth()];
                        const mTx = transactions
                            .filter(t => t.type === 'Payment' && t.date && t.date.startsWith(mKey))
                            .reduce((sum, t) => sum + t.amount, 0);
                        const mExp = expenses
                            .filter(e => e.date && e.date.startsWith(mKey))
                            .reduce((sum, e) => sum + e.amount, 0);

                        monthlyData.push({
                            name: mName,
                            income: mTx > 0 ? mTx : Math.round(Math.max(10000, totalRevenue * (0.12 + (5 - i) * 0.03))),
                            expenses: mExp > 0 ? mExp : Math.round(Math.max(5000, totalExpenses * (0.13 + (5 - i) * 0.02)))
                        });
                    }

                    const catMap: Record<string, number> = {};
                    expenses.forEach(e => {
                        const cat = e.category || 'General';
                        catMap[cat] = (catMap[cat] || 0) + e.amount;
                    });
                    let expenseDistribution = Object.entries(catMap).map(([name, value]) => ({ name, value }));
                    if (expenseDistribution.length === 0) {
                        expenseDistribution = [
                            { name: 'Utilities', value: 8500 },
                            { name: 'Supplies', value: 14200 },
                            { name: 'Maintenance', value: 5000 }
                        ];
                    }

                    const totalInvoiced = transactions
                        .filter(t => t.type === 'Invoice' || t.type === 'ManualDebit')
                        .reduce((sum, t) => sum + t.amount, 0);

                    // Compute expected fee based on curriculum fee structure and active students
                    let expectedFromStructure = 0;
                    students.forEach(s => {
                        if (s.classId) {
                            feeStructure.forEach(item => {
                                const cf = item.classSpecificFees?.find(f => f.classId === s.classId);
                                if (cf && cf.amount) {
                                    expectedFromStructure += cf.amount;
                                }
                            });
                        }
                    });
                    const totalExpectedFee = expectedFromStructure > 0 
                        ? expectedFromStructure 
                        : (totalInvoiced > 0 ? totalInvoiced : totalRevenue + feesOverdue);

                    sendJson(200, {
                        totalStudents: students.length,
                        totalStaff: staff.length,
                        totalRevenue,
                        totalExpenses,
                        totalProfit,
                        feesOverdue,
                        totalExpectedFee,
                        totalInvoiced,
                        feeCollectionRate: totalExpectedFee > 0 ? Math.min(100, Math.round((totalRevenue / totalExpectedFee) * 100)) : 100,
                        netIncome: totalProfit,
                        attendanceRate: 94.5,
                        monthlyData,
                        expenseDistribution
                    });
                    return;
                }

                // Users
                if (path === '/api/users') {
                    if (req.method === 'GET') {
                        sendJson(200, users);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newUser = {
                                id: `user-${Date.now()}`,
                                ...body,
                                avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
                                status: 'Active'
                            };
                            users.push(newUser);
                            sendJson(201, newUser);
                        });
                        return;
                    }
                }

                // Students Photo Upload
                if (path === '/api/students/upload-photo') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const raw = body?.dataUrl || body?.profileImage || body?.url;
                            let url = '';
                            if (raw && raw.startsWith('data:image/')) {
                                url = saveUploadedMedia('students', raw);
                            } else if (raw && (raw.startsWith('/public/uploads/') || raw.startsWith('http'))) {
                                url = raw;
                            } else {
                                url = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120';
                            }
                            sendJson(200, { url });
                        });
                        return;
                    }
                }

                // Generic Media / Document Upload
                if (path === '/api/upload' || path === '/api/media/upload') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const raw = body?.dataUrl || body?.file || body?.url;
                            const url = raw && raw.startsWith('data:image/') 
                                ? saveUploadedMedia('media', raw, body?.filename) 
                                : (raw || '/public/uploads/media/file.png');
                            sendJson(200, { url });
                        });
                        return;
                    }
                }

                // Users Photo / Avatar Upload
                if (path === '/api/users/upload-photo' || path === '/api/users/upload-avatar') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const raw = body?.dataUrl || body?.avatarUrl || body?.url;
                            const url = raw && raw.startsWith('data:image/') 
                                ? saveUploadedMedia('users', raw) 
                                : (raw || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120');
                            sendJson(200, { url });
                        });
                        return;
                    }
                }

                // Settings Logo Upload
                if (path === '/api/settings/upload-logo') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const raw = body?.dataUrl || body?.logoUrl || body?.url;
                            const logoUrl = raw && raw.startsWith('data:image/') 
                                ? saveUploadedMedia('logos', raw) 
                                : (raw || schoolInfo.logoUrl || '/public/uploads/logos/default_logo.png');
                            schoolInfo.logoUrl = logoUrl;
                            sendJson(200, { logoUrl });
                        });
                        return;
                    }
                }

                // Students
                if (path === '/api/students') {
                    if (req.method === 'GET') {
                        sendJson(200, students);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newStudent = {
                                id: `stud-${Date.now()}`,
                                admissionNumber: `2026-${String(students.length + 1).padStart(4, '0')}`,
                                status: 'Active',
                                profileImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120',
                                balance: 0,
                                ...body
                            };
                            students.unshift(newStudent);

                            // Auto-provision guardian / parent user account
                            if (body.guardianEmail) {
                                const gEmail = body.guardianEmail.toLowerCase().trim();
                                const exists = users.some(u => u.email.toLowerCase() === gEmail);
                                if (!exists) {
                                    const parentUser: any = {
                                        id: `user-parent-${Date.now()}`,
                                        name: body.guardianName || `Guardian of ${body.name}`,
                                        email: gEmail,
                                        role: 'Parent',
                                        status: 'Active',
                                        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
                                        schoolId: schoolInfo.id || 'school-1'
                                    };
                                    users.push(parentUser);
                                }

                                // Auto-record welcome communication log
                                const welcomeLog: any = {
                                    id: `log-${Date.now()}`,
                                    recipient: gEmail,
                                    channel: 'Email',
                                    message: `[Portal Access Credentials] Welcome to ${schoolInfo.name || 'School'} Parent Portal. Account activated for scholar ${body.name}. Username: ${gEmail}, Password: Parent@2026. Log in to access live grades, attendance, and fee statements.`,
                                    status: 'Delivered',
                                    timestamp: new Date().toISOString()
                                };
                                communicationLogs.unshift(welcomeLog);
                            }

                            sendJson(201, newStudent);
                        });
                        return;
                    }
                }

                if (path.startsWith('/api/students/')) {
                    const id = path.replace('/api/students/', '');
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            students = students.map(s => s.id === id ? { ...s, ...body } : s);
                            const updated = students.find(s => s.id === id);
                            sendJson(200, updated || body);
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        students = students.filter(s => s.id !== id);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // Transactions
                if (path === '/api/transactions') {
                    if (req.method === 'GET') {
                        sendJson(200, transactions);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newTx = {
                                id: `tx-${Date.now()}`,
                                ...body
                            };
                            transactions.unshift(newTx);
                            sendJson(201, newTx);
                        });
                        return;
                    }
                }

                // Expenses
                if (path === '/api/expenses') {
                    if (req.method === 'GET') {
                        sendJson(200, expenses);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newExp = {
                                id: `exp-${Date.now()}`,
                                ...body
                            };
                            expenses.unshift(newExp);
                            sendJson(201, newExp);
                        });
                        return;
                    }
                }

                // Staff Photo Upload
                if (path === '/api/staff/upload-photo') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const raw = body?.dataUrl || body?.photoUrl || body?.url;
                            let url = '';
                            if (raw && raw.startsWith('data:image/')) {
                                url = saveUploadedMedia('staff', raw);
                            } else if (raw && (raw.startsWith('/public/uploads/') || raw.startsWith('http'))) {
                                url = raw;
                            } else {
                                url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120';
                            }
                            sendJson(200, { url });
                        });
                        return;
                    }
                }

                // Staff
                if (path === '/api/staff') {
                    if (req.method === 'GET') {
                        sendJson(200, staff);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newStaffId = `staff-${Date.now()}`;
                            const staffEmail = (body.email || '').toLowerCase().trim();
                            const rawPassword = (body.password || '').trim() || 'password123';
                            const userRole = body.userRole || Role.Teacher;

                            let photoUrl = body.photoUrl;
                            if (photoUrl && photoUrl.startsWith('data:image/')) {
                                photoUrl = saveUploadedMedia('staff', photoUrl);
                            }
                            if (!photoUrl) {
                                photoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120';
                            }

                            const newStaff = {
                                id: newStaffId,
                                ...body,
                                photoUrl
                            };
                            staff.push(newStaff);

                            // Auto-provision corresponding user login account so staff can immediately log in
                            if (staffEmail) {
                                const existingUserIndex = users.findIndex(u => u.email.toLowerCase() === staffEmail);
                                if (existingUserIndex >= 0) {
                                    users[existingUserIndex] = {
                                        ...users[existingUserIndex],
                                        name: body.name || users[existingUserIndex].name,
                                        role: userRole,
                                        avatarUrl: photoUrl,
                                        password: rawPassword,
                                        status: 'Active'
                                    };
                                } else {
                                    const newUser: User = {
                                        id: `user-${newStaffId}`,
                                        name: body.name || 'Staff Member',
                                        email: staffEmail,
                                        password: rawPassword,
                                        role: userRole,
                                        avatarUrl: photoUrl,
                                        status: 'Active',
                                        schoolId: schoolInfo.id || 'school-1'
                                    };
                                    users.push(newUser);
                                }
                            }

                            sendJson(201, newStaff);
                        });
                        return;
                    }
                }

                if (path.startsWith('/api/staff/')) {
                    const staffId = path.replace('/api/staff/', '');
                    // Skip if upload-photo
                    if (staffId === 'upload-photo') {
                        return;
                    }
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            let photoUrl = body.photoUrl;
                            if (photoUrl && photoUrl.startsWith('data:image/')) {
                                photoUrl = saveUploadedMedia('staff', photoUrl);
                                body.photoUrl = photoUrl;
                            }

                            const idx = staff.findIndex(s => s.id === staffId);
                            if (idx >= 0) {
                                staff[idx] = { ...staff[idx], ...body };
                                // Update linked user if email or name changed
                                const staffEmail = (staff[idx].email || '').toLowerCase().trim();
                                if (staffEmail) {
                                    const uIdx = users.findIndex(u => u.email.toLowerCase() === staffEmail);
                                    if (uIdx >= 0) {
                                        users[uIdx] = {
                                            ...users[uIdx],
                                            name: staff[idx].name || users[uIdx].name,
                                            role: body.userRole || users[uIdx].role,
                                            ...(photoUrl ? { avatarUrl: photoUrl } : {})
                                        };
                                    }
                                }
                                sendJson(200, staff[idx]);
                            } else {
                                // Fallback: look up by email or upsert
                                const staffEmail = (body.email || '').toLowerCase().trim();
                                const byEmailIdx = staffEmail ? staff.findIndex(s => (s.email || '').toLowerCase() === staffEmail) : -1;
                                if (byEmailIdx >= 0) {
                                    staff[byEmailIdx] = { ...staff[byEmailIdx], ...body, ...(photoUrl ? { photoUrl } : {}) };
                                    sendJson(200, staff[byEmailIdx]);
                                } else {
                                    const createdStaff = {
                                        id: staffId,
                                        name: body.name || 'Staff Member',
                                        email: body.email || '',
                                        role: body.role || 'Senior Teacher',
                                        userRole: body.userRole || Role.Teacher,
                                        salary: body.salary || 50000,
                                        joinDate: body.joinDate || new Date().toISOString().split('T')[0],
                                        ...body,
                                        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
                                    };
                                    staff.push(createdStaff);
                                    sendJson(200, createdStaff);
                                }
                            }
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        staff = staff.filter(s => s.id !== staffId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // Payroll
                if (path === '/api/payroll/payroll-items') {
                    sendJson(200, payrollItems);
                    return;
                }
                if (path === '/api/payroll/payroll-history') {
                    const parsedUrl = new URL(url, 'http://localhost');
                    const staffId = parsedUrl.searchParams.get('staffId');
                    const month = parsedUrl.searchParams.get('month');
                    let filtered = [...payrollHistory];
                    if (staffId) {
                        filtered = filtered.filter(p => p.staffId === staffId);
                    }
                    if (month) {
                        filtered = filtered.filter(p => p.month && p.month.toLowerCase().includes(month.toLowerCase()));
                    }
                    sendJson(200, { data: filtered, total: filtered.length, page: 1, limit: filtered.length, last_page: 1 });
                    return;
                }
                if (path === '/api/payroll/generate') {
                    readBody(body => {
                        payrollHistory = Array.isArray(body) ? [...body, ...payrollHistory] : payrollHistory;
                        sendJson(200, payrollHistory);
                    });
                    return;
                }

                // Academics - Classes
                if (path === '/api/academics/classes') {
                    if (req.method === 'GET') {
                        sendJson(200, classes);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newClass = {
                                id: `class-${Date.now()}`,
                                ...body
                            };
                            classes.push(newClass);
                            sendJson(201, newClass);
                        });
                        return;
                    }
                }
                if (path === '/api/academics/classes/batch' && req.method === 'PUT') {
                    readBody(body => {
                        if (Array.isArray(body)) {
                            classes = body;
                            sendJson(200, classes);
                        } else {
                            sendJson(400, { error: 'Expected array of classes' });
                        }
                    });
                    return;
                }
                if (path.startsWith('/api/academics/classes/')) {
                    const classId = path.replace('/api/academics/classes/', '');
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            const idx = classes.findIndex(c => c.id === classId);
                            if (idx >= 0) {
                                classes[idx] = { ...classes[idx], ...body };
                                sendJson(200, classes[idx]);
                            } else {
                                sendJson(404, { error: 'Class not found' });
                            }
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        classes = classes.filter(c => c.id !== classId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // Academics - Subjects
                if (path === '/api/academics/subjects') {
                    if (req.method === 'GET') {
                        sendJson(200, subjects);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newSubject = {
                                id: `sub-${Date.now()}`,
                                code: (body.code || 'SUB').toUpperCase().trim(),
                                name: (body.name || '').trim()
                            };
                            subjects.push(newSubject);
                            sendJson(201, newSubject);
                        });
                        return;
                    }
                }
                if (path === '/api/academics/subjects/batch' && req.method === 'PUT') {
                    readBody(body => {
                        if (Array.isArray(body)) {
                            subjects = body;
                            sendJson(200, subjects);
                        } else {
                            sendJson(400, { error: 'Expected array of subjects' });
                        }
                    });
                    return;
                }
                if (path.startsWith('/api/academics/subjects/')) {
                    const subjectId = path.replace('/api/academics/subjects/', '');
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            const idx = subjects.findIndex(s => s.id === subjectId);
                            if (idx >= 0) {
                                subjects[idx] = { ...subjects[idx], ...body };
                                sendJson(200, subjects[idx]);
                            } else {
                                sendJson(404, { error: 'Subject not found' });
                            }
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        subjects = subjects.filter(s => s.id !== subjectId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // Academics - Class-Subject Assignments
                if (path === '/api/academics/class-subject-assignments') {
                    if (req.method === 'GET') {
                        sendJson(200, assignments);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newAssign = {
                                id: `csa-${Date.now()}`,
                                ...body
                            };
                            assignments.push(newAssign);
                            sendJson(201, newAssign);
                        });
                        return;
                    }
                }
                if (path === '/api/academics/class-subject-assignments/batch' && req.method === 'PUT') {
                    readBody(body => {
                        if (Array.isArray(body)) {
                            assignments = body;
                            sendJson(200, assignments);
                        } else {
                            sendJson(400, { error: 'Expected array of assignments' });
                        }
                    });
                    return;
                }
                if (path.startsWith('/api/academics/class-subject-assignments/')) {
                    const assignmentId = path.replace('/api/academics/class-subject-assignments/', '');
                    if (req.method === 'DELETE') {
                        assignments = assignments.filter(a => a.id !== assignmentId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // Academics - Timetable, Exams, Grades, Attendance, Grading Scale, Fee Structure
                if (path === '/api/academics/timetable-entries') {
                    sendJson(200, timetable);
                    return;
                }
                if (path === '/api/academics/timetable-entries/batch' && req.method === 'PUT') {
                    readBody(body => {
                        if (Array.isArray(body)) {
                            timetable = body;
                            sendJson(200, timetable);
                        }
                    });
                    return;
                }

                if (path === '/api/academics/exams') {
                    sendJson(200, exams);
                    return;
                }
                if (path === '/api/academics/exams/batch' && req.method === 'PUT') {
                    readBody(body => {
                        if (Array.isArray(body)) {
                            exams = body;
                            sendJson(200, exams);
                        }
                    });
                    return;
                }

                if (path === '/api/academics/grades') {
                    sendJson(200, grades);
                    return;
                }
                if (path === '/api/academics/grades/batch' && req.method === 'PUT') {
                    readBody(body => {
                        if (Array.isArray(body)) {
                            grades = body;
                            sendJson(200, grades);
                        }
                    });
                    return;
                }

                if (path === '/api/academics/attendance-records') {
                    sendJson(200, attendance);
                    return;
                }
                if (path === '/api/academics/attendance-records/batch' && req.method === 'PUT') {
                    readBody(body => {
                        if (Array.isArray(body)) {
                            attendance = body;
                            sendJson(200, attendance);
                        }
                    });
                    return;
                }

                if (path === '/api/academics/events') {
                    sendJson(200, []);
                    return;
                }

                if (path === '/api/academics/grading-scale') {
                    if (req.method === 'GET') {
                        sendJson(200, gradingRules);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newRule = { id: `rule-${Date.now()}`, ...body };
                            gradingRules.push(newRule);
                            sendJson(201, newRule);
                        });
                        return;
                    }
                }
                if (path.startsWith('/api/academics/grading-scale/')) {
                    const ruleId = path.replace('/api/academics/grading-scale/', '');
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            const idx = gradingRules.findIndex(r => r.id === ruleId);
                            if (idx >= 0) {
                                gradingRules[idx] = { ...gradingRules[idx], ...body };
                                sendJson(200, gradingRules[idx]);
                            } else {
                                sendJson(404, { error: 'Rule not found' });
                            }
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        gradingRules = gradingRules.filter(r => r.id !== ruleId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                if (path === '/api/academics/fee-structure') {
                    if (req.method === 'GET') {
                        sendJson(200, feeStructure);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newItem = { id: `fee-${Date.now()}`, ...body };
                            feeStructure.push(newItem);
                            sendJson(201, newItem);
                        });
                        return;
                    }
                }
                if (path.startsWith('/api/academics/fee-structure/')) {
                    const feeId = path.replace('/api/academics/fee-structure/', '');
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            const idx = feeStructure.findIndex(f => f.id === feeId);
                            if (idx >= 0) {
                                feeStructure[idx] = { ...feeStructure[idx], ...body };
                                sendJson(200, feeStructure[idx]);
                            } else {
                                sendJson(404, { error: 'Fee item not found' });
                            }
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        feeStructure = feeStructure.filter(f => f.id !== feeId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // Communications
                if (path === '/api/communications/announcements') {
                    if (req.method === 'GET') {
                        sendJson(200, announcements);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newAnn = { id: `ann-${Date.now()}`, ...body };
                            announcements.unshift(newAnn);
                            sendJson(201, newAnn);
                        });
                        return;
                    }
                }
                if (path === '/api/communications/send-email') {
                    if (req.method === 'POST') {
                        readBody(async body => {
                            const rawTo = body.to;
                            const toList: string[] = Array.isArray(rawTo) 
                                ? rawTo 
                                : (typeof rawTo === 'string' ? rawTo.split(',').map(s => s.trim()) : []);
                            
                            const validRecipients = toList.filter(Boolean);
                            const recipientsStr = validRecipients.length > 0 ? validRecipients.join(', ') : 'Recipient';
                            const subject = body.subject || 'School Portal Notification';
                            const htmlBody = body.body || '';
                            const plainText = (htmlBody).replace(/<[^>]*>?/gm, '').trim();

                            if (validRecipients.length === 0) {
                                sendJson(400, { success: false, message: 'No valid recipient email provided.' });
                                return;
                            }

                            // Dispatches through configured production SMTP transporter
                            const emailResult = await sendProductionEmail({
                                to: validRecipients,
                                subject: subject,
                                html: htmlBody,
                                text: plainText
                            });

                            const newLog: any = {
                                id: `log-${Date.now()}`,
                                recipient: recipientsStr,
                                channel: 'Email',
                                message: `[${subject}] ${plainText.substring(0, 120)}${plainText.length > 120 ? '...' : ''}`,
                                status: emailResult.success ? 'Delivered' : 'Failed',
                                timestamp: new Date().toISOString()
                            };
                            communicationLogs.unshift(newLog);

                            sendJson(200, {
                                success: emailResult.success,
                                message: emailResult.message,
                                messageId: emailResult.messageId,
                                error: emailResult.error,
                                log: newLog
                            });
                        });
                        return;
                    }
                }

                if (path === '/api/communications/contact') {
                    if (req.method === 'POST') {
                        readBody(async body => {
                            const name = (body.name || 'Prospective Administrator').trim();
                            const school = (body.school || 'Unspecified School').trim();
                            const phone = (body.phone || 'N/A').trim();
                            const email = (body.email || '').trim();
                            const curriculum = (body.curriculum || 'Standard CBC / 8-4-4').trim();
                            const message = (body.message || 'No additional message provided').trim();

                            const smtpConfig = getSmtpConfig();
                            const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || smtpConfig.user || 'info@saaslink.co.ke';

                            // 1. Notify Platform Admins
                            const adminHtml = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
                                    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
                                        <h2 style="color: #0f172a; margin: 0;">🚀 New Institutional Demo Inquiry</h2>
                                        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Submitted via the official website contact portal</p>
                                    </div>
                                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Institution:</td><td style="padding: 8px 0; color: #0f172a;"><strong>${school}</strong></td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #475569;">Contact Person:</td><td style="padding: 8px 0; color: #0f172a;">${name}</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #475569;">Direct Phone:</td><td style="padding: 8px 0; color: #0f172a;">${phone}</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td><td style="padding: 8px 0; color: #0f172a;">${email || 'Not provided'}</td></tr>
                                        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold; color: #475569;">Curriculum Focus:</td><td style="padding: 8px 0; color: #0f172a;">${curriculum}</td></tr>
                                        <tr><td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Notes / Requirements:</td><td style="padding: 8px 0; color: #0f172a; line-height: 1.5;">${message}</td></tr>
                                    </table>
                                    <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-top: 16px; font-size: 12px; color: #64748b;">
                                        Dispatched automatically via configured SMTP transport: ${smtpConfig.host}:${smtpConfig.port}
                                    </div>
                                </div>
                            `;

                            const adminEmailResult = await sendProductionEmail({
                                to: adminNotifyEmail,
                                subject: `New School Demo Inquiry: ${school} - ${name}`,
                                html: adminHtml,
                                replyTo: email || undefined
                            });

                            // 2. If prospective client provided their email, send polite acknowledgment
                            let clientEmailResult = { success: true };
                            if (email) {
                                const clientHtml = `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff;">
                                        <h2 style="color: #0f172a; margin-top: 0;">Thank You for Contacting SaasLink</h2>
                                        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                                            Dear <strong>${name}</strong>,<br/><br/>
                                            We have received your inquiry regarding <strong>${school}</strong>. 
                                            Our edtech integration engineers are reviewing your operational requirements for <strong>${curriculum}</strong> curriculum workflow and automated fee collection.
                                        </p>
                                        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
                                            <p style="margin: 0; font-size: 13px; color: #1e293b; font-weight: bold;">Priority Support Hotline & WhatsApp</p>
                                            <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">
                                                Direct: <strong>0720935895</strong> | WhatsApp: <strong>+254 720 935 895</strong> | Email: <strong>info@saaslink.co.ke</strong>
                                            </p>
                                        </div>
                                        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                                            A senior school technology specialist will contact you promptly to schedule your demonstration.
                                        </p>
                                        <p style="color: #94a3b8; font-size: 11px; margin-top: 24px;">SaasLink Technologies Kenya &copy; ${new Date().getFullYear()} - Digital School Operating System</p>
                                    </div>
                                `;

                                clientEmailResult = await sendProductionEmail({
                                    to: email,
                                    subject: 'Inquiry Confirmation: SaasLink School Management Platform',
                                    html: clientHtml
                                });
                            }

                            const newLog = {
                                id: `log-${Date.now()}`,
                                recipient: email || phone,
                                channel: 'Email',
                                message: `[Contact Inquiry] ${school} (${name}) inquiry processed`,
                                status: adminEmailResult.success ? 'Delivered' : 'Logged',
                                timestamp: new Date().toISOString()
                            };
                            communicationLogs.unshift(newLog);

                            sendJson(200, {
                                success: true,
                                message: 'Your inquiry has been submitted and confirmed.',
                                delivery: {
                                    adminDelivered: adminEmailResult.success,
                                    clientDelivered: clientEmailResult.success,
                                    diagnostic: adminEmailResult.message
                                }
                            });
                        });
                        return;
                    }
                }

                if (path === '/api/communications/communication-logs') {
                    sendJson(200, communicationLogs);
                    return;
                }

                // Super Admin SMTP Gateway Management
                if (path === '/api/super-admin/smtp-config') {
                    if (req.method === 'GET') {
                        const config = getSmtpConfig();
                        sendJson(200, {
                            host: config.host,
                            port: config.port,
                            user: config.user,
                            pass: config.pass ? '••••••••' : '',
                            hasPass: !!config.pass,
                            from: config.from,
                            secure: config.secure,
                            rejectUnauthorized: config.rejectUnauthorized
                        });
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const result = updateEnvSmtpConfig(body);
                            sendJson(200, result);
                        });
                        return;
                    }
                }

                if (path === '/api/super-admin/test-smtp') {
                    if (req.method === 'POST') {
                        readBody(async body => {
                            const targetEmail = (body.targetEmail || 'mutheeisaiah9@gmail.com').trim();
                            const config = getSmtpConfig();
                            
                            const verifyResult = await verifySmtpConnection();
                            const testResult = await sendProductionEmail({
                                to: targetEmail,
                                subject: `SMTP Diagnostic Test - SaasLink [${new Date().toLocaleTimeString()}]`,
                                html: `
                                    <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                        <h2 style="color: #10b981; margin-top: 0;">✓ Production SMTP Operational</h2>
                                        <p style="color: #334155;">This is a live test email dispatched from SaasLink School Management System.</p>
                                        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
                                            <tr><td style="padding: 6px; font-weight: bold;">Host:</td><td>${config.host}</td></tr>
                                            <tr><td style="padding: 6px; font-weight: bold;">Port:</td><td>${config.port}</td></tr>
                                            <tr><td style="padding: 6px; font-weight: bold;">Sender:</td><td>${config.from}</td></tr>
                                            <tr><td style="padding: 6px; font-weight: bold;">Timestamp:</td><td>${new Date().toISOString()}</td></tr>
                                        </table>
                                    </div>
                                `
                            });

                            sendJson(200, {
                                success: testResult.success,
                                message: testResult.message,
                                verifyResult,
                                deliveryResult: testResult
                            });
                        });
                        return;
                    }
                }

                // Settings
                if (path === '/api/settings/school-info') {
                    if (req.method === 'GET') {
                        sendJson(200, schoolInfo);
                        return;
                    }
                    if (req.method === 'PUT' || req.method === 'PATCH') {
                        readBody(body => {
                            schoolInfo = { ...schoolInfo, ...body };
                            sendJson(200, schoolInfo);
                        });
                        return;
                    }
                }
                if (path === '/api/settings/daraja') {
                    if (req.method === 'GET') {
                        sendJson(200, darajaSettings);
                        return;
                    }
                    if (req.method === 'PUT' || req.method === 'PATCH') {
                        readBody(body => {
                            darajaSettings = { ...darajaSettings, ...body };
                            sendJson(200, darajaSettings);
                        });
                        return;
                    }
                }
                if (path === '/api/settings/upload-logo') {
                    sendJson(200, { logoUrl: schoolInfo.logoUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=120' });
                    return;
                }

                // Super Admin
                if (path === '/api/super-admin/stats') {
                    const activeCount = schools.filter(s => s.subscriptionStatus === SubscriptionStatus.ACTIVE).length;
                    const graceCount = schools.filter(s => s.subscriptionStatus === SubscriptionStatus.PAST_DUE).length;
                    const disabledCount = schools.filter(s => s.subscriptionStatus === SubscriptionStatus.SUSPENDED).length;
                    const totalRev = saasReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                    const mpesaRev = saasReceipts.filter(r => (r.paymentMethod || '').toLowerCase().includes('mpesa') || (r.paymentMethod || '').toLowerCase().includes('lipa')).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                    const cardRev = saasReceipts.filter(r => (r.paymentMethod || '').toLowerCase().includes('card') || (r.paymentMethod || '').toLowerCase().includes('stripe')).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                    const wireRev = saasReceipts.filter(r => (r.paymentMethod || '').toLowerCase().includes('wire') || (r.paymentMethod || '').toLowerCase().includes('bank') || (r.paymentMethod || '').toLowerCase().includes('ncba')).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                    const mrr = schools
                        .filter(s => s.subscriptionStatus === SubscriptionStatus.ACTIVE)
                        .reduce((sum, s) => {
                            const planAnnual = s.plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumAnnualPrice || 60000) : (pricing?.basicAnnualPrice || 30000);
                            const planMonthly = s.plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumMonthlyPrice || 6000) : (pricing?.basicMonthlyPrice || 3000);
                            return sum + (s.billingCycle === 'ANNUALLY' ? Math.round(planAnnual / 12) : planMonthly);
                        }, 0);

                    sendJson(200, {
                        totalSchools: schools.length,
                        activeSubscriptions: activeCount,
                        gracePeriodCount: graceCount,
                        disabledCount: disabledCount,
                        totalRevenue: totalRev,
                        mpesaRevenue: mpesaRev,
                        cardRevenue: cardRev,
                        wireRevenue: wireRev,
                        monthlyRecurringRevenue: mrr,
                        annualRecurringRevenue: mrr * 12,
                        totalPlatformUsers: users.length,
                        systemUptime: '99.98%',
                        pricing
                    });
                    return;
                }
                if (path === '/api/super-admin/schools') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newSchool: any = {
                                id: `school-${Date.now()}`,
                                name: body.schoolName || body.name || 'New Institution',
                                slug: (body.schoolName || body.name || 'school').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                schoolCode: body.schoolCode || (body.schoolName || 'SCH').substring(0, 3).toUpperCase(),
                                email: body.adminEmail || body.email || 'admin@school.com',
                                phone: body.phone || '',
                                address: body.address || body.county || 'Nairobi, Kenya',
                                plan: body.plan || SubscriptionPlan.BASIC,
                                subscriptionStatus: body.status || SubscriptionStatus.ACTIVE,
                                billingCycle: body.billingCycle || 'ANNUALLY',
                                startDate: new Date().toISOString().split('T')[0],
                                endDate: new Date(Date.now() + (body.billingCycle === 'MONTHLY' ? 30 : 365) * 86400000).toISOString().split('T')[0],
                                studentCount: Number(body.studentCount) || 0,
                                staffCount: Number(body.staffCount) || 0,
                                adminName: body.adminName || 'Admin',
                                remindersCount: 0
                            };
                            const newUser = {
                                id: `user-${Date.now()}`,
                                name: body.adminName || 'School Admin',
                                email: newSchool.email,
                                role: 'Admin' as any,
                                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
                                status: 'Active' as const,
                                schoolId: newSchool.id
                            };
                            users.push(newUser);
                            schools = [newSchool, ...schools];
                            sendJson(201, newSchool);
                        });
                        return;
                    }
                    sendJson(200, schools.map(s => ({
                        ...s,
                        schoolCode: (s.schoolCode && s.schoolCode !== 'PENDING-VERIFICATION') ? s.schoolCode : (s.name || 'SCH').substring(0, 3).toUpperCase()
                    })));
                    return;
                }
                if (path === '/api/super-admin/invoices') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newInv = {
                                id: `inv-saas-${Date.now()}`,
                                invoiceNumber: `INV-SAAS-${new Date().getFullYear()}-${String(saasInvoices.length + 1).padStart(3, '0')}`,
                                schoolId: body.schoolId,
                                schoolName: body.schoolName,
                                schoolCode: body.schoolCode,
                                recipientEmail: body.recipientEmail,
                                recipientPhone: body.recipientPhone,
                                plan: body.plan || 'PREMIUM',
                                billingCycle: body.billingCycle || 'ANNUALLY',
                                amount: Number(body.amount) || 60000,
                                currency: body.currency || 'KES',
                                issueDate: body.issueDate || new Date().toISOString().split('T')[0],
                                dueDate: body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                                status: body.status || 'ISSUED',
                                notes: body.notes
                            };
                            saasInvoices = [newInv, ...saasInvoices];
                            sendJson(200, newInv);
                        });
                        return;
                    }
                    sendJson(200, saasInvoices);
                    return;
                }
                if (path.startsWith('/api/super-admin/invoices/') && path.endsWith('/status')) {
                    const parts = path.split('/');
                    const invoiceId = parts[4];
                    readBody(body => {
                        const invIndex = saasInvoices.findIndex(i => i.id === invoiceId);
                        if (invIndex !== -1) {
                            const paidDate = body.paidDate || new Date().toISOString().split('T')[0];
                            const txRef = body.transactionRef || `MPESA-${Date.now().toString().slice(-6)}`;
                            const payMethod = body.paymentMethod || 'Lipa Na M-Pesa';
                            saasInvoices[invIndex] = {
                                ...saasInvoices[invIndex],
                                status: body.status || 'PAID',
                                paidDate,
                                transactionRef: txRef,
                                paymentMethod: payMethod
                            };
                            const inv = saasInvoices[invIndex];
                            if (inv.status === 'PAID') {
                                const newReceipt = {
                                    id: `rec-saas-${Date.now()}`,
                                    receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String(saasReceipts.length + 1).padStart(3, '0')}`,
                                    invoiceId: inv.id,
                                    invoiceNumber: inv.invoiceNumber,
                                    schoolId: inv.schoolId,
                                    schoolName: inv.schoolName,
                                    amount: inv.amount,
                                    currency: inv.currency,
                                    paymentDate: paidDate,
                                    paymentMethod: payMethod,
                                    transactionCode: txRef,
                                    plan: inv.plan,
                                    provisionedUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
                                    verifiedBy: 'Platform Super Administrator'
                                };
                                saasReceipts = [newReceipt, ...saasReceipts];
                                const schIdx = schools.findIndex(s => s.id === inv.schoolId);
                                if (schIdx !== -1) {
                                    schools[schIdx] = {
                                        ...schools[schIdx],
                                        subscriptionStatus: SubscriptionStatus.ACTIVE,
                                        endDate: newReceipt.provisionedUntil,
                                        remindersCount: 0
                                    };
                                }
                            }
                            sendJson(200, inv);
                        } else {
                            sendJson(404, { error: 'Invoice not found' });
                        }
                    });
                    return;
                }
                if (path === '/api/super-admin/receipts') {
                    sendJson(200, saasReceipts);
                    return;
                }
                if (path === '/api/super-admin/lifecycle-sweep') {
                    let remindersSent = 0;
                    let disabledCount = 0;
                    let warningCount = 0;
                    const log: any[] = [];
                    const now = new Date();
                    schools = schools.map(school => {
                        const end = new Date(school.endDate);
                        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        let newStatus = school.subscriptionStatus;
                        let count = school.remindersCount || 0;
                        let lastDate = school.lastReminderDate;

                        if (daysLeft < -14) {
                            if (newStatus !== SubscriptionStatus.SUSPENDED) {
                                newStatus = SubscriptionStatus.SUSPENDED;
                                disabledCount++;
                                log.push({
                                    schoolId: school.id,
                                    schoolName: school.name,
                                    action: 'LOCKED',
                                    reason: `Account past due by ${Math.abs(daysLeft)} days (exceeded 14-day grace).`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        } else if (daysLeft < 0) {
                            if (newStatus !== SubscriptionStatus.SUSPENDED) {
                                newStatus = SubscriptionStatus.PAST_DUE;
                                warningCount++;
                                count++;
                                lastDate = new Date().toISOString().split('T')[0];
                                remindersSent++;
                                log.push({
                                    schoolId: school.id,
                                    schoolName: school.name,
                                    action: 'GRACE_REMINDER_SENT',
                                    reason: `Subscription expired ${Math.abs(daysLeft)} days ago. Grace lockout in ${14 + daysLeft} days.`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        } else if (daysLeft <= 5) {
                            warningCount++;
                            count++;
                            lastDate = new Date().toISOString().split('T')[0];
                            remindersSent++;
                            log.push({
                                schoolId: school.id,
                                schoolName: school.name,
                                action: 'EXPIRY_REMINDER_SENT',
                                reason: `Subscription expiring in ${daysLeft} days. Bi-daily reminder cadence active.`,
                                timestamp: new Date().toISOString()
                            });
                        }
                        return {
                            ...school,
                            subscriptionStatus: newStatus,
                            remindersCount: count,
                            lastReminderDate: lastDate
                        };
                    });
                    sendJson(200, {
                        scannedAt: new Date().toISOString(),
                        schoolsEvaluated: schools.length,
                        remindersSent,
                        disabledCount,
                        warningCount,
                        log
                    });
                    return;
                }
                if (path.startsWith('/api/super-admin/schools/') && path.endsWith('/reminder')) {
                    const parts = path.split('/');
                    const schoolId = parts[4];
                    const sch = schools.find(s => s.id === schoolId);
                    if (sch) {
                        sch.remindersCount = (sch.remindersCount || 0) + 1;
                        sch.lastReminderDate = new Date().toISOString().split('T')[0];
                        sendJson(200, { success: true, message: `Payment reminder dispatched to ${sch.name} (${sch.email}).` });
                    } else {
                        sendJson(404, { error: 'School not found' });
                    }
                    return;
                }
                if (path.startsWith('/api/super-admin/schools/') && path.endsWith('/toggle-access')) {
                    const parts = path.split('/');
                    const schoolId = parts[4];
                    readBody(body => {
                        const sch = schools.find(s => s.id === schoolId);
                        if (sch) {
                            sch.subscriptionStatus = body.enabled ? SubscriptionStatus.ACTIVE : SubscriptionStatus.SUSPENDED;
                            sendJson(200, { success: true, school: sch });
                        } else {
                            sendJson(404, { error: 'School not found' });
                        }
                    });
                    return;
                }
                if (path.startsWith('/api/super-admin/schools/') && path.endsWith('/extend')) {
                    const parts = path.split('/');
                    const schoolId = parts[4];
                    readBody(body => {
                        const sch = schools.find(s => s.id === schoolId);
                        if (sch) {
                            const days = Number(body.days) || 30;
                            const currentEnd = new Date(sch.endDate);
                            const baseTime = currentEnd.getTime() > Date.now() ? currentEnd.getTime() : Date.now();
                            sch.endDate = new Date(baseTime + days * 86400000).toISOString().split('T')[0];
                            sch.subscriptionStatus = SubscriptionStatus.ACTIVE;
                            sendJson(200, { success: true, school: sch });
                        } else {
                            sendJson(404, { error: 'School not found' });
                        }
                    });
                    return;
                }
                if (path.startsWith('/api/super-admin/schools/') && path.endsWith('/activate')) {
                    const parts = path.split('/');
                    const schoolId = parts[4];
                    readBody(body => {
                        const sch = schools.find(s => s.id === schoolId);
                        if (sch) {
                            if (!sch.schoolCode || sch.schoolCode === 'PENDING-VERIFICATION') {
                                sch.schoolCode = (sch.name || 'SCH').substring(0, 3).toUpperCase();
                            }
                            const inv = saasInvoices.find(i => i.schoolId === schoolId && i.status !== 'PAID');
                            const targetPlan = body.plan || (sch as any).pendingUpgradePlan || inv?.plan || (sch.plan !== SubscriptionPlan.FREE ? sch.plan : SubscriptionPlan.PREMIUM);
                            sch.plan = targetPlan;

                            const cycle = (sch as any).billingCycle || inv?.billingCycle || sch.billingCycle || 'MONTHLY';
                            sch.billingCycle = cycle;

                            const planAnnual = sch.plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumAnnualPrice || 60000) : (pricing?.basicAnnualPrice || 30000);
                            const planMonthly = sch.plan === SubscriptionPlan.PREMIUM ? (pricing?.premiumMonthlyPrice || 6000) : (pricing?.basicMonthlyPrice || 3000);
                            const baseAmount = cycle === 'ANNUALLY' ? planAnnual : planMonthly;
                            const totalAmount = inv?.amount || (baseAmount + Math.round(baseAmount * 0.16));
                            const txnRef = body.transactionRef || inv?.invoiceNumber || `WIRE-NCBA-${Date.now().toString().slice(-6)}`;
                            const paymentDate = new Date().toISOString().split('T')[0];
                            const provisionedDays = cycle === 'ANNUALLY' ? 365 : 30;

                            sch.subscriptionStatus = SubscriptionStatus.ACTIVE;
                            sch.endDate = new Date(Date.now() + provisionedDays * 86400000).toISOString().split('T')[0];
                            sch.remindersCount = 0;
                            sch.lastPaymentDate = paymentDate;
                            sch.lastPaymentAmount = totalAmount;
                            delete (sch as any).pendingUpgradePlan;

                            if (schoolInfo && schoolInfo.id === sch.id) {
                                schoolInfo.plan = targetPlan;
                                schoolInfo.subscriptionStatus = SubscriptionStatus.ACTIVE;
                                schoolInfo.billingCycle = cycle;
                                schoolInfo.endDate = sch.endDate;
                                if (!schoolInfo.schoolCode || schoolInfo.schoolCode === 'PENDING-VERIFICATION') {
                                    schoolInfo.schoolCode = sch.schoolCode;
                                }
                            }

                            if (inv) {
                                inv.status = 'PAID';
                                inv.paidDate = paymentDate;
                                inv.transactionRef = txnRef;
                                inv.paymentMethod = body.paymentMethod || 'Bank Wire';
                            }

                            const newReceipt = {
                                id: `rec-saas-${Date.now()}`,
                                receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String(saasReceipts.length + 1).padStart(3, '0')}`,
                                invoiceId: inv?.id || '',
                                invoiceNumber: inv?.invoiceNumber || sch.invoiceNumber || `INV-SAAS-${new Date().getFullYear()}-ACT`,
                                schoolId: sch.id,
                                schoolName: sch.name,
                                amount: totalAmount,
                                currency: 'KES',
                                paymentDate: paymentDate,
                                paymentMethod: body.paymentMethod || 'Bank Wire',
                                transactionCode: txnRef,
                                plan: sch.plan,
                                provisionedUntil: sch.endDate,
                                verifiedBy: 'Platform Super Administrator'
                            };
                            saasReceipts.unshift(newReceipt as any);

                            // Dispatch School Activation Email with initial login credentials
                            const initialPassword = sch.temporaryPassword || 'Admin@2026';
                            const activationSubject = `Account Activated - Official Login Credentials for ${sch.name}`;
                            communicationLogs.unshift({
                                id: `log-${Date.now()}`,
                                studentId: sch.id,
                                type: CommunicationType.Email,
                                message: `[${activationSubject}] Congratulations! Your subscription for ${sch.name} has been verified and manually activated by the Super Administrator. Plan: ${sch.plan} | Valid Until: ${sch.endDate} | Billing: ${sch.billingCycle}`,
                                date: new Date().toISOString(),
                                sentBy: 'Super Administrator',
                                recipient: sch.email,
                                channel: 'Email',
                                status: 'Delivered',
                                timestamp: new Date().toISOString()
                            });

                            sendJson(200, { 
                                success: true, 
                                school: sch, 
                                receipt: newReceipt, 
                                credentials: { email: sch.email, password: initialPassword } 
                            });
                        } else {
                            sendJson(404, { error: 'School not found' });
                        }
                    });
                    return;
                }
                if (path === '/api/super-admin/payments/initiate' && req.method === 'POST') {
                    readBody(body => {
                        const schoolId = body.schoolId || schoolInfo?.id;
                        let sch = schools.find(s => s.id === schoolId || (body.email && s.email === body.email));
                        if (!sch && schoolInfo) {
                            sch = schoolInfo as any;
                            if (!schools.find(s => s.id === sch.id)) {
                                schools.unshift(sch);
                            }
                        }
                        if (sch) {
                            const requestedPlan = body.plan || SubscriptionPlan.PREMIUM;
                            const requestedCycle = body.billingCycle || sch.billingCycle || 'MONTHLY';
                            if (!sch.schoolCode || sch.schoolCode === 'PENDING-VERIFICATION') {
                                sch.schoolCode = (sch.name || 'SCH').substring(0, 3).toUpperCase();
                            }

                            sch.subscriptionStatus = SubscriptionStatus.PENDING_APPROVAL;
                            (sch as any).pendingUpgradePlan = requestedPlan;
                            (sch as any).paymentMethod = body.method || 'WIRE';
                            (sch as any).billingCycle = requestedCycle;

                            const txnRef = body.transactionCode || `WIRE-NCBA-${Date.now().toString().slice(-6)}`;
                            sch.invoiceNumber = txnRef;

                            if (schoolInfo && schoolInfo.id === sch.id) {
                                schoolInfo.subscriptionStatus = SubscriptionStatus.PENDING_APPROVAL;
                                (schoolInfo as any).pendingUpgradePlan = requestedPlan;
                                (schoolInfo as any).paymentMethod = body.method || 'WIRE';
                                (schoolInfo as any).invoiceNumber = txnRef;
                                if (!schoolInfo.schoolCode || schoolInfo.schoolCode === 'PENDING-VERIFICATION') {
                                    schoolInfo.schoolCode = sch.schoolCode;
                                }
                            }

                            const newInv = {
                                id: `inv-saas-${Date.now()}`,
                                invoiceNumber: txnRef,
                                schoolId: sch.id,
                                schoolName: sch.name,
                                schoolCode: sch.schoolCode,
                                recipientEmail: sch.email,
                                recipientPhone: sch.phone,
                                plan: requestedPlan,
                                billingCycle: requestedCycle,
                                amount: Number(body.amount) || 5800,
                                currency: 'KES',
                                issueDate: new Date().toISOString().split('T')[0],
                                dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                                status: 'UNPAID',
                                paymentMethod: 'Bank Wire',
                                notes: `Proforma Invoice for ${requestedPlan} subscription (${requestedCycle}). Super Admin wire transfer verification required.`
                            };
                            saasInvoices = [newInv as any, ...saasInvoices];

                            communicationLogs.unshift({
                                id: `log-${Date.now()}`,
                                studentId: sch.id,
                                type: CommunicationType.Email,
                                message: `[Proforma Invoice ${txnRef}] Order received for ${requestedPlan} plan (${requestedCycle}). Bank Wire Transfer awaiting Super Administrator verification.`,
                                date: new Date().toISOString(),
                                sentBy: 'System Billing Engine',
                                recipient: sch.email,
                                channel: 'Email',
                                status: 'Delivered',
                                timestamp: new Date().toISOString()
                            });

                            sendJson(200, {
                                success: true,
                                message: 'Wire transfer order recorded. Super Administrator verification pending.',
                                invoice: newInv,
                                school: sch
                            });
                        } else {
                            sendJson(404, { error: 'School not found' });
                        }
                    });
                    return;
                }
                if (path === '/api/super-admin/payments/manual') {
                    readBody(body => {
                        const targetSchool = schools.find(s => s.id === body.schoolId);
                        const newReceipt = {
                            id: `rec-saas-${Date.now()}`,
                            receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String(saasReceipts.length + 1).padStart(3, '0')}`,
                            invoiceId: body.invoiceId || '',
                            invoiceNumber: body.invoiceNumber || `INV-SAAS-${new Date().getFullYear()}-MANUAL`,
                            schoolId: body.schoolId,
                            schoolName: targetSchool?.name || 'Institution',
                            amount: Number(body.amount) || 60000,
                            currency: body.currency || 'KES',
                            paymentDate: body.date || new Date().toISOString().split('T')[0],
                            paymentMethod: body.method || 'Lipa Na M-Pesa',
                            transactionCode: body.transactionCode || `TXN-${Date.now()}`,
                            plan: (targetSchool?.plan || SubscriptionPlan.PREMIUM) as SubscriptionPlan,
                            provisionedUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
                            verifiedBy: 'Platform Super Administrator'
                        };
                        saasReceipts = [newReceipt, ...saasReceipts];
                        if (targetSchool) {
                            targetSchool.subscriptionStatus = SubscriptionStatus.ACTIVE;
                            targetSchool.endDate = newReceipt.provisionedUntil;
                            targetSchool.remindersCount = 0;
                        }
                        if (body.invoiceId) {
                            const inv = saasInvoices.find(i => i.id === body.invoiceId);
                            if (inv) {
                                inv.status = 'PAID';
                                inv.paidDate = newReceipt.paymentDate;
                                inv.transactionRef = newReceipt.transactionCode;
                                inv.paymentMethod = newReceipt.paymentMethod;
                            }
                        }
                        sendJson(200, { success: true, receipt: newReceipt });
                    });
                    return;
                }
                if (path === '/api/super-admin/health') {
                    const onlineUsersList = [
                        {
                            id: 'sess-usr-001',
                            userId: 'super-admin-1',
                            name: 'Chief Systems Administrator',
                            email: 'superadmin@saaslink.ac.ke',
                            role: 'SuperAdmin',
                            schoolName: 'Central Platform Operations',
                            schoolCode: 'HQ-OPERATIONS',
                            ip: '197.237.112.4',
                            userAgent: 'Chrome 128 (macOS Sonoma)',
                            connectedAt: new Date(Date.now() - 48 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 12000).toISOString(),
                            currentPath: '/super-admin',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-002',
                            userId: 'usr-admin-alliance',
                            name: 'Dr. Christopher Kiptoo',
                            email: 'admin@alliancehigh.ac.ke',
                            role: 'Admin',
                            schoolName: 'Alliance High School',
                            schoolCode: 'AHS',
                            ip: '102.219.208.15',
                            userAgent: 'Firefox 129 (Windows 11)',
                            connectedAt: new Date(Date.now() - 115 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 45000).toISOString(),
                            currentPath: '/finance/fees',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-003',
                            userId: 'usr-tch-004',
                            name: 'Mwalimu Sarah Mwangi',
                            email: 's.mwangi@moigirls.ac.ke',
                            role: 'Teacher',
                            schoolName: 'Moi Girls Academy',
                            schoolCode: 'MGA',
                            ip: '41.89.24.11',
                            userAgent: 'Safari 17.5 (iOS 17.6)',
                            connectedAt: new Date(Date.now() - 25 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 15000).toISOString(),
                            currentPath: '/academics/grading',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-004',
                            userId: 'usr-prt-882',
                            name: 'Faith Odhiambo (Guardian)',
                            email: 'faith.o@gmail.com',
                            role: 'Parent',
                            schoolName: 'Nairobi Greenhill Academy',
                            schoolCode: 'NGA',
                            ip: '196.201.214.89',
                            userAgent: 'Chrome 128 (Android 14)',
                            connectedAt: new Date(Date.now() - 14 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 60000).toISOString(),
                            currentPath: '/parent/finances',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-005',
                            userId: 'usr-admin-lenana',
                            name: 'James Gitau (Finance Officer)',
                            email: 'bursar@lenanaschool.ac.ke',
                            role: 'Accountant',
                            schoolName: 'Lenana School',
                            schoolCode: 'LNA',
                            ip: '105.163.1.204',
                            userAgent: 'Edge 127 (Windows 10)',
                            connectedAt: new Date(Date.now() - 80 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 180000).toISOString(),
                            currentPath: '/payroll',
                            status: 'idle'
                        },
                        {
                            id: 'sess-usr-006',
                            userId: 'usr-tch-009',
                            name: 'David Kiprono',
                            email: 'd.kiprono@strathmore.ac.ke',
                            role: 'Teacher',
                            schoolName: 'Strathmore School',
                            schoolCode: 'STR',
                            ip: '197.156.134.12',
                            userAgent: 'Chrome 128 (macOS)',
                            connectedAt: new Date(Date.now() - 6 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 5000).toISOString(),
                            currentPath: '/my-class',
                            status: 'active'
                        }
                    ];

                    sendJson(200, {
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        uptimeSeconds: Math.floor(process.uptime()),
                        uptimeFormatted: '14d 6h 32m',
                        environment: process.env.NODE_ENV || 'development',
                        strictApiMode: false,
                        database: {
                            status: 'up',
                            engine: 'MySQL',
                            latencyMs: 2.3,
                            activeConnections: 4,
                            maxPoolSize: 10,
                            databaseName: 'saaslink_production',
                            details: 'TypeORM pooled connections via MySQL driver'
                        },
                        redis: {
                            status: 'connected',
                            latencyMs: 0.8,
                            hitRate: '99.4%',
                            totalKeys: 348,
                            usedMemory: '14.2 MB',
                            host: '127.0.0.1',
                            port: 6379
                        },
                        queues: {
                            bullmq: {
                                status: 'operational',
                                queueName: 'notifications',
                                waiting: 2,
                                active: 0,
                                completed: 2140,
                                failed: 1,
                                delayed: 0,
                                throughputPerMin: 48
                            }
                        },
                        system: {
                            heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                            heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                            rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
                            memoryPercentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
                            cpuLoadPercentage: 12,
                            nodeVersion: process.version,
                            platform: process.platform
                        },
                        onlineUsersSummary: {
                            totalOnline: onlineUsersList.length,
                            superAdminsOnline: 1,
                            schoolAdminsOnline: 2,
                            teachersOnline: 2,
                            parentsOnline: 1
                        },
                        onlineUsersList
                    });
                    return;
                }
                if (path === '/api/super-admin/online-users') {
                    sendJson(200, [
                        {
                            id: 'sess-usr-001',
                            userId: 'super-admin-1',
                            name: 'Chief Systems Administrator',
                            email: 'superadmin@saaslink.ac.ke',
                            role: 'SuperAdmin',
                            schoolName: 'Central Platform Operations',
                            schoolCode: 'HQ-OPERATIONS',
                            ip: '197.237.112.4',
                            userAgent: 'Chrome 128 (macOS Sonoma)',
                            connectedAt: new Date(Date.now() - 48 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 12000).toISOString(),
                            currentPath: '/super-admin',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-002',
                            userId: 'usr-admin-alliance',
                            name: 'Dr. Christopher Kiptoo',
                            email: 'admin@alliancehigh.ac.ke',
                            role: 'Admin',
                            schoolName: 'Alliance High School',
                            schoolCode: 'AHS',
                            ip: '102.219.208.15',
                            userAgent: 'Firefox 129 (Windows 11)',
                            connectedAt: new Date(Date.now() - 115 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 45000).toISOString(),
                            currentPath: '/finance/fees',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-003',
                            userId: 'usr-tch-004',
                            name: 'Mwalimu Sarah Mwangi',
                            email: 's.mwangi@moigirls.ac.ke',
                            role: 'Teacher',
                            schoolName: 'Moi Girls Academy',
                            schoolCode: 'MGA',
                            ip: '41.89.24.11',
                            userAgent: 'Safari 17.5 (iOS 17.6)',
                            connectedAt: new Date(Date.now() - 25 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 15000).toISOString(),
                            currentPath: '/academics/grading',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-004',
                            userId: 'usr-prt-882',
                            name: 'Faith Odhiambo (Guardian)',
                            email: 'faith.o@gmail.com',
                            role: 'Parent',
                            schoolName: 'Nairobi Greenhill Academy',
                            schoolCode: 'NGA',
                            ip: '196.201.214.89',
                            userAgent: 'Chrome 128 (Android 14)',
                            connectedAt: new Date(Date.now() - 14 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 60000).toISOString(),
                            currentPath: '/parent/finances',
                            status: 'active'
                        },
                        {
                            id: 'sess-usr-005',
                            userId: 'usr-admin-lenana',
                            name: 'James Gitau (Finance Officer)',
                            email: 'bursar@lenanaschool.ac.ke',
                            role: 'Accountant',
                            schoolName: 'Lenana School',
                            schoolCode: 'LNA',
                            ip: '105.163.1.204',
                            userAgent: 'Edge 127 (Windows 10)',
                            connectedAt: new Date(Date.now() - 80 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 180000).toISOString(),
                            currentPath: '/payroll',
                            status: 'idle'
                        },
                        {
                            id: 'sess-usr-006',
                            userId: 'usr-tch-009',
                            name: 'David Kiprono',
                            email: 'd.kiprono@strathmore.ac.ke',
                            role: 'Teacher',
                            schoolName: 'Strathmore School',
                            schoolCode: 'STR',
                            ip: '197.156.134.12',
                            userAgent: 'Chrome 128 (macOS)',
                            connectedAt: new Date(Date.now() - 6 * 60000).toISOString(),
                            lastActive: new Date(Date.now() - 5000).toISOString(),
                            currentPath: '/my-class',
                            status: 'active'
                        }
                    ]);
                    return;
                }
                if (path === '/api/super-admin/health/ping-db') {
                    sendJson(200, { success: true, latencyMs: 2.1, timestamp: new Date().toISOString() });
                    return;
                }
                if (path === '/api/super-admin/health/test-queue') {
                    sendJson(200, {
                        success: true,
                        jobId: `bull-job-${Date.now()}`,
                        message: 'BullMQ notification worker active and healthy. Test job processed in 14ms.',
                        latencyMs: 14
                    });
                    return;
                }
                if (path === '/api/super-admin/health/retry-failed-jobs') {
                    sendJson(200, { success: true, retriedCount: 1, message: 'All failed BullMQ jobs re-queued' });
                    return;
                }
                if (path === '/api/super-admin/pricing') {
                    if (req.method === 'PUT') {
                        readBody(body => {
                            pricing = { ...pricing, ...body };
                            sendJson(200, pricing);
                        });
                        return;
                    }
                    sendJson(200, pricing);
                    return;
                }
                if (path === '/api/super-admin/test-stk-push') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const phone = body.phone || '254712345678';
                            const amount = Number(body.amount) || 10;
                            const paybill = body.paybill || pricing.mpesaPaybill || '522522';
                            const hasKeys = !!(pricing.mpesaConsumerKey && pricing.mpesaPasskey);
                            sendJson(200, {
                                success: true,
                                simulated: !hasKeys,
                                message: hasKeys 
                                    ? `Live Safaricom STK push initiated to ${phone} for KES ${amount.toLocaleString()} via Paybill ${paybill}. Enter M-Pesa PIN on handset.`
                                    : `STK push simulated successfully to ${phone} for KES ${amount.toLocaleString()} via Paybill ${paybill}. (Configure Daraja Consumer Key & Passkey in Settings for live carrier dispatch).`,
                                checkoutRequestID: `ws_CO_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`,
                                merchantRequestID: `MR_${Date.now().toString(36).toUpperCase()}`,
                                responseCode: "0",
                                customerMessage: `Success. Request accepted for processing on mobile number ${phone}`
                            });
                        });
                        return;
                    }
                }
                if (path === '/api/super-admin/payments/card-checkout' || path === '/api/subscriptions/card-checkout') {
                    if (req.method === 'POST') {
                        readBody(body => {
                            const { schoolId, plan, billingCycle, amount, cardDetails } = body;
                            const targetSchool = schools.find(s => s.id === schoolId) || schools[0];
                            const checkoutAmount = Number(amount) || (plan === SubscriptionPlan.PREMIUM ? (billingCycle === 'ANNUALLY' ? (pricing.premiumAnnualPrice || 50000) : (pricing.premiumMonthlyPrice || 5000)) : (billingCycle === 'ANNUALLY' ? (pricing.basicAnnualPrice || 30000) : (pricing.basicMonthlyPrice || 3000)));
                            
                            const txCode = `STRIPE-CH_${Date.now().toString(36).toUpperCase()}`;
                            const now = new Date();
                            const newEnd = new Date();
                            newEnd.setDate(newEnd.getDate() + (billingCycle === 'ANNUALLY' ? 365 : 30));

                            if (targetSchool) {
                                targetSchool.plan = plan || targetSchool.plan;
                                targetSchool.billingCycle = billingCycle || 'ANNUALLY';
                                targetSchool.subscriptionStatus = SubscriptionStatus.ACTIVE;
                                targetSchool.startDate = now.toISOString().split('T')[0];
                                targetSchool.endDate = newEnd.toISOString().split('T')[0];
                            }

                            const newReceipt: any = {
                                id: `rec-saas-${Date.now()}`,
                                receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String(saasReceipts.length + 1).padStart(3, '0')}`,
                                invoiceNumber: `INV-SAAS-${Date.now().toString().slice(-4)}`,
                                schoolId: targetSchool?.id || 'sch-1',
                                schoolName: targetSchool?.name || 'School',
                                amount: checkoutAmount,
                                currency: 'KES',
                                paymentDate: now.toISOString().split('T')[0],
                                paymentMethod: 'Stripe / Credit Card',
                                transactionCode: txCode,
                                plan: plan || SubscriptionPlan.BASIC,
                                provisionedUntil: newEnd.toISOString().split('T')[0],
                                verifiedBy: 'Stripe Self-Checkout Engine',
                                notes: `Online card subscription checkout for ${plan} (${billingCycle}). Card ending in ${cardDetails?.last4 || '4242'}.`
                            };
                            saasReceipts = [newReceipt, ...saasReceipts];

                            sendJson(200, {
                                success: true,
                                transactionCode: txCode,
                                receipt: newReceipt,
                                school: targetSchool,
                                message: `Payment of KES ${checkoutAmount.toLocaleString()} processed successfully via Stripe. Institutional subscription active until ${newEnd.toLocaleDateString()}!`
                            });
                        });
                        return;
                    }
                }
                if (path === '/api/super-admin/payments') {
                    sendJson(200, saasReceipts);
                    return;
                }

                // Library
                if (path === '/api/library/books') {
                    sendJson(200, books);
                    return;
                }
                if (path === '/api/library/transactions') {
                    sendJson(200, []);
                    return;
                }

                // LMS Assignments & Homework
                if (path === '/api/lms/assignments') {
                    if (req.method === 'GET') {
                        const urlObj = new URL(url, 'http://localhost');
                        const classId = urlObj.searchParams.get('classId');
                        const subjectId = urlObj.searchParams.get('subjectId');
                        const teacherId = urlObj.searchParams.get('teacherId');
                        let filtered = [...lmsAssignments];
                        if (classId) filtered = filtered.filter(a => a.classId === classId);
                        if (subjectId) filtered = filtered.filter(a => a.subjectId === subjectId);
                        if (teacherId) filtered = filtered.filter(a => a.teacherId === teacherId);
                        sendJson(200, filtered);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newAssign = {
                                id: `lms-assign-${Date.now()}`,
                                ...body,
                                createdAt: new Date().toISOString(),
                                submittedCount: 0,
                                gradedCount: 0,
                                totalAssigned: students.filter(s => s.classId === body.classId).length || 5
                            };
                            lmsAssignments = [newAssign, ...lmsAssignments];
                            sendJson(201, newAssign);
                        });
                        return;
                    }
                }

                if (path.startsWith('/api/lms/assignments/')) {
                    const assignId = path.replace('/api/lms/assignments/', '');
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            const idx = lmsAssignments.findIndex(a => a.id === assignId);
                            if (idx >= 0) {
                                lmsAssignments[idx] = { ...lmsAssignments[idx], ...body, updatedAt: new Date().toISOString() };
                                sendJson(200, lmsAssignments[idx]);
                            } else {
                                sendJson(404, { error: 'Assignment not found' });
                            }
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        lmsAssignments = lmsAssignments.filter(a => a.id !== assignId);
                        lmsSubmissions = lmsSubmissions.filter(s => s.assignmentId !== assignId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // LMS Submissions
                if (path === '/api/lms/submissions') {
                    if (req.method === 'GET') {
                        const urlObj = new URL(url, 'http://localhost');
                        const assignmentId = urlObj.searchParams.get('assignmentId');
                        const studentId = urlObj.searchParams.get('studentId');
                        let filtered = [...lmsSubmissions];
                        if (assignmentId) filtered = filtered.filter(s => s.assignmentId === assignmentId);
                        if (studentId) filtered = filtered.filter(s => s.studentId === studentId);
                        sendJson(200, filtered);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const existingIndex = lmsSubmissions.findIndex(s => s.assignmentId === body.assignmentId && s.studentId === body.studentId);
                            const newSub = {
                                id: existingIndex >= 0 ? lmsSubmissions[existingIndex].id : `sub-${Date.now()}`,
                                ...body,
                                submittedAt: new Date().toISOString()
                            };
                            if (existingIndex >= 0) {
                                lmsSubmissions[existingIndex] = newSub;
                            } else {
                                lmsSubmissions = [newSub, ...lmsSubmissions];
                            }
                            // Update assignment counts
                            const assign = lmsAssignments.find(a => a.id === body.assignmentId);
                            if (assign) {
                                assign.submittedCount = lmsSubmissions.filter(s => s.assignmentId === body.assignmentId).length;
                            }
                            sendJson(201, newSub);
                        });
                        return;
                    }
                }

                if (path.startsWith('/api/lms/submissions/') && path.endsWith('/grade')) {
                    const subId = path.replace('/api/lms/submissions/', '').replace('/grade', '');
                    readBody(body => {
                        const sub = lmsSubmissions.find(s => s.id === subId);
                        if (sub) {
                            sub.score = body.score;
                            sub.gradeLetter = body.gradeLetter;
                            sub.teacherFeedback = body.teacherFeedback;
                            sub.gradedBy = body.gradedBy || 'Teacher';
                            sub.gradedAt = new Date().toISOString();
                            sub.status = body.status || 'Graded';
                            sub.rubricScores = body.rubricScores;
                            
                            // Update assignment gradedCount
                            const assign = lmsAssignments.find(a => a.id === sub.assignmentId);
                            if (assign) {
                                assign.gradedCount = lmsSubmissions.filter(s => s.assignmentId === sub.assignmentId && s.score !== null && s.score !== undefined).length;
                            }
                            sendJson(200, sub);
                        } else {
                            sendJson(404, { error: 'Submission not found' });
                        }
                    });
                    return;
                }

                // LMS Live Classes (Google Meet & Zoom)
                if (path === '/api/lms/live-classes') {
                    if (req.method === 'GET') {
                        const urlObj = new URL(url, 'http://localhost');
                        const classId = urlObj.searchParams.get('classId');
                        const status = urlObj.searchParams.get('status');
                        let filtered = [...lmsLiveClasses];
                        if (classId) filtered = filtered.filter(c => c.classId === classId);
                        if (status) filtered = filtered.filter(c => c.status === status);
                        sendJson(200, filtered);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newLive = {
                                id: `live-${Date.now()}`,
                                ...body,
                                attendeesCount: body.attendeesCount || 0,
                                createdAt: new Date().toISOString()
                            };
                            lmsLiveClasses = [newLive, ...lmsLiveClasses];
                            sendJson(201, newLive);
                        });
                        return;
                    }
                }

                if (path.startsWith('/api/lms/live-classes/')) {
                    const liveId = path.replace('/api/lms/live-classes/', '');
                    if (req.method === 'PATCH' || req.method === 'PUT') {
                        readBody(body => {
                            const idx = lmsLiveClasses.findIndex(c => c.id === liveId);
                            if (idx >= 0) {
                                lmsLiveClasses[idx] = { ...lmsLiveClasses[idx], ...body };
                                sendJson(200, lmsLiveClasses[idx]);
                            } else {
                                sendJson(404, { error: 'Live class not found' });
                            }
                        });
                        return;
                    }
                    if (req.method === 'DELETE') {
                        lmsLiveClasses = lmsLiveClasses.filter(c => c.id !== liveId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // EdTech News & Articles (Public & Super Admin)
                if (path === '/api/edtech-news' || path === '/api/super-admin/edtech-news') {
                    if (req.method === 'GET') {
                        const urlObj = new URL(url, 'http://localhost');
                        const status = urlObj.searchParams.get('status');
                        const category = urlObj.searchParams.get('category');
                        let results = [...edTechArticles];
                        if (status) {
                            results = results.filter(a => a.status === status);
                        }
                        if (category && category !== 'ALL') {
                            results = results.filter(a => a.category.toLowerCase() === category.toLowerCase());
                        }
                        sendJson(200, results);
                        return;
                    }

                    if (req.method === 'POST') {
                        readBody(body => {
                            const newArticle = {
                                id: body.id || `article-${Date.now()}`,
                                slug: body.slug || (body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `article-${Date.now()}`),
                                title: body.title || 'Untitled EdTech Article',
                                category: body.category || 'CBC Curriculum',
                                date: body.date || new Date().toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' }),
                                readTime: body.readTime || '4 min read',
                                excerpt: body.excerpt || '',
                                author: body.author || 'SaasLink Editorial Board',
                                authorRole: body.authorRole || 'Educational Research Division',
                                authorAvatar: body.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
                                coverImageUrl: body.coverImageUrl || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
                                content: Array.isArray(body.content) ? body.content : [body.content || ''],
                                tags: Array.isArray(body.tags) ? body.tags : [],
                                status: body.status || 'PUBLISHED',
                                featured: Boolean(body.featured),
                                learningObjectives: Array.isArray(body.learningObjectives) ? body.learningObjectives : [],
                                media: Array.isArray(body.media) ? body.media : [],
                                viewsCount: body.viewsCount || 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };
                            edTechArticles = [newArticle, ...edTechArticles];
                            sendJson(201, newArticle);
                        });
                        return;
                    }
                }

                if (path.startsWith('/api/edtech-news/') || path.startsWith('/api/super-admin/edtech-news/')) {
                    const articleId = path.split('/').pop();
                    const isToggleStatus = path.endsWith('/toggle-status');
                    const isToggleFeatured = path.endsWith('/toggle-featured');

                    if (isToggleStatus) {
                        const targetId = path.split('/')[4];
                        const idx = edTechArticles.findIndex(a => a.id === targetId || a.slug === targetId);
                        if (idx >= 0) {
                            edTechArticles[idx].status = edTechArticles[idx].status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
                            edTechArticles[idx].updatedAt = new Date().toISOString();
                            sendJson(200, edTechArticles[idx]);
                        } else {
                            sendJson(404, { error: 'Article not found' });
                        }
                        return;
                    }

                    if (isToggleFeatured) {
                        const targetId = path.split('/')[4];
                        const idx = edTechArticles.findIndex(a => a.id === targetId || a.slug === targetId);
                        if (idx >= 0) {
                            edTechArticles[idx].featured = !edTechArticles[idx].featured;
                            edTechArticles[idx].updatedAt = new Date().toISOString();
                            sendJson(200, edTechArticles[idx]);
                        } else {
                            sendJson(404, { error: 'Article not found' });
                        }
                        return;
                    }

                    if (req.method === 'GET') {
                        const art = edTechArticles.find(a => a.id === articleId || a.slug === articleId);
                        if (art) {
                            art.viewsCount = (art.viewsCount || 0) + 1;
                            sendJson(200, art);
                        } else {
                            sendJson(404, { error: 'Article not found' });
                        }
                        return;
                    }

                    if (req.method === 'PUT' || req.method === 'PATCH') {
                        readBody(body => {
                            const idx = edTechArticles.findIndex(a => a.id === articleId || a.slug === articleId);
                            if (idx >= 0) {
                                edTechArticles[idx] = {
                                    ...edTechArticles[idx],
                                    ...body,
                                    updatedAt: new Date().toISOString()
                                };
                                sendJson(200, edTechArticles[idx]);
                            } else {
                                sendJson(404, { error: 'Article not found' });
                            }
                        });
                        return;
                    }

                    if (req.method === 'DELETE') {
                        edTechArticles = edTechArticles.filter(a => a.id !== articleId && a.slug !== articleId);
                        sendJson(200, { success: true });
                        return;
                    }
                }

                // AI Financial Summary
                if (path === '/api/ai/financial-summary') {
                    const totalRevenue = transactions.filter(t => t.type === 'Payment').reduce((sum, t) => sum + t.amount, 0);
                    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
                    sendJson(200, {
                        summary: `**Institutional Financial Summary (Term 1 2026)**\n\n- **Total Revenue Collected**: KES ${totalRevenue.toLocaleString()}\n- **Total Operating Expenses**: KES ${totalExpenses.toLocaleString()}\n- **Net Operational Balance**: KES ${(totalRevenue - totalExpenses).toLocaleString()}\n- **Fee Collection Efficiency**: 82.4%\n- **Top Expense Category**: Utilities & Stationery Supplies\n\n*Recommendation*: Maintain disciplined cashflow reserves while preparing for upcoming mid-term facility maintenance.`
                    });
                    return;
                }

                // Fallback for any other API routes
                sendJson(200, { success: true, data: [] });
            });
        }
    };
}
