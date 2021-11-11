require('dotenv').config();
const Agenda = require('agenda');

const config = require('./config');
const pastebin = require('./sites/pastebin');
const pastelink = require('./sites/pastelink');
const stronghold = require('./sites/stronghold');
const deeppaste = require('./sites/deeppaste');
const logger = require('./utils/logger');
const sendReport = require('./utils/sendReport');

const agenda = new Agenda({ name: 'pastes', db: { address: config.agenda.db } });

agenda.define('pastebin_com', async (job, done) => {
  try {
    const count = await pastebin();
    logger.info(`${count} pastes found on pastebin_com`);
    await sendReport('pastebin_com', count);
    done();
  } catch (error) {
    await sendReport('pastebin_com', -1, error);
    done(error);
  }
});

agenda.define('pastelink_net', async (job, done) => {
  try {
    const count = await pastelink();
    logger.info(`${count} pastes found on pastebin_com`);
    await sendReport('pastelink_net', count);
    done();
  } catch (error) {
    await sendReport('pastelink_net', -1, error);
    done(error);
  }
});

agenda.define('stronghold_onion', async (job, done) => {
  try {
    const count = await stronghold();
    logger.info(`${count} pastes found on stronghold_onion`);
    await sendReport('stronghold_onion', count);
    done();
  } catch (error) {
    await sendReport('stronghold_onion', -1, error);
    done(error);
  }
});

agenda.define('deeppaste_onion', async (job, done) => {
  try {
    const count = await deeppaste();
    logger.info(`${count} pastes found on deeppaste_onion`);
    await sendReport('deeppaste_onion', count);
    done();
  } catch (error) {
    await sendReport('deeppaste_onion', -1, error);
    done(error);
  }
});

agenda.on('start', (job) => {
  logger.info(`Job ${job.attrs.name} starting`, { type: 'general' });
});

agenda.on('complete', (job) => {
  logger.info(`Job ${job.attrs.name} finished`, { type: 'general' });
});

agenda.on('fail', (error, job) => {
  logger.error(`Job ${job.attrs.name} failed with ${error}`, { type: 'general' });
});

agenda.on('ready', () => {
  agenda.start();
  agenda.every('0 */1 * * *', 'pastebin_com');
  agenda.every('15 */1 * * *', 'stronghold_onion');
  agenda.every('30 */1 * * *', 'pastelink_net');
  agenda.every('45 */1 * * *', 'deeppaste_onion');
});
