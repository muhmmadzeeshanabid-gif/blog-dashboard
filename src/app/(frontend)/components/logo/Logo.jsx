import Link from "next/link";

export default function Logo({ siteName = "ORIN" }) {
  return (
    <div className="bwp-logo-container clearfix">
      <div className="bwp-logo-text-container">
        <Link href="/" rel="home" className="bwp-logo-text">
          {siteName}
        </Link>
      </div>
      <h1 className="screen-reader-text bwp-site-name">
        {siteName}
      </h1>
    </div>
  );
}
