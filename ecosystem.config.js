module.exports = {
  apps: [
    {
      name: 'saaslink-emis',
      script: 'dist/main.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '-r tsconfig-paths/register',
      env: {
        NODE_ENV: 'production',
        TS_NODE_PROJECT: 'tsconfig.paths.json',
      },
    },
  ],
};
