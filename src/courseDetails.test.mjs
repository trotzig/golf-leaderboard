import { expect, test } from 'vitest';

import { getCourseDetails } from './courseDetails.mjs';

function course(teeName, firstHoleLength) {
  return {
    CourseID: 2364897,
    CourseName: 'VGK 18 hålsbanan',
    TeeName: teeName,
    Holes: {
      H10: { Number: 10, Par: 3, Length: 150 },
      H2: { Number: 2, Par: 5, Length: 480 },
      H1: { Number: 1, Par: 4, Length: firstHoleLength },
      'H-OUT': { Par: 35, Length: 2970 },
      'H-TOTAL': { Par: 72, Length: 6230 },
    },
  };
}

test('getCourseDetails returns holes sorted by number, without the totals', () => {
  const data = { Courses: { C2364897T63: course('63', 350) } };
  expect(getCourseDetails(data, '2364897')).toEqual({
    name: 'VGK 18 hålsbanan',
    holes: [
      { key: 'H1', number: '1', length: 350, par: 4 },
      { key: 'H2', number: '2', length: 480, par: 5 },
      { key: 'H10', number: '10', length: 150, par: 3 },
    ],
  });
});

test('getCourseDetails picks the longest tee when a course has several', () => {
  const data = {
    Courses: {
      C2364897T41: course('41', 290),
      C2364897T63: course('63', 350),
      C2364897T56: course('56', 320),
    },
  };
  expect(getCourseDetails(data, '2364897').holes[0].length).toBe(350);
});

test('getCourseDetails handles a course that is not in the response', () => {
  expect(getCourseDetails({ Courses: {}, Classes: {} }, '1')).toEqual({
    name: undefined,
    holes: [],
  });
  expect(getCourseDetails({ Courses: null }, '1').holes).toEqual([]);
});
