const chrono = require('chrono-node');
const md5 = require('md5');
const puppeteer = require('puppeteer');

const checkCache = require('../utils/checkCache');
const logger = require('../utils/logger');
const savePaste = require('../utils/savePaste');

const features = {
  title: {
    xpath: `/html/body/h3[2]`,
    attribute: 'innerText',
    parse: (value) => value.trim()
  },
  author: {
    xpath: `/html/body/p[1]`,
    attribute: 'innerText',
    parse: (value) => value.trim().split(', ')[0].trim()
  },
  createdOn: {
    xpath: `/html/body/p[1]`,
    attribute: 'innerText',
    parse: (value) => chrono.parseDate(value.trim().split(', ')[1].trim())
  },
  body: {
    xpath: `/html/body/textarea[@class='boxes'][1]`,
    attribute: 'value',
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
  const pUrl = `http://depasteon6cqgrykzrgya52xglohg5ovyuyhte3ll7hzix7h5ldfqsyd.onion/show.php?md5=${pId}`;

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
    id: `deeppaste_onion:${pId}`,
    site_id: 'deeppaste_onion',
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

  await savePaste(paste);

  await page.goBack();
};

const getPastes = async () => {
  const browser = await puppeteer.launch({
    args: ['--proxy-server=socks5://127.0.0.1:9050', '--no-sandbox'],
    headless: true
  });

  try {
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

    for (let i = 0; i <= 10; i += 1) {
      logger.info(`Getting page ${i}...`, { type: 'web' });

      await page.goto(`http://depasteon6cqgrykzrgya52xglohg5ovyuyhte3ll7hzix7h5ldfqsyd.onion/last.php?page=${i}`, {
        waitUntil: 'networkidle0',
        timeout: 600000
      });

      const elHandles = await page.$x(`/html/body/a[contains(@href,'show.php?md5=')]`);

      const pastes = [];

      for (let j = 0; j < elHandles.length; j += 1) {
        const el = await elHandles[j].getProperty('href');
        const value = await el.jsonValue();
        const paste = value.split('=')[1];
        pastes.push(paste);
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const paste of pastes) {
        if (await checkCache(`deeppaste_onion:${paste}`)) {
          logger.info(`deeppaste_onion:${paste} found in cache`, { type: 'database' });
        } else {
          await getPaste(page, paste);
          count += 1;
        }
      }
    }

    await browser.close();
    return count;
  } catch (error) {
    logger.error(error, { type: 'general' });
    await browser.close();
    throw error;
  }
};

module.exports = getPastes;
