const fs = require('fs');
let content = fs.readFileSync('src/views/lms/LmsView.tsx', 'utf8');

content = content.replace(
    `const classStudents = students.filter(s => s.classId === activeGradingAssignment.classId);\n        if (classStudents.length > 0) return classStudents;\n        // Fallback to sample roster if mock students don't match classId directly\n        return students.slice(0, 6);`,
    `return students.filter(s => s.classId === activeGradingAssignment.classId);`
);

fs.writeFileSync('src/views/lms/LmsView.tsx', content);
