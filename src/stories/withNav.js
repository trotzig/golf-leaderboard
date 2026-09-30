import React from 'react';

import Nav from '../Menu.js';

// Renders a story below the site navigation, the way pages appear in the app.
export default function withNav(Story) {
  return (
    <div>
      <Nav />
      <Story />
    </div>
  );
}
