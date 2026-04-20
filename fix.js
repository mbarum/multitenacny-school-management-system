const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add imports if they modify state
  if (content.includes('@UseGuards(JwtAuthGuard)') && !content.includes('RolesGuard')) {
    content = content.replace(/@UseGuards\(JwtAuthGuard\)/g, '@UseGuards(JwtAuthGuard, RolesGuard)');
    
    let importToAdd = `\nimport { RolesGuard } from '../auth/guards/roles.guard';\nimport { Roles } from '../auth/decorators/roles.decorator';\nimport { UserRole } from 'src/common/user-role.enum';\n`;
    
    content = content.replace(/import\s+{.*}\s+from\s+'@nestjs\/common';/, match => `${match}${importToAdd}`);
    
    // Add @Roles(UserRole.ADMIN) directly above method declarations holding Mutating endpoints
    // This is a naive but effective regex for simple nestjs controllers
    const regex = /(@(?:Post|Patch|Delete)(?:\([^)]*\))?)\s*(?:@(.*))?\s*(\w+\s*\([^)]*\))/g;
    
    content = content.replace(regex, (match, p1, p2, p3) => {
        // if p2 already exists (another decorator), keep it. But if p2 is Roles, don't duplicate.
        if (p2 && p2.includes('Roles')) return match;
        
        let existingDecorators = p2 ? `@${p2}\n  ` : '';
        return `${p1}\n  @Roles(UserRole.ADMIN)\n  ${existingDecorators}${p3}`;
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
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
