// Not every player has a photo, and the ones that do are either .jpg or .png.
// PLAYER_PHOTOS is a listing of public/players made at build time (see
// next.config.mjs), since public/ isn't on disk in the deployed functions.

const EXTENSIONS = ['jpg', 'png'];

// Maps player id to file extension, preferring .jpg like PlayerPhoto does.
export function indexPlayerPhotos(filenames) {
  const index = {};
  for (const extension of EXTENSIONS) {
    for (const filename of filenames) {
      const match = filename.match(/^(.+)\.([a-z]+)$/);
      if (match && match[2] === extension && !index[match[1]]) {
        index[match[1]] = extension;
      }
    }
  }
  return index;
}

export default function playerPhotoPath(
  playerId,
  index = JSON.parse(process.env.PLAYER_PHOTOS || '{}'),
) {
  const extension = playerId && index[playerId];
  return extension ? `/players/${playerId}.${extension}` : null;
}
