import { EdTechArticle } from '../types';

export const initialEdTechArticles: EdTechArticle[] = [
    {
        id: 'cbc-assessment-matrix',
        slug: 'cbc-assessment-matrix',
        title: 'Mastering the Junior School CBC Assessment Matrix: What Kenyan Headteachers Need to Know',
        category: 'CBC Curriculum',
        date: 'February 24, 2026',
        readTime: '4 min read',
        excerpt: 'How automated rubrics and continuous assessment trackers save teachers up to 14 hours every term while meeting strict KNEC CBA guidelines.',
        author: 'Mary Nduta Mburu',
        authorRole: 'Senior Educational Consultant & Former KICD Curriculum Specialist',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
        coverImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
        status: 'PUBLISHED',
        featured: true,
        tags: ['CBC Framework', 'KNEC CBA', 'Junior Secondary', 'Formative Rubrics', 'School Leadership'],
        learningObjectives: [
            'Understand the core criteria separating Exceeding Expectations (EE) from Meeting Expectations (ME) across strands',
            'Learn how to configure digital continuous assessment trackers for rapid staff grading',
            'Comply with KNEC upload specifications for termly learner assessment portfolios'
        ],
        content: [
            'The transition to the Competency-Based Curriculum (CBC) marks a profound shift from high-stakes rote examinations to continuous formative assessment. However, for many headteachers and subject facilitators, managing learner portfolios across multiple strands and sub-strands has introduced acute administrative friction.',
            'Under the Kenya National Examinations Council (KNEC) guidelines, teachers must track four distinct performance levels: Exceeding Expectations (EE), Meeting Expectations (ME), Approaching Expectations (AE), and Below Expectations (BE). When calculated manually on physical marksheets, this process consumes over 25 hours per term for a teacher managing three streams.',
            'Digital systems like SaasLink eliminate this friction by translating live classroom observations into standardized digital rubrics with single-click scoring. Teachers record assessments directly on smartphones or tablets, while the platform auto-compiles summary CBA upload files formatted precisely to KNEC portal specifications.',
            'The result? A 75% reduction in report compilation time, zero transcription errors, and rich, descriptive narrative reports that give parents deep clarity regarding their child’s unique aptitudes and values.'
        ],
        media: [
            {
                id: 'media-cbc-video-1',
                type: 'VIDEO',
                title: 'Video Masterclass: Implementing CBC Assessment Portfolios in Junior Secondary',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
                duration: '06:45',
                caption: 'Step-by-step video tutorial demonstrating the setup of strands, sub-strands, and competency rubrics on mobile tablets.',
                description: 'KICD Master Trainer Mary Nduta explains practical techniques to observe collaborative learner tasks.'
            },
            {
                id: 'media-cbc-pdf-1',
                type: 'PDF',
                title: 'Official KNEC CBA Assessment Guidelines & Rubrics Matrix (2026 Edition)',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                fileName: 'KNEC_Junior_School_CBA_Rubrics_2026.pdf',
                fileSize: '2.4 MB',
                description: 'Complete regulatory framework and assessment grading descriptors officially endorsed for Kenyan Junior Schools.'
            },
            {
                id: 'media-cbc-img-1',
                type: 'IMAGE',
                title: 'Learner Assessment Continuum & Rubrics Architecture',
                url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
                caption: 'Visual breakdown comparing formative assessment workflows against traditional end-of-term summative exams.'
            }
        ],
        viewsCount: 1420,
        createdAt: '2026-02-24T08:00:00.000Z',
        updatedAt: '2026-02-24T08:00:00.000Z'
    },
    {
        id: 'daraja-mpesa-school-fees',
        slug: 'daraja-mpesa-school-fees',
        title: 'The Death of Paper Receipts: How Real-Time M-Pesa Integration Stops Fee Pilferage',
        category: 'School Finance',
        date: 'January 18, 2026',
        readTime: '5 min read',
        excerpt: 'Why over 400 private and public academies in Kenya are abandoning manual banking slips in favor of automated API ledger reconciliation.',
        author: 'David Ochieng, CPA(K)',
        authorRole: 'Head of Educational Accounts, SaasLink Technologies Ltd',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        coverImageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000',
        status: 'PUBLISHED',
        featured: false,
        tags: ['M-Pesa Automation', 'School Accounts', 'Fee Collection', 'Fraud Prevention', 'Bursar Operations'],
        learningObjectives: [
            'Recognize the top 3 financial leakage vectors in physical school bursar offices',
            'Learn how instant C2B webhooks eliminate forged bank deposit slips',
            'Audit and automate SMS fee receipts for parents with verifiable digital tokens'
        ],
        content: [
            'Every term, school finance offices across Kenya face the same chaotic phenomenon: long cashier queues of parents clutching paper bank deposit slips, faded M-Pesa SMS messages forwarded from third parties, and hours spent manually scouring bank statements to locate missing transaction reference codes.',
            'Manual receipting creates two severe vulnerabilities: human error in ledger posting and deliberate presentation of fabricated or recycled deposit slips. School audits regularly reveal between 3% and 7% uncollected revenue due to slip reconciliation gaps.',
            'With SaasLink’s direct M-Pesa API integration, parents pay directly to the school’s official Paybill quoting their scholar’s admission number as the account reference. Within 800 milliseconds, a verified server-to-server webhook is dispatched.',
            'The student’s digital fee ledger is credited instantly, the parent receives an automated SMS confirmation with a cryptographically verified receipt link, and the Bursar’s dashboard reflects the balance in real-time. No slips, no cash handling, and zero leakage.'
        ],
        media: [
            {
                id: 'media-mpesa-video-1',
                type: 'VIDEO',
                title: 'Live Walkthrough: Real-time M-Pesa C2B Webhook Reconciliation',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600',
                duration: '04:15',
                caption: 'Watch an incoming parent payment credit a student ledger and generate a tax receipt under 2 seconds.'
            },
            {
                id: 'media-mpesa-pdf-1',
                type: 'PDF',
                title: 'School Financial Control & Anti-Pilferage Audit Whitepaper',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                fileName: 'School_Financial_Control_Mpesa_Audit_Guide.pdf',
                fileSize: '1.8 MB',
                description: 'A comprehensive checklist for School Boards of Management (BOM) to eliminate cash handling risks.'
            },
            {
                id: 'media-mpesa-img-1',
                type: 'IMAGE',
                title: 'Automated M-Pesa API Webhook Flowchart',
                url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
                caption: 'Architectural schematic showing end-to-end ledger validation between M-Pesa and the SaasLink Cloud.'
            }
        ],
        viewsCount: 980,
        createdAt: '2026-01-18T10:30:00.000Z',
        updatedAt: '2026-01-18T10:30:00.000Z'
    },
    {
        id: 'data-privacy-kenyan-schools',
        slug: 'data-privacy-kenyan-schools',
        title: 'Kenya Data Protection Act 2019: An Essential Compliance Guide for School Boards',
        category: 'Legal & Policy',
        date: 'March 02, 2026',
        readTime: '6 min read',
        excerpt: 'Understanding your statutory responsibilities as a Data Controller when collecting minor learner records, medical details, and guardian contacts.',
        author: 'Adv. Felix Kipkorir',
        authorRole: 'Legal Counsel & Certified Data Protection Officer, SaasLink Technologies Ltd',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
        coverImageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1000',
        status: 'PUBLISHED',
        featured: false,
        tags: ['ODPC Compliance', 'Data Protection Act 2019', 'Child Safety', 'Cybersecurity', 'School Governance'],
        learningObjectives: [
            'Fulfill statutory ODPC registration requirements as a school Data Controller',
            'Draft legally compliant parent consent clauses for learner biometric and photographic data',
            'Implement encrypted role-based access control (RBAC) to protect student academic profiles'
        ],
        content: [
            'Enacted by the Parliament of Kenya, the Data Protection Act (DPA) of 2019 governs how organizations collect, process, store, and share personal data. Because schools routinely process sensitive data concerning minors, the Office of the Data Protection Commissioner (ODPC) has designated educational institutions as high-responsibility data controllers.',
            'Key statutory obligations required of schools include obtaining explicit parental consent, ensuring that student marks are not publicly displayed without authorization, and engaging only vetted, certified cloud data processors.',
            'SaasLink Technologies Ltd acts as your compliant Data Processor. All databases are isolated through rigorous multi-tenancy, encrypted at rest with AES-256 standards, and hosted in sovereign, highly audited cloud facilities. School directors can rest assured that their digital infrastructure complies fully with Kenyan statutory mandates.'
        ],
        media: [
            {
                id: 'media-dpa-pdf-1',
                type: 'PDF',
                title: 'School Board of Management ODPC Compliance Self-Assessment Checklist',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                fileName: 'ODPC_School_Board_Compliance_Checklist_2026.pdf',
                fileSize: '1.2 MB',
                description: 'Practical 10-point statutory checklist to prepare your academy for Ministry and ODPC compliance audits.'
            },
            {
                id: 'media-dpa-img-1',
                type: 'IMAGE',
                title: 'Data Controller vs Data Processor Responsibilities in Schools',
                url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
                caption: 'Legal division of duties between the school board and cloud software vendors.'
            }
        ],
        viewsCount: 740,
        createdAt: '2026-03-02T14:15:00.000Z',
        updatedAt: '2026-03-02T14:15:00.000Z'
    },
    {
        id: 'dual-curriculum-hybrid',
        slug: 'dual-curriculum-hybrid',
        title: 'Dual-Curriculum Timetabling: Strategies for Schools Running CBC and Traditional 8-4-4 Concurrently',
        category: 'Academic Administration',
        date: 'December 12, 2025',
        readTime: '4 min read',
        excerpt: 'How hybrid academies seamlessly timetable shared laboratories, specialist teachers, and dual grading scales under one roof.',
        author: 'Grace Muthoni K.',
        authorRole: 'Principal, Greenfield Comprehensive Academy',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
        coverImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000',
        status: 'PUBLISHED',
        featured: false,
        tags: ['Timetabling', 'Hybrid Schools', '8-4-4 to CBC', 'Staff Scheduling', 'Facility Optimization'],
        learningObjectives: [
            'Eliminate room and teacher double-booking between 8-4-4 senior forms and CBC junior streams',
            'Combine lab resource schedules without disrupting practical exam preparations',
            'Generate unified teacher timetables supporting different lesson period lengths'
        ],
        content: [
            'During the ongoing national transition, Kenyan schools frequently operate as hybrid institutions—educating Junior Secondary learners under the CBC framework while preparing senior candidates under the traditional 8-4-4 or international curriculums.',
            'This dual environment creates administrative headaches: timetabling shared science labs, assigning teachers who instruct both systems, and generating two completely divergent report card formats at the close of term.',
            'SaasLink was engineered from inception with unified dual-curriculum flexibility. School administrators configure CBC learning areas for lower cohorts and numerical subject marksheets for senior forms on the exact same portal. Staff seamlessly view their individual schedules without curriculum conflict.'
        ],
        media: [
            {
                id: 'media-hybrid-pdf-1',
                type: 'PDF',
                title: 'Dual-Curriculum Timetabling Matrix & Allocation Template',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                fileName: 'Dual_Curriculum_Timetabling_Framework.pdf',
                fileSize: '3.1 MB',
                description: 'Ready-to-use timetable template with collision detection formulas for dual-system academies.'
            },
            {
                id: 'media-hybrid-video-1',
                type: 'VIDEO',
                title: 'Staff Scheduling Webinar: Conflict-Free Lab and Teacher Allocations',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600',
                duration: '05:10',
                caption: 'Step-by-step masterclass on assigning shared teachers across junior CBC and senior secondary classes.'
            }
        ],
        viewsCount: 1105,
        createdAt: '2025-12-12T09:00:00.000Z',
        updatedAt: '2025-12-12T09:00:00.000Z'
    }
];
