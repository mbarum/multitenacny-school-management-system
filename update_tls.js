const fs = require('fs');
let content = fs.readFileSync('server/src/queues/notification.processor.ts', 'utf8');

content = content.replace(/tls:\s*\{\s*rejectUnauthorized:[^\}]+\}/g, "tls: { rejectUnauthorized: String(this.configService.get('SMTP_REJECT_UNAUTHORIZED')).toLowerCase() === 'true' }");

fs.writeFileSync('server/src/queues/notification.processor.ts', content);
