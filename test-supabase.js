const { createClient } = require("@supabase/supabase-js");

try {
  console.log("Initializing Supabase client...");
  const supabase = createClient("https://placeholder.supabase.co", "placeholder");
  console.log("Supabase client initialized successfully.");
  
  console.log("Calling getSession...");
  supabase.auth.getSession().then(({ data, error }) => {
    console.log("getSession promise resolved:", { data, error });
  }).catch(err => {
    console.log("getSession promise rejected:", err);
  });

  console.log("Calling onAuthStateChange...");
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state change callback:", event);
  });
  console.log("onAuthStateChange completed. Subscription exists:", !!subscription);
} catch (error) {
  console.error("Caught synchronous error during test:", error);
}
