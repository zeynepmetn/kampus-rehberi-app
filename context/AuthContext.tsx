import {
  createStudent,
  Student as DBStudent,
  getStudentByNumber,
  updateStudent
} from '@/database/database';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface UserSettings {
  notifications: {
    events: boolean;
    classReminders: boolean;
    cafeteriaUpdates: boolean;
    announcements: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
}

interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean;
  student: DBStudent | null;
  settings: UserSettings;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (studentNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsAdmin: (password: string) => boolean;
  register: (data: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    email: string;
    password: string;
    departmentId: number;
    classYear: number;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProfile: (updates: Partial<DBStudent>) => Promise<void>;
  refreshStudent: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  notifications: {
    events: true,
    classReminders: true,
    cafeteriaUpdates: true,
    announcements: true,
  },
  theme: 'dark',
  language: 'tr',
};

// Admin password - in production, this should be more secure
const ADMIN_PASSWORD = 'admin123';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isAdmin: false,
    student: null,
    settings: defaultSettings,
    isLoading: false,
  });

  const login = useCallback(async (studentNumber: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Find student by number
      const student = await getStudentByNumber(studentNumber);

      if (!student) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Öğrenci bulunamadı. Lütfen kayıt olun.' };
      }

      // Check password (simple check for demo)
      if (student.password && student.password !== password) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Şifre hatalı' };
      }

      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        isAdmin: false,
        student,
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Giriş yapılırken bir hata oluştu' };
    }
  }, []);

  const loginAsAdmin = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        isAdmin: true,
        student: null,
      }));
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (data: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    email: string;
    password: string;
    departmentId: number;
    classYear: number;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Check if student already exists
      const existing = await getStudentByNumber(data.studentNumber);
      if (existing) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Bu öğrenci numarası zaten kayıtlı' };
      }

      // Create new student
      const studentId = await createStudent({
        student_number: data.studentNumber,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        department_id: data.departmentId,
        class_year: data.classYear,
        gno: 0,
        yno: 0,
      });

      // Get the created student
      const student = await getStudentByNumber(data.studentNumber);

      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        isAdmin: false,
        student,
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Kayıt yapılırken bir hata oluştu' };
    }
  }, []);

  const logout = useCallback(() => {
    setState({
      isLoggedIn: false,
      isAdmin: false,
      student: null,
      settings: defaultSettings,
      isLoading: false,
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const updateProfile = useCallback(async (updates: Partial<DBStudent>) => {
    if (!state.student?.id) return;

    try {
      await updateStudent(state.student.id, updates);
      const updatedStudent = await getStudentByNumber(state.student.student_number);
      setState(prev => ({
        ...prev,
        student: updatedStudent,
      }));
    } catch (error) {
      console.error('Update profile error:', error);
    }
  }, [state.student]);

  const refreshStudent = useCallback(async () => {
    if (!state.student?.student_number) return;

    try {
      const student = await getStudentByNumber(state.student.student_number);
      setState(prev => ({
        ...prev,
        student,
      }));
    } catch (error) {
      console.error('Refresh student error:', error);
    }
  }, [state.student]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginAsAdmin,
        register,
        logout,
        updateSettings,
        updateProfile,
        refreshStudent,
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
