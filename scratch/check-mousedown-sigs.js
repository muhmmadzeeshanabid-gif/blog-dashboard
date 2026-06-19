const fs = require('fs');
const path = require('path');

const files = [
  'src/app/dashboard/analytics/AnalyticsClient.jsx',
  'src/app/dashboard/categories/CategoriesClient.jsx',
  'src/app/dashboard/highlights/HighlightsClient.jsx',
  'src/app/dashboard/media/MediaClient.jsx',
  'src/app/dashboard/OverviewClient.jsx',
  'src/app/dashboard/posts/new/PostEditorClient.jsx',
  'src/app/dashboard/posts/PostsClient.jsx',
  'src/app/dashboard/settings/SettingsClient.jsx',
  'src/app/dashboard/users/UsersClient.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const code = fs.readFileSync(file, 'utf8');
  
  // Look for onDocumentMouseDown or onMouseDown definition
  const match1 = code.match(/const\s+(onDocumentMouseDown|onMouseDown)\s*=\s*\(([^)]*)\)\s*=>\s*\{/);
  if (match1) {
    console.log(`${file}: signature="${match1[0]}"`);
  } else {
    console.log(`${file}: NO SIGNATURE MATCH`);
  }
});
