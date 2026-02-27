#!/usr/bin/env node

import prisma from '../src/prisma.mjs';

const updated = await prisma.competition.updateMany({
  where: {
    visible: false,
    NOT: [
      { name: { contains: '(Entry)' } },
      { name: { contains: 'FINAL 5 PLAY-OFF SERIES' } },
    ],
  },
  data: { visible: true },
});

console.log(`Made ${updated.count} competitions visible`);

await prisma.$disconnect();
