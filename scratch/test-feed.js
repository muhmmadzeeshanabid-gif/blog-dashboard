const { getHomepageFeed } = require("../src/app/(backend)/lib/postStore");
const { getAppSettings } = require("../src/app/(backend)/lib/appSettings");

async function main() {
  const appSettings = await getAppSettings();
  const feed1 = await getHomepageFeed(1, appSettings.postsPerPage);
  const feed2 = await getHomepageFeed(2, appSettings.postsPerPage);

  console.log("=== PAGE 1 POSTS ===");
  feed1.recentPosts.forEach((p, idx) => {
    console.log(`${idx + 1}. Title: ${p.title} | Sticky: ${p.isSticky} | Format: ${p.format}`);
  });

  console.log("\n=== PAGE 2 POSTS ===");
  feed2.recentPosts.forEach((p, idx) => {
    console.log(`${idx + 1}. Title: ${p.title} | Sticky: ${p.isSticky} | Format: ${p.format}`);
  });
}

main().catch(console.error);
