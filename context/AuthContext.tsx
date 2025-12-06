import { Student, UserSettings } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  student: Student | null;
  settings: UserSettings;
}

interface AuthContextType extends AuthState {
  login: (name: string, studentNumber: string) => void;
  selectDepartment: (department: string) => void;
  selectYear: (year: number) => void;
  logout: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProfile: (updates: Partial<Student>) => void;
}

const defaultSettings: UserSettings = {
  notifications: {
    events: true,
    classReminders: true,
    cafeteriaUpdates: true,
    announcements: true,
  },
  theme: 'system',
  language: 'tr',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    student: null,
    settings: defaultSettings,
  });

  const login = useCallback((name: string, studentNumber: string) => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name,
      studentNumber,
      department: '',
      email: `${studentNumber}@university.edu.tr`,
      year: 2,
    };
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      student: newStudent,
    }));
  }, []);

  const selectDepartment = useCallback((department: string) => {
    setState((prev) => ({
      ...prev,
      student: prev.student ? { ...prev.student, department } : null,
    }));
  }, []);

  const selectYear = useCallback((year: number) => {
    setState((prev) => ({
      ...prev,
      student: prev.student ? { ...prev.student, year } : null,
    }));
  }, []);

  const logout = useCallback(() => {
    setState({
      isLoggedIn: false,
      student: null,
      settings: defaultSettings,
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const updateProfile = useCallback((updates: Partial<Student>) => {
    setState((prev) => ({
      ...prev,
      student: prev.student ? { ...prev.student, ...updates } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        selectDepartment,
        selectYear,
        logout,
        updateSettings,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

