const axios = require('axios');

const config = require('../config');
const countPastes = require('./countPastes');
const logger = require('./logger');

const sendReport = async (pasteSite, count, errorMsg = null) => {
  try {
    const report = {
      embeds: [
        {
          title: pasteSite,
          url: config.mongodb.dashboard_uri,
          description: errorMsg ? `Error: ${errorMsg}` : `${count} new pastes scraped!`,
          fields: [
            {
              name: 'pastebin_com',
              value: await countPastes('pastebin_com:*'),
              inline: true
            },
            {
              name: 'stronghold_onion',
              value: await countPastes('stronghold_onion:*'),
              inline: true
            },
            {
              name: 'total',
              value: await countPastes('*'),
              inline: true
            }
          ],
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
