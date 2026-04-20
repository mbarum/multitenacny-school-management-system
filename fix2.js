const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes('RolesGuard') && !content.includes('import { RolesGuard }')) {
    let importToAdd = `\nimport { RolesGuard } from '../auth/guards/roles.guard';\nimport { Roles } from '../auth/decorators/roles.decorator';\nimport { UserRole } from '../../common/user-role.enum';\n`;
    // Just inject at the very top
    content = importToAdd + content;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed imports in', filePath);
  }
}

function walkSync(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function(name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.controller.ts')) {
            processFile(filePath);
        } else if (stat.isDirectory()) {
            walkSync(filePath);
        }
    });
}

walkSync('src/modules');
