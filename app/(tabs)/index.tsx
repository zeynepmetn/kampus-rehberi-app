import { useAuth } from '@/context/AuthContext';
import { useCourses } from '@/context/CourseContext';
import { useNotifications } from '@/context/NotificationContext';
import { days } from '@/data/schedule';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ScheduleScreen() {
  const { student } = useAuth();
  const { unreadCount } = useNotifications();
  const { getFilteredSchedule, getSelectedCountForDay, getTotalSelectedCount } = useCourses();
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());

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

  const totalSelected = getTotalSelectedCount();
  const currentDaySelected = getSelectedCountForDay(selectedDay);
  
  // Sadece ders seçimi yapıldıysa dersleri göster
  const todayCourses = totalSelected > 0 ? getFilteredSchedule(selectedDay) : [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.studentName}>{student?.name || 'Öğrenci'}</Text>
            <Text style={styles.department}>{student?.department}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Seçili Ders Bilgisi veya Ders Seçimi Uyarısı */}
      {totalSelected > 0 ? (
        <View style={styles.filterInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
          <Text style={styles.filterInfoText}>
            {totalSelected} ders seçili ({currentDaySelected} bu gün)
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.selectCoursesPrompt}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#667eea" />
          <Text style={styles.selectCoursesText}>
            Derslerinizi seçmek için tıklayın
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#667eea" />
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
            const daySelectedCount = getSelectedCountForDay(day);
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
                {daySelectedCount > 0 && (
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
                      {daySelectedCount}
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
      >
        <Text style={styles.sectionTitle}>
          {selectedDay} Programı
        </Text>

        {totalSelected === 0 ? (
          /* Ders seçimi yapılmamış */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="book-outline" size={48} color="#667eea" />
            </View>
            <Text style={styles.emptyTitle}>Ders Seçimi Yapılmadı</Text>
            <Text style={styles.emptySubtitle}>
              Programınızı görmek için önce derslerinizi seçmeniz gerekiyor.
            </Text>
            <TouchableOpacity 
              style={styles.selectCoursesButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.selectCoursesButtonText}>Ders Seç</Text>
            </TouchableOpacity>
          </View>
        ) : todayCourses.length === 0 ? (
          /* Ders seçilmiş ama bu gün ders yok */
          <View style={styles.emptyState}>
            <Ionicons name="cafe-outline" size={64} color="#64748b" />
            <Text style={styles.emptyTitle}>Bu Gün Ders Yok!</Text>
            <Text style={styles.emptySubtitle}>
              Seçtiğiniz dersler {selectedDay} günü yok.
            </Text>
          </View>
        ) : (
          /* Dersler gösteriliyor */
          todayCourses.map((course, index) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              activeOpacity={0.8}
            >
              <View
                style={[styles.courseAccent, { backgroundColor: course.color }]}
              />
              <View style={styles.courseContent}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text style={styles.courseTime}>
                      {course.startTime} - {course.endTime}
                    </Text>
                  </View>
                </View>
                <Text style={styles.courseName}>{course.name}</Text>
                <View style={styles.courseDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{course.instructor}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{course.room}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Quick Stats - Sadece ders seçildiyse göster */}
        {totalSelected > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Haftalık Özet</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="book-outline" size={24} color="#667eea" />
                <Text style={styles.statNumber}>
                  {days.reduce((acc, day) => acc + getFilteredSchedule(day).length, 0)}
                </Text>
                <Text style={styles.statLabel}>Toplam Ders</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={24} color="#4ECDC4" />
                <Text style={styles.statNumber}>
                  {totalSelected * 3}
                </Text>
                <Text style={styles.statLabel}>Saat/Hafta</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="calendar-outline" size={24} color="#FF6B6B" />
                <Text style={styles.statNumber}>
                  {days.filter(day => getFilteredSchedule(day).length > 0).length}
                </Text>
                <Text style={styles.statLabel}>Aktif Gün</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  department: {
    fontSize: 13,
    color: '#667eea',
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterInfoText: {
    fontSize: 13,
    color: '#4ECDC4',
    flex: 1,
  },
  selectCoursesPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  selectCoursesText: {
    fontSize: 14,
    color: '#667eea',
    flex: 1,
    fontWeight: '500',
  },
  daySelectorContainer: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  daySelector: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: '#667eea',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
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
    backgroundColor: '#475569',
  },
  dayDotActive: {
    backgroundColor: '#fff',
  },
  dayCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ECDC4',
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
    color: '#fff',
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
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  selectCoursesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
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
    color: '#94a3b8',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    color: '#64748b',
  },
  statsContainer: {
    marginTop: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
});
