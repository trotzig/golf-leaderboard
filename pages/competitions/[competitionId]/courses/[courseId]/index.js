import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import LoadingSkeleton from '../../../../../src/LoadingSkeleton';
import Menu from '../../../../../src/Menu';
import fetchJsonP from '../../../../../src/fetchJsonP';

export default function Course() {
  const [course, setCourse] = useState();
  const [venue, setVenue] = useState();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { competitionId, courseId } = router.query;

  useEffect(() => {
    if (!competitionId || !courseId) {
      return;
    }
    async function run() {
      setLoading(true);
      const data = await fetchJsonP(
        `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
      );
      console.log(data);
      setCourse(data.Courses[`C${courseId}`]);
      setVenue(data.CompetitionData.Venue);
      setLoading(false);
    }
    run();
  }, [competitionId, courseId]);
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
