import { useRouter } from 'next/router';
import React from 'react';

import { useJsonPData } from '../../../../../src/fetchJsonP';
import LoadingSkeleton from '../../../../../src/LoadingSkeleton';
import Menu from '../../../../../src/Menu';

export default function Course() {
  const router = useRouter();
  const { competitionId, courseId } = router.query;

  const data = useJsonPData(
    `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
  );

  const loading = !data;
  const course = data && data.Courses[`C${courseId}`];
  const venue = data && data.CompetitionData.Venue;
  return (
    <div>
      <Menu />
      <div className="course">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <h2>
              {venue.Name} – {course.Name}
            </h2>
            <div className="course-table">
              <div className="course-item">
                <span>Hole</span>
                <span>Len(m)</span>
                <span>Par</span>
              </div>

              {Object.keys(course.Holes).map(holeKey => {
                const hole = course.Holes[holeKey];
                const tee = Object.values(hole.Tees)[0];
                return (
                  <div key={holeKey} className="course-item">
                    <span>{holeKey.replace(/^H-?/, '')}</span>
                    <span>{tee.Length}</span>
                    <span>{tee.Par}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
