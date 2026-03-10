const urls = [
  'https://freesound.org/people/felix.blume/sounds/709287/',
  'https://freesound.org/people/tim.kahn/sounds/197714/',
  'https://freesound.org/people/lastraindrop/sounds/744133/',
  'https://freesound.org/people/Vonora/sounds/269570/'
];

async function main() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const match = html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"']+\.mp3/);
      if (match) {
        console.log(url, '=>', match[0]);
      } else {
        console.log(url, '=> NOT FOUND');
      }
    } catch (e) {
      console.log(url, '=> ERROR', e);
    }
  }
}

main();
