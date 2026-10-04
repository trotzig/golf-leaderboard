import '../../styles.css';

import React from 'react';

import CoursePage from '../CoursePage.js';
import { competitions2026 } from './mockData.js';
import courseInfo from './testData/courseInfo.json';
import withNav from './withNav.js';

const competition = competitions2026[11];

export default {
  title: 'CoursePage',
  component: CoursePage,
  decorators: [withNav],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => (
  <CoursePage
    competition={{ ...competition }}
    courseId="2364897"
    initialData={courseInfo}
  />
);

// GolfBox hasn't published the course yet
export const NoCourseInfo = () => (
  <CoursePage
    competition={{ ...competition }}
    courseId="2364897"
    initialData={{ ...courseInfo, Courses: {} }}
  />
);
