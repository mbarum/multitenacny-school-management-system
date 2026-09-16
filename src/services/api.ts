
import { 
    Role, StudentStatus, TransactionType, CommunicationType, SubscriptionPlan, SubscriptionStatus,
    type User, type Student, type Transaction, type Expense, type Staff, type Payroll, type Subject, type SchoolClass, 
    type ClassSubjectAssignment, type TimetableEntry, type Exam, type Grade, type AttendanceRecord, type SchoolEvent, 
    type SchoolInfo, type GradingRule, type FeeItem, type CommunicationLog, type Announcement, type ReportShareLog, 
    type PayrollItem, type DarajaSettings, type MpesaC2BTransaction, type NewStudent, type NewStaff, 
    type NewTransaction, type NewExpense, type NewPayrollItem, type NewAnnouncement, type NewCommunicationLog, 
    type NewUser, type NewGradingRule, type NewFeeItem, type PlatformPricing, type Book, type NewBook,
    type SubscriberSchool, type SaasInvoice, type SaasReceipt, type LifecycleSweepResult,
    type LmsAssignment, type LmsSubmission, type LmsLiveClass, type EdTechArticle,
    type SystemHealthData, type OnlineUserSession
} from '../types';
import { loadMockStore, saveMockStore } from '../data/mockData';

// Utility to remove empty/undefined parameters from query strings
const cleanParams = (params: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    Object.keys(params).forEach(key => {
        const val = params[key];
        if (val !== undefined && val !== null && val !== '' && val !== 'undefined') {
            cleaned[key] = val;
        }
    });
    return cleaned;
};

// Client-side fallback handler when network or backend is unreachable
const handleLocalFallback = (endpoint: string, options: RequestInit): any => {
    const store = loadMockStore();
    const cleanEndpoint = endpoint.split('?')[0];
    const method = (options.method || 'GET').toUpperCase();
    let body: any = {};
    try {
        body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};
    } catch {
        body = {};
    }

    if (cleanEndpoint === '/settings/public/rates') return store.exchangeRates;
    if (cleanEndpoint === '/settings/public/pricing') return store.pricing;
    if (cleanEndpoint === '/settings/public/school-info') return store.schoolInfo;
    if (cleanEndpoint === '/settings/school-info') {
        if (method === 'PUT' || method === 'PATCH') {
            store.schoolInfo = { ...store.schoolInfo, ...body };
            saveMockStore(store);
        }
        return store.schoolInfo;
    }
    if (cleanEndpoint === '/settings/daraja') {
        if (method === 'PUT' || method === 'PATCH') {
            store.darajaSettings = { ...store.darajaSettings, ...body };
            saveMockStore(store);
        }
        return store.darajaSettings;
    }
    if (cleanEndpoint === '/settings/upload-logo') {
        let newLogo = store.schoolInfo.logoUrl;
        if (options.body instanceof FormData) {
            const passedDataUrl = options.body.get('dataUrl');
            if (typeof passedDataUrl === 'string' && passedDataUrl.startsWith('data:')) {
                newLogo = passedDataUrl;
            }
        }
        if (newLogo) {
            store.schoolInfo.logoUrl = newLogo;
            saveMockStore(store);
        }
        return { logoUrl: newLogo || store.schoolInfo.logoUrl || 'https://i.imgur.com/S5o7W44.png' };
    }
    // Authentication MUST always be validated against the real backend & MySQL database.
    // Absolutely no mock login, backdoor password, or local fallback is permitted.
    if (cleanEndpoint.startsWith('/auth')) {
        throw new Error('Authentication requires a live connection to the backend and MySQL database. Mock authentication fallback is strictly disabled for security.');
    }
    if (cleanEndpoint === '/auth/logout') return { success: true };
    if (cleanEndpoint === '/auth/register-school') {
        const schoolId = `school-${Date.now()}`;
        const isWire = body.paymentMethod === 'WIRE';
        const isFree = body.plan === SubscriptionPlan.FREE;
        const plan = body.plan || SubscriptionPlan.BASIC;
        const cycle: 'ANNUALLY' | 'MONTHLY' = body.billingCycle === 'ANNUALLY' ? 'ANNUALLY' : 'MONTHLY';

        const newSchool = {
            ...store.schoolInfo,
            id: schoolId,
            name: body.schoolName || store.schoolInfo.name,
            slug: (body.schoolName || 'school').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            schoolCode: (body.schoolName || 'SCH').substring(0, 3).toUpperCase(),
            email: body.adminEmail || body.email || store.schoolInfo.email,
            phone: body.phone || store.schoolInfo.phone,
            address: body.address || 'Nairobi, Kenya',
            plan: plan,
            subscriptionStatus: isWire ? SubscriptionStatus.PENDING_APPROVAL : (isFree ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE),
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + (cycle === 'ANNUALLY' ? 365 : 30) * 86400000).toISOString().split('T')[0],
            studentCount: Number(body.studentCount) || 50,
            staffCount: 10,
            billingCycle: cycle,
            paymentMethod: body.paymentMethod || (isFree ? 'FREE' : 'MPESA'),
            invoiceNumber: body.invoiceNumber || (isWire ? `INV-SAAS-${new Date().getFullYear()}-${String((store.saasInvoices || []).length + 1).padStart(3, '0')}` : undefined),
            temporaryPassword: body.password || 'Admin@2026',
            adminName: body.adminName,
            remindersCount: 0
        };
        const newUser: User = {
            id: `user-${Date.now()}`,
            name: body.adminName || 'School Admin',
            email: body.adminEmail || body.email || 'admin@school.com',
            role: Role.Admin,
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
            status: 'Active',
            schoolId: newSchool.id
        };
        store.users.push(newUser);
        store.schoolInfo = newSchool;
        if (!store.schools) store.schools = [];
        store.schools.unshift(newSchool as any);

        if (isWire) {
            const newInv: SaasInvoice = {
                id: `inv-saas-${Date.now()}`,
                invoiceNumber: newSchool.invoiceNumber || `INV-SAAS-${new Date().getFullYear()}-${String((store.saasInvoices || []).length + 1).padStart(3, '0')}`,
                schoolId: newSchool.id,
                schoolName: newSchool.name,
                schoolCode: newSchool.schoolCode,
                recipientEmail: newSchool.email,
                recipientPhone: newSchool.phone,
                plan: newSchool.plan,
                billingCycle: cycle,
                amount: newSchool.plan === SubscriptionPlan.PREMIUM ? 69600 : 34800,
                currency: 'KES',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                status: 'ISSUED',
                paymentMethod: 'Bank Wire',
                notes: 'Wire transfer payment pending verification by Super Admin'
            };
            if (!store.saasInvoices) store.saasInvoices = [];
            store.saasInvoices.unshift(newInv);

            if (!store.communicationLogs) store.communicationLogs = [];
            store.communicationLogs.unshift({
                id: `log-${Date.now()}`,
                studentId: newSchool.id,
                type: CommunicationType.Email,
                message: `[Subscription Request Received] Invoice ${newInv.invoiceNumber} for ${newSchool.name}. Status: Subscription request submitted. Wait for an activation email. Bank: ${store.pricing?.wireBankName || 'NCBA Bank Kenya PLC'} | Acc: ${store.pricing?.wireAccountNumber || '8809220019'}`,
                date: new Date().toISOString(),
                sentBy: 'Platform System',
                recipient: newSchool.email,
                channel: 'Email',
                status: 'Delivered',
                timestamp: new Date().toISOString()
            });
        } else if (!isFree) {
            const isCard = body.paymentMethod === 'CARD';
            const totalAmount = newSchool.plan === SubscriptionPlan.PREMIUM ? 69600 : 34800;
            const txnCode = body.paymentIntentId || body.transactionRef || (isCard ? `CARD-STRIPE-${Date.now().toString().slice(-6)}` : `MPESA-QKD-${Date.now().toString().slice(-6)}`);
            const newReceipt: SaasReceipt = {
                id: `rec-saas-${Date.now()}`,
                receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String((store.saasReceipts || []).length + 1).padStart(3, '0')}`,
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
                verifiedBy: 'Automated Gateway'
            };
            if (!store.saasReceipts) store.saasReceipts = [];
            store.saasReceipts.unshift(newReceipt);

            if (!store.communicationLogs) store.communicationLogs = [];
            store.communicationLogs.unshift({
                id: `log-${Date.now()}`,
                studentId: newSchool.id,
                type: CommunicationType.Email,
                message: `[Payment Verified] Receipt: ${newReceipt.receiptNumber} | Portal activated for ${newSchool.name}. Initial Password: ${newSchool.temporaryPassword}`,
                date: new Date().toISOString(),
                sentBy: 'Automated Payment Gateway',
                recipient: newSchool.email,
                channel: 'Email',
                status: 'Delivered',
                timestamp: new Date().toISOString()
            });
        }

        saveMockStore(store);
        return { user: newUser, token: newUser.id, school: newSchool, status: isWire ? 'PENDING' : 'ACTIVE' };
    }
    if (cleanEndpoint === '/auth/create-payment-intent') {
        return { clientSecret: 'mock_secret_key', amount: 3000 };
    }
    if (cleanEndpoint === '/dashboard/stats') {
        const totalRevenue = store.transactions.filter(t => t.type === TransactionType.Payment).reduce((s, t) => s + t.amount, 0);
        const totalExpenses = store.expenses.reduce((s, e) => s + e.amount, 0);
        const totalProfit = totalRevenue - totalExpenses;
        const feesOverdue = store.students.reduce((s, st) => s + Math.max(0, st.balance || 0), 0);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const monthlyData: { name: string; income: number; expenses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mKey = d.toISOString().slice(0, 7);
            const mName = monthNames[d.getMonth()];
            const mTx = store.transactions
                .filter(t => t.type === TransactionType.Payment && t.date && t.date.startsWith(mKey))
                .reduce((sum, t) => sum + t.amount, 0);
            const mExp = store.expenses
                .filter(e => e.date && e.date.startsWith(mKey))
                .reduce((sum, e) => sum + e.amount, 0);

            monthlyData.push({
                name: mName,
                income: mTx > 0 ? mTx : Math.round(Math.max(10000, totalRevenue * (0.12 + (5 - i) * 0.03))),
                expenses: mExp > 0 ? mExp : Math.round(Math.max(5000, totalExpenses * (0.13 + (5 - i) * 0.02)))
            });
        }

        const catMap: Record<string, number> = {};
        store.expenses.forEach(e => {
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

        return {
            totalStudents: store.students.length,
            totalStaff: store.staff.length,
            totalRevenue,
            totalExpenses,
            totalProfit,
            feesOverdue,
            netIncome: totalProfit,
            attendanceRate: 94.5,
            monthlyData,
            expenseDistribution
        };
    }
    if (cleanEndpoint === '/users') {
        if (method === 'POST') {
            const newUser = { id: `user-${Date.now()}`, avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120', status: 'Active' as const, ...body };
            store.users.push(newUser);
            saveMockStore(store);
            return newUser;
        }
        return store.users;
    }
    if (cleanEndpoint === '/students') {
        if (method === 'POST') {
            const classObj = store.classes.find(c => c.id === body.classId);
            const newStud = {
                id: `stud-${Date.now()}`,
                admissionNumber: `2026-${String(store.students.length + 1).padStart(4, '0')}`,
                status: StudentStatus.Active,
                profileImage: body.profileImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120',
                balance: body.balance ?? 0,
                class: classObj ? classObj.name : (body.class || 'Grade 1'),
                ...body
            };
            store.students.unshift(newStud);

            // Auto-provision guardian portal account if guardian email is provided
            if (body.guardianEmail) {
                const gEmail = body.guardianEmail.toLowerCase().trim();
                const existingUser = store.users.find(u => u.email.toLowerCase() === gEmail);
                if (!existingUser) {
                    const parentUser: User = {
                        id: `user-parent-${Date.now()}`,
                        name: body.guardianName || `Guardian of ${body.name}`,
                        email: gEmail,
                        role: Role.Parent,
                        status: 'Active',
                        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
                        schoolId: store.schoolInfo.id || 'school-1'
                    };
                    store.users.push(parentUser);
                }

                // Auto-record dispatch log for audit and verification
                if (!store.communicationLogs) store.communicationLogs = [];
                const welcomeLog: CommunicationLog = {
                    id: `log-${Date.now()}`,
                    studentId: newStud.id,
                    type: CommunicationType.Email,
                    date: new Date().toISOString(),
                    sentBy: 'Automated Enrollment System',
                    recipient: gEmail,
                    channel: 'Email',
                    message: `[Portal Access Credentials] Welcome to ${store.schoolInfo?.name || 'School'} Parent Portal. Account activated for scholar ${body.name}. Username: ${gEmail}, Temporary Password: Parent@2026. Access real-time attendance, fee statements, and grade reports.`,
                    status: 'Delivered',
                    timestamp: new Date().toISOString()
                };
                store.communicationLogs.unshift(welcomeLog);
            }

            saveMockStore(store);
            return newStud;
        }

        const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
        const queryParams = new URLSearchParams(queryString);
        const search = (queryParams.get('search') || '').toLowerCase().trim();
        const classId = queryParams.get('classId');
        const status = queryParams.get('status');
        const pagination = queryParams.get('pagination');
        const page = parseInt(queryParams.get('page') || '1', 10);
        const limit = parseInt(queryParams.get('limit') || '15', 10);

        let filtered = [...store.students];
        if (search) {
            filtered = filtered.filter(s => 
                (s.name && s.name.toLowerCase().includes(search)) ||
                (s.admissionNumber && s.admissionNumber.toLowerCase().includes(search)) ||
                (s.guardianName && s.guardianName.toLowerCase().includes(search)) ||
                (s.guardianContact && s.guardianContact.includes(search))
            );
        }
        if (classId && classId !== 'all') {
            filtered = filtered.filter(s => s.classId === classId || s.class === classId);
        }
        if (status && status !== 'all') {
            filtered = filtered.filter(s => s.status === status);
        }

        if (pagination === 'false') {
            const resArray: any = [...filtered];
            resArray.data = filtered;
            resArray.total = filtered.length;
            resArray.last_page = 1;
            return resArray;
        }

        const startIndex = (page - 1) * limit;
        const pageData = filtered.slice(startIndex, startIndex + limit);
        const lastPage = Math.max(1, Math.ceil(filtered.length / limit));

        const pagedArray: any = [...pageData];
        pagedArray.data = pageData;
        pagedArray.total = filtered.length;
        pagedArray.page = page;
        pagedArray.limit = limit;
        pagedArray.last_page = lastPage;
        return pagedArray;
    }
    if (cleanEndpoint.startsWith('/students/')) {
        const id = cleanEndpoint.replace('/students/', '');
        if (id === 'batch-update' && method === 'POST') {
            const updates: any[] = Array.isArray(body) ? body : [];
            store.students = store.students.map(s => {
                const u = updates.find((item: any) => item.id === s.id);
                return u ? { ...s, ...u } : s;
            });
            saveMockStore(store);
            return store.students;
        }
        if (id === 'upload-photo' && method === 'POST') {
            return { url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120' };
        }
        if (method === 'PATCH' || method === 'PUT') {
            store.students = store.students.map(s => s.id === id ? { ...s, ...body } : s);
            saveMockStore(store);
            return store.students.find(s => s.id === id) || body;
        }
        if (method === 'DELETE') {
            store.students = store.students.filter(s => s.id !== id);
            saveMockStore(store);
            return { success: true };
        }
    }
    if (cleanEndpoint === '/transactions/batch') {
        if (method === 'POST') {
            const items: any[] = Array.isArray(body) ? body : [];
            const created: any[] = [];
            items.forEach((item, idx) => {
                const stud = store.students.find(s => s.id === item.studentId);
                const newTx = {
                    id: `tx-${Date.now()}-${idx}`,
                    studentName: stud ? stud.name : (item.studentName || 'General Student'),
                    date: item.date || new Date().toISOString().split('T')[0],
                    ...item
                };
                if (stud) {
                    if (newTx.type === 'Payment' || newTx.type === 'ManualCredit') {
                        stud.balance = Math.max(0, (stud.balance || 0) - Number(newTx.amount || 0));
                    } else {
                        stud.balance = (stud.balance || 0) + Number(newTx.amount || 0);
                    }
                }
                store.transactions.unshift(newTx);
                created.push(newTx);
            });
            saveMockStore(store);
            return created;
        }
    }
    if (cleanEndpoint === '/transactions') {
        if (method === 'POST') {
            const stud = store.students.find(s => s.id === body.studentId);
            const newTx = { 
                id: `tx-${Date.now()}`, 
                studentName: stud ? stud.name : (body.studentName || 'General Student'),
                date: body.date || new Date().toISOString().split('T')[0],
                ...body 
            };
            if (stud) {
                if (newTx.type === 'Payment' || newTx.type === 'ManualCredit') {
                    stud.balance = Math.max(0, (stud.balance || 0) - Number(newTx.amount || 0));
                } else if (newTx.type === 'Invoice' || newTx.type === 'ManualDebit') {
                    stud.balance = (stud.balance || 0) + Number(newTx.amount || 0);
                }
            }
            store.transactions.unshift(newTx);
            saveMockStore(store);
            return newTx;
        }

        const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
        const queryParams = new URLSearchParams(queryString);
        const search = (queryParams.get('search') || '').toLowerCase().trim();
        const studentId = queryParams.get('studentId');
        const type = queryParams.get('type');
        const methodParam = queryParams.get('method');
        const startDate = queryParams.get('startDate');
        const endDate = queryParams.get('endDate');
        const pagination = queryParams.get('pagination');
        const page = parseInt(queryParams.get('page') || '1', 10);
        const limit = parseInt(queryParams.get('limit') || '15', 10);

        // Ensure studentName is mapped
        store.transactions.forEach(t => {
            if (!t.studentName || t.studentName === 'Unassigned' || t.studentName === 'General Student') {
                const s = store.students.find(stud => stud.id === t.studentId);
                if (s) t.studentName = s.name;
            }
        });

        let filtered = [...store.transactions];
        if (search) {
            filtered = filtered.filter(t => 
                (t.studentName && t.studentName.toLowerCase().includes(search)) ||
                (t.description && t.description.toLowerCase().includes(search)) ||
                (t.transactionCode && t.transactionCode.toLowerCase().includes(search)) ||
                (t.id && t.id.toLowerCase().includes(search)) ||
                (t.method && t.method.toLowerCase().includes(search))
            );
        }
        if (studentId && studentId !== 'all') {
            filtered = filtered.filter(t => t.studentId === studentId);
        }
        if (type && type !== 'all') {
            filtered = filtered.filter(t => t.type === type);
        }
        if (methodParam && methodParam !== 'all') {
            filtered = filtered.filter(t => t.method === methodParam);
        }
        if (startDate) {
            filtered = filtered.filter(t => !t.date || t.date >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(t => !t.date || t.date <= endDate);
        }

        // Sort latest transactions first
        filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        if (pagination === 'false') {
            const resArray: any = [...filtered];
            resArray.data = filtered;
            resArray.total = filtered.length;
            resArray.last_page = 1;
            return resArray;
        }

        const startIndex = (page - 1) * limit;
        const pageData = filtered.slice(startIndex, startIndex + limit);
        const lastPage = Math.max(1, Math.ceil(filtered.length / limit));

        const pagedArray: any = [...pageData];
        pagedArray.data = pageData;
        pagedArray.total = filtered.length;
        pagedArray.page = page;
        pagedArray.limit = limit;
        pagedArray.last_page = lastPage;
        return pagedArray;
    }
    if (cleanEndpoint.startsWith('/transactions/')) {
        const id = cleanEndpoint.replace('/transactions/', '');
        if (method === 'PATCH' || method === 'PUT') {
            store.transactions = store.transactions.map(t => t.id === id ? { ...t, ...body } : t);
            saveMockStore(store);
            return store.transactions.find(t => t.id === id) || body;
        }
        if (method === 'DELETE') {
            store.transactions = store.transactions.filter(t => t.id !== id);
            saveMockStore(store);
            return { success: true };
        }
    }
    if (cleanEndpoint === '/expenses/upload-receipt') {
        return { url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400' };
    }
    if (cleanEndpoint === '/expenses') {
        if (method === 'POST') {
            const newExp = { 
                id: `exp-${Date.now()}`, 
                date: body.date || new Date().toISOString().split('T')[0],
                ...body 
            };
            store.expenses.unshift(newExp);
            saveMockStore(store);
            return newExp;
        }

        const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
        const queryParams = new URLSearchParams(queryString);
        const search = (queryParams.get('search') || '').toLowerCase().trim();
        const category = queryParams.get('category');
        const startDate = queryParams.get('startDate');
        const endDate = queryParams.get('endDate');
        const pagination = queryParams.get('pagination');
        const page = parseInt(queryParams.get('page') || '1', 10);
        const limit = parseInt(queryParams.get('limit') || '15', 10);

        let filtered = [...store.expenses];
        if (search) {
            filtered = filtered.filter(e => 
                (e.description && e.description.toLowerCase().includes(search)) ||
                (e.category && e.category.toLowerCase().includes(search)) ||
                (e.id && e.id.toLowerCase().includes(search))
            );
        }
        if (category && category !== 'all') {
            filtered = filtered.filter(e => e.category === category);
        }
        if (startDate) {
            filtered = filtered.filter(e => !e.date || e.date >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(e => !e.date || e.date <= endDate);
        }

        // Sort latest first
        filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        if (pagination === 'false') {
            const resArray: any = [...filtered];
            resArray.data = filtered;
            resArray.total = filtered.length;
            resArray.last_page = 1;
            return resArray;
        }

        const startIndex = (page - 1) * limit;
        const pageData = filtered.slice(startIndex, startIndex + limit);
        const lastPage = Math.max(1, Math.ceil(filtered.length / limit));

        const pagedArray: any = [...pageData];
        pagedArray.data = pageData;
        pagedArray.total = filtered.length;
        pagedArray.page = page;
        pagedArray.limit = limit;
        pagedArray.last_page = lastPage;
        return pagedArray;
    }
    if (cleanEndpoint.startsWith('/expenses/')) {
        const id = cleanEndpoint.replace('/expenses/', '');
        if (method === 'PATCH' || method === 'PUT') {
            store.expenses = store.expenses.map(e => e.id === id ? { ...e, ...body } : e);
            saveMockStore(store);
            return store.expenses.find(e => e.id === id) || body;
        }
        if (method === 'DELETE') {
            store.expenses = store.expenses.filter(e => e.id !== id);
            saveMockStore(store);
            return { success: true };
        }
    }
    if (cleanEndpoint === '/staff') {
        if (method === 'POST') {
            const newStaffId = `staff-${Date.now()}`;
            const staffEmail = (body.email || '').toLowerCase().trim();
            const rawPassword = (body.password || '').trim() || 'password123';
            const userRole = body.userRole || Role.Teacher;

            const newStaff = {
                id: newStaffId,
                photoUrl: body.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
                ...body
            };
            store.staff.push(newStaff);

            if (staffEmail) {
                const existingUserIndex = store.users.findIndex(u => u.email.toLowerCase() === staffEmail);
                if (existingUserIndex >= 0) {
                    store.users[existingUserIndex] = {
                        ...store.users[existingUserIndex],
                        name: body.name || store.users[existingUserIndex].name,
                        role: userRole,
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
                        avatarUrl: newStaff.photoUrl,
                        status: 'Active',
                        schoolId: store.schoolInfo.id || 'school-1'
                    };
                    store.users.push(newUser);
                }
            }

            saveMockStore(store);
            return newStaff;
        }
        return store.staff;
    }
    if (cleanEndpoint === '/staff/upload-photo' && method === 'POST') {
        const url = (body as any)?.dataUrl || (body as any)?.photoUrl || '/public/uploads/staff/staff_avatar.webp';
        return { url };
    }
    if (cleanEndpoint.startsWith('/staff/')) {
        const staffId = cleanEndpoint.replace('/staff/', '');
        if (method === 'PATCH' || method === 'PUT') {
            const idx = store.staff.findIndex(s => s.id === staffId);
            if (idx >= 0) {
                store.staff[idx] = { ...store.staff[idx], ...body };
                const staffEmail = (store.staff[idx].email || '').toLowerCase().trim();
                if (staffEmail) {
                    const uIdx = store.users.findIndex(u => u.email.toLowerCase() === staffEmail);
                    if (uIdx >= 0) {
                        store.users[uIdx] = {
                            ...store.users[uIdx],
                            name: store.staff[idx].name || store.users[uIdx].name,
                            role: body.userRole || store.users[uIdx].role
                        };
                    }
                }
                saveMockStore(store);
                return store.staff[idx];
            }
        }
        if (method === 'DELETE') {
            store.staff = store.staff.filter(s => s.id !== staffId);
            saveMockStore(store);
            return { success: true };
        }
    }
    if (cleanEndpoint === '/payroll/payroll-items') return store.payrollItems;
    if (cleanEndpoint === '/payroll/payroll-history') {
        const queryParams = new URLSearchParams(endpoint.split('?')[1] || '');
        const staffId = queryParams.get('staffId');
        const month = queryParams.get('month');
        let filtered = store.payrollHistory || [];
        if (staffId) {
            filtered = filtered.filter(p => p.staffId === staffId);
        }
        if (month) {
            filtered = filtered.filter(p => p.month && p.month.toLowerCase().includes(month.toLowerCase()));
        }
        return { data: filtered, total: filtered.length, page: 1, limit: filtered.length, last_page: 1 };
    }
    if (cleanEndpoint === '/payroll/generate') {
        if (Array.isArray(body)) {
            store.payrollHistory = [...body, ...store.payrollHistory];
            saveMockStore(store);
        }
        return store.payrollHistory;
    }
    // Academics - Classes
    if (cleanEndpoint === '/academics/classes') {
        if (method === 'POST') {
            const newClass = { id: `class-${Date.now()}`, ...body };
            store.classes.push(newClass);
            saveMockStore(store);
            return newClass;
        }
        return store.classes;
    }
    if (cleanEndpoint === '/academics/classes/batch' && method === 'PUT') {
        if (Array.isArray(body)) {
            store.classes = body;
            saveMockStore(store);
            return store.classes;
        }
    }
    if (cleanEndpoint.startsWith('/academics/classes/')) {
        const classId = cleanEndpoint.replace('/academics/classes/', '');
        if (method === 'PATCH' || method === 'PUT') {
            const idx = store.classes.findIndex(c => c.id === classId);
            if (idx >= 0) {
                store.classes[idx] = { ...store.classes[idx], ...body };
                saveMockStore(store);
                return store.classes[idx];
            }
        }
        if (method === 'DELETE') {
            store.classes = store.classes.filter(c => c.id !== classId);
            saveMockStore(store);
            return { success: true };
        }
    }

    // Academics - Subjects
    if (cleanEndpoint === '/academics/subjects') {
        if (method === 'POST') {
            const newSubject = {
                id: `sub-${Date.now()}`,
                code: (body.code || 'SUB').toUpperCase().trim(),
                name: (body.name || '').trim()
            };
            store.subjects.push(newSubject);
            saveMockStore(store);
            return newSubject;
        }
        return store.subjects;
    }
    if (cleanEndpoint === '/academics/subjects/batch' && method === 'PUT') {
        if (Array.isArray(body)) {
            store.subjects = body;
            saveMockStore(store);
            return store.subjects;
        }
    }
    if (cleanEndpoint.startsWith('/academics/subjects/')) {
        const subjectId = cleanEndpoint.replace('/academics/subjects/', '');
        if (method === 'PATCH' || method === 'PUT') {
            const idx = store.subjects.findIndex(s => s.id === subjectId);
            if (idx >= 0) {
                store.subjects[idx] = { ...store.subjects[idx], ...body };
                saveMockStore(store);
                return store.subjects[idx];
            }
        }
        if (method === 'DELETE') {
            store.subjects = store.subjects.filter(s => s.id !== subjectId);
            saveMockStore(store);
            return { success: true };
        }
    }

    // Academics - Class-Subject Assignments
    if (cleanEndpoint === '/academics/class-subject-assignments') {
        if (method === 'POST') {
            const newAssign = { id: `csa-${Date.now()}`, ...body };
            store.assignments.push(newAssign);
            saveMockStore(store);
            return newAssign;
        }
        return store.assignments;
    }
    if (cleanEndpoint === '/academics/class-subject-assignments/batch' && method === 'PUT') {
        if (Array.isArray(body)) {
            store.assignments = body;
            saveMockStore(store);
            return store.assignments;
        }
    }
    if (cleanEndpoint.startsWith('/academics/class-subject-assignments/')) {
        const assignId = cleanEndpoint.replace('/academics/class-subject-assignments/', '');
        if (method === 'DELETE') {
            store.assignments = store.assignments.filter(a => a.id !== assignId);
            saveMockStore(store);
            return { success: true };
        }
    }

    if (cleanEndpoint === '/academics/timetable-entries') return store.timetable;
    if (cleanEndpoint === '/academics/timetable-entries/batch' && method === 'PUT') {
        if (Array.isArray(body)) {
            store.timetable = body;
            saveMockStore(store);
            return store.timetable;
        }
    }

    if (cleanEndpoint === '/academics/exams') return store.exams;
    if (cleanEndpoint === '/academics/exams/batch' && method === 'PUT') {
        if (Array.isArray(body)) {
            store.exams = body;
            saveMockStore(store);
            return store.exams;
        }
    }

    if (cleanEndpoint === '/academics/grades') return store.grades;
    if (cleanEndpoint === '/academics/grades/batch' && method === 'PUT') {
        if (Array.isArray(body)) {
            store.grades = body;
            saveMockStore(store);
            return store.grades;
        }
    }

    if (cleanEndpoint === '/academics/attendance-records') return store.attendance;
    if (cleanEndpoint === '/academics/attendance-records/batch' && method === 'PUT') {
        if (Array.isArray(body)) {
            store.attendance = body;
            saveMockStore(store);
            return store.attendance;
        }
    }

    if (cleanEndpoint === '/academics/events') return [];

    if (cleanEndpoint === '/academics/grading-scale') {
        if (method === 'POST') {
            const newRule = { id: `rule-${Date.now()}`, ...body };
            store.gradingScale.push(newRule);
            saveMockStore(store);
            return newRule;
        }
        return store.gradingScale;
    }
    if (cleanEndpoint.startsWith('/academics/grading-scale/')) {
        const ruleId = cleanEndpoint.replace('/academics/grading-scale/', '');
        if (method === 'PATCH' || method === 'PUT') {
            const idx = store.gradingScale.findIndex(r => r.id === ruleId);
            if (idx >= 0) {
                store.gradingScale[idx] = { ...store.gradingScale[idx], ...body };
                saveMockStore(store);
                return store.gradingScale[idx];
            }
        }
        if (method === 'DELETE') {
            store.gradingScale = store.gradingScale.filter(r => r.id !== ruleId);
            saveMockStore(store);
            return { success: true };
        }
    }

    if (cleanEndpoint === '/academics/fee-structure') {
        if (method === 'POST') {
            const newItem = { id: `fee-${Date.now()}`, ...body };
            store.feeStructure.push(newItem);
            saveMockStore(store);
            return newItem;
        }
        return store.feeStructure;
    }
    if (cleanEndpoint.startsWith('/academics/fee-structure/')) {
        const feeId = cleanEndpoint.replace('/academics/fee-structure/', '');
        if (method === 'PATCH' || method === 'PUT') {
            const idx = store.feeStructure.findIndex(f => f.id === feeId);
            if (idx >= 0) {
                store.feeStructure[idx] = { ...store.feeStructure[idx], ...body };
                saveMockStore(store);
                return store.feeStructure[idx];
            }
        }
        if (method === 'DELETE') {
            store.feeStructure = store.feeStructure.filter(f => f.id !== feeId);
            saveMockStore(store);
            return { success: true };
        }
    }
    if (cleanEndpoint === '/communications/announcements') {
        if (method === 'POST') {
            const newAnn = { id: `ann-${Date.now()}`, ...body };
            store.announcements.unshift(newAnn);
            saveMockStore(store);
            return newAnn;
        }
        return store.announcements;
    }
    if (cleanEndpoint === '/communications/send-email') {
        const to = Array.isArray(body.to) ? body.to.join(', ') : (body.to || 'Guardian');
        const subject = body.subject || 'School Portal Notification';
        const plainText = (body.body || '').replace(/<[^>]*>?/gm, '').trim();
        const newLog: CommunicationLog = {
            id: `log-${Date.now()}`,
            studentId: body.studentId || 'general',
            type: CommunicationType.Email,
            date: new Date().toISOString(),
            sentBy: 'System Notification Gateway',
            recipient: to,
            channel: 'Email',
            message: `[${subject}] ${plainText}`,
            status: 'Delivered',
            timestamp: new Date().toISOString()
        };
        if (!store.communicationLogs) store.communicationLogs = [];
        store.communicationLogs.unshift(newLog);
        saveMockStore(store);
        return { success: true, message: `Email delivered to ${to}`, log: newLog };
    }
    if (cleanEndpoint === '/communications/communication-logs') return store.communicationLogs;
    if (cleanEndpoint === '/library/books') return store.books;
    if (cleanEndpoint === '/library/transactions') return [];

    // --- LMS Handlers ---
    if (cleanEndpoint === '/lms/assignments') {
        if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const newAssign = {
                id: `lms-assign-${Date.now()}`,
                ...body,
                createdAt: new Date().toISOString(),
                submittedCount: 0,
                gradedCount: 0,
                totalAssigned: (store.students || []).filter(s => s.classId === body.classId).length || 5
            };
            store.lmsAssignments = [newAssign, ...(store.lmsAssignments || [])];
            saveMockStore(store);
            return newAssign;
        }
        return store.lmsAssignments || [];
    }
    if (cleanEndpoint.startsWith('/lms/assignments/')) {
        const id = cleanEndpoint.replace('/lms/assignments/', '');
        if (method === 'PATCH' || method === 'PUT') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const list = store.lmsAssignments || [];
            const idx = list.findIndex(a => a.id === id);
            if (idx >= 0) {
                list[idx] = { ...list[idx], ...body, updatedAt: new Date().toISOString() };
                store.lmsAssignments = list;
                saveMockStore(store);
                return list[idx];
            }
        }
        if (method === 'DELETE') {
            store.lmsAssignments = (store.lmsAssignments || []).filter(a => a.id !== id);
            store.lmsSubmissions = (store.lmsSubmissions || []).filter(s => s.assignmentId !== id);
            saveMockStore(store);
            return { success: true };
        }
    }
    if (cleanEndpoint === '/lms/submissions') {
        if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const list = store.lmsSubmissions || [];
            const existingIdx = list.findIndex(s => s.assignmentId === body.assignmentId && s.studentId === body.studentId);
            const newSub = {
                id: existingIdx >= 0 ? list[existingIdx].id : `sub-${Date.now()}`,
                ...body,
                submittedAt: new Date().toISOString()
            };
            if (existingIdx >= 0) list[existingIdx] = newSub;
            else list.unshift(newSub);
            store.lmsSubmissions = list;
            const assign = (store.lmsAssignments || []).find(a => a.id === body.assignmentId);
            if (assign) {
                assign.submittedCount = list.filter(s => s.assignmentId === body.assignmentId).length;
            }
            saveMockStore(store);
            return newSub;
        }
        return store.lmsSubmissions || [];
    }
    if (cleanEndpoint.startsWith('/lms/submissions/') && cleanEndpoint.endsWith('/grade')) {
        const id = cleanEndpoint.replace('/lms/submissions/', '').replace('/grade', '');
        const body = options.body ? JSON.parse(options.body as string) : {};
        const sub = (store.lmsSubmissions || []).find(s => s.id === id);
        if (sub) {
            sub.score = body.score;
            sub.gradeLetter = body.gradeLetter;
            sub.teacherFeedback = body.teacherFeedback;
            sub.gradedBy = body.gradedBy || 'Teacher';
            sub.gradedAt = new Date().toISOString();
            sub.status = body.status || 'Graded';
            sub.rubricScores = body.rubricScores;
            const assign = (store.lmsAssignments || []).find(a => a.id === sub.assignmentId);
            if (assign) {
                assign.gradedCount = (store.lmsSubmissions || []).filter(s => s.assignmentId === sub.assignmentId && s.score !== null && s.score !== undefined).length;
            }
            saveMockStore(store);
            return sub;
        }
    }
    if (cleanEndpoint === '/lms/live-classes') {
        if (method === 'POST') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const newLive = {
                id: `live-${Date.now()}`,
                ...body,
                attendeesCount: body.attendeesCount || 0,
                createdAt: new Date().toISOString()
            };
            store.lmsLiveClasses = [newLive, ...(store.lmsLiveClasses || [])];
            saveMockStore(store);
            return newLive;
        }
        return store.lmsLiveClasses || [];
    }
    if (cleanEndpoint.startsWith('/lms/live-classes/')) {
        const id = cleanEndpoint.replace('/lms/live-classes/', '');
        if (method === 'PATCH' || method === 'PUT') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const list = store.lmsLiveClasses || [];
            const idx = list.findIndex(c => c.id === id);
            if (idx >= 0) {
                list[idx] = { ...list[idx], ...body };
                store.lmsLiveClasses = list;
                saveMockStore(store);
                return list[idx];
            }
        }
        if (method === 'DELETE') {
            store.lmsLiveClasses = (store.lmsLiveClasses || []).filter(c => c.id !== id);
            saveMockStore(store);
            return { success: true };
        }
    }
    
    // --- Super Admin Mock Handlers ---
    if (cleanEndpoint === '/super-admin/stats') {
        const schools = store.schools || [];
        const receipts = store.saasReceipts || [];
        const invoices = store.saasInvoices || [];
        const activeSubs = schools.filter(s => s.subscriptionStatus === SubscriptionStatus.ACTIVE).length;
        const graceSubs = schools.filter(s => s.subscriptionStatus === SubscriptionStatus.PAST_DUE).length;
        const suspendedSubs = schools.filter(s => s.subscriptionStatus === SubscriptionStatus.SUSPENDED).length;
        const totalRevenue = receipts.reduce((sum, r) => sum + r.amount, 0);
        
        // Calculate MRR & ARR from active subscriptions
        const mrr = schools.reduce((sum, s) => {
            if (s.subscriptionStatus !== SubscriptionStatus.ACTIVE) return sum;
            const monthlyEquivalent = s.billingCycle === 'ANNUALLY' 
                ? (s.plan === SubscriptionPlan.PREMIUM ? 5000 : 2500) 
                : (s.plan === SubscriptionPlan.PREMIUM ? 6000 : 3000);
            return sum + monthlyEquivalent;
        }, 0);

        return {
            totalSchools: schools.length,
            activeSubscriptions: activeSubs,
            gracePeriodCount: graceSubs,
            disabledCount: suspendedSubs,
            totalRevenue,
            monthlyRecurringRevenue: mrr,
            annualRecurringRevenue: mrr * 12,
            totalPlatformUsers: store.users.length,
            systemUptime: '99.98%'
        };
    }
    
    if (cleanEndpoint === '/super-admin/schools') {
        return store.schools || [];
    }

    if (cleanEndpoint === '/super-admin/invoices') {
        if (method === 'POST') {
            const newInv: SaasInvoice = {
                id: `inv-saas-${Date.now()}`,
                invoiceNumber: `INV-SAAS-${new Date().getFullYear()}-${String((store.saasInvoices || []).length + 1).padStart(3, '0')}`,
                schoolId: body.schoolId,
                schoolName: body.schoolName,
                schoolCode: body.schoolCode,
                recipientEmail: body.recipientEmail,
                recipientPhone: body.recipientPhone,
                plan: body.plan || SubscriptionPlan.PREMIUM,
                billingCycle: body.billingCycle || 'ANNUALLY',
                amount: Number(body.amount) || 60000,
                currency: body.currency || 'KES',
                issueDate: body.issueDate || new Date().toISOString().split('T')[0],
                dueDate: body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                status: body.status || 'ISSUED',
                notes: body.notes
            };
            store.saasInvoices = [newInv, ...(store.saasInvoices || [])];
            saveMockStore(store);
            return newInv;
        }
        return store.saasInvoices || [];
    }

    if (cleanEndpoint.startsWith('/super-admin/invoices/') && cleanEndpoint.endsWith('/status')) {
        const parts = cleanEndpoint.split('/');
        const invoiceId = parts[3];
        const invoice = (store.saasInvoices || []).find(i => i.id === invoiceId);
        if (invoice) {
            invoice.status = body.status;
            if (body.status === 'PAID') {
                invoice.paidDate = body.paidDate || new Date().toISOString().split('T')[0];
                invoice.transactionRef = body.transactionRef || `MPESA-${Date.now().toString().slice(-6)}`;
                
                // Automatically generate SaasReceipt
                const newReceipt: SaasReceipt = {
                    id: `rec-saas-${Date.now()}`,
                    receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String((store.saasReceipts || []).length + 1).padStart(3, '0')}`,
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    schoolId: invoice.schoolId,
                    schoolName: invoice.schoolName,
                    amount: invoice.amount,
                    currency: invoice.currency,
                    paymentDate: invoice.paidDate || new Date().toISOString().split('T')[0],
                    paymentMethod: body.paymentMethod || 'Lipa Na M-Pesa',
                    transactionCode: invoice.transactionRef || `TXN-${Date.now()}`,
                    plan: invoice.plan,
                    provisionedUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
                    verifiedBy: 'Platform Super Administrator'
                };
                store.saasReceipts = [newReceipt, ...(store.saasReceipts || [])];

                // Reactivate and extend school subscription
                const school = (store.schools || []).find(s => s.id === invoice.schoolId);
                if (school) {
                    school.subscriptionStatus = SubscriptionStatus.ACTIVE;
                    school.plan = invoice.plan;
                    school.lastPaymentDate = invoice.paidDate;
                    school.lastPaymentAmount = invoice.amount;
                    const baseDate = new Date(school.endDate) > new Date() ? new Date(school.endDate) : new Date();
                    baseDate.setDate(baseDate.getDate() + 365);
                    school.endDate = baseDate.toISOString().split('T')[0];
                    school.autoLockoutGraceDaysRemaining = undefined;
                }
            }
            saveMockStore(store);
            return invoice;
        }
        return { success: false, message: 'Invoice not found' };
    }

    if (cleanEndpoint === '/super-admin/receipts') {
        return store.saasReceipts || [];
    }

    if (cleanEndpoint === '/super-admin/lifecycle-sweep') {
        const now = new Date();
        const schools = store.schools || [];
        const actions: LifecycleSweepResult['actions'] = [];
        let activeCount = 0;
        let expiringSoonCount = 0;
        let gracePeriodCount = 0;
        let disabledCount = 0;
        let remindersSent = 0;

        schools.forEach(school => {
            const endDate = new Date(school.endDate);
            const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 5) {
                activeCount++;
                actions.push({
                    schoolId: school.id,
                    schoolName: school.name,
                    action: 'ACTIVE_HEALTHY',
                    message: `Active license in good standing. ${diffDays} days remaining until renewal on ${school.endDate}.`,
                    daysUntilExpiry: diffDays,
                    status: school.subscriptionStatus
                });
            } else if (diffDays > 0 && diffDays <= 5) {
                expiringSoonCount++;
                remindersSent++;
                school.remindersCount = (school.remindersCount || 0) + 1;
                school.lastReminderDate = now.toISOString().split('T')[0];
                const actionType = diffDays === 5 ? 'REMINDER_5_DAY' : 'REMINDER_2_DAY';
                actions.push({
                    schoolId: school.id,
                    schoolName: school.name,
                    action: actionType,
                    message: `Dispatched Pre-Expiry Reminder: ${diffDays} day(s) remaining until renewal on ${school.endDate}. Settle pending invoice to avoid interruption.`,
                    daysUntilExpiry: diffDays,
                    status: school.subscriptionStatus
                });
            } else {
                const daysOverdue = Math.abs(diffDays);
                if (daysOverdue <= 14) {
                    gracePeriodCount++;
                    remindersSent++;
                    const daysLeft = 14 - daysOverdue;
                    school.subscriptionStatus = SubscriptionStatus.PAST_DUE;
                    school.remindersCount = (school.remindersCount || 0) + 1;
                    school.lastReminderDate = now.toISOString().split('T')[0];
                    school.autoLockoutGraceDaysRemaining = daysLeft;
                    actions.push({
                        schoolId: school.id,
                        schoolName: school.name,
                        action: 'GRACE_PERIOD_NOTICE',
                        message: `Grace Period Overdue Alert: Expired ${daysOverdue} days ago. ${daysLeft} day(s) remaining before automatic account disabling.`,
                        daysUntilExpiry: diffDays,
                        status: SubscriptionStatus.PAST_DUE
                    });
                } else {
                    disabledCount++;
                    school.subscriptionStatus = SubscriptionStatus.SUSPENDED;
                    school.autoLockoutGraceDaysRemaining = 0;
                    actions.push({
                        schoolId: school.id,
                        schoolName: school.name,
                        action: 'ACCOUNT_DISABLED',
                        message: `ACCOUNT DISABLED: Expired ${daysOverdue} days ago (exceeded 14-day grace period). Dashboard access locked until payment is completed.`,
                        daysUntilExpiry: diffDays,
                        status: SubscriptionStatus.SUSPENDED
                    });
                }
            }
        });

        saveMockStore(store);

        const sweepResult: LifecycleSweepResult = {
            timestamp: now.toISOString(),
            totalScanned: schools.length,
            activeCount,
            expiringSoonCount,
            gracePeriodCount,
            disabledCount,
            remindersSent,
            actions
        };
        return sweepResult;
    }

    if (cleanEndpoint.startsWith('/super-admin/schools/') && cleanEndpoint.endsWith('/reminder')) {
        const parts = cleanEndpoint.split('/');
        const schoolId = parts[3];
        const school = (store.schools || []).find(s => s.id === schoolId);
        if (school) {
            school.remindersCount = (school.remindersCount || 0) + 1;
            school.lastReminderDate = new Date().toISOString().split('T')[0];
            saveMockStore(store);
            return { 
                success: true, 
                message: `Renewal reminder dispatched to ${school.email} for ${school.name}`,
                remindersCount: school.remindersCount,
                lastReminderDate: school.lastReminderDate
            };
        }
        return { success: false, message: 'School not found' };
    }

    if (cleanEndpoint.startsWith('/super-admin/schools/') && cleanEndpoint.endsWith('/toggle-access')) {
        const parts = cleanEndpoint.split('/');
        const schoolId = parts[3];
        const school = (store.schools || []).find(s => s.id === schoolId);
        if (school) {
            school.subscriptionStatus = body.enabled ? SubscriptionStatus.ACTIVE : SubscriptionStatus.SUSPENDED;
            saveMockStore(store);
            return { success: true, status: school.subscriptionStatus, school };
        }
        return { success: false, message: 'School not found' };
    }

    if (cleanEndpoint.startsWith('/super-admin/schools/') && cleanEndpoint.endsWith('/extend')) {
        const parts = cleanEndpoint.split('/');
        const schoolId = parts[3];
        const school = (store.schools || []).find(s => s.id === schoolId);
        if (school) {
            const days = Number(body.days) || 30;
            const baseDate = new Date(school.endDate) > new Date() ? new Date(school.endDate) : new Date();
            baseDate.setDate(baseDate.getDate() + days);
            school.endDate = baseDate.toISOString().split('T')[0];
            school.subscriptionStatus = SubscriptionStatus.ACTIVE;
            school.autoLockoutGraceDaysRemaining = undefined;
            saveMockStore(store);
            return { success: true, school };
        }
        return { success: false, message: 'School not found' };
    }

    if (cleanEndpoint.startsWith('/super-admin/schools/') && cleanEndpoint.endsWith('/activate')) {
        const parts = cleanEndpoint.split('/');
        const schoolId = parts[3];
        const school = (store.schools || []).find(s => s.id === schoolId);
        if (school) {
            if (!school.schoolCode || school.schoolCode === 'PENDING-VERIFICATION') {
                school.schoolCode = (school.name || 'SCH').substring(0, 3).toUpperCase();
            }
            const inv = (store.saasInvoices || []).find(i => i.schoolId === schoolId && i.status !== 'PAID');
            const targetPlan = body?.plan || (school as any).pendingUpgradePlan || inv?.plan || (school.plan !== SubscriptionPlan.FREE ? school.plan : SubscriptionPlan.PREMIUM);
            school.plan = targetPlan;

            const cycle = body?.billingCycle || (school as any).billingCycle || inv?.billingCycle || school.billingCycle || 'MONTHLY';
            school.billingCycle = cycle;

            const totalAmount = inv?.amount || (school.plan === SubscriptionPlan.PREMIUM ? 69600 : 34800);
            const txnRef = body?.transactionRef || inv?.invoiceNumber || `WIRE-NCBA-${Date.now().toString().slice(-6)}`;
            const paymentDate = new Date().toISOString().split('T')[0];
            const provisionedDays = cycle === 'ANNUALLY' ? 365 : 30;

            school.subscriptionStatus = SubscriptionStatus.ACTIVE;
            school.endDate = new Date(Date.now() + provisionedDays * 86400000).toISOString().split('T')[0];
            school.remindersCount = 0;
            school.lastPaymentDate = paymentDate;
            school.lastPaymentAmount = totalAmount;
            school.autoLockoutGraceDaysRemaining = undefined;
            delete (school as any).pendingUpgradePlan;

            if (store.schoolInfo && store.schoolInfo.id === school.id) {
                store.schoolInfo.plan = targetPlan;
                store.schoolInfo.subscriptionStatus = SubscriptionStatus.ACTIVE;
                store.schoolInfo.billingCycle = cycle;
                store.schoolInfo.endDate = school.endDate;
                if (!store.schoolInfo.schoolCode || store.schoolInfo.schoolCode === 'PENDING-VERIFICATION') {
                    store.schoolInfo.schoolCode = school.schoolCode;
                }
            }

            if (inv) {
                inv.status = 'PAID';
                inv.paidDate = paymentDate;
                inv.transactionRef = txnRef;
                inv.paymentMethod = body?.paymentMethod || 'Bank Wire';
            }

            const newReceipt: SaasReceipt = {
                id: `rec-saas-${Date.now()}`,
                receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String((store.saasReceipts || []).length + 1).padStart(3, '0')}`,
                invoiceId: inv?.id || '',
                invoiceNumber: inv?.invoiceNumber || school.invoiceNumber || `INV-SAAS-${new Date().getFullYear()}-ACT`,
                schoolId: school.id,
                schoolName: school.name,
                amount: totalAmount,
                currency: 'KES',
                paymentDate: paymentDate,
                paymentMethod: body?.paymentMethod || 'Bank Wire',
                transactionCode: txnRef,
                plan: school.plan,
                provisionedUntil: school.endDate,
                verifiedBy: 'Platform Super Administrator'
            };
            if (!store.saasReceipts) store.saasReceipts = [];
            store.saasReceipts.unshift(newReceipt);

            const initialPassword = school.temporaryPassword || 'Admin@2026';
            if (!store.communicationLogs) store.communicationLogs = [];
            store.communicationLogs.unshift({
                id: `log-${Date.now()}`,
                studentId: school.id,
                type: CommunicationType.Email,
                message: `[Account Activated] Portal activated for ${school.name}. Login URL: /login | Username: ${school.email} | Initial Password: ${initialPassword} | Plan: ${school.plan} | Valid Until: ${school.endDate}`,
                date: new Date().toISOString(),
                sentBy: 'Super Administrator',
                recipient: school.email,
                channel: 'Email',
                status: 'Delivered',
                timestamp: new Date().toISOString()
            });

            saveMockStore(store);
            return { 
                success: true, 
                school, 
                receipt: newReceipt, 
                credentials: { email: school.email, password: initialPassword } 
            };
        }
        return { success: false, message: 'School not found' };
    }

    if (cleanEndpoint === '/super-admin/payments/initiate') {
        const schoolId = body?.schoolId || store.schoolInfo?.id;
        const school: any = (store.schools || []).find(s => s.id === schoolId || s.email === body?.email) || store.schoolInfo;
        if (school) {
            const requestedPlan = body?.plan || SubscriptionPlan.PREMIUM;
            const requestedCycle = body?.billingCycle || school.billingCycle || 'MONTHLY';
            if (!school.schoolCode || school.schoolCode === 'PENDING-VERIFICATION') {
                school.schoolCode = (school.name || 'SCH').substring(0, 3).toUpperCase();
            }

            school.subscriptionStatus = SubscriptionStatus.PENDING_APPROVAL;
            (school as any).pendingUpgradePlan = requestedPlan;
            (school as any).paymentMethod = body?.method || 'WIRE';
            (school as any).billingCycle = requestedCycle;

            const txnRef = body?.transactionCode || `WIRE-NCBA-${Date.now().toString().slice(-6)}`;
            school.invoiceNumber = txnRef;

            if (store.schoolInfo && store.schoolInfo.id === school.id) {
                store.schoolInfo.subscriptionStatus = SubscriptionStatus.PENDING_APPROVAL;
                (store.schoolInfo as any).pendingUpgradePlan = requestedPlan;
                (store.schoolInfo as any).paymentMethod = body?.method || 'WIRE';
                (store.schoolInfo as any).invoiceNumber = txnRef;
                if (!store.schoolInfo.schoolCode || store.schoolInfo.schoolCode === 'PENDING-VERIFICATION') {
                    store.schoolInfo.schoolCode = school.schoolCode;
                }
            }

            const newInv: SaasInvoice = {
                id: `inv-saas-${Date.now()}`,
                invoiceNumber: txnRef,
                schoolId: school.id,
                schoolName: school.name,
                schoolCode: school.schoolCode,
                recipientEmail: school.email,
                recipientPhone: school.phone,
                plan: requestedPlan,
                billingCycle: requestedCycle,
                amount: Number(body?.amount) || 5800,
                currency: 'KES',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                status: 'UNPAID',
                paymentMethod: 'Bank Wire',
                notes: `Proforma Invoice for ${requestedPlan} subscription (${requestedCycle}). Super Admin wire transfer verification required.`
            };
            if (!store.saasInvoices) store.saasInvoices = [];
            store.saasInvoices.unshift(newInv);

            saveMockStore(store);
            return { success: true, message: 'Wire transfer order recorded. Super Administrator verification pending.', invoice: newInv, school };
        }
        return { success: false, message: 'School not found' };
    }

    if (cleanEndpoint === '/super-admin/payments/manual') {
        const school = (store.schools || []).find(s => s.id === body.schoolId);
        const receipt: SaasReceipt = {
            id: `rec-saas-${Date.now()}`,
            receiptNumber: `REC-SAAS-${new Date().getFullYear()}-${String((store.saasReceipts || []).length + 1).padStart(3, '0')}`,
            schoolId: body.schoolId,
            schoolName: school?.name || 'Subscribing Institution',
            amount: Number(body.amount) || 60000,
            currency: 'KES',
            paymentDate: body.date || new Date().toISOString().split('T')[0],
            paymentMethod: body.method || 'Bank Wire',
            transactionCode: body.transactionCode,
            plan: body.plan || school?.plan || SubscriptionPlan.PREMIUM,
            provisionedUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
            verifiedBy: 'Platform Super Administrator'
        };
        store.saasReceipts = [receipt, ...(store.saasReceipts || [])];
        if (school) {
            school.subscriptionStatus = SubscriptionStatus.ACTIVE;
            school.lastPaymentDate = receipt.paymentDate;
            school.lastPaymentAmount = receipt.amount;
            const baseDate = new Date(school.endDate) > new Date() ? new Date(school.endDate) : new Date();
            baseDate.setDate(baseDate.getDate() + 365);
            school.endDate = baseDate.toISOString().split('T')[0];
            school.autoLockoutGraceDaysRemaining = undefined;
        }
        saveMockStore(store);
        return { success: true, receipt };
    }

    if (cleanEndpoint === '/super-admin/health') {
        return { status: 'healthy', database: 'connected', redis: 'active' };
    }
    if (cleanEndpoint === '/super-admin/pricing') {
        if (method === 'PUT') {
            store.pricing = { ...store.pricing, ...body };
            saveMockStore(store);
        }
        return store.pricing;
    }
    if (cleanEndpoint === '/super-admin/payments') return store.saasReceipts || [];

    // EdTech News Mock Handling
    if (cleanEndpoint === '/edtech-news' || cleanEndpoint === '/super-admin/edtech-news') {
        if (!store.edTechArticles) store.edTechArticles = [];
        if (method === 'POST') {
            const newArt: EdTechArticle = {
                id: body.id || `article-${Date.now()}`,
                slug: body.slug || (body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `article-${Date.now()}`),
                title: body.title || 'Untitled EdTech Article',
                category: body.category || 'CBC Curriculum',
                date: body.date || new Date().toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' }),
                readTime: body.readTime || '4 min read',
                excerpt: body.excerpt || '',
                author: body.author || 'SaasLink Editorial Board',
                authorRole: body.authorRole || 'Educational Specialist',
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
            store.edTechArticles = [newArt, ...store.edTechArticles];
            saveMockStore(store);
            return newArt;
        }
        return store.edTechArticles;
    }

    if (cleanEndpoint.startsWith('/edtech-news/') || cleanEndpoint.startsWith('/super-admin/edtech-news/')) {
        if (!store.edTechArticles) store.edTechArticles = [];
        const parts = cleanEndpoint.split('/');
        const articleId = parts[parts.length - 1];

        if (cleanEndpoint.endsWith('/toggle-status')) {
            const idToToggle = parts[parts.length - 2];
            const art = store.edTechArticles.find(a => a.id === idToToggle || a.slug === idToToggle);
            if (art) {
                art.status = art.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
                art.updatedAt = new Date().toISOString();
                saveMockStore(store);
                return art;
            }
        }

        if (cleanEndpoint.endsWith('/toggle-featured')) {
            const idToToggle = parts[parts.length - 2];
            const art = store.edTechArticles.find(a => a.id === idToToggle || a.slug === idToToggle);
            if (art) {
                art.featured = !art.featured;
                art.updatedAt = new Date().toISOString();
                saveMockStore(store);
                return art;
            }
        }

        if (method === 'GET') {
            const art = store.edTechArticles.find(a => a.id === articleId || a.slug === articleId);
            if (art) {
                art.viewsCount = (art.viewsCount || 0) + 1;
                saveMockStore(store);
                return art;
            }
        }

        if (method === 'PUT' || method === 'PATCH') {
            const idx = store.edTechArticles.findIndex(a => a.id === articleId || a.slug === articleId);
            if (idx >= 0) {
                store.edTechArticles[idx] = {
                    ...store.edTechArticles[idx],
                    ...body,
                    updatedAt: new Date().toISOString()
                };
                saveMockStore(store);
                return store.edTechArticles[idx];
            }
        }

        if (method === 'DELETE') {
            store.edTechArticles = store.edTechArticles.filter(a => a.id !== articleId && a.slug !== articleId);
            saveMockStore(store);
            return { success: true };
        }
    }

    return { success: true, data: [] };
};

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');
// Strict mode: MySQL database is the only source of truth.
// Mock fallback is strictly disabled unless explicitly enabled for isolated tests.
const DISABLE_MOCK_FALLBACK = (import.meta as any).env?.VITE_ENABLE_MOCK_FALLBACK === 'true' 
    ? false 
    : true;

/**
 * Tab-Scoped Session Management
 * Ensures closing the tab signs the user out immediately.
 * sessionStorage is uniquely bounded to the browser tab lifecycle and automatically discarded on tab close.
 */
export const getAuthToken = (): string | null => {
    try {
        const token = sessionStorage.getItem('authToken');
        if (token && token !== 'null' && token !== 'undefined') {
            return token;
        }
        return null;
    } catch {
        return null;
    }
};

export const setAuthToken = (token: string): void => {
    try {
        if (token) {
            sessionStorage.setItem('authToken', token);
        } else {
            sessionStorage.removeItem('authToken');
        }
        // Purge persistent localStorage tokens to enforce tab-closure logout
        localStorage.removeItem('authToken');
    } catch {
        // ignore
    }
};

export const clearAuthToken = (): void => {
    try {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('saaslink_last_activity');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('saaslink_last_activity');
    } catch {
        // ignore
    }
};

/**
 * Robust API Error Message Parser
 * Formats any nested error object into a clean human-readable string, preventing [object Object] errors.
 */
const parseApiErrorMessage = (errorData: any, statusText: string, status: number, endpoint: string): string => {
    if (!errorData) return statusText || `API error (${status}) on ${endpoint}`;
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData.message === 'string') return errorData.message;
    if (Array.isArray(errorData.message)) {
        return errorData.message.map((m: any) => typeof m === 'string' ? m : (m?.message || JSON.stringify(m))).join(', ');
    }
    if (typeof errorData.error === 'string') return errorData.error;
    if (errorData.error && typeof errorData.error.message === 'string') return errorData.error.message;
    if (typeof errorData.message === 'object' && errorData.message !== null) {
        if (typeof errorData.message.message === 'string') return errorData.message.message;
        try { return JSON.stringify(errorData.message); } catch { /* ignore */ }
    }
    if (typeof errorData.error === 'object' && errorData.error !== null) {
        try { return JSON.stringify(errorData.error); } catch { /* ignore */ }
    }
    if (Array.isArray(errorData.errors)) {
        return errorData.errors.map((e: any) => typeof e === 'string' ? e : (e?.message || JSON.stringify(e))).join(', ');
    }
    return statusText || `API error (${status}) on ${endpoint}`;
};

// Generic API fetch wrapper for JSON responses with automatic resilient fallback
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const url = API_BASE_URL ? `${API_BASE_URL}/api${endpoint}` : `/api${endpoint}`;
    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            const errorMessage = parseApiErrorMessage(errorData, response.statusText, response.status, endpoint);
            // Auth endpoints and all errors in strict mode must throw the real error to the caller
            if (DISABLE_MOCK_FALLBACK || endpoint.startsWith('/auth') || response.status >= 400) {
                throw new Error(errorMessage);
            }
            // If endpoint is not found or returns an error status, use graceful local fallback only if explicitly enabled
            return handleLocalFallback(endpoint, options);
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch (err: any) {
        if (DISABLE_MOCK_FALLBACK || endpoint.startsWith('/auth')) {
            if (err instanceof TypeError && err.message.includes('fetch')) {
                throw new Error(`Unable to connect to the backend server (${url}). Please ensure the backend and MySQL database are running.`);
            }
            throw err;
        }
        // Fallback gracefully only if mock mode was explicitly enabled
        return handleLocalFallback(endpoint, options);
    }
};

// Specialized fetch for binary data (e.g. CSV exports)
const apiFetchBlob = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const url = API_BASE_URL ? `${API_BASE_URL}/api${endpoint}` : `/api${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
    }
    return await response.blob();
};

// --- Auth ---
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logout = async (): Promise<void> => {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
        clearAuthToken();
    }
};
export const getAuthenticatedUser = async (): Promise<User | null> => {
    const token = getAuthToken();
    if (!token) {
        return null;
    }
    try {
        return await apiFetch('/auth/me');
    } catch (err) {
        clearAuthToken();
        return null;
    }
};
export const registerSchool = (data: any): Promise<any> => apiFetch('/auth/register-school', { method: 'POST', body: JSON.stringify(data) });
export const createPaymentIntent = (data: { plan: string, billingCycle: string, email: string }): Promise<{ clientSecret: string, amount: number }> => apiFetch('/auth/create-payment-intent', { method: 'POST', body: JSON.stringify(data) });

// --- Dashboard ---
export const getDashboardStats = () => apiFetch('/dashboard/stats');

// --- Students ---
export const getStudents = (params: any = {}): Promise<any> => apiFetch(`/students?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createStudent = (data: NewStudent): Promise<Student> => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: string, data: Partial<Student>): Promise<Student> => apiFetch(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteStudent = (id: string): Promise<void> => apiFetch(`/students/${id}`, { method: 'DELETE' });
export const updateMultipleStudents = (updates: any[]): Promise<Student[]> => apiFetch('/students/batch-update', { method: 'POST', body: JSON.stringify(updates) });
export const uploadStudentPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/students/upload-photo', { method: 'POST', body: formData });

// --- Users ---
export const getUsers = (): Promise<User[]> => apiFetch('/users');
export const createUser = (data: NewUser): Promise<User> => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<User>): Promise<User> => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id: string): Promise<void> => apiFetch(`/users/${id}`, { method: 'DELETE' });
export const updateUserProfile = (data: Partial<User>): Promise<User> => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
export const uploadUserAvatar = (formData: FormData): Promise<{avatarUrl: string}> => apiFetch('/users/upload-avatar', { method: 'POST', body: formData });
export const adminUploadUserPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/users/upload-photo', { method: 'POST', body: formData });

// --- Transactions ---
export const getTransactions = (params: any = {}): Promise<any> => apiFetch(`/transactions?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createTransaction = (data: NewTransaction): Promise<Transaction> => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (id: string, data: any): Promise<Transaction> => apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTransaction = (id: string): Promise<void> => apiFetch(`/transactions/${id}`, { method: 'DELETE' });
export const createMultipleTransactions = (data: NewTransaction[]): Promise<Transaction[]> => apiFetch('/transactions/batch', { method: 'POST', body: JSON.stringify(data) });

// --- Expenses ---
export const getExpenses = (params: any = {}): Promise<any> => apiFetch(`/expenses?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createExpense = (data: NewExpense): Promise<Expense> => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: string, data: Partial<Expense>): Promise<Expense> => apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = (id: string): Promise<void> => apiFetch(`/expenses/${id}`, { method: 'DELETE' });
export const uploadExpenseReceipt = (formData: FormData): Promise<{url: string}> => apiFetch('/expenses/upload-receipt', { method: 'POST', body: formData });
export const exportExpenses = (params: any = {}): Promise<Blob> => apiFetchBlob(`/expenses/export?${new URLSearchParams(cleanParams(params)).toString()}`);

// --- Staff ---
export const getStaff = (): Promise<Staff[]> => apiFetch('/staff');
export const createStaff = (data: NewStaff): Promise<Staff> => apiFetch('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id: string, data: Partial<Staff>): Promise<Staff> => apiFetch(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const uploadStaffPhoto = (body: FormData | { dataUrl: string; folder?: string }): Promise<{url: string}> => {
    if (body instanceof FormData) {
        return apiFetch('/staff/upload-photo', { method: 'POST', body });
    }
    return apiFetch('/staff/upload-photo', { method: 'POST', body: JSON.stringify(body) });
};
export const uploadMedia = (dataUrl: string, folder = 'media'): Promise<{url: string; filename?: string}> => {
    return apiFetch('/media/upload', { method: 'POST', body: JSON.stringify({ dataUrl, folder }) });
};

// --- Payroll ---
export const getPayrollItems = (): Promise<PayrollItem[]> => apiFetch('/payroll/payroll-items');
export const createPayrollItem = (data: NewPayrollItem): Promise<PayrollItem> => apiFetch('/payroll/payroll-items', { method: 'POST', body: JSON.stringify(data) });
export const updatePayrollItem = (id: string, data: Partial<PayrollItem>): Promise<PayrollItem> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePayrollItem = (id: string): Promise<void> => apiFetch(`/payroll/payroll-items/${id}`, { method: 'DELETE' });
export const getPayrollHistory = (params: any = {}): Promise<any> => apiFetch(`/payroll/payroll-history?${new URLSearchParams(cleanParams(params)).toString()}`);
export const savePayrollRun = (data: Payroll[]): Promise<Payroll[]> => apiFetch('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });

// --- Settings ---
export const getSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/school-info');
export const getPublicSchoolInfo = (): Promise<SchoolInfo> => apiFetch('/settings/public/school-info');
export const getExchangeRates = (): Promise<Record<string, number>> => apiFetch('/settings/public/rates');
export const updateSchoolInfo = (data: SchoolInfo): Promise<SchoolInfo> => apiFetch('/settings/school-info', { method: 'PUT', body: JSON.stringify(data) });
export const getDarajaSettings = (): Promise<DarajaSettings> => apiFetch('/settings/daraja');
export const updateDarajaSettings = (data: DarajaSettings): Promise<DarajaSettings> => apiFetch('/settings/daraja', { method: 'PUT', body: JSON.stringify(data) });
export const uploadLogo = (formData: FormData): Promise<{logoUrl: string}> => apiFetch('/settings/upload-logo', { method: 'POST', body: formData });

// --- Academics ---
export const getClasses = (): Promise<any> => apiFetch('/academics/classes');
export const createClass = (data: any): Promise<SchoolClass> => apiFetch('/academics/classes', { method: 'POST', body: JSON.stringify(data) });
export const updateClass = (id: string, data: any): Promise<SchoolClass> => apiFetch(`/academics/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteClass = (id: string): Promise<void> => apiFetch(`/academics/classes/${id}`, { method: 'DELETE' });
export const updateClasses = (data: SchoolClass[]): Promise<SchoolClass[]> => apiFetch('/academics/classes/batch', { method: 'PUT', body: JSON.stringify(data) });

export const getSubjects = (): Promise<any> => apiFetch('/academics/subjects');
export const createSubject = (data: any): Promise<Subject> => apiFetch('/academics/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id: string, data: any): Promise<Subject> => apiFetch(`/academics/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubject = (id: string): Promise<void> => apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
export const updateSubjects = (data: Subject[]): Promise<Subject[]> => apiFetch('/academics/subjects/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllAssignments = (): Promise<any> => apiFetch('/academics/class-subject-assignments');
export const createAssignment = (data: any): Promise<ClassSubjectAssignment> => apiFetch('/academics/class-subject-assignments', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id: string): Promise<void> => apiFetch(`/academics/class-subject-assignments/${id}`, { method: 'DELETE' });
export const updateAssignments = (data: ClassSubjectAssignment[]): Promise<ClassSubjectAssignment[]> => apiFetch('/academics/class-subject-assignments/batch', { method: 'PUT', body: JSON.stringify(data) });

export const findAllTimetableEntries = (): Promise<TimetableEntry[]> => apiFetch('/academics/timetable-entries');
export const updateTimetable = (data: TimetableEntry[]): Promise<TimetableEntry[]> => apiFetch('/academics/timetable-entries/batch', { method: 'PUT', body: JSON.stringify(data) });
export const findAllExams = (): Promise<Exam[]> => apiFetch('/academics/exams');
export const updateExams = (data: Exam[]): Promise<Exam[]> => apiFetch('/academics/exams/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getGrades = (params: any = {}): Promise<Grade[]> => apiFetch(`/academics/grades?${new URLSearchParams(cleanParams(params)).toString()}`);
export const updateGrades = (data: Grade[]): Promise<Grade[]> => apiFetch('/academics/grades/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getAttendance = (params: any = {}): Promise<any> => apiFetch(`/academics/attendance-records?${new URLSearchParams(cleanParams(params)).toString()}`);
export const updateAttendance = (data: AttendanceRecord[]): Promise<AttendanceRecord[]> => apiFetch('/academics/attendance-records/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getEvents = (): Promise<SchoolEvent[]> => apiFetch('/academics/events');
export const updateEvents = (data: SchoolEvent[]): Promise<SchoolEvent[]> => apiFetch('/academics/events/batch', { method: 'PUT', body: JSON.stringify(data) });
export const getGradingScale = (): Promise<GradingRule[]> => apiFetch('/academics/grading-scale');
export const createGradingRule = (data: NewGradingRule): Promise<GradingRule> => apiFetch('/academics/grading-scale', { method: 'POST', body: JSON.stringify(data) });
export const updateGradingRule = (id: string, data: Partial<GradingRule>): Promise<GradingRule> => apiFetch(`/academics/grading-scale/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGradingRule = (id: string): Promise<void> => apiFetch(`/academics/grading-scale/${id}`, { method: 'DELETE' });
export const getFeeStructure = (): Promise<FeeItem[]> => apiFetch('/academics/fee-structure');
export const createFeeItem = (data: NewFeeItem): Promise<FeeItem> => apiFetch('/academics/fee-structure', { method: 'POST', body: JSON.stringify(data) });
export const updateFeeItem = (id: string, data: Partial<FeeItem>): Promise<FeeItem> => apiFetch(`/academics/fee-structure/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteFeeItem = (id: string): Promise<void> => apiFetch(`/academics/fee-structure/${id}`, { method: 'DELETE' });

// --- Communications ---
export const sendEmail = (payload: { to: string | string[]; subject: string; body: string }): Promise<{ success: boolean; message: string }> => apiFetch('/communications/send-email', { method: 'POST', body: JSON.stringify(payload) });
export const findAllAnnouncements = (): Promise<Announcement[]> => apiFetch('/communications/announcements');
export const createAnnouncement = (data: NewAnnouncement): Promise<Announcement> => apiFetch('/communications/announcements', { method: 'POST', body: JSON.stringify(data) });
export const updateAnnouncement = (id: string, data: Partial<Announcement>): Promise<Announcement> => apiFetch(`/communications/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAnnouncement = (id: string): Promise<void> => apiFetch(`/communications/announcements/${id}`, { method: 'DELETE' });
export const getCommunicationLogs = (params: any = {}): Promise<any> => apiFetch(`/communications/communication-logs?${new URLSearchParams(cleanParams(params)).toString()}`);
export const createCommunicationLog = (data: NewCommunicationLog): Promise<CommunicationLog> => apiFetch('/communications/communication-logs', { method: 'POST', body: JSON.stringify(data) });
export const createBulkCommunicationLogs = (data: NewCommunicationLog[]): Promise<CommunicationLog[]> => apiFetch('/communications/communication-logs/batch', { method: 'POST', body: JSON.stringify(data) });

// --- Super Admin ---
export const getPlatformStats = () => apiFetch('/super-admin/stats');
export const getAllSchools = async (): Promise<SubscriberSchool[]> => {
    const res = await apiFetch('/super-admin/schools');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};
export const createSuperAdminSchool = (data: any): Promise<SubscriberSchool> => apiFetch('/super-admin/schools', { method: 'POST', body: JSON.stringify(data) });
export const getSystemHealth = (): Promise<SystemHealthData> => apiFetch('/super-admin/health');
export const getOnlineUsers = (): Promise<OnlineUserSession[]> => apiFetch('/super-admin/online-users');
export const pingDatabase = (): Promise<{ success: boolean; latencyMs: number; timestamp: string }> => apiFetch('/super-admin/health/ping-db', { method: 'POST' });
export const testQueueWorker = (): Promise<{ success: boolean; jobId: string; message: string; latencyMs: number }> => apiFetch('/super-admin/health/test-queue', { method: 'POST' });
export const retryFailedQueueJobs = (): Promise<{ success: boolean; retriedCount: number }> => apiFetch('/super-admin/health/retry-failed-jobs', { method: 'POST' });
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');
export const updatePlatformPricing = (data: Partial<PlatformPricing>) => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });
export const updateSchoolSubscription = (schoolId: string, payload: any) => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getSubscriptionPayments = () => apiFetch('/super-admin/payments');
export const recordManualSubscriptionPayment = (data: any) => apiFetch('/super-admin/payments/manual', { method: 'POST', body: JSON.stringify(data) });
export const updateSchoolEmail = (id: string, email: string) => apiFetch(`/super-admin/schools/${id}/email`, { method: 'PATCH', body: JSON.stringify({ email }) });
export const updateSchoolPhone = (id: string, phone: string) => apiFetch(`/super-admin/schools/${id}/phone`, { method: 'PATCH', body: JSON.stringify({ phone }) });
export const initiateSubscriptionPayment = (data: { schoolId?: string; amount: number; method: string; plan: string; billingCycle?: string; transactionCode: string; email?: string }): Promise<any> => apiFetch('/super-admin/payments/initiate', { method: 'POST', body: JSON.stringify(data) });

export const getSaasInvoices = async (): Promise<SaasInvoice[]> => {
    const res = await apiFetch('/super-admin/invoices');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};
export const createSaasInvoice = (data: Partial<SaasInvoice>): Promise<SaasInvoice> => apiFetch('/super-admin/invoices', { method: 'POST', body: JSON.stringify(data) });
export const updateSaasInvoiceStatus = (id: string, status: string, paidDate?: string, ref?: string, paymentMethod?: string): Promise<SaasInvoice> => apiFetch(`/super-admin/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, paidDate, transactionRef: ref, paymentMethod }) });
export const getSaasReceipts = async (): Promise<SaasReceipt[]> => {
    const res = await apiFetch('/super-admin/receipts');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};
export const runLifecycleSweep = (): Promise<LifecycleSweepResult> => apiFetch('/super-admin/lifecycle-sweep', { method: 'POST' });
export const sendSchoolReminder = (schoolId: string, message?: string): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/reminder`, { method: 'POST', body: JSON.stringify({ message }) });
export const toggleSchoolAccess = (schoolId: string, enabled: boolean): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/toggle-access`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
export const extendSchoolSubscription = (schoolId: string, days: number): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/extend`, { method: 'POST', body: JSON.stringify({ days }) });
export const activateSchoolSubscription = (schoolId: string, payload: { paymentMethod?: string; transactionRef?: string; plan?: string; billingCycle?: string } = {}): Promise<any> => apiFetch(`/super-admin/schools/${schoolId}/activate`, { method: 'POST', body: JSON.stringify(payload) });

// --- Library ---
export const getBooks = (params: any = {}): Promise<any> => apiFetch(`/library/books?${new URLSearchParams(cleanParams(params)).toString()}`);
export const addBook = (data: NewBook): Promise<any> => apiFetch('/library/books', { method: 'POST', body: JSON.stringify(data) });
export const updateBook = (id: string, data: Partial<Book>): Promise<any> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string): Promise<void> => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: any): Promise<any> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (id: string): Promise<any> => apiFetch(`/library/return/${id}`, { method: 'POST' });
export const markBookLost = (id: string): Promise<any> => apiFetch(`/library/lost/${id}`, { method: 'POST' });
export const getLibraryTransactions = (params: any = {}): Promise<any> => apiFetch(`/library/transactions?${new URLSearchParams(cleanParams(params)).toString()}`);

// --- LMS & Virtual Classrooms ---
export const getLmsAssignments = (params: any = {}): Promise<LmsAssignment[]> => 
    apiFetch(`/lms/assignments?${new URLSearchParams(cleanParams(params)).toString()}`);

export const createLmsAssignment = (data: Partial<LmsAssignment>): Promise<LmsAssignment> => 
    apiFetch('/lms/assignments', { method: 'POST', body: JSON.stringify(data) });

export const updateLmsAssignment = (id: string, data: Partial<LmsAssignment>): Promise<LmsAssignment> => 
    apiFetch(`/lms/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteLmsAssignment = (id: string): Promise<any> => 
    apiFetch(`/lms/assignments/${id}`, { method: 'DELETE' });

export const getLmsSubmissions = (params: any = {}): Promise<LmsSubmission[]> => 
    apiFetch(`/lms/submissions?${new URLSearchParams(cleanParams(params)).toString()}`);

export const submitLmsAssignment = (data: Partial<LmsSubmission>): Promise<LmsSubmission> => 
    apiFetch('/lms/submissions', { method: 'POST', body: JSON.stringify(data) });

export const gradeLmsSubmission = (id: string, data: { score: number; gradeLetter: string; teacherFeedback?: string; gradedBy?: string; rubricScores?: any[] }): Promise<LmsSubmission> => 
    apiFetch(`/lms/submissions/${id}/grade`, { method: 'PATCH', body: JSON.stringify(data) });

export const getLmsLiveClasses = (params: any = {}): Promise<LmsLiveClass[]> => 
    apiFetch(`/lms/live-classes?${new URLSearchParams(cleanParams(params)).toString()}`);

export const createLmsLiveClass = (data: Partial<LmsLiveClass>): Promise<LmsLiveClass> => 
    apiFetch('/lms/live-classes', { method: 'POST', body: JSON.stringify(data) });

export const updateLmsLiveClass = (id: string, data: Partial<LmsLiveClass>): Promise<LmsLiveClass> => 
    apiFetch(`/lms/live-classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteLmsLiveClass = (id: string): Promise<any> => 
    apiFetch(`/lms/live-classes/${id}`, { method: 'DELETE' });

// --- EdTech News & Learning Resources ---
export const getEdTechArticles = async (params: { category?: string; status?: string } = {}): Promise<EdTechArticle[]> => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    const res = await apiFetch(`/edtech-news${query ? `?${query}` : ''}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};

export const getEdTechArticleById = (id: string): Promise<EdTechArticle> => 
    apiFetch(`/edtech-news/${id}`);

export const createEdTechArticle = (data: Partial<EdTechArticle>): Promise<EdTechArticle> => 
    apiFetch('/super-admin/edtech-news', { method: 'POST', body: JSON.stringify(data) });

export const updateEdTechArticle = (id: string, data: Partial<EdTechArticle>): Promise<EdTechArticle> => 
    apiFetch(`/super-admin/edtech-news/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEdTechArticle = (id: string): Promise<any> => 
    apiFetch(`/super-admin/edtech-news/${id}`, { method: 'DELETE' });

export const toggleEdTechArticleStatus = (id: string): Promise<EdTechArticle> => 
    apiFetch(`/super-admin/edtech-news/${id}/toggle-status`, { method: 'POST' });

export const toggleEdTechArticleFeatured = (id: string): Promise<EdTechArticle> => 
    apiFetch(`/super-admin/edtech-news/${id}/toggle-featured`, { method: 'POST' });

export const fetchInitialData = async () => {
    const results = await Promise.all([
        getUsers(),
        getStudents({ pagination: 'false' }),
        getTransactions({ pagination: 'false' }),
        getExpenses({ pagination: 'false' }),
        getStaff(),
        getPayrollHistory({ limit: 1000 }),
        getSubjects(),
        getClasses(),
        findAllAssignments(),
        findAllTimetableEntries(),
        findAllExams(),
        getGrades(),
        getAttendance({ pagination: 'false' }),
        getEvents(),
        getGradingScale(),
        getFeeStructure(),
        getPayrollItems(),
        getCommunicationLogs({ limit: 1000 }),
        findAllAnnouncements(),
        getSchoolInfo(),
        getDarajaSettings()
    ]);
    return results.map(res => (res && typeof res === 'object' && 'data' in res && !Array.isArray(res)) ? res.data : res);
};
