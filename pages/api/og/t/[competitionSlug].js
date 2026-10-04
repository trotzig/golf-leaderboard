import ogCompetitionCard from '../../../../src/ogCompetitionCard.mjs';
import { sendOgImage } from '../../../../src/ogImage.js';
import playerPhotoPath from '../../../../src/playerPhotoPath.mjs';
import prisma from '../../../../src/prisma';

export default async function handler(req, res) {
  const competition = await prisma.competition.findUnique({
    where: { slug: req.query.competitionSlug },
    select: {
      name: true,
      venue: true,
      start: true,
      end: true,
      categories: true,
      competitionScore: {
        where: { position: '1' },
        select: {
          scoreText: true,
          player: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!competition) {
    res.status(404).end();
    return;
  }

  const card = ogCompetitionCard(competition, competition.competitionScore[0]);
  const photoPath = playerPhotoPath(card.winner?.playerId);
  if (photoPath) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    card.photoUrl = `${protocol}://${req.headers.host}${photoPath}`;
  }
  await sendOgImage(res, card);
}
