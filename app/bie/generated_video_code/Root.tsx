import React from 'react';
import { Composition } from 'remotion';
import { BIELesson } from './BIELesson';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="lesson_ch01_electrostatics_1"
        component={BIELesson}
        durationInFrames={3089}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={
          lessonId: "lesson_ch01_electrostatics_1",
          title: "Lesson 1: Electric Charge & Coulomb's Law",
        }
      />
      <Composition
        id="lesson_ch01_electrostatics_2"
        component={BIELesson}
        durationInFrames={3089}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={
          lessonId: "lesson_ch01_electrostatics_2",
          title: "Lesson 2: Electric Charge & Coulomb's Law",
        }
      />
      <Composition
        id="lesson_ch02_geodynamics_1"
        component={BIELesson}
        durationInFrames={2369}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={
          lessonId: "lesson_ch02_geodynamics_1",
          title: "Lesson 1: Plate Tectonics & Boundary Dynamics",
        }
      />
      <Composition
        id="lesson_ch03_gravitation_1"
        component={BIELesson}
        durationInFrames={2358}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={
          lessonId: "lesson_ch03_gravitation_1",
          title: "Lesson 1: Universal Gravitation & Orbital Freefall",
        }
      />
    </>
  );
};
