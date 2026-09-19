const fs = require('fs');
let content = fs.readFileSync('src/views/parent/ParentLmsView.tsx', 'utf8');

content = content.replace(
    `const activeStudentList = parentChildren.length > 0 ? parentChildren : (students.slice(0, 1) as Student[]);`,
    `const activeStudentList = parentChildren;`
);

fs.writeFileSync('src/views/parent/ParentLmsView.tsx', content);
