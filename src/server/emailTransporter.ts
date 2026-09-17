// src/server/emailTransporter.ts
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
    rejectUnauthorized: boolean;
}

/**
 * Parses the .env file if available in the workspace root, fallback to process.env
 */
function readEnvFile(): Record<string, string> {
    const envVars: Record<string, string> = {};
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    let val = trimmed.slice(eqIdx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    envVars[key] = val;
                }
            }
        } catch (e) {
            console.error('[emailTransporter] Error reading .env:', e);
        }
    }
    return envVars;
}

export function getSmtpConfig(): SmtpConfig {
    const envFile = readEnvFile();
    const host = process.env.SMTP_HOST || envFile.SMTP_HOST || 'smtp.mailgun.org';
    const port = Number(process.env.SMTP_PORT || envFile.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || envFile.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || envFile.SMTP_PASS || '';
    const from = process.env.SMTP_FROM || envFile.SMTP_FROM || '"Saaslink School Management" <no-reply@saaslink.co.ke>';
    const rejectUnauthorized = (process.env.SMTP_REJECT_UNAUTHORIZED || envFile.SMTP_REJECT_UNAUTHORIZED) !== 'false';
    const secure = port === 465;

    return {
        host,
        port,
        user,
        pass,
        from,
        secure,
        rejectUnauthorized
    };
}

/**
 * Creates and returns a configured Nodemailer Transporter
 */
export function createTransporter(customConfig?: Partial<SmtpConfig>): nodemailer.Transporter {
    const config = { ...getSmtpConfig(), ...(customConfig || {}) };

    const transportOptions: any = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
            rejectUnauthorized: config.rejectUnauthorized
        }
    };

    if (config.user || config.pass) {
        transportOptions.auth = {
            user: config.user,
            pass: config.pass
        };
    }

    return nodemailer.createTransport(transportOptions);
}

/**
 * Verifies SMTP connection and authentication
 */
export async function verifySmtpConnection(customConfig?: Partial<SmtpConfig>): Promise<{ success: boolean; message: string; error?: string }> {
    const config = { ...getSmtpConfig(), ...(customConfig || {}) };
    
    if (!config.host) {
        return { success: false, message: 'SMTP Host is missing in .env or settings.' };
    }
    
    try {
        const transporter = createTransporter(config);
        await transporter.verify();
        return {
            success: true,
            message: `SMTP connection established successfully to ${config.host}:${config.port}`
        };
    } catch (err: any) {
        return {
            success: false,
            message: `SMTP Handshake Failed: ${err.message || 'Unknown error'}`,
            error: err.code || err.message
        };
    }
}

/**
 * Dispatches a real production email through Nodemailer
 */
export async function sendProductionEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}): Promise<{ success: boolean; message: string; messageId?: string; accepted?: any[]; response?: string; error?: string }> {
    const config = getSmtpConfig();
    const transporter = createTransporter();

    const recipients = Array.isArray(params.to) ? params.to.join(', ') : params.to;
    const plainText = params.text || params.html.replace(/<[^>]*>?/gm, '').trim();
    const fromAddress = params.from || config.from;

    const mailOptions = {
        from: fromAddress,
        to: recipients,
        subject: params.subject,
        html: params.html,
        text: plainText,
        replyTo: params.replyTo || undefined
    };

    console.log(`[SMTP] Attempting delivery to ${recipients} via ${config.host}:${config.port}...`);

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Delivered messageId: ${info.messageId} | Response: ${info.response}`);
        return {
            success: true,
            message: `Email successfully delivered to ${recipients}`,
            messageId: info.messageId,
            accepted: info.accepted,
            response: info.response
        };
    } catch (err: any) {
        console.error(`[SMTP ERROR] Delivery failed to ${recipients}:`, err.message);
        
        // Provide clear diagnostics for common SMTP setup issues
        let helpfulMessage = err.message;
        if (err.code === 'EAUTH' || err.message?.toLowerCase().includes('auth')) {
            helpfulMessage = `SMTP Authentication failed with ${config.host}. Please verify SMTP_USER and SMTP_PASS in .env. (${err.message})`;
        } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
            helpfulMessage = `SMTP Connection timed out connecting to ${config.host}:${config.port}. Verify host and port in .env. (${err.message})`;
        }

        return {
            success: false,
            message: helpfulMessage,
            error: err.code || err.message
        };
    }
}

/**
 * Updates or adds SMTP configuration variables to the .env file in project root
 */
export function updateEnvSmtpConfig(newConfig: Partial<SmtpConfig>): { success: boolean; message: string } {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

        const updates: Record<string, string | undefined> = {
            SMTP_HOST: newConfig.host,
            SMTP_PORT: newConfig.port ? String(newConfig.port) : undefined,
            SMTP_USER: newConfig.user,
            SMTP_PASS: newConfig.pass,
            SMTP_FROM: newConfig.from,
            SMTP_REJECT_UNAUTHORIZED: newConfig.rejectUnauthorized !== undefined ? String(newConfig.rejectUnauthorized) : undefined
        };

        for (const [key, val] of Object.entries(updates)) {
            if (val === undefined) continue;
            
            // Apply to process.env immediately for hot runtime updates
            process.env[key] = val;

            const regex = new RegExp(`^${key}=.*$`, 'm');
            const newLine = `${key}=${val.includes(' ') && !val.startsWith('"') ? `"${val}"` : val}`;

            if (regex.test(content)) {
                content = content.replace(regex, newLine);
            } else {
                content += `\n${newLine}`;
            }
        }

        fs.writeFileSync(envPath, content, 'utf8');
        console.log('[SMTP] .env updated with new SMTP parameters');
        return { success: true, message: 'SMTP configuration updated in .env successfully' };
    } catch (err: any) {
        console.error('[SMTP] Failed to write .env file:', err);
        return { success: false, message: `Failed to update .env: ${err.message}` };
    }
}
