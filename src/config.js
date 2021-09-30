module.exports = {
  redis: {
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    dashboard_uri: process.env.MONGODB_DASHBOARD_URI
  },
  agenda: {
    db: process.env.AGENDA_DB
  },
  discord: {
    report_webhook: process.env.DISCORD_REPORT_WEBHOOK
  }
};
