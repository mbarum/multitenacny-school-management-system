module.exports = {
  apps: [
    {
      name: 'saaslink-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: './',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      },
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'saaslink-backend',
      script: 'dist/main.js',
      cwd: './server',
      env: {
        PORT: 5000,
        NODE_ENV: 'production'
      },
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
