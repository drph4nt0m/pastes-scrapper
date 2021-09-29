const axios = require('axios');
const cheerio = require('cheerio');
const chrono = require('chrono-node');
const md5 = require('md5');

const checkCache = require('../utils/checkCache');
const logger = require('../utils/logger');
const savePaste = require('../utils/savePaste');

const sleep = async () => {
  // random number between 0 and 3
  const minutes = Math.floor(Math.random() * 4);
  logger.info(`Sleeping for ${minutes} minutes...`, { type: 'general' });
  await new Promise((resolve) => {
    setTimeout(resolve, minutes * 60 * 1000);
  });
  logger.info('Awake!', { type: 'general' });
};

const getPaste = async (id) => {
  const pId = id;
  const pUrl = `https://pastebin.com/${pId}`;

  const response = await axios.get(pUrl);
  const $ = cheerio.load(response.data);

  const pTitle = $('body > div.wrap > div.container > div.content > div.post-view > div.details > div.info-bar > div.info-top > h1').text().trim();
  const pAuthor = $('body > div.wrap > div.container > div.content > div.post-view > div.details > div.info-bar > div.info-bottom > div.username > a')
    .text()
    .trim();
  const pCreatedOn = chrono.parseDate(
    $('body > div.wrap > div.container > div.content > div.post-view > div.details > div.info-bar > div.info-bottom > div.date > span')
      .attr('title')
      .trim()
  );
  const pBody = $('body > div.wrap > div.container > div.content > div.post-view > textarea').text().trim();
  const pMD5 = md5(pBody);

  const paste = {
    id: `pastebin_com:${pId}`,
    site_id: 'pastebin_com',
    paste: {
      id: pId,
      url: pUrl,
      title: pTitle,
      author: pAuthor,
      createdOn: pCreatedOn,
      body: pBody,
      md5: pMD5
    }
  };

  // logger.info(`paste: ${JSON.stringify(paste)}`, { type: 'web' });

  await savePaste(paste);
};

const getPastes = async () => {
  await sleep();

  const response = await axios.get('https://pastebin.com/archive');
  const $ = cheerio.load(response.data);
  const pastes = [];
  $('table.maintable > tbody > tr').each((i, el) => {
    const $el = $(el);
    const id = $el.find('td:nth-child(1) > a').attr('href')?.split('/')[1];
    if (id) {
      pastes.push(id);
    }
  });

  let count = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const paste of pastes) {
    if (await checkCache(`pastebin_com:${paste}`)) {
      logger.info(`pastebin_com:${paste} found in cache`, { type: 'database' });
    } else {
      await getPaste(paste);
      count += 1;
    }
  }

  return count;
};

module.exports = getPastes;
