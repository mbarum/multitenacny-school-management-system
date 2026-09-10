import type { Plugin } from 'vite';
import {
    initialSchoolInfo, initialPricing, initialUsers, initialStudents,
    initialClasses, initialSubjects, initialAssignments, initialTimetable,
    initialExams, initialGrades, initialAttendance, initialStaff,
    initialPayrollItems, initialPayrollHistory, initialTransactions,
    initialExpenses, initialAnnouncements, initialCommunicationLogs,
    initialGradingRules, initialFeeStructure, initialDarajaSettings, initialBooks
} from '../data/mockData';
import { EXCHANGE_RATES } from '../utils/currency';

export function viteApiPlugin(): Plugin {
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

    return {
        name: 'saaslink-mock-api-plugin',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url || '';

                if (!url.startsWith('/api')) {
                    if (url.startsWith('/public/uploads/')) {
                        res.writeHead(200, { 'Content-Type': 'image/png' });
                        res.end('');
                        return;
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
                            callback({});
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
                    const user = users.find(u => u.id === token) || users[0];
                    sendJson(200, user);
                    return;
                }

                if (path === '/api/auth/login') {
                    readBody(body => {
                        const email = (body.email || '').toLowerCase().trim();
                        let user = users.find(u => u.email.toLowerCase() === email);
                        if (!user && email.includes('@')) {
                            const matchedStudent = students.find(s => s.guardianEmail && s.guardianEmail.toLowerCase().trim() === email);
                            if (matchedStudent) {
                                user = {
                                    id: `user-parent-${matchedStudent.id}`,
                                    name: matchedStudent.guardianName || `Guardian of ${matchedStudent.name}`,
                                    email: email,
                                    role: 'Parent' as any,
                                    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
                                    status: 'Active' as const,
                                    schoolId: schoolInfo.id || 'school-1'
                                };
                                users.push(user);
                            }
                        }
                        if (!user) user = users[0];
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

                if (path === '/api/auth/register-school') {
                    readBody(body => {
                        const newSchool = {
                            ...schoolInfo,
                            name: body.schoolName || schoolInfo.name,
                            email: body.email || schoolInfo.email,
                            phone: body.phone || schoolInfo.phone
                        };
                        const newUser = {
                            id: `user-${Date.now()}`,
                            name: body.adminName || 'School Admin',
                            email: body.email || 'admin@school.com',
                            role: 'Admin' as any,
                            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
                            status: 'Active' as const,
                            schoolId: newSchool.id
                        };
                        users.push(newUser);
                        schoolInfo = newSchool;
                        sendJson(200, { user: newUser, token: newUser.id, school: newSchool });
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

                    sendJson(200, {
                        totalStudents: students.length,
                        totalStaff: staff.length,
                        totalRevenue,
                        totalExpenses,
                        totalProfit,
                        feesOverdue,
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

                // Staff
                if (path === '/api/staff') {
                    if (req.method === 'GET') {
                        sendJson(200, staff);
                        return;
                    }
                    if (req.method === 'POST') {
                        readBody(body => {
                            const newStaff = {
                                id: `staff-${Date.now()}`,
                                photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
                                ...body
                            };
                            staff.push(newStaff);
                            sendJson(201, newStaff);
                        });
                        return;
                    }
                }

                // Payroll
                if (path === '/api/payroll/payroll-items') {
                    sendJson(200, payrollItems);
                    return;
                }
                if (path === '/api/payroll/payroll-history') {
                    sendJson(200, payrollHistory);
                    return;
                }
                if (path === '/api/payroll/generate') {
                    readBody(body => {
                        payrollHistory = Array.isArray(body) ? [...body, ...payrollHistory] : payrollHistory;
                        sendJson(200, payrollHistory);
                    });
                    return;
                }

                // Academics
                if (path === '/api/academics/classes') {
                    sendJson(200, classes);
                    return;
                }
                if (path === '/api/academics/subjects') {
                    sendJson(200, subjects);
                    return;
                }
                if (path === '/api/academics/class-subject-assignments') {
                    sendJson(200, assignments);
                    return;
                }
                if (path === '/api/academics/timetable-entries') {
                    sendJson(200, timetable);
                    return;
                }
                if (path === '/api/academics/exams') {
                    sendJson(200, exams);
                    return;
                }
                if (path === '/api/academics/grades') {
                    sendJson(200, grades);
                    return;
                }
                if (path === '/api/academics/attendance-records') {
                    sendJson(200, attendance);
                    return;
                }
                if (path === '/api/academics/events') {
                    sendJson(200, []);
                    return;
                }
                if (path === '/api/academics/grading-scale') {
                    sendJson(200, gradingRules);
                    return;
                }
                if (path === '/api/academics/fee-structure') {
                    sendJson(200, feeStructure);
                    return;
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
                        readBody(body => {
                            const to = Array.isArray(body.to) ? body.to.join(', ') : (body.to || 'Guardian');
                            const subject = body.subject || 'School Portal Notification';
                            const plainText = (body.body || '').replace(/<[^>]*>?/gm, '').trim();
                            const newLog: any = {
                                id: `log-${Date.now()}`,
                                recipient: to,
                                channel: 'Email',
                                message: `[${subject}] ${plainText}`,
                                status: 'Delivered',
                                timestamp: new Date().toISOString()
                            };
                            communicationLogs.unshift(newLog);
                            sendJson(200, { success: true, message: `Email delivered to ${to}`, log: newLog });
                        });
                        return;
                    }
                }
                if (path === '/api/communications/communication-logs') {
                    sendJson(200, communicationLogs);
                    return;
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
                    sendJson(200, {
                        totalSchools: 1,
                        activeSubscriptions: 1,
                        monthlyRecurringRevenue: 5000,
                        totalPlatformUsers: users.length,
                        systemUptime: '99.98%'
                    });
                    return;
                }
                if (path === '/api/super-admin/schools') {
                    sendJson(200, [
                        {
                            ...schoolInfo,
                            studentCount: students.length,
                            staffCount: staff.length,
                            subscriptionStatus: 'ACTIVE',
                            plan: 'PREMIUM'
                        }
                    ]);
                    return;
                }
                if (path === '/api/super-admin/health') {
                    sendJson(200, { status: 'healthy', database: 'connected', redis: 'active' });
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
                if (path === '/api/super-admin/payments') {
                    sendJson(200, []);
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
