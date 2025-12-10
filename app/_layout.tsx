import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { CafeteriaProvider } from '@/context/CafeteriaContext';
import { CourseProvider } from '@/context/CourseContext';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { NotificationProvider } from '@/context/NotificationContext';

// Custom dark theme for the app
const CampusTheme = {
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

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <NotificationProvider>
          <CafeteriaProvider>
            <CourseProvider>
              <ThemeProvider value={CampusTheme}>
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
                </Stack>
                <StatusBar style="light" />
              </ThemeProvider>
            </CourseProvider>
          </CafeteriaProvider>
        </NotificationProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}
