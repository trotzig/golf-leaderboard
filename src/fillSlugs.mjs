import prisma from './prisma.mjs';
import generateCompetitionSlug from './generateCompetitionSlug.mjs';

async function fillSlugs() {
  const competitions = await prisma.competition.findMany();
  for (const competition of competitions) {
    await prisma.competition.update({
      data: { slug: generateCompetitionSlug(competition) },
      where: { id: competition.id },
    });
  }
}
fillSlugs()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
