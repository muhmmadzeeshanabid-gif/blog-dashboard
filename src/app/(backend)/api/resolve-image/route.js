import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const decodedUrl = decodeURIComponent(targetUrl).trim();

    // 1. If it's a local Unsplash placeholder path, we resolve the Unsplash ID
    if (decodedUrl.startsWith("/images/") && decodedUrl.includes("-unsplash")) {
      const match = decodedUrl.match(/\/images\/.*-([a-zA-Z0-9]+)-unsplash/i);
      if (match && match[1]) {
        const id = match[1];
        try {
          // Use HEAD request and redirect: manual to resolve the redirect URL without fetching the full image body
          const response = await fetch(`https://unsplash.com/photos/${id}/download`, {
            method: "HEAD",
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
          });
          const redirectUrl = response.headers.get("location");
          if (redirectUrl) {
            return NextResponse.redirect(redirectUrl, 302);
          }
        } catch (err) {
          console.error("[Resolve Image API] Unsplash resolution failed:", err);
        }
      }
      return NextResponse.redirect("https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80", 302);
    }

    // 2. If it's a Pinterest URL, we fetch and extract the image
    const isPinterest = /pinterest\.com\/pin\//i.test(decodedUrl) || /pin\.it\//i.test(decodedUrl);

    if (isPinterest) {
      try {
        const response = await fetch(decodedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          next: { revalidate: 3600 }, // Cache the resolved image for an hour
        });

        if (response.ok) {
          const html = await response.text();
          // Extract og:image meta tag content
          const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
          const ogImageRegexAlt = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i;
          
          let match = html.match(ogImageRegex) || html.match(ogImageRegexAlt);
          
          if (!match) {
            const itempropImageRegex = /<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i;
            match = html.match(itempropImageRegex);
          }

          if (match && match[1]) {
            const directImageUrl = match[1];
            // Redirect to the direct image URL on i.pinimg.com
            return NextResponse.redirect(directImageUrl, 302);
          }
        }
      } catch (err) {
        console.error("[Resolve Image API] Pinterest parsing failed:", err);
      }
    }

    // 2. If it's not Pinterest or resolution failed, we just redirect directly to the original targetUrl
    return NextResponse.redirect(decodedUrl, 302);
  } catch (err) {
    console.error("[Resolve Image API] Error:", err);
    return NextResponse.json({ error: "Failed to resolve image" }, { status: 500 });
  }
}
