import React, { useEffect } from 'react';

import Menu from '../../src/Menu';
import fetchJsonP from '../../src/fetchJsonP';

export default function AuthConfirmedPage() {
  return (
    <div className="profile">
      <Menu />
      <h2>Success</h2>
      <div className="page-margin">
        Your email address is confirmed. You can close this window or{' '}
        <a href="/profile">continue to your settings</a>.
      </div>
    </div>
  );
}
