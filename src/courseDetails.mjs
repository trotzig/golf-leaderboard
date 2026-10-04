function getHoles(course) {
  return Object.entries(course.Holes || {})
    .filter(([key]) => /^H\d+$/.test(key))
    .map(([key, hole]) => ({
      key,
      number: String(hole.Number),
      length: hole.Length,
      par: hole.Par,
    }))
    .sort((a, b) => parseInt(a.number) - parseInt(b.number));
}

function totalLength(holes) {
  return holes.reduce((sum, hole) => sum + (hole.length || 0), 0);
}

// Picks a course's name and holes out of a GolfBox `InfoHandler/GetInfo`
// response.
//
// `Courses` is keyed by course *and* tee (`C{CourseID}T{TeeName}`), so a
// course with several tees shows up more than once. The tour always plays
// from the tips, so we want the longest one.
export function getCourseDetails(data, courseId) {
  const tees = Object.values(data.Courses || {})
    .filter(c => String(c.CourseID) === String(courseId))
    .map(c => ({ name: c.CourseName, holes: getHoles(c) }))
    .sort((a, b) => totalLength(b.holes) - totalLength(a.holes));

  return tees[0] || { name: undefined, holes: [] };
}
