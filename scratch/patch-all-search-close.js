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
    console.log(`Skipping: ${file} (does not exist)`);
    return;
  }
  let code = fs.readFileSync(file, 'utf8');

  // 1. Remove existing outside click handlers for search if present
  // Specifically look for "// Close search on outside click" block
  const searchCloseRegex = /\s*\/\/\s*Close search on outside click[\s\S]*?setIsSearchOpen\(false\)[\s\S]*?setSearchQuery\(""\);?\s*\}/g;
  if (searchCloseRegex.test(code)) {
    code = code.replace(searchCloseRegex, '');
    console.log(`Removed existing search close handler from ${file}`);
  }

  // 2. Insert new generic search close handler at the start of onDocumentMouseDown or onMouseDown
  const replacementDocument = `const onDocumentMouseDown = (event) => {
    // Close search on outside click
    if (
      event.target instanceof Element &&
      !event.target.closest('[class*="searchBar"]') &&
      !event.target.closest('[aria-label*="Search"]') &&
      !event.target.closest('[aria-label*="search"]')
    ) {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  `;

  const replacementMouseDown = `const onMouseDown = (e) => {
    // Close search on outside click
    if (
      e.target instanceof Element &&
      !e.target.closest('[class*="searchBar"]') &&
      !e.target.closest('[aria-label*="Search"]') &&
      !e.target.closest('[aria-label*="search"]')
    ) {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  `;

  let updated = false;
  if (code.includes('const onDocumentMouseDown = (event) => {')) {
    code = code.replace('const onDocumentMouseDown = (event) => {', replacementDocument);
    updated = true;
  } else if (code.includes('const onMouseDown = (e) => {')) {
    code = code.replace('const onMouseDown = (e) => {', replacementMouseDown);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(file, code, 'utf8');
    console.log(`Patched ${file} successfully.`);
  } else {
    console.log(`Could not find signature in ${file}`);
  }
});
