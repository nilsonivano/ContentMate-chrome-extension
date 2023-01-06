const contentmateDevAddress = 'http://localhost:3000/extension';
const contentmateAppAddress = 'https://app.contentmate.me/extension';

const postMessage = obj => {
  console.log('browser_action: send message', obj);
  document.getElementsByTagName('iframe')[0].contentWindow.postMessage(JSON.stringify(obj), '*');
};

// Listen to message from child window
window.addEventListener('message', (e) => {
  let data;
  try {
    data = JSON.parse(e.data);
  } catch (err) { return; }

  if (!data || !data.command) {
    console.error('browser_action: received a message without command', { origin: e.origin, data });
    return;
  }
  console.log('browser_action: received message', data);

  if (data.command === 'cookie') {
    chrome.cookies.getAll({ url: 'https://www.linkedin.com/' }, cookieObjects => {
      const cookie = cookieObjects.map(c => `${c.name}=${c.value}`).join('; ');
      if (!cookie) return false;
      console.log('browser_action: get cookie', { cookie });
      postMessage({ command: 'cookie', cookie });
    });
  }
});

chrome.management.getSelf(self => {
  const server = self.installType === 'development' ? contentmateDevAddress : contentmateAppAddress;
  const iframe = document.createElement('iframe');
  iframe.src = server;
  iframe.width = '100%';
  iframe.height = '100%';
  document.getElementById('main').appendChild(iframe);
});

localStorage.setItem('Contentmate opened', (new Date()));
