import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { useTheme } from '@/context/ThemeContext';
import {
  CourseSchedule,
  getEnrolledCourses,
  getStudentWeeklySchedule,
  StudentCourse,
} from '@/database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

// Course colors for visual variety
const courseColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export default function ScheduleScreen() {
  const { isReady } = useDatabase();
  const { student } = useAuth();
  const { colors, isDark } = useTheme();
  const [enrolledCourses, setEnrolledCourses] = useState<StudentCourse[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, CourseSchedule[]>>({});
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function getCurrentDay() {
    const dayIndex = new Date().getDay();
    const dayMap: Record<number, string> = {
      1: 'Pazartesi',
      2: 'Salı',
      3: 'Çarşamba',
      4: 'Perşembe',
      5: 'Cuma',
    };
    return dayMap[dayIndex] || 'Pazartesi';
  }

  useEffect(() => {
    if (isReady && student?.id) {
      loadData();
    } else if (isReady && !student) {
      setIsLoading(false);
    }
  }, [isReady, student]);

  const loadData = async () => {
    if (!student?.id) return;
    
    try {
      setIsLoading(true);

      // Load enrolled courses
      const enrolled = await getEnrolledCourses(student.id);
      setEnrolledCourses(enrolled);

      // Load weekly schedule
      const schedule = await getStudentWeeklySchedule(student.id);
      setWeeklySchedule(schedule);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const todayCourses = weeklySchedule[selectedDay] || [];
  const totalCourses = enrolledCourses.length;
  const totalCredits = enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

  const getCourseColor = (index: number) => {
    return courseColors[index % courseColors.length];
  };

  const getCoursesCountForDay = (day: string) => {
    return (weeklySchedule[day] || []).length;
  };

  const styles = createStyles(colors, isDark);

  if (!isReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.headerGradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.studentName}>
              {student?.first_name} {student?.last_name}
            </Text>
            <Text style={styles.department}>{student?.department_name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* GPA Info */}
        <View style={styles.gpaContainer}>
          <View style={styles.gpaItem}>
            <Text style={styles.gpaLabel}>GNO</Text>
            <Text style={styles.gpaValue}>{student?.gno?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.gpaDivider} />
          <View style={styles.gpaItem}>
            <Text style={styles.gpaLabel}>YNO</Text>
            <Text style={styles.gpaValue}>{student?.yno?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.gpaDivider} />
          <View style={styles.gpaItem}>
            <Text style={styles.gpaLabel}>Sınıf</Text>
            <Text style={styles.gpaValue}>{student?.class_year || 1}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Course Info or Selection Prompt */}
      {totalCourses > 0 ? (
        <View style={styles.filterInfo}>
          <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
          <Text style={styles.filterInfoText}>
            {totalCourses} ders kayıtlı • {totalCredits} kredi • {todayCourses.length} ders bugün
          </Text>
          <TouchableOpacity onPress={() => router.push('/course-selection')}>
            <Ionicons name="settings-outline" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.selectCoursesPrompt}
          onPress={() => router.push('/course-selection')}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.selectCoursesText}>
            Derslerinizi seçmek için tıklayın
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Day Selector */}
      <View style={styles.daySelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {days.map((day) => {
            const dayCount = getCoursesCountForDay(day);
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDay === day && styles.dayButtonActive,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDay === day && styles.dayButtonTextActive,
                  ]}
                >
                  {day.substring(0, 3)}
                </Text>
                {dayCount > 0 && (
                  <View style={styles.dayInfo}>
                    <View
                      style={[
                        styles.dayDot,
                        selectedDay === day && styles.dayDotActive,
                      ]}
                    />
                    <Text style={[
                      styles.dayCount,
                      selectedDay === day && styles.dayCountActive,
                    ]}>
                      {dayCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Schedule Content */}
      <ScrollView
        style={styles.scheduleContainer}
        contentContainerStyle={styles.scheduleContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.sectionTitle}>
          {selectedDay} Programı
        </Text>

        {totalCourses === 0 ? (
          /* No courses selected */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="book-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Ders Seçimi Yapılmadı</Text>
            <Text style={styles.emptySubtitle}>
              Programınızı görmek için önce derslerinizi seçmeniz gerekiyor.
            </Text>
            <TouchableOpacity 
              style={styles.selectCoursesButton}
              onPress={() => router.push('/course-selection')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.selectCoursesButtonText}>Ders Seç</Text>
            </TouchableOpacity>
          </View>
        ) : todayCourses.length === 0 ? (
          /* Courses selected but none today */
          <View style={styles.emptyState}>
            <Ionicons name="cafe-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Bu Gün Ders Yok!</Text>
            <Text style={styles.emptySubtitle}>
              {selectedDay} günü dersiniz bulunmuyor.
            </Text>
          </View>
        ) : (
          /* Show courses */
          todayCourses.map((schedule, index) => (
            <TouchableOpacity
              key={schedule.id}
              style={styles.courseCard}
              activeOpacity={0.8}
            >
              <View
                style={[styles.courseAccent, { backgroundColor: getCourseColor(index) }]}
              />
              <View style={styles.courseContent}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseCode}>{schedule.course_code}</Text>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.courseTime}>
                      {schedule.start_time} - {schedule.end_time}
                    </Text>
                  </View>
                </View>
                <Text style={styles.courseName}>{schedule.course_name}</Text>
                <View style={styles.courseDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                    <Text style={styles.detailText}>{schedule.instructor}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                    <Text style={styles.detailText}>{schedule.classroom} • {schedule.faculty}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Quick Stats - Show only if courses selected */}
        {totalCourses > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Haftalık Özet</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="book-outline" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{totalCourses}</Text>
                <Text style={styles.statLabel}>Toplam Ders</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="ribbon-outline" size={24} color={colors.secondary} />
                <Text style={styles.statNumber}>{totalCredits}</Text>
                <Text style={styles.statLabel}>Kredi</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="calendar-outline" size={24} color={colors.accent} />
                <Text style={styles.statNumber}>
                  {days.filter(day => getCoursesCountForDay(day) > 0).length}
                </Text>
                <Text style={styles.statLabel}>Aktif Gün</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.statsTitle}>Hızlı Erişim</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/course-selection')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="school" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Ders Seçimi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/academic-calendar')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="calendar" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.actionText}>Akademik Takvim</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/my-exams')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="document-text" size={24} color={colors.accent} />
              </View>
              <Text style={styles.actionText}>Sınavlarım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  department: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpaContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  gpaItem: {
    flex: 1,
    alignItems: 'center',
  },
  gpaLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  gpaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  gpaDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterInfoText: {
    fontSize: 13,
    color: colors.secondary,
    flex: 1,
  },
  selectCoursesPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  selectCoursesText: {
    fontSize: 14,
    color: colors.primary,
    flex: 1,
    fontWeight: '500',
  },
  daySelectorContainer: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  daySelector: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
  },
  dayDotActive: {
    backgroundColor: '#fff',
  },
  dayCount: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  dayCountActive: {
    color: '#fff',
  },
  scheduleContainer: {
    flex: 1,
  },
  scheduleContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  selectCoursesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  selectCoursesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  courseAccent: {
    width: 4,
  },
  courseContent: {
    flex: 1,
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  courseDetails: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  statsContainer: {
    marginTop: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
