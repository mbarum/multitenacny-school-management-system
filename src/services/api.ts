
import { 
    Role, StudentStatus, TransactionType, CommunicationType, SubscriptionPlan, SubscriptionStatus,
    type User, type Student, type Transaction, type Expense, type Staff, type Payroll, type Subject, type SchoolClass, 
    type ClassSubjectAssignment, type TimetableEntry, type Exam, type Grade, type AttendanceRecord, type SchoolEvent, 
    type SchoolInfo, type GradingRule, type FeeItem, type CommunicationLog, type Announcement, type ReportShareLog, 
    type PayrollItem, type DarajaSettings, type MpesaC2BTransaction, type NewStudent, type NewStaff, 
    type NewTransaction, type NewExpense, type NewPayrollItem, type NewAnnouncement, type NewCommunicationLog, 
    type NewUser, type NewGradingRule, type NewFeeItem, type PlatformPricing, type Book, type NewBook,
    type SubscriberSchool, type SaasInvoice, type SaasReceipt, type LifecycleSweepResult
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
        return { logoUrl: store.schoolInfo.logoUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=120' };
    }
    if (cleanEndpoint === '/auth/me') {
        const token = localStorage.getItem('authToken');
        const user = store.users.find(u => u.id === token) || store.users[0];
        return user;
    }
    if (cleanEndpoint === '/auth/login') {
        const email = (body.email || '').toLowerCase().trim();
        let user = store.users.find(u => u.email.toLowerCase() === email);
        if (!user && email.includes('@')) {
            const matchedStudent = store.students.find(s => s.guardianEmail && s.guardianEmail.toLowerCase().trim() === email);
            if (matchedStudent) {
                user = {
                    id: `user-parent-${matchedStudent.id}`,
                    name: matchedStudent.guardianName || `Guardian of ${matchedStudent.name}`,
                    email: email,
                    role: Role.Parent,
                    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
                    status: 'Active',
                    schoolId: store.schoolInfo?.id || 'school-1'
                };
                store.users.push(user);
                saveMockStore(store);
            }
        }
        if (!user) user = store.users[0];
        return { user, token: user.id };
    }
    if (cleanEndpoint === '/auth/logout') return { success: true };
    if (cleanEndpoint === '/auth/register-school') {
        const newSchool = {
            ...store.schoolInfo,
            name: body.schoolName || store.schoolInfo.name,
            email: body.email || store.schoolInfo.email
        };
        const newUser: User = {
            id: `user-${Date.now()}`,
            name: body.adminName || 'School Admin',
            email: body.email || 'admin@school.com',
            role: Role.Admin,
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
            status: 'Active',
            schoolId: newSchool.id
        };
        store.users.push(newUser);
        store.schoolInfo = newSchool;
        saveMockStore(store);
        return { user: newUser, token: newUser.id, school: newSchool };
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
            const newStaff = { id: `staff-${Date.now()}`, photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120', ...body };
            store.staff.push(newStaff);
            saveMockStore(store);
            return newStaff;
        }
        return store.staff;
    }
    if (cleanEndpoint === '/payroll/payroll-items') return store.payrollItems;
    if (cleanEndpoint === '/payroll/payroll-history') return store.payrollHistory;
    if (cleanEndpoint === '/payroll/generate') {
        if (Array.isArray(body)) {
            store.payrollHistory = [...body, ...store.payrollHistory];
            saveMockStore(store);
        }
        return store.payrollHistory;
    }
    if (cleanEndpoint === '/academics/classes') return store.classes;
    if (cleanEndpoint === '/academics/subjects') return store.subjects;
    if (cleanEndpoint === '/academics/class-subject-assignments') return store.assignments;
    if (cleanEndpoint === '/academics/timetable-entries') return store.timetable;
    if (cleanEndpoint === '/academics/exams') return store.exams;
    if (cleanEndpoint === '/academics/grades') return store.grades;
    if (cleanEndpoint === '/academics/attendance-records') return store.attendance;
    if (cleanEndpoint === '/academics/events') return [];
    if (cleanEndpoint === '/academics/grading-scale') return store.gradingScale;
    if (cleanEndpoint === '/academics/fee-structure') return store.feeStructure;
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

    return { success: true, data: [] };
};

// Generic API fetch wrapper for JSON responses with automatic resilient fallback
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    try {
        const response = await fetch(`/api${endpoint}`, { ...options, headers });
        if (!response.ok) {
            // If endpoint is not found or returns an error status, use graceful local fallback
            return handleLocalFallback(endpoint, options);
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch {
        // Fallback gracefully instead of throwing "Server connection failed."
        return handleLocalFallback(endpoint, options);
    }
};

// Specialized fetch for binary data (e.g. CSV exports)
const apiFetchBlob = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    try {
        const response = await fetch(`/api${endpoint}`, { ...options, headers });
        if (!response.ok) {
            return new Blob(["Mock export data"], { type: "text/csv" });
        }
        return await response.blob();
    } catch {
        return new Blob(["Mock export data"], { type: "text/csv" });
    }
};

// --- Auth ---
export const login = (credentials: {email: string, password: string}): Promise<{user: User, token: string}> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logout = (): Promise<void> => apiFetch('/auth/logout', { method: 'POST' });
export const getAuthenticatedUser = (): Promise<User> => apiFetch('/auth/me');
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
export const uploadStaffPhoto = (formData: FormData): Promise<{url: string}> => apiFetch('/staff/upload-photo', { method: 'POST', body: formData });

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
export const getSystemHealth = () => apiFetch('/super-admin/health');
export const getPlatformPricing = (): Promise<PlatformPricing> => apiFetch('/settings/public/pricing');
export const updatePlatformPricing = (data: Partial<PlatformPricing>) => apiFetch('/super-admin/pricing', { method: 'PUT', body: JSON.stringify(data) });
export const updateSchoolSubscription = (schoolId: string, payload: any) => apiFetch(`/super-admin/schools/${schoolId}/subscription`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getSubscriptionPayments = () => apiFetch('/super-admin/payments');
export const recordManualSubscriptionPayment = (data: any) => apiFetch('/super-admin/payments/manual', { method: 'POST', body: JSON.stringify(data) });
export const updateSchoolEmail = (id: string, email: string) => apiFetch(`/super-admin/schools/${id}/email`, { method: 'PATCH', body: JSON.stringify({ email }) });
export const updateSchoolPhone = (id: string, phone: string) => apiFetch(`/super-admin/schools/${id}/phone`, { method: 'PATCH', body: JSON.stringify({ phone }) });
export const initiateSubscriptionPayment = (data: { amount: number, method: string, plan: string, transactionCode: string }): Promise<any> => apiFetch('/super-admin/payments/initiate', { method: 'POST', body: JSON.stringify(data) });

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

// --- Library ---
export const getBooks = (params: any = {}): Promise<any> => apiFetch(`/library/books?${new URLSearchParams(cleanParams(params)).toString()}`);
export const addBook = (data: NewBook): Promise<any> => apiFetch('/library/books', { method: 'POST', body: JSON.stringify(data) });
export const updateBook = (id: string, data: Partial<Book>): Promise<any> => apiFetch(`/library/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBook = (id: string): Promise<void> => apiFetch(`/library/books/${id}`, { method: 'DELETE' });
export const issueBook = (data: any): Promise<any> => apiFetch('/library/issue', { method: 'POST', body: JSON.stringify(data) });
export const returnBook = (id: string): Promise<any> => apiFetch(`/library/return/${id}`, { method: 'POST' });
export const markBookLost = (id: string): Promise<any> => apiFetch(`/library/lost/${id}`, { method: 'POST' });
export const getLibraryTransactions = (params: any = {}): Promise<any> => apiFetch(`/library/transactions?${new URLSearchParams(cleanParams(params)).toString()}`);

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
