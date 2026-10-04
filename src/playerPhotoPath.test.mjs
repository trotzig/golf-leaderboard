import { describe, expect, it } from 'vitest';

import playerPhotoPath, { indexPlayerPhotos } from './playerPhotoPath.mjs';

describe('indexPlayerPhotos', () => {
  it('maps player ids to their file extension', () => {
    expect(indexPlayerPhotos(['020618-005.jpg', '264957.png'])).toEqual({
      '020618-005': 'jpg',
      264957: 'png',
    });
  });

  it('prefers jpg when a player has both', () => {
    expect(indexPlayerPhotos(['1234567.png', '1234567.jpg'])).toEqual({
      1234567: 'jpg',
    });
  });

  it('ignores files that are not photos', () => {
    expect(indexPlayerPhotos(['.DS_Store', 'README.md', '1234567.json'])).toEqual(
      {},
    );
  });
});

describe('playerPhotoPath', () => {
  const index = { '020618-005': 'jpg', 264957: 'png' };

  it('returns the path with the right extension', () => {
    expect(playerPhotoPath('020618-005', index)).toBe('/players/020618-005.jpg');
    expect(playerPhotoPath('264957', index)).toBe('/players/264957.png');
  });

  it('returns null for players without a photo', () => {
    expect(playerPhotoPath('138099', index)).toBeNull();
    expect(playerPhotoPath(undefined, index)).toBeNull();
  });
});
