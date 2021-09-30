const chrono = require('chrono-node');
const md5 = require('md5');
const puppeteer = require('puppeteer');

const checkCache = require('../utils/checkCache');
const logger = require('../utils/logger');
const savePaste = require('../utils/savePaste');

const features = {
  title: {
    xpath: `//section[@id='show']/div[@class='row']/div/div[contains(@class,'pre-header')]/div/div/h4`,
    attribute: 'innerText',
    parse: (value) => value.trim()
  },
  author: {
    xpath: `//section[@id='show']/div[@class='row']/div/div[contains(@class,'pre-footer')]/div/div[1]`,
    attribute: 'innerText',
    parse: (value) => value.trim().split(' at ')[0].split(' by ')[1].trim()
  },
  createdOn: {
    xpath: `//section[@id='show']/div[@class='row']/div/div[contains(@class,'pre-footer')]/div/div[1]`,
    attribute: 'innerText',
    parse: (value) => chrono.parseDate(value.trim().split(' at ')[1].trim())
  },
  body: {
    xpath: `//div[contains(@class,'well')]`,
    attribute: 'innerText',
    parse: (value) => value.trim()
  }
};

const sleep = async () => {
  // random number between 0 and 3
  const minutes = Math.floor(Math.random() * 4);
  logger.info(`Sleeping for ${minutes} minutes...`, { type: 'general' });
  await new Promise((resolve) => {
    setTimeout(resolve, minutes * 60 * 1000);
  });
  logger.info('Awake!', { type: 'general' });
};

const getXpathValue = async (page, feature) => {
  let [elHandle] = await page.$x(features[feature].xpath);
  elHandle = await elHandle.getProperty(features[feature].attribute);
  let value = await elHandle.jsonValue();
  if (features[feature].parse) {
    value = features[feature].parse(value);
  }
  return value;
};

const getPaste = async (page, id) => {
  const pId = id;
  const pUrl = `http://strongerw2ise74v3duebgsvug4mehyhlpa7f6kfwnas7zofs3kov7yd.onion/${pId}`;

  await page.goto(pUrl, {
    waitUntil: 'networkidle0',
    timeout: 300000
  });

  const pTitle = await getXpathValue(page, 'title');
  const pAuthor = await getXpathValue(page, 'author');
  const pCreatedOn = await getXpathValue(page, 'createdOn');
  const pBody = await getXpathValue(page, 'body');
  const pMD5 = md5(pBody);

  const paste = {
    id: `stronghold_onion:${pId}`,
    site_id: 'stronghold_onion',
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

  await page.goBack();
};

const getPastes = async () => {
  const browser = await puppeteer.launch({
    args: ['--proxy-server=socks5://127.0.0.1:9050', '--no-sandbox'],
    headless: true
  });

  const page = await browser.newPage();

  await page.goto('https://check.torproject.org/', {
    waitUntil: 'networkidle0'
  });

  const isUsingTor = await page.$eval('body', (el) => el.innerHTML.includes('Congratulations. This browser is configured to use Tor'));

  if (!isUsingTor) {
    logger.error('Not using Tor. Closing...', { type: 'web' });
    await browser.close();
    throw new Error('Unable to connect to Tor proxy.');
  }

  await sleep();

  let count = 0;

  for (let i = 1; i <= 5; i += 1) {
    logger.info(`Getting page ${i}...`, { type: 'web' });

    await page.goto(`http://strongerw2ise74v3duebgsvug4mehyhlpa7f6kfwnas7zofs3kov7yd.onion/all?page=${i}`, {
      waitUntil: 'networkidle0',
      timeout: 300000
    });

    const pastes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('section#list div.row a.btn[href]'), (a) => a.getAttribute('href').split('/').slice(-1)[0].trim())
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const paste of pastes) {
      if (await checkCache(`stronghold_onion:${paste}`)) {
        logger.info(`stronghold_onion:${paste} found in cache`, { type: 'database' });
      } else {
        await getPaste(page, paste);
        count += 1;
      }
    }
  }

  await browser.close();

  return count;
};

module.exports = getPastes;
