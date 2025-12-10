import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { getExamsByStudent, Exam } from '@/database/database';
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

const examTypes = [
  { value: 'midterm', label: 'Vize', color: '#F59E0B' },
  { value: 'final', label: 'Final', color: '#EF4444' },
  { value: 'makeup', label: 'Bütünleme', color: '#8B5CF6' },
];

export default function MyExamsScreen() {
  const { isReady } = useDatabase();
  const { student } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && student?.id) {
      loadExams();
    }
  }, [isReady, student?.id, selectedFilter]);

  const loadExams = async () => {
    if (!student?.id) return;

    try {
      setIsLoading(true);
      let allExams = await getExamsByStudent(student.id);

      // Filter by type if selected
      if (selectedFilter) {
        allExams = allExams.filter((exam) => exam.exam_type === selectedFilter);
      }

      // Sort by date
      allExams.sort((a, b) => {
        const dateA = new Date(a.exam_date).getTime();
        const dateB = new Date(b.exam_date).getTime();
        return dateA - dateB;
      });

      setExams(allExams);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExams();
    setIsRefreshing(false);
  };

  const getExamTypeInfo = (type: string) => {
    return examTypes.find((t) => t.value === type) || examTypes[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateString);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Sınavlarım</Text>
            <Text style={styles.headerSubtitle}>
              {exams.length} sınav bulundu
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === null && styles.filterChipActive]}
              onPress={() => setSelectedFilter(null)}
            >
              <Text style={[styles.filterChipText, selectedFilter === null && styles.filterChipTextActive]}>
                Tümü
              </Text>
            </TouchableOpacity>
            {examTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.filterChip, selectedFilter === type.value && styles.filterChipActive]}
                onPress={() => setSelectedFilter(type.value)}
              >
                <Text style={[styles.filterChipText, selectedFilter === type.value && styles.filterChipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Exams List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#667eea" />
        }
      >
        {exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>
              {selectedFilter ? 'Bu türde sınav bulunmuyor' : 'Sınav bulunmuyor'}
            </Text>
          </View>
        ) : (
          exams.map((exam) => {
            const examTypeInfo = getExamTypeInfo(exam.exam_type);
            const daysUntil = getDaysUntil(exam.exam_date);
            const isPast = daysUntil < 0;
            const isToday = daysUntil === 0;
            const isUpcoming = daysUntil > 0 && daysUntil <= 7;

            return (
              <View key={exam.id} style={styles.examCard}>
                <View style={styles.examHeader}>
                  <View style={styles.examInfo}>
                    <Text style={styles.courseCode}>{exam.course_code}</Text>
                    <Text style={styles.courseName}>{exam.course_name}</Text>
                  </View>
                  <View style={[styles.examTypeBadge, { backgroundColor: examTypeInfo.color + '20' }]}>
                    <Text style={[styles.examTypeText, { color: examTypeInfo.color }]}>
                      {examTypeInfo.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.examDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#667eea" />
                    <Text style={styles.detailText}>{formatDate(exam.exam_date)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#667eea" />
                    <Text style={styles.detailText}>
                      {exam.start_time} - {exam.end_time}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color="#667eea" />
                    <Text style={styles.detailText}>
                      {exam.classroom} • {exam.faculty}
                    </Text>
                  </View>
                </View>

                {isUpcoming && (
                  <View style={styles.countdownContainer}>
                    <Ionicons name="alarm-outline" size={16} color="#4ECDC4" />
                    <Text style={styles.countdownText}>
                      {isToday ? 'Bugün!' : daysUntil === 1 ? 'Yarın!' : `${daysUntil} gün kaldı`}
                    </Text>
                  </View>
                )}

                {isPast && (
                  <View style={styles.pastBadge}>
                    <Text style={styles.pastText}>Geçmiş</Text>
                  </View>
                )}
              </View>
            );
          })
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  filtersContainer: {
    marginTop: 8,
  },
  filtersScroll: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
  },
  filterChipText: {
    fontSize: 13,
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
  examCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  examTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  examTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  examDetails: {
    gap: 8,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  pastBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pastText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
});

