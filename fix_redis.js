const fs = require('fs');
let content = fs.readFileSync('server/src/app.module.ts', 'utf8');

// The backend throws 500 or hangs if Redis isn't running and BullMQ tries to connect
content = content.replace(
  /BullModule\.forRootAsync\(\{[\s\S]*?\}\),\s*ServeStaticModule/m,
  '/* BullModule disabled for local/AI Studio fallback */\n    ServeStaticModule'
);

fs.writeFileSync('server/src/app.module.ts', content);
