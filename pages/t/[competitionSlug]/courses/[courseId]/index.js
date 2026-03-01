import { useRouter } from 'next/router';
import React from 'react';

import { useJsonPData } from '../../../../../src/fetchJsonP';
import LoadingSkeleton from '../../../../../src/LoadingSkeleton';
import Menu from '../../../../../src/Menu';
import prisma from '../../../../../src/prisma';

function HoleIllustration({ length, maxLength }) {
  const pct = Math.max(15, (length / maxLength) * 100);
  return (
    <div className="hole-visual" style={{ '--hole-pct': `${pct}%` }}>
      <div className="hole-tee" />
      <div className="hole-fairway" />
      <div className="hole-green">
        <div className="hole-flagpole" />
        <div className="hole-flag" />
        <div className="hole-cup" />
      </div>
    </div>
  );
}

export default function Course({ competition }) {
  const router = useRouter();
  const { courseId } = router.query;

  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competition.id}/language/2057/`,
  );

  const loading = !data;
  const course = data && data.Courses[`C${courseId}`];
  const venue = data && data.CompetitionData.Venue;

  const holes = course
    ? Object.entries(course.Holes)
        .filter(([key]) => /^H\d+$/.test(key))
        .map(([key, hole]) => {
          const tee = Object.values(hole.Tees)[0];
          return {
            key,
            number: key.replace(/^H/, ''),
            length: tee.Length,
            par: tee.Par,
          };
        })
        .sort((a, b) => parseInt(a.number) - parseInt(b.number))
    : [];

  const maxLength = holes.length ? Math.max(...holes.map(h => h.length)) : 1;
  const totalLength = holes.reduce((sum, h) => sum + h.length, 0);
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9);
  const frontLength = frontNine.reduce((sum, h) => sum + h.length, 0);
  const backLength = backNine.reduce((sum, h) => sum + h.length, 0);
  const frontPar = frontNine.reduce((sum, h) => sum + h.par, 0);
  const backPar = backNine.reduce((sum, h) => sum + h.par, 0);

  return (
    <div>
      <Menu activeHref="/leaderboard" />
      <div className="course">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <h2>
              {venue.Name} – {course.Name}
            </h2>
            <div className="hole-list">
              {holes.map((hole, i) => (
                <React.Fragment key={hole.key}>
                  <div className="hole-row">
                    <span className="hole-num">{hole.number}</span>
                    <HoleIllustration length={hole.length} maxLength={maxLength} />
                    <span className="hole-len">{hole.length}m</span>
                    <span className="hole-par">Par {hole.par}</span>
                  </div>
                  {i === 8 && backNine.length > 0 && (
                    <div className="hole-subtotal">
                      <span className="hole-subtotal-label">Out</span>
                      <span className="hole-subtotal-len">{frontLength}m</span>
                      <span className="hole-subtotal-par">Par {frontPar}</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
              {holes.length > 0 && (
                <>
                  {backNine.length > 0 && (
                    <div className="hole-subtotal">
                      <span className="hole-subtotal-label">In</span>
                      <span className="hole-subtotal-len">{backLength}m</span>
                      <span className="hole-subtotal-par">Par {backPar}</span>
                    </div>
                  )}
                  <div className="hole-subtotal hole-subtotal--total">
                    <span className="hole-subtotal-label">Total</span>
                    <span className="hole-subtotal-len">{totalLength}m</span>
                    <span className="hole-subtotal-par">Par {totalPar}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const competition = await prisma.competition.findUnique({
    where: { slug: params.competitionSlug },
    select: {
      id: true,
      name: true,
      venue: true,
      start: true,
      end: true,
      slug: true,
    },
  });
  if (!competition) {
    return { notFound: true };
  }
  competition.start = competition.start.getTime();
  competition.end = competition.end.getTime();
  const props = { competition };
  return { props };
}
