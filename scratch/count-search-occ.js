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
  const countSearch = (code.match(/isSearchOpen/g) || []).length;
  console.log(`${file}: isSearchOpen matches = ${countSearch}`);
});
