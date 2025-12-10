import {
    CourseSchedule,
    deleteCourseSchedule,
    Department,
    getAllSchedules,
    getCoursesByDepartment,
    getDepartments,
} from '@/database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

export default function SchedulesManagement() {
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [selectedDepartment, selectedDay]);

  const loadData = async () => {
    try {
      const deps = await getDepartments();
      setDepartments(deps);
      if (deps.length > 0) {
        setSelectedDepartment(deps[0]);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const allSchedules = await getAllSchedules();
      let filtered = allSchedules;

      if (selectedDepartment) {
        const deptCourses = await getCoursesByDepartment(selectedDepartment.id!);
        const courseIds = deptCourses.map((c) => c.id!);
        filtered = filtered.filter((s) => courseIds.includes(s.course_id));
      }

      if (selectedDay) {
        filtered = filtered.filter((s) => s.day === selectedDay);
      }

      setSchedules(filtered);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSchedules();
    setIsRefreshing(false);
  };

  const handleDelete = async (schedule: CourseSchedule) => {
    Alert.alert(
      'Programı Sil',
      `"${schedule.course_name}" dersinin ${schedule.day} günü ${schedule.start_time}-${schedule.end_time} saatlerindeki programını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourseSchedule(schedule.id!);
              Alert.alert('Başarılı', 'Program silindi');
              loadSchedules();
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Hata', 'Program silinemedi');
            }
          },
        },
      ]
    );
  };

  const filteredSchedules = schedules;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ders Programları</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/admin/courses')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayFilter}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedDay && styles.filterChipActive]}
              onPress={() => setSelectedDay(null)}
            >
              <Text style={[styles.filterChipText, !selectedDay && styles.filterChipTextActive]}>
                Tümü
              </Text>
            </TouchableOpacity>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.filterChip, selectedDay === day && styles.filterChipActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[styles.filterChipText, selectedDay === day && styles.filterChipTextActive]}
                >
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptFilter}>
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={[
                  styles.filterChip,
                  selectedDepartment?.id === dept.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedDepartment(dept)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedDepartment?.id === dept.id && styles.filterChipTextActive,
                  ]}
                >
                  {dept.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Schedule List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#667eea" />
        }
      >
        {filteredSchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>Program bulunmuyor</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/admin/courses')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Ders Programı Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredSchedules.map((schedule) => (
            <View key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.courseCode}>{schedule.course_code}</Text>
                  <Text style={styles.courseName}>{schedule.course_name}</Text>
                </View>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{schedule.day}</Text>
                </View>
              </View>

              <View style={styles.scheduleDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#667eea" />
                  <Text style={styles.detailText}>
                    {schedule.start_time} - {schedule.end_time}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color="#667eea" />
                  <Text style={styles.detailText}>{schedule.classroom}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="business-outline" size={16} color="#667eea" />
                  <Text style={styles.detailText}>{schedule.faculty}</Text>
                </View>
                {schedule.department_name && (
                  <View style={styles.detailItem}>
                    <Ionicons name="school-outline" size={16} color="#667eea" />
                    <Text style={styles.detailText}>{schedule.department_name}</Text>
                  </View>
                )}
              </View>

              <View style={styles.scheduleActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/admin/courses')}
                >
                  <Ionicons name="create-outline" size={18} color="#667eea" />
                  <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(schedule)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    gap: 8,
  },
  dayFilter: {
    marginBottom: 4,
  },
  deptFilter: {
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 12,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scheduleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dayBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667eea',
  },
  scheduleDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  scheduleActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

