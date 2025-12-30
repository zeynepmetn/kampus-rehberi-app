import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { CafeteriaProvider } from '@/context/CafeteriaContext';
import { CourseProvider } from '@/context/CourseContext';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Custom themes for the app
const CampusDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#667eea',
    background: '#0f172a',
    card: '#1a1a2e',
    text: '#fff',
    border: 'rgba(255, 255, 255, 0.08)',
    notification: '#ef4444',
  },
};

const CampusLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#667eea',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    border: 'rgba(0, 0, 0, 0.08)',
    notification: '#ef4444',
  },
};

function RootLayoutNav() {
  const { isDark } = useTheme();
  
  return (
    <NavigationThemeProvider value={isDark ? CampusDarkTheme : CampusLightTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen 
          name="department-selection" 
          options={{ animation: 'slide_from_right' }} 
        />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen 
          name="notifications" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="academic-calendar" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="course-selection" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="my-exams" 
          options={{ 
            animation: 'slide_from_right',
            presentation: 'card',
          }} 
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <AuthProvider>
          <NotificationProvider>
            <CafeteriaProvider>
              <CourseProvider>
                <RootLayoutNav />
              </CourseProvider>
            </CafeteriaProvider>
          </NotificationProvider>
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
