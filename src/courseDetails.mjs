// Picks a course's name and holes out of a GolfBox `InfoHandler/GetInfo`
// response.
//
// `Courses` is keyed by course *and* tee (`C{CourseID}T{TeeName}`), so a
// course played from several tees shows up more than once. We want the tee
// the men play from, which the class's round setup names in `TeeMen`.
export function getCourseDetails(data, courseId) {
  const tees = Object.values(data.Courses || {}).filter(
    c => String(c.CourseID) === String(courseId),
  );
  const mensTee = Object.values(data.Classes || {})
    .flatMap(cls => Object.values(cls.Rounds || {}))
    .map(round => (round.Courses || {})[`Course${courseId}`])
    .filter(Boolean)
    .map(c => c.TeeMen)[0];
  const course = tees.find(c => c.TeeName === mensTee) || tees[0];

  const holes = Object.entries((course && course.Holes) || {})
    .filter(([key]) => /^H\d+$/.test(key))
    .map(([key, hole]) => ({
      key,
      number: String(hole.Number),
      length: hole.Length,
      par: hole.Par,
    }))
    .sort((a, b) => parseInt(a.number) - parseInt(b.number));

  return { name: course && course.CourseName, holes };
}
