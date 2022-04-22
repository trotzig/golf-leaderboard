#!/usr/bin/env node

import notifySubscribers from '../src/notifySubscribers.mjs';

notifySubscribers()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
