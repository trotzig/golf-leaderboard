#!/usr/bin/env node
import syncData from '../src/syncData.mjs';

syncData()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
