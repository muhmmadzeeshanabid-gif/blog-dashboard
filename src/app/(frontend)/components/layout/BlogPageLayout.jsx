import { Suspense } from "react";
import Header from "../header/Header";
import Logo from "../logo/Logo";
import Footer from "../footer/Footer";
import ScrollTop from "../utils/ScrollTop";
import GalleryLightbox from "../utils/GalleryLightbox";
import { getAppSettings } from "@/backend/lib/appSettings";

export default async function BlogPageLayout({ 
  children, 
  activeFormat = "", 
  formatSlugs = {}, 
  showSeparator = false 
}) {
  let siteName = "ORIN";
  try {
    const appSettings = await getAppSettings();
    siteName = appSettings.siteName || "ORIN";
  } catch {
    // fallback to default
  }

  return (
    <>
      <Suspense fallback={null}>
        <Header activeFormat={activeFormat} formatSlugs={formatSlugs} />
      </Suspense>

      <div className="bwp-site-content">
        <div className="container">
          <Logo siteName={siteName} />
          
          {showSeparator && (
            <div className="bwp-separator bwp-gradient" style={{ marginTop: "45px", marginBottom: "45px" }}>
              <span className="bwp-rhomb"></span>
            </div>
          )}

          {children}
        </div>
      </div>

      <Footer />
      <ScrollTop />
      <GalleryLightbox />
    </>
  );
}
