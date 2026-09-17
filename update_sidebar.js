const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

if (!content.includes('const { t } = useLanguage();')) {
    content = content.replace(
        'const location = useLocation();',
        'const { t } = useLanguage();\n    const location = useLocation();'
    );
}

if (!content.includes('import { useLanguage }')) {
    content = content.replace(
        `import { useData } from '../../contexts/DataContext';`,
        `import { useData } from '../../contexts/DataContext';\nimport { useLanguage } from '../../contexts/LanguageContext';`
    );
}

// In the rendering loop for navigationItems:
// <span className="font-semibold">{item.label}</span>
// => <span className="font-semibold">{t(`nav.${item.view}`, item.label)}</span>
content = content.replace(
    `className="font-semibold">{item.label}</span>`,
    `className="font-semibold">{t(\`nav.\${item.view}\`, item.label)}</span>`
);

// Mobile rendering loop:
content = content.replace(
    `className="font-medium text-sm truncate">{item.label}</span>`,
    `className="font-medium text-sm truncate">{t(\`nav.\${item.view}\`, item.label)}</span>`
);


fs.writeFileSync('src/components/layout/Sidebar.tsx', content);
