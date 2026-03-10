const https = require('https');

const urls = [
  'https://freesound.org/people/felix.blume/sounds/709287/',
  'https://freesound.org/people/tim.kahn/sounds/197714/',
  'https://freesound.org/people/lastraindrop/sounds/744133/',
  'https://freesound.org/people/Vonora/sounds/269570/'
];

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  for (const url of urls) {
    const html = await fetchHtml(url);
    const match = html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"']+\.mp3/);
    if (match) {
      console.log(url, '=>', match[0]);
    } else {
      console.log(url, '=> NOT FOUND');
    }
  }
}

main();
