module.exports = {
  apps: [
    {
      name: 'pastes-node',
      script: 'node',
      args: './src/app.js',
      watch: ['src'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'logs']
    }
  ]
};
