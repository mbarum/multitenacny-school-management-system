const fs = require('fs');
let content = fs.readFileSync('src/components/landing/LandingPage.tsx', 'utf8');

// Metrics
content = content.replace(
    `Institutions Empowered`,
    `{t('metrics.schools', 'Institutions Empowered')}`
);
content = content.replace(
    `Primary, Secondary & Academies`,
    `{t('metrics.schools.sub', 'Primary, Secondary & Academies')}`
);
content = content.replace(
    `Fee Auto-Match`,
    `{t('metrics.reconciliation', 'Fee Auto-Match')}`
);
content = content.replace(
    `Automated ledger reconciliation`,
    `{t('metrics.reconciliation.sub', 'Automated ledger reconciliation')}`
);
content = content.replace(
    `Dual-Curriculum Ready`,
    `{t('metrics.curriculum', 'Dual-Curriculum Ready')}`
);
content = content.replace(
    `Competency & numerical streams`,
    `{t('metrics.curriculum.sub', 'Competency & numerical streams')}`
);
content = content.replace(
    `Data Sovereignty`,
    `{t('metrics.currencies', 'Data Sovereignty')}` // Just reuse a key or fallback
);
content = content.replace(
    `Encrypted cloud multi-tenancy`,
    `{t('metrics.currencies.sub', 'Encrypted cloud multi-tenancy')}`
);

// Features Title
content = content.replace(
    `Complete Administrative Suite`,
    `{t('features.badge', 'Complete Administrative Suite')}`
);
content = content.replace(
    `Engineered for Institutional Rigor & Zero Fraud`,
    `{t('features.title', 'Engineered for Institutional Rigor & Zero Fraud')}`
);

fs.writeFileSync('src/components/landing/LandingPage.tsx', content);
