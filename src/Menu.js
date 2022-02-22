import React from 'react';
import Link from 'next/link';

export default function Menu({}) {
  return (
    <nav>
      <Link href="/">
        <a>Start</a>
      </Link>
      <Link href="/oom">
        <a>Order of merit</a>
      </Link>
    </nav>
  );
}
