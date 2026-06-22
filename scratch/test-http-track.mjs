async function test() {
  const url = "http://localhost:3000/api/analytics/track";
  const body = {
    pathname: "/posts/how-minimalism-helps-me-stay-calm",
    isNewVisitor: true
  };
  
  console.log(`Sending POST request to ${url}...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
