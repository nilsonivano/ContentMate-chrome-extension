/* eslint-disable no-console */

const contentMateDevAddress = 'http://localhost:3000';
const contentMateAppAddress = 'https://app.contentmate.me';

let server = '';
chrome.management.getSelf(self => {
  server = self.installType === 'development' ? contentMateDevAddress : contentMateAppAddress;
});

let currentCookie = '';

const check = () => {
  console.log('check: start');
  chrome.cookies.getAll({ url: 'https://www.linkedin.com/' }, cookieObjects => {
    if (!server) return;
    const liAtCookieObject = cookieObjects.find(c => c.name === 'li_at');
    if (!liAtCookieObject) {
      console.log('check: logged out');
      if (currentCookie) {
        currentCookie = '';
      }
      return;
    }

    const cookie = cookieObjects.map(c => `${c.name}=${c.value}`).join('; ');
    if (cookie === currentCookie) return;

    console.log('check: logged', { currentCookie, cookie });
    currentCookie = cookie;
    chrome.runtime.setUninstallURL(`${server}/api/uninstall/${liAtCookieObject.value}`);
    console.log(`check: ${server}/api/uninstall/${cookie}`)
    console.log('check: send cookie to server', JSON.stringify({ cookie }));
    fetch(`${server}/api/cookies`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cookies: cookie }),
    }).then(function (response) {
      console.log(response);
    }).catch(function (error) {
      console.log('Request failed', error);
    });
  });
};

chrome.cookies.onChanged.addListener(({ removed, cookie, cause }) => {
  console.log('cookies onChanged', { removed, cookie, cause });
  if (!['explicit', 'expired_overwrite'].includes(cause)) return;
  if (cookie.name !== 'li_at') return;
  console.log('cookies onChanged: li_at or JSESSIONID change', { removed, cookie, cause });
  check();
});

chrome.alarms.create('checkCookie', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(() => {
  console.log('Checking cookie');
  check();
});

check();