const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const page = await fetch('http://[::1]:3000/');
    const cssMatch = page.body.match(/href="([^"]+\.css)"/);
    if (!cssMatch) {
      console.log('No CSS file link found in the HTML response.');
      return;
    }
    const cssPath = cssMatch[1];
    console.log('Found CSS path:', cssPath);
    const cssFile = await fetch(`http://[::1]:3000${cssPath}`);
    if (cssFile.body.includes('bwp-dropdown-mobile-menu') && cssFile.body.includes('fixed')) {
      console.log('CSS bundle actively contains the new styles!');
    } else {
      console.log('CSS bundle does NOT contain the new styles yet.');
    }
  } catch (err) {
    console.error('Error fetching dev server:', err.message);
  }
}

main();
