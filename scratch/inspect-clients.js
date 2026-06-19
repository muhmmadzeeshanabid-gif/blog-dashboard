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
  if (!fs.existsSync(file)) {
    console.log(`${file} does not exist`);
    return;
  }
  const code = fs.readFileSync(file, 'utf8');
  
  // Find where onDocumentMouseDown is defined
  const mousedownMatch = code.match(/const onDocumentMouseDown = \([\s\S]*?\};/);
  console.log(`=== ${file} ===`);
  if (mousedownMatch) {
    console.log(mousedownMatch[0]);
  } else {
    console.log('No onDocumentMouseDown match found');
  }
  console.log('----------------');
});
