// Registers a Node hooks loader that transpiles JSX in the email templates
// under `src/emails/` on import, so scripts that send emails can run outside
// of Next.js. Use with `node --import ./scripts/registerJsxLoader.mjs ...`.
import { register } from 'node:module';

register('./jsxLoader.mjs', import.meta.url);
