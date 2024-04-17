export default function removeCommonCoursePrefix(courses, courseName) {
  if (courses.length === 1) {
    return courseName;
  }
  const names = courses.map(c => c.Name);
  names.sort((a, b) => a.length - b.length);
  const lastMatch = (() => {
    let i;
    for (i = 0; i < names[0].length; i++) {
      const refChar = names[0][i];
      for (const name of names) {
        if (name[i] !== refChar) {
          return i;
        }
      }
    }
    return i;
  })();

  if (courseName.length - lastMatch < 5) {
    // solve case "Sand Valley Golf Resort (Par 70)" vs "Sand Valley Golf Resort (Par 71)"
    return courseName;
  }

  return courseName.slice(lastMatch);
}
