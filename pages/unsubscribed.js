import React from 'react';

import Menu from '../src/Menu';

export default function UnsubscribedPage() {
  return (
    <div className="profile">
      <Menu />
      <h2>You are now unsubscribed</h2>
      <div className="page-margin">
        You will no longer receive email updates when your favorite players
        compete.
      </div>
    </div>
  );
}
