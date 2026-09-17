const fs = require('fs');
let content = fs.readFileSync('src/components/landing/LandingPage.tsx', 'utf8');

content = content.replace(
    `import LanguageSelector from './LanguageSelector';`,
    `import LanguageSelector from './LanguageSelector';\nimport { useLanguage } from '../../contexts/LanguageContext';`
);

content = content.replace(
    `export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {`,
    `export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {\n    const { t } = useLanguage();`
);

// Navigation
content = content.replace(`>CBC & 8-4-4<`, `>{t('nav.curriculum', 'CBC & 8-4-4')}<`);
content = content.replace(`>Capabilities<`, `>{t('nav.features', 'Capabilities')}<`);
content = content.replace(`>Subscription Plans<`, `>{t('nav.pricing', 'Subscription Plans')}<`);
content = content.replace(`>EdTech News<`, `>{t('nav.news', 'EdTech News')}<`);
content = content.replace(`>Contact<`, `>{t('nav.contact', 'Contact')}<`);
content = content.replace(`>Portal Login<`, `>{t('nav.login', 'Portal Login')}<`);
content = content.replace(`>Subscribe School Now<`, `>{t('nav.subscribe', 'Subscribe School Now')}<`);

// Mobile navigation
content = content.replace(`>CBC & 8-4-4 System<`, `>{t('nav.curriculum', 'CBC & 8-4-4 System')}<`);
content = content.replace(`>Core Capabilities<`, `>{t('nav.features', 'Core Capabilities')}<`);
content = content.replace(`>Subscription Tiers<`, `>{t('nav.pricing', 'Subscription Tiers')}<`);
content = content.replace(`>EdTech Regulations & News<`, `>{t('nav.news', 'EdTech Regulations & News')}<`);
content = content.replace(`>Contact & Support (0720935895)<`, `>{t('nav.contact', 'Contact & Support (0720935895)')}<`);


// Hero
content = content.replace(
    `<span>Unified Cloud Operating System for Educational Institutions</span>`,
    `<span>{t('hero.badge', 'Unified Cloud Operating System for Educational Institutions')}</span>`
);

content = content.replace(
    `The Cloud School Operating System for{' '}`,
    `{t('hero.title.pre', 'The Cloud School Operating System for')}{' '}`
);

content = content.replace(
    `CBC & Traditional Learning`,
    `{t('hero.title.highlight', 'CBC & Traditional Learning')}`
);

content = content.replace(
    `Designed for Primary, Junior Secondary, and High Schools. Seamlessly unify Competency-Based formative rubrics, traditional numerical examinations, automated fee reconciliation, and instant parent communication. Managed by <strong>SaasLink Technologies Ltd</strong>.`,
    `{t('hero.description', 'Designed for Primary, Junior Secondary, and High Schools. Seamlessly unify Competency-Based formative rubrics, traditional numerical examinations, automated fee reconciliation, and instant parent communication. Managed by SaasLink Technologies Ltd.')}`
);

content = content.replace(
    `<span>Subscribe Your School Now</span>`,
    `<span>{t('hero.btn.subscribe', 'Subscribe Your School Now')}</span>`
);

content = content.replace(
    `<span>Call 0720935895</span>`,
    `<span>{t('hero.btn.call', 'Call 0720935895')}</span>`
);

fs.writeFileSync('src/components/landing/LandingPage.tsx', content);
