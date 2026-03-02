import React, { useEffect } from 'react';

export default function InvalidTokenPage() {
  return (
    <div className="profile">
      <div className="alert page-margin">
        The link you received is no longer valid. Try initiating{' '}
        <a href="/profile">a new sign in session</a>.
      </div>
    </div>
  );
}
