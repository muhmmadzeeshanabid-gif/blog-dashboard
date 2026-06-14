"use client";

export default function PostShareList() {
  const preventDefault = (e) => e.preventDefault();

  return (
    <ul className="bwp-single-post-share-list list-unstyled clearfix">
      <li>
        <a 
          href="#" 
          className="bwp-twitter-share" 
          title="Share on Twitter" 
          onClick={preventDefault}
        >
          <i className="fab fa-twitter"></i>
        </a>
      </li>
      <li>
        <a 
          href="#" 
          className="bwp-facebook-share" 
          title="Share on Facebook" 
          onClick={preventDefault}
        >
          <i className="fab fa-facebook-f"></i>
        </a>
      </li>
      <li>
        <a 
          href="#" 
          className="bwp-pinterest-share" 
          title="Pin it" 
          onClick={preventDefault}
        >
          <i className="fab fa-pinterest-p"></i>
        </a>
      </li>
      <li>
        <a 
          href="#" 
          className="bwp-reddit-share" 
          title="Share on Reddit" 
          onClick={preventDefault}
        >
          <i className="fab fa-reddit-alien"></i>
        </a>
      </li>
    </ul>
  );
}
