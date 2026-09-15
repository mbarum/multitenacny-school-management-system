import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'sw' | 'fr';

export interface LanguageContextType {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => void;
    t: (key: string, fallback?: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'saaslink_language_preference';

export const translations: Record<SupportedLanguage, Record<string, string>> = {
    en: {
        // Nav & General
        'nav.curriculum': 'CBC & 8-4-4 Systems',
        'nav.features': 'Capabilities',
        'nav.pricing': 'Subscription Plans',
        'nav.news': 'EdTech News',
        'nav.contact': 'Contact & Support',
        'nav.subscribe': 'Subscribe School',
        'nav.login': 'Log In',

        // Hero
        'hero.badge': 'Operating Cloud for K-12 & High Schools Across East Africa & Beyond',
        'hero.title.pre': 'The All-in-One Cloud Management Suite for',
        'hero.title.highlight': 'K-12 & High Schools',
        'hero.title.post': 'in East Africa & Beyond',
        'hero.description': 'Engineered for Primary, Junior School, and High Schools across East Africa and beyond. Seamlessly unifies Competency-Based Education (CBE/CBC), traditional 8-4-4 numeric examinations, automated M-Pesa fee reconciliation, and instant parent notifications in English, Swahili, and French.',
        'hero.btn.subscribe': 'Subscribe Your School Now',
        'hero.btn.call': 'Direct Inquiries: +254 720 935 895',

        // Metrics
        'metrics.schools': 'Schools Enrolled',
        'metrics.schools.sub': 'Kenya, Uganda, Tanzania & Rwanda',
        'metrics.reconciliation': 'Automated M-Pesa Hook',
        'metrics.reconciliation.sub': 'Zero manual receipting',
        'metrics.curriculum': 'CBE & 8-4-4 Standard',
        'metrics.curriculum.sub': 'Primary through High School (K-12)',
        'metrics.currencies': 'Multi-Currency Ready',
        'metrics.currencies.sub': 'KES, UGX, TZS, RWF, BIF, USD',

        // Curriculum section
        'curriculum.badge': 'Dual-Curriculum & Regional Standard',
        'curriculum.title': 'Unified for Competency-Based (CBE) & Traditional 8-4-4 Systems',
        'curriculum.desc': 'East African and regional institutions demand flexibility—balancing formative Competency-Based Education (CBE/CBC) rubrics with classical 8-4-4 numeric rankings from Primary to High School. SaasLink delivers certified evaluation engines for both methodologies.',
        'curriculum.cbe.title': 'Competency-Based Education (CBE / CBC)',
        'curriculum.cbe.tag': 'Primary, Junior & Senior Secondary (K-12)',
        'curriculum.cbe.desc': 'Comprehensive formative scoring across strands, sub-strands, core competencies, and values. Fully compatible with national assessment portals and digital progress tracking.',
        'curriculum.cbe.f1': 'Formative 4-Level Performance Rubrics (Exceeding, Meeting, Approaching, Below).',
        'curriculum.cbe.f2': 'Digital Learner Assessment Portfolios ready for institutional and ministry export.',
        'curriculum.cbe.f3': 'Holistic competency, core values, and co-curricular rubric tracking.',
        
        'curriculum.traditional.title': 'Traditional 8-4-4 & Numeric Examination System',
        'curriculum.traditional.tag': 'Primary to High School Examination Streams',
        'curriculum.traditional.desc': 'Rigorous numeric examination computation engineered for primary, secondary, and high schools across Kenya and neighboring territories.',
        'curriculum.traditional.f1': 'Standardized 12-point grading engine with mean grade deviations and stream rankings.',
        'curriculum.traditional.f2': 'Automated Opener, Midterm CAT, and End-of-Term cumulative weightings.',
        'curriculum.traditional.f3': 'Institutional merit broadsheets, terminal report cards, and tamper-evident QR validation.',

        // Features
        'features.badge': 'Complete Institutional Suite',
        'features.title': 'Engineered for Regional Institutional Rigor & Zero Fraud',
        'features.mpesa.title': 'Mobile Money Integration',
        'features.mpesa.desc': 'Connect your school mobile money till or paybill directly. Instant server webhook verification automatically reconciles fee balances in under 800 milliseconds and dispatches instant SMS alerts to guardians.',
        'features.multicurrency.title': 'East African Currencies & USD',
        'features.multicurrency.desc': 'Full regional multi-currency support: KES (Kenya), UGX (Uganda), TZS (Tanzania), RWF (Rwanda), BIF (Burundi), and USD (Global) with dynamic conversion and localized financial reporting.',
        'features.multilingual.title': 'Multi-Language Interface',
        'features.multilingual.desc': 'Available in English, Swahili (Kiswahili), and French (Français) to empower school administrators, teachers, and parents seamlessly across the East African Community.',

        // Pricing Badges
        'pricing.badge.mpesa': 'Automated M-Pesa Fee Reconciliation',
        'pricing.badge.mpesa.sub': 'Direct automated mobile money webhook clearing & instant receipts',
        'pricing.badge.compliance': 'Institutional Data Privacy & Sovereignty',
        'pricing.badge.compliance.sub': 'Encrypted cloud multi-tenancy compliant with regional Data Protection acts',
        'pricing.badge.migration': 'Free Guided Onboarding & Rapid Data Migration',
        'pricing.badge.migration.sub': 'Complimentary transition support, historical Excel ledger import & staff training',

        // In-App Navigation Items
        'nav.dashboard': 'Dashboard',
        'nav.students': 'Students',
        'nav.fees': 'Fee Management',
        'nav.expenses': 'Expenses',
        'nav.staff_payroll': 'Staff & Payroll',
        'nav.academics': 'Academics',
        'nav.timetable': 'Timetable',
        'nav.attendance': 'Attendance',
        'nav.calendar': 'Calendar',
        'nav.examinations': 'Examinations',
        'nav.lms': 'LMS & Live Classes',
        'nav.report_cards': 'Report Cards',
        'nav.library': 'Library',
        'nav.communication': 'Communication',
        'nav.reporting': 'Reporting & Analytics',
        'nav.settings': 'Settings',
        'nav.teacher_dashboard': 'Teacher Dashboard',
        'nav.my_class': 'My Class',
        'nav.teacher_attendance': 'Attendance Register',
        'nav.teacher_examinations': 'Class Examinations',
        'nav.teacher_communication': 'Class Messages',
        'nav.parent_dashboard': 'Parent Portal',
        'nav.parent_lms': 'Homework & LMS',
        'nav.parent_finances': 'Student Fee Ledger',
        'nav.parent_announcements': 'School Bulletins',
        'nav.super_admin_dashboard': 'Platform Operations',

        // Header & Interface
        'header.greeting': 'Hello',
        'header.notifications': 'Notifications',
        'header.theme.light': 'Light',
        'header.theme.dark': 'Dark',
        'header.theme.mode': 'Theme Mode',
        'header.theme.titleLight': 'Switch to light mode',
        'header.theme.titleDark': 'Switch to dark mode',
        'header.activeAccount': 'Active Account',
        'header.profileSettings': 'Profile Settings',
        'header.signOut': 'Sign Out',
        'header.language': 'Language',
        'header.selectLanguage': 'Select Interface Language',
        'header.notice.superAdmin': 'System Notice: {count} new applications are awaiting manual financial verification.',
        'header.processQueue': 'Process Queue',
        'header.openSidebar': 'Open navigation sidebar',
    },
    sw: {
        // Nav & General
        'nav.curriculum': 'Mifumo ya CBE na 8-4-4',
        'nav.features': 'Uwezo wa Mfumo',
        'nav.pricing': 'Mipango ya Malipo',
        'nav.news': 'Habari za Elimu (EdTech)',
        'nav.contact': 'Wasiliana Nasi',
        'nav.subscribe': 'Sajili Shule Yako',
        'nav.login': 'Ingia Kwenye Akaunti',

        // Hero
        'hero.badge': 'Mfumo Rasmi wa Kidijitali kwa Shule za Msingi na Sekondari Afrika Mashariki na Zaidi',
        'hero.title.pre': 'Mfumo Jumuishi wa Kidijitali wa Usimamizi wa',
        'hero.title.highlight': 'Shule za K-12 na Sekondari',
        'hero.title.post': 'Afrika Mashariki na Nje ya Mipaka',
        'hero.description': 'Imeundwa kwa ustadi kwa shule za msingi na sekondari (K-12) kote Afrika Mashariki. Inaunganisha mtaala wa umilisi (CBE/CBC), mtihani wa jadi wa 8-4-4, upatanisho wa malipo ya M-Pesa kiotomatiki, na arifa za wazazi kwa Kiingereza, Kiswahili na Kifaransa.',
        'hero.btn.subscribe': 'Sajili Shule Yako Sasa',
        'hero.btn.call': 'Mawasiliano ya Moja kwa Moja: +254 720 935 895',

        // Metrics
        'metrics.schools': 'Shule Zinazotumia',
        'metrics.schools.sub': 'Kenya, Uganda, Tanzania na Rwanda',
        'metrics.reconciliation': 'Upatanisho wa M-Pesa',
        'metrics.reconciliation.sub': 'Hakuna risiti za karatasi tena',
        'metrics.curriculum': 'Mitaala ya CBE na 8-4-4',
        'metrics.curriculum.sub': 'Kuanzia chekechea hadi sekondari',
        'metrics.currencies': 'Sarafu Zote za Ukanda',
        'metrics.currencies.sub': 'KES, UGX, TZS, RWF, BIF na USD',

        // Curriculum section
        'curriculum.badge': 'Viwango vya Pamoja vya Mitaala ya Kanda',
        'curriculum.title': 'Imeunganishwa kwa Mtaala wa Umilisi (CBE) na Mfumo wa Jadi wa 8-4-4',
        'curriculum.desc': 'Shule za Afrika Mashariki zinahitaji urahisi wa kusimamia tathmini ya umilisi (CBE/CBC) pamoja na alama za kawaida za mfumo wa 8-4-4 kuanzia shule ya msingi hadi kidato cha nne. SaasLink inatoa suluhisho kamili la tathmini kwa mifumo yote miwili.',
        'curriculum.cbe.title': 'Mtaala Unaozingatia Umilisi (CBE / CBC)',
        'curriculum.cbe.tag': 'Shule za Awali, Msingi na Sekondari ya Chini (K-12)',
        'curriculum.cbe.desc': 'Tathmini ya kina ya maendeleo ya mwanafunzi katika maeneo mbalimbali, maadili na ujuzi wa kimsingi. Inalingana na miongozo ya wizara na mitihani ya kitaifa.',
        'curriculum.cbe.f1': 'Viwango 4 Rasmi vya Tathmini (Kuzidi Matarajio, Kufikia, Kuelekea, Chini ya Matarajio).',
        'curriculum.cbe.f2': 'Kumbukumbu za kidijitali za mwanafunzi zilizotayarishwa kusafirishwa kwenye tovuti za kitaifa.',
        'curriculum.cbe.f3': 'Ufuatiliaji wa kina wa maadili, talanta, na umilisi wa mwanafunzi.',

        'curriculum.traditional.title': 'Mfumo wa Jadi wa 8-4-4 & Hesabu za Mitihani',
        'curriculum.traditional.tag': 'Madarasa ya Mitihani ya Msingi na Sekondari',
        'curriculum.traditional.desc': 'Injini yenye nguvu ya kukokotoa alama na madaraja ya mitihani kwa shule zote za sekondari na bweni kote nchini na ukanda wa Afrika Mashariki.',
        'curriculum.traditional.f1': 'Mfumo wa madaraja 12 wenye wastani wa alama, nafasi za mtiririko na mkengeuko wa wastani.',
        'curriculum.traditional.f2': 'Hesabu za kiotomatiki za mitihani ya mwanzo wa muhula, katikati (CAT) na mwisho wa muhula.',
        'curriculum.traditional.f3': 'Jedwali kuu la matokeo (broadsheets), kadi za ripoti, na nambari salama ya uthibitishaji ya QR.',

        // Features
        'features.badge': 'Mfumo Kamilifu wa Usimamizi',
        'features.title': 'Imejengwa kwa Usalama wa Hali ya Juu na Kudhibiti Upotevu wa Fedha',
        'features.mpesa.title': 'Muunganisho wa Pesa kwa Njia ya Simu (Mobile Money)',
        'features.mpesa.desc': 'Unganisha nambari ya Paybill au Till ya shule yako moja kwa moja. Mfumo unapokea na kusasisha taarifa za karo ndani ya sekunde moja (milisekunde 800) na kutuma risiti ya SMS kwa mzazi papo hapo.',
        'features.multicurrency.title': 'Sarafu za Afrika Mashariki na Dola (USD)',
        'features.multicurrency.desc': 'Msaada kamili wa sarafu: Shilingi ya Kenya (KES), Uganda (UGX), Tanzania (TZS), Faranga ya Rwanda (RWF), Burundi (BIF) na Dola ya Marekani (USD) kwa uwazi kamili wa mahesabu ya shule.',
        'features.multilingual.title': 'Mfumo katika Lugha Nyingi',
        'features.multilingual.desc': 'Unapatikana kwa Kiingereza, Kiswahili na Kifaransa (Français) ili kuwezesha wakuu wa shule, walimu na wazazi kote katika Jumuiya ya Afrika Mashariki (EAC).',

        // Pricing Badges
        'pricing.badge.mpesa': 'Upatanisho wa Malipo ya M-Pesa Kiotomatiki',
        'pricing.badge.mpesa.sub': 'Uthibitishaji wa papo hapo wa miamala ya Paybill na kutoa risiti bila kuchelewa',
        'pricing.badge.compliance': 'Faragha na Usalama wa Data ya Shule',
        'pricing.badge.compliance.sub': 'Uhifadhi salama wa wingu unaotii sheria za ulinzi wa data za kikanda',
        'pricing.badge.migration': 'Mafunzo ya Bure kwa Wafanyakazi na Uhamishaji wa Data',
        'pricing.badge.migration.sub': 'Usaidizi wa bure wa kuhamisha taarifa kutoka Excel na daftari za karatasi na kutoa mafunzo kwa walimu',

        // In-App Navigation Items
        'nav.dashboard': 'Dashibodi Kuu',
        'nav.students': 'Wanafunzi',
        'nav.fees': 'Usimamizi wa Karo',
        'nav.expenses': 'Matumizi ya Shule',
        'nav.staff_payroll': 'Wafanyakazi na Mishahara',
        'nav.academics': 'Masomo na Mitaala',
        'nav.timetable': 'Ratiba ya Masomo',
        'nav.attendance': 'Mahudhurio',
        'nav.calendar': 'Kalenda ya Shule',
        'nav.examinations': 'Mitihani na Tathmini',
        'nav.lms': 'LMS na Madarasa Mtandaoni',
        'nav.report_cards': 'Kadi za Ripoti',
        'nav.library': 'Maktaba',
        'nav.communication': 'Mawasiliano na SMS',
        'nav.reporting': 'Ripoti na Takwimu',
        'nav.settings': 'Mipangilio ya Mfumo',
        'nav.teacher_dashboard': 'Dashibodi ya Mwalimu',
        'nav.my_class': 'Darasa Langu',
        'nav.teacher_attendance': 'Daftari la Mahudhurio',
        'nav.teacher_examinations': 'Mitihani ya Darasa',
        'nav.teacher_communication': 'Ujumbe wa Darasa',
        'nav.parent_dashboard': 'Lango la Mzazi',
        'nav.parent_lms': 'Kazi za Nyumbani (LMS)',
        'nav.parent_finances': 'Daftari la Karo ya Mtoto',
        'nav.parent_announcements': 'Matangazo ya Shule',
        'nav.super_admin_dashboard': 'Usimamizi wa Mfumo Mkuu',

        // Header & Interface
        'header.greeting': 'Habari',
        'header.notifications': 'Taarifa',
        'header.theme.light': 'Mwangaza',
        'header.theme.dark': 'Giza',
        'header.theme.mode': 'Hali ya Muonekano',
        'header.theme.titleLight': 'Badili kwa hali ya mwangaza',
        'header.theme.titleDark': 'Badili kwa hali ya giza',
        'header.activeAccount': 'Akaunti Iliyopo',
        'header.profileSettings': 'Mipangilio ya Wasifu',
        'header.signOut': 'Ondoka Kwenye Mfumo',
        'header.language': 'Lugha',
        'header.selectLanguage': 'Chagua Lugha ya Mfumo',
        'header.notice.superAdmin': 'Taarifa ya Mfumo: Maombi mapya {count} yanasubiri uhakiki wa fedha.',
        'header.processQueue': 'Kagua Sasa',
        'header.openSidebar': 'Fungua menyu ya urambazaji',
    },
    fr: {
        // Nav & General
        'nav.curriculum': 'Programmes CBE et 8-4-4',
        'nav.features': 'Fonctionnalités',
        'nav.pricing': 'Tarification & Abonnements',
        'nav.news': 'Actualités EdTech',
        'nav.contact': 'Contact & Support',
        'nav.subscribe': 'Inscrire l’Établissement',
        'nav.login': 'Connexion',

        // Hero
        'hero.badge': 'Plateforme Cloud pour Écoles Maternelles, Primaires et Secondaires (K-12) en Afrique de l’Est et au-delà',
        'hero.title.pre': 'La Suite Cloud Intégrée de Gestion Scolaire pour les',
        'hero.title.highlight': 'Établissements K-12 et Secondaires',
        'hero.title.post': 'en Afrique de l’Est et au-delà',
        'hero.description': 'Conçue pour les écoles primaires et secondaires (K-12) à travers l’Afrique de l’Est et au-delà. Unifie harmonieusement l’Approche Par Compétences (APC/CBE), le système traditionnel 8-4-4, le rapprochement automatisé des paiements M-Pesa et les notifications SMS multilingues en anglais, swahili et français.',
        'hero.btn.subscribe': 'Inscrire Votre Établissement',
        'hero.btn.call': 'Ligne Directe: +254 720 935 895',

        // Metrics
        'metrics.schools': 'Établissements Actifs',
        'metrics.schools.sub': 'Kenya, Ouganda, Tanzanie, Rwanda & Burundi',
        'metrics.reconciliation': 'Rapprochement Automatisé M-Pesa',
        'metrics.reconciliation.sub': 'Zéro saisie manuelle de reçus',
        'metrics.curriculum': 'Programmes CBE & 8-4-4',
        'metrics.curriculum.sub': 'Du Primaire au Secondaire Supérieur',
        'metrics.currencies': 'Multi-Devises Régionales',
        'metrics.currencies.sub': 'KES, UGX, TZS, RWF, BIF, USD',

        // Curriculum section
        'curriculum.badge': 'Standard de Double Cursus Régional',
        'curriculum.title': 'Optimisé pour l’Éducation par Compétences (CBE) et le Système 8-4-4',
        'curriculum.desc': 'Les établissements est-africains exigent une gestion flexible permettant d’allier les rubriques formatives par compétences (CBE) aux classements numériques du système 8-4-4 du primaire au lycée. SaasLink propose des moteurs d’évaluation certifiés pour ces deux approches.',
        'curriculum.cbe.title': 'Approche Par Compétences (APC / CBE / CBC)',
        'curriculum.cbe.tag': 'Primaire, Collège et Lycée (K-12)',
        'curriculum.cbe.desc': 'Évaluation formative rigoureuse à travers les compétences clés, les sous-domaines et les valeurs fondamentales, prête pour l’exportation institutionnelle et ministérielle.',
        'curriculum.cbe.f1': 'Barème d’évaluation officiel à 4 niveaux (Dépasse, Atteint, Approche, En dessous).',
        'curriculum.cbe.f2': 'Portfolios numériques des élèves formatés pour synchronisation avec les portails officiels.',
        'curriculum.cbe.f3': 'Suivi qualitatif des compétences clés, de la citoyenneté et des valeurs éthiques.',

        'curriculum.traditional.title': 'Système Traditionnel 8-4-4 & Notations Numériques',
        'curriculum.traditional.tag': 'Cycles d’Examens Primaires et Secondaires',
        'curriculum.traditional.desc': 'Moteur de notation numérique complet adapté aux collèges, lycées et internats à travers toute la région.',
        'curriculum.traditional.f1': 'Barème normalisé à 12 points avec calcul des moyennes, classements et écarts types.',
        'curriculum.traditional.f2': 'Pondération automatisée des évaluations continues, devoirs surveillés et examens terminaux.',
        'curriculum.traditional.f3': 'Bulletins de notes officiels, récapitulatifs de classe et validation sécurisée par code QR.',

        // Features
        'features.badge': 'Suite Administrative Complète',
        'features.title': 'Conçue pour la Rigueur Institutionnelle et la Prévention des Fraudes',
        'features.mpesa.title': 'Intégration Mobile Money',
        'features.mpesa.desc': 'Connectez directement le compte Paybill ou Till de votre établissement. Le webhook serveur valide et comptabilise les règlements de frais en moins de 800 millisecondes et déclenche l’envoi d’un reçu SMS immédiat.',
        'features.multicurrency.title': 'Devises d’Afrique de l’Est et USD',
        'features.multicurrency.desc': 'Prise en charge native des devises régionales: KES (Kenya), UGX (Ouganda), TZS (Tanzanie), RWF (Rwanda), BIF (Burundi) et Dollar américain (USD) avec conversion dynamique.',
        'features.multilingual.title': 'Interface Trilingue Intégrée',
        'features.multilingual.desc': 'Disponible en anglais, swahili et français pour faciliter la collaboration entre administrateurs, enseignants et parents dans toute la Communauté d’Afrique de l’Est.',

        // Pricing Badges
        'pricing.badge.mpesa': 'Rapprochement Automatisé des Frais M-Pesa',
        'pricing.badge.mpesa.sub': 'Traitement automatisé par webhook mobile money et délivrance instantanée de quittances',
        'pricing.badge.compliance': 'Souveraineté et Protection des Données Scolaires',
        'pricing.badge.compliance.sub': 'Hébergement cloud souverain hautement sécurisé conforme aux lois régionales sur la protection des données',
        'pricing.badge.migration': 'Formation Gratuite du Personnel et Migration Rapide',
        'pricing.badge.migration.sub': 'Accompagnement offert pour l’importation de vos fichiers Excel et formation pratique de vos équipes',

        // In-App Navigation Items
        'nav.dashboard': 'Tableau de Bord',
        'nav.students': 'Élèves & Inscriptions',
        'nav.fees': 'Gestion des Frais Scolaires',
        'nav.expenses': 'Dépenses & Achats',
        'nav.staff_payroll': 'Personnel & Salaires',
        'nav.academics': 'Programmes & Matières',
        'nav.timetable': 'Emploi du Temps',
        'nav.attendance': 'Registre des Présences',
        'nav.calendar': 'Calendrier Scolaire',
        'nav.examinations': 'Examens & Évaluations',
        'nav.lms': 'LMS & Classes Virtuelles',
        'nav.report_cards': 'Bulletins de Notes',
        'nav.library': 'Bibliothèque Scolaire',
        'nav.communication': 'Communications & SMS',
        'nav.reporting': 'Rapports & Statistiques',
        'nav.settings': 'Paramètres Généraux',
        'nav.teacher_dashboard': 'Espace Enseignant',
        'nav.my_class': 'Ma Classe',
        'nav.teacher_attendance': 'Appel de Classe',
        'nav.teacher_examinations': 'Évaluations de la Classe',
        'nav.teacher_communication': 'Messages aux Parents',
        'nav.parent_dashboard': 'Espace Parents',
        'nav.parent_lms': 'Devoirs & Cours LMS',
        'nav.parent_finances': 'Relevé des Écolages',
        'nav.parent_announcements': 'Circulaires de l’Établissement',
        'nav.super_admin_dashboard': 'Supervision de la Plateforme',

        // Header & Interface
        'header.greeting': 'Bonjour',
        'header.notifications': 'Notifications',
        'header.theme.light': 'Clair',
        'header.theme.dark': 'Sombre',
        'header.theme.mode': 'Mode de Thème',
        'header.theme.titleLight': 'Passer en mode clair',
        'header.theme.titleDark': 'Passer en mode sombre',
        'header.activeAccount': 'Compte Actif',
        'header.profileSettings': 'Paramètres du Profil',
        'header.signOut': 'Déconnexion',
        'header.language': 'Langue',
        'header.selectLanguage': 'Sélectionner la Langue',
        'header.notice.superAdmin': 'Avis Système: {count} nouvelles demandes sont en attente de vérification financière.',
        'header.processQueue': 'Traiter la File',
        'header.openSidebar': 'Ouvrir le menu de navigation',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<SupportedLanguage>(() => {
        try {
            const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
            if (saved && (saved === 'en' || saved === 'sw' || saved === 'fr')) {
                return saved;
            }
        } catch {
            // Ignore localStorage errors
        }
        return 'en';
    });

    const setLanguage = (lang: SupportedLanguage) => {
        setLanguageState(lang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch {
            // Ignore
        }
    };

    const t = (key: string, fallback?: string): string => {
        const langTable = translations[language] || translations.en;
        if (langTable[key]) return langTable[key];
        if (translations.en[key]) return translations.en[key];
        return fallback || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
