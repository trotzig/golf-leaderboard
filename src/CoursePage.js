import React from 'react';

import { getCourseDetails } from './courseDetails.mjs';
import { useJsonPData } from './fetchJsonP.js';
import LoadingSkeleton from './LoadingSkeleton.js';
import VenueMapLink from './VenueMapLink.js';

function HoleIllustration({ length, maxLength, par }) {
  const pct = Math.max(15, (length / maxLength) * 100);
  const segments = par >= 5 ? [2, 2, 1] : par >= 4 ? [2, 1] : [1];
  return (
    <div className="hole-visual" style={{ '--hole-pct': `${pct}%` }}>
      <div className="hole-tee" />
      <div className="hole-fairway">
        {segments.map((flex, i) => (
          <div key={i} className="hole-fairway-segment" style={{ flex }} />
        ))}
      </div>
      <div className="hole-green">
        <div className="hole-flagpole" />
        <div className="hole-flag" />
        <div className="hole-cup" />
      </div>
    </div>
  );
}

export default function CoursePage({ competition, courseId, initialData }) {
  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/InfoHandler/GetInfo/CompetitionId/${competition.id}/language/2057/`,
    initialData,
  );

  const loading = !data;
  const { name: courseName, holes } = data
    ? getCourseDetails(data, courseId)
    : { holes: [] };
  const venue = data && data.CompetitionData.Venue;

  const maxLength = holes.length ? Math.max(...holes.map(h => h.length)) : 1;
  const totalLength = holes.reduce((sum, h) => sum + h.length, 0);
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const parCounts = holes.reduce((acc, h) => {
    acc[h.par] = (acc[h.par] || 0) + 1;
    return acc;
  }, {});
  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9);
  const frontLength = frontNine.reduce((sum, h) => sum + h.length, 0);
  const backLength = backNine.reduce((sum, h) => sum + h.length, 0);
  const frontPar = frontNine.reduce((sum, h) => sum + h.par, 0);
  const backPar = backNine.reduce((sum, h) => sum + h.par, 0);

  return (
    <div>
      <div className="course">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <h2>
              {[venue.Name, courseName].filter(Boolean).join(' – ')}
            </h2>
            <p className="leaderboard-page-subtitle page-margin">
              <VenueMapLink venue={venue.Name} />
            </p>
            {holes.length > 0 && (
              <p className="course-summary page-margin">
                {(() => {
                  const parts = Object.entries(parCounts)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                    .map(([par, count]) => `${count} par ${par}${count === 1 ? '' : 's'}`);
                  const last = parts.pop();
                  const parDesc = parts.length ? `${parts.join(', ')} and ${last}` : last;
                  return `A par ${totalPar} course with ${parDesc}, measuring a total of ${totalLength.toLocaleString('en-US')} m off the tips.`;
                })()}
              </p>
            )}
            {holes.length === 0 && (
              <p className="alert page-margin">
                Hole details for this course aren't available yet.
              </p>
            )}
            <div className="hole-list">
              {holes.map((hole, i) => (
                <React.Fragment key={hole.key}>
                  <div className="hole-row">
                    <span className="hole-num">{hole.number}</span>
                    <HoleIllustration length={hole.length} maxLength={maxLength} par={hole.par} />
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
