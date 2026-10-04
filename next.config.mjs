import fs from 'fs';

import { indexPlayerPhotos } from './src/playerPhotoPath.mjs';

const nextConfig = {
  env: {
    BASE_URL: process.env.BASE_URL,
    PLAYER_PHOTOS: JSON.stringify(
      indexPlayerPhotos(fs.readdirSync('./public/players')),
    ),
  },
};

export default nextConfig;
