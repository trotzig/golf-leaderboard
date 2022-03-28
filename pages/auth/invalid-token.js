import React, { useEffect } from 'react';

import Menu from '../../src/Menu';
import fetchJsonP from '../../src/fetchJsonP';

export default function InvalidTokenPage() {
  return (
    <div className="profile">
      <Menu />
      <div className="alert page-margin">
        The link you received is no longer valid. Try initiating{' '}
        <a href="/profile">a new sign in session</a>.
      </div>
    </div>
  );
}
