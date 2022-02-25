import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Menu from '../../../../../src/Menu';
import fetchJsonP from '../../../../../src/fetchJsonP';

export default function Course() {
  const [course, setCourse] = useState();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { competitionId, courseId } = router.query;
  console.log(competitionId, courseId);

  useEffect(() => {
    console.log('effect');
    if (!competitionId || !courseId) {
      return;
    }
    async function run() {
      setLoading(true);
      const data = await fetchJsonP(
        `https://scores.golfbox.dk/Handlers/LeaderboardHandler/GetLeaderboard/CompetitionId/${competitionId}/language/2057/`,
      );
      setCourse(data.Courses[`C${courseId}`]);
      setLoading(false);
    }
    run();
  }, [competitionId, courseId]);
  return (
    <div>
      <Menu />
      <div className="course">
        {loading ? (
          <div className="lds-ellipsis">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        ) : (
          <>
            <h2>{course.Name}</h2>
            <div className="course-table">
              <table>
                <thead>
                  <tr>
                    <th>Hole</th>
                    {Object.values(course.Holes)
                      .slice(0, 18)
                      .map(hole => (
                        <th key={hole.Number}>{hole.Number}</th>
                      ))}
                    <th>In</th>
                    <th>Out</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Len (m)</td>
                    {Object.values(course.Holes).map(hole => {
                      const tee = Object.values(hole.Tees)[0];
                      return <td key={hole.Number}>{tee.Length}</td>;
                    })}
                  </tr>
                  <tr>
                    <td>Par</td>
                    {Object.values(course.Holes).map(hole => {
                      const tee = Object.values(hole.Tees)[0];
                      return <td key={hole.Number}>{tee.Par}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
