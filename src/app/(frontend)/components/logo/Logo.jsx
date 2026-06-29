import Link from "next/link";

export default function Logo() {
  return (
    <>
    <div className="bwp-logo-container clearfix">
      <div className="bwp-logo-text-container">
        <Link href="/" rel="home" className="bwp-logo-text">
          {"ORIN"}
        </Link>
      </div>
      <h1 className="screen-reader-text bwp-site-name">
        {"Orin - Minimal Blog For WordPress"}
      </h1>
    </div>
    </>
  );
}

