const axios = require('axios');

const config = require('../config');
const logger = require('./logger');

const sendReport = async (pasteSite, count, errorMsg = null) => {
  try {
    const report = {
      embeds: [
        {
          title: pasteSite,
          description: errorMsg ? `Error: ${errorMsg}` : `${count} pastes scraped!`,
          color: errorMsg ? 13123149 : 16764033,
          timestamp: new Date()
        }
      ]
    };
    await axios.post(config.discord.report_webhook, report);
  } catch (error) {
    logger.error(error);
  }
};

module.exports = sendReport;
