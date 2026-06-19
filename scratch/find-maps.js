const fs = require('fs');
const lines = fs.readFileSync('src/app/dashboard/highlights/HighlightsClient.jsx', 'utf8').split('\n');

lines.forEach((line, idx) => {
  if (line.includes('selectedHeroPosts.map') || line.includes('selectedPopularPosts.map') || line.includes('selectedRandomPosts.map') || line.includes('homeSlides.map') || line.includes('aboutSlides.map') || line.includes('contactSlides.map')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
