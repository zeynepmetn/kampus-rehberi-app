import React, { createContext, useContext, useState, ReactNode } from 'react';
import { weeklySchedule, days } from '@/data/schedule';

interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
}

// Her gün için ayrı ders seçimi
type DaySelection = Record<string, string[]>; // { 'Pazartesi': ['BIL201', 'MAT201'], 'Salı': ['BIL205'] }

interface CourseContextType {
  selectedCoursesByDay: DaySelection;
  toggleCourse: (day: string, courseId: string) => void;
  isCourseSelected: (day: string, courseId: string) => boolean;
  getFilteredSchedule: (day: string) => Course[];
  getCoursesForDay: (day: string) => Course[];
  clearDaySelection: (day: string) => void;
  clearAllSelections: () => void;
  getTotalSelectedCount: () => number;
  getSelectedCountForDay: (day: string) => number;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  // Her gün için ayrı seçim state'i
  const [selectedCoursesByDay, setSelectedCoursesByDay] = useState<DaySelection>({
    'Pazartesi': [],
    'Salı': [],
    'Çarşamba': [],
    'Perşembe': [],
    'Cuma': [],
  });

  const toggleCourse = (day: string, courseId: string) => {
    setSelectedCoursesByDay(prev => {
      const daySelection = prev[day] || [];
      const newDaySelection = daySelection.includes(courseId)
        ? daySelection.filter(id => id !== courseId)
        : [...daySelection, courseId];
      
      return {
        ...prev,
        [day]: newDaySelection,
      };
    });
  };

  const isCourseSelected = (day: string, courseId: string) => {
    return (selectedCoursesByDay[day] || []).includes(courseId);
  };

  const getCoursesForDay = (day: string): Course[] => {
    return weeklySchedule[day] || [];
  };

  const getFilteredSchedule = (day: string): Course[] => {
    const dayCourses = weeklySchedule[day] || [];
    const daySelection = selectedCoursesByDay[day] || [];
    
    if (daySelection.length === 0) {
      return dayCourses;
    }
    return dayCourses.filter(course => daySelection.includes(course.id));
  };

  const clearDaySelection = (day: string) => {
    setSelectedCoursesByDay(prev => ({
      ...prev,
      [day]: [],
    }));
  };

  const clearAllSelections = () => {
    setSelectedCoursesByDay({
      'Pazartesi': [],
      'Salı': [],
      'Çarşamba': [],
      'Perşembe': [],
      'Cuma': [],
    });
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedCoursesByDay).reduce((acc, arr) => acc + arr.length, 0);
  };

  const getSelectedCountForDay = (day: string) => {
    return (selectedCoursesByDay[day] || []).length;
  };

  return (
    <CourseContext.Provider
      value={{
        selectedCoursesByDay,
        toggleCourse,
        isCourseSelected,
        getFilteredSchedule,
        getCoursesForDay,
        clearDaySelection,
        clearAllSelections,
        getTotalSelectedCount,
        getSelectedCountForDay,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
}
