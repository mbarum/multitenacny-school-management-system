const fs = require('fs');
let content = fs.readFileSync('src/views/super-admin/SuperAdminDashboard.tsx', 'utf8');

// Container padding
content = content.replace(
    `className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn"`,
    `className="p-3 sm:p-6 md:p-10 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn overflow-x-hidden"`
);

// Header banner padding and gaps
content = content.replace(
    `className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl text-white shadow-2xl border border-slate-700/50"`,
    `className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-3xl text-white shadow-2xl border border-slate-700/50 w-full"`
);

// The automated lifecycle policy notice
content = content.replace(
    `className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-600"`,
    `className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 text-xs text-slate-600 w-full"`
);

// Search and filter area in schools list
content = content.replace(
    `className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50"`,
    `className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50 w-full"`
);

// Fix the flex-wrap for buttons
content = content.replace(
    `className="flex flex-wrap items-center gap-3"`,
    `className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto"`
);

// Fix overflow-x-hidden on the main cards wrappers
content = content.replace(
    `className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"`,
    `className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full"`
);
content = content.replace(
    `className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4"`,
    `className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4 w-full"`
);
content = content.replace(
    `className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4"`,
    `className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4 w-full"`
);

fs.writeFileSync('src/views/super-admin/SuperAdminDashboard.tsx', content);
