const fs = require('fs');
let content = fs.readFileSync('server/src/common/filters/http-exception.filter.ts', 'utf8');

// Replace the else block to suppress 401 on health
content = content.replace(
  /this\.logger\.warn\(`Http Status: \$\{status\} Error Message: \$\{JSON\.stringify\(message\)\} Path: \$\{request\.originalUrl\}`\);/,
  `if (status === 401 && request.originalUrl?.includes('/health')) {
            // Suppress aggressive polling 401 logs for health endpoints
            this.logger.debug(\`Http Status: \${status} Path: \${request.originalUrl}\`);
        } else {
            this.logger.warn(\`Http Status: \${status} Error Message: \${JSON.stringify(message)} Path: \${request.originalUrl}\`);
        }`
);

fs.writeFileSync('server/src/common/filters/http-exception.filter.ts', content);
