import {
    deleteExam,
    Department,
    Exam,
    getAllExams,
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

const examTypes = [
  { value: 'midterm', label: 'Vize', color: '#F59E0B' },
  { value: 'final', label: 'Final', color: '#EF4444' },
  { value: 'makeup', label: 'Bütünleme', color: '#8B5CF6' },
];

export default function ExamsManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadExams();
  }, [selectedDepartment, selectedExamType]);

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

  const loadExams = async () => {
    try {
      const allExams = await getAllExams();
      let filtered = allExams;

      if (selectedDepartment) {
        const deptCourses = await getCoursesByDepartment(selectedDepartment.id!);
        const courseIds = deptCourses.map((c) => c.id!);
        filtered = filtered.filter((e) => courseIds.includes(e.course_id));
      }

      if (selectedExamType) {
        filtered = filtered.filter((e) => e.exam_type === selectedExamType);
      }

      // Sort by date
      filtered.sort((a, b) => {
        const dateA = new Date(a.exam_date).getTime();
        const dateB = new Date(b.exam_date).getTime();
        return dateA - dateB;
      });

      setExams(filtered);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExams();
    setIsRefreshing(false);
  };

  const handleDelete = async (exam: Exam) => {
    const examTypeLabel = examTypes.find((t) => t.value === exam.exam_type)?.label || exam.exam_type;
    Alert.alert(
      'Sınavı Sil',
      `"${exam.course_name}" dersinin ${examTypeLabel} sınavını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExam(exam.id!);
              Alert.alert('Başarılı', 'Sınav silindi');
              loadExams();
            } catch (error) {
              console.error('Error deleting exam:', error);
              Alert.alert('Hata', 'Sınav silinemedi');
            }
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Sınav Yönetimi</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/admin/courses')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilter}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedExamType && styles.filterChipActive]}
              onPress={() => setSelectedExamType(null)}
            >
              <Text style={[styles.filterChipText, !selectedExamType && styles.filterChipTextActive]}>
                Tümü
              </Text>
            </TouchableOpacity>
            {examTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.filterChip,
                  selectedExamType === type.value && styles.filterChipActive,
                  selectedExamType === type.value && { backgroundColor: type.color },
                ]}
                onPress={() => setSelectedExamType(type.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedExamType === type.value && styles.filterChipTextActive,
                  ]}
                >
                  {type.label}
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

      {/* Exam List */}
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
            <Text style={styles.emptyText}>Sınav bulunmuyor</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/admin/courses')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Sınav Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          exams.map((exam) => {
            const examTypeInfo = getExamTypeInfo(exam.exam_type);
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
                    <Text style={styles.detailText}>{exam.classroom}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="business-outline" size={16} color="#667eea" />
                    <Text style={styles.detailText}>{exam.faculty}</Text>
                  </View>
                  {exam.department_name && (
                    <View style={styles.detailItem}>
                      <Ionicons name="school-outline" size={16} color="#667eea" />
                      <Text style={styles.detailText}>{exam.department_name}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.examActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/admin/courses')}
                  >
                    <Ionicons name="create-outline" size={18} color="#667eea" />
                    <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(exam)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                  </TouchableOpacity>
                </View>
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
  typeFilter: {
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
  examCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  examTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  examTypeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  examDetails: {
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
  examActions: {
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

