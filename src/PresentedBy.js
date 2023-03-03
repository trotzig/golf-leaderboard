import React from 'react';

import StripeLogoSvg from './StripeLogoSvg.js';

export default function PresentedBy() {
  return (
    <a href="https://stripegolf.se/" className="presented-by">
      <div className="presented-by-intro">Presented by</div>
      <div className="presented-by-main">
        <StripeLogoSvg />
        <div className="presented-by-products">
          <img src="/presented-by/putter-headcover.png" />
          <img src="/presented-by/golfballs_green.png" />
          <img src="/presented-by/putter-headcover2.png" />
        </div>
      </div>
    </a>
  );
}
