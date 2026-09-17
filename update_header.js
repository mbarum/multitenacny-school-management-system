const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!content.includes('import { useLanguage }')) {
    content = content.replace(
        `import { useData } from '../../contexts/DataContext';`,
        `import { useData } from '../../contexts/DataContext';\nimport { useLanguage } from '../../contexts/LanguageContext';`
    );
}

if (!content.includes('const { t } = useLanguage();')) {
    content = content.replace(
        'const location = useLocation();',
        'const { t, language, setLanguage } = useLanguage();\n    const location = useLocation();'
    );
}

content = content.replace(
    `<span className="font-medium text-slate-700 dark:text-slate-200">Hello, {currentUser.name}</span>`,
    `<span className="font-medium text-slate-700 dark:text-slate-200">{t('header.greeting', 'Hello')}, {currentUser.name}</span>`
);
content = content.replace(
    `<span className="sr-only">Notifications</span>`,
    `<span className="sr-only">{t('header.notifications', 'Notifications')}</span>`
);
content = content.replace(
    `>Switch to light mode<`,
    `>{t('header.theme.titleLight', 'Switch to light mode')}<`
);
content = content.replace(
    `>Switch to dark mode<`,
    `>{t('header.theme.titleDark', 'Switch to dark mode')}<`
);
content = content.replace(
    `>Active Account<`,
    `>{t('header.activeAccount', 'Active Account')}<`
);
content = content.replace(
    `>Profile Settings<`,
    `>{t('header.profileSettings', 'Profile Settings')}<`
);
content = content.replace(
    `>Sign Out<`,
    `>{t('header.signOut', 'Sign Out')}<`
);
content = content.replace(
    `>Open sidebar<`,
    `>{t('header.openSidebar', 'Open sidebar')}<`
);

// We should also replace the language selector inside header if there is one, but let's check Header.tsx first
fs.writeFileSync('src/components/layout/Header.tsx', content);
