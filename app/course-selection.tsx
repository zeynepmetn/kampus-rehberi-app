import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  CourseWithEligibility,
  enrollCourse,
  getAvailableCoursesForStudent,
  getEnrolledCourses,
  StudentCourse,
  unenrollCourse,
} from '@/database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CURRENT_ACADEMIC_YEAR = '2024-2025';
const CURRENT_SEMESTER = 'fall';

type FilterType = 'all' | 'eligible' | 'enrolled' | 'mandatory' | 'elective';

export default function CourseSelectionScreen() {
  const { student } = useAuth();
  const { colors, isDark } = useTheme();
  const [availableCourses, setAvailableCourses] = useState<CourseWithEligibility[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<StudentCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedCourse, setSelectedCourse] = useState<CourseWithEligibility | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Bulk selection
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  const styles = createStyles(colors, isDark);

  useEffect(() => {
    if (student?.id) {
      loadData();
    }
  }, [student]);

  const loadData = async () => {
    if (!student?.id) return;

    try {
      setIsLoading(true);

      // Load available courses
      const courses = await getAvailableCoursesForStudent(student.id);
      setAvailableCourses(courses);

      // Load enrolled courses
      const enrolled = await getEnrolledCourses(student.id);
      setEnrolledCourses(enrolled);

      // Clear selection when reloading
      setSelectedCourseIds(new Set());
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleCoursePress = (course: CourseWithEligibility) => {
    if (isBulkMode) {
      toggleCourseSelection(course.id!);
    } else {
      setSelectedCourse(course);
      setShowCourseModal(true);
    }
  };

  const toggleCourseSelection = (courseId: number) => {
    const course = availableCourses.find(c => c.id === courseId);
    if (!course) return;

    if (!course.is_eligible || isEnrolled(courseId)) return;

    const newSelected = new Set(selectedCourseIds);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourseIds(newSelected);
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourse || !student?.id) return;

    try {
      setIsEnrolling(true);

      await enrollCourse({
        student_id: student.id,
        course_id: selectedCourse.id!,
        semester: CURRENT_SEMESTER,
        academic_year: CURRENT_ACADEMIC_YEAR,
        status: 'enrolled',
      });

      Alert.alert('Başarılı', `"${selectedCourse.name}" dersi programa eklendi.`);
      setShowCourseModal(false);
      await loadData();
    } catch (error) {
      console.error('Error enrolling course:', error);
      Alert.alert('Hata', 'Ders eklenirken bir hata oluştu.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (selectedCourseIds.size === 0 || !student?.id) return;

    Alert.alert(
      'Dersleri Ekle',
      `${selectedCourseIds.size} dersi programa eklemek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ekle',
          onPress: async () => {
            try {
              setIsEnrolling(true);

              for (const courseId of selectedCourseIds) {
                await enrollCourse({
                  student_id: student.id!,
                  course_id: courseId,
                  semester: CURRENT_SEMESTER,
                  academic_year: CURRENT_ACADEMIC_YEAR,
                  status: 'enrolled',
                });
              }

              Alert.alert('Başarılı', `${selectedCourseIds.size} ders programa eklendi.`);
              setSelectedCourseIds(new Set());
              setIsBulkMode(false);
              await loadData();
            } catch (error) {
              console.error('Error bulk enrolling:', error);
              Alert.alert('Hata', 'Dersler eklenirken bir hata oluştu.');
            } finally {
              setIsEnrolling(false);
            }
          },
        },
      ]
    );
  };

  const handleUnenrollCourse = async () => {
    if (!selectedCourse || !student?.id) return;

    Alert.alert(
      'Dersi Kaldır',
      `"${selectedCourse.name}" dersini programdan kaldırmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsEnrolling(true);
              await unenrollCourse(student.id!, selectedCourse.id!);
              Alert.alert('Başarılı', 'Ders programdan kaldırıldı.');
              setShowCourseModal(false);
              await loadData();
            } catch (error) {
              console.error('Error unenrolling course:', error);
              Alert.alert('Hata', 'Ders kaldırılırken bir hata oluştu.');
            } finally {
              setIsEnrolling(false);
            }
          },
        },
      ]
    );
  };

  const isEnrolled = (courseId: number) => {
    return enrolledCourses.some((ec) => ec.course_id === courseId);
  };

  const filteredCourses = availableCourses.filter((course) => {
    switch (selectedFilter) {
      case 'eligible':
        return course.is_eligible && !isEnrolled(course.id!);
      case 'enrolled':
        return isEnrolled(course.id!);
      case 'mandatory':
        return course.is_mandatory === 1;
      case 'elective':
        return course.is_mandatory === 0;
      default:
        return true;
    }
  });

  const filterOptions: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'Tümü', icon: 'apps' },
    { key: 'eligible', label: 'Alınabilir', icon: 'checkmark-circle' },
    { key: 'enrolled', label: 'Alınan', icon: 'bookmark' },
    { key: 'mandatory', label: 'Zorunlu', icon: 'alert-circle' },
    { key: 'elective', label: 'Seçmeli', icon: 'options' },
  ];

  const getTotalCredits = () => {
    return enrolledCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  };

  const getTotalECTS = () => {
    return enrolledCourses.reduce((sum, course) => sum + (course.ects || 0), 0);
  };

  const getSelectedCredits = () => {
    return Array.from(selectedCourseIds).reduce((sum, id) => {
      const course = availableCourses.find(c => c.id === id);
      return sum + (course?.credits || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Dersler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Ders Seçimi</Text>
            <Text style={styles.headerSubtitle}>
              {student?.department_name} - {student?.class_year}. Sınıf
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bulkButton, isBulkMode && styles.bulkButtonActive]}
            onPress={() => {
              setIsBulkMode(!isBulkMode);
              setSelectedCourseIds(new Set());
            }}
          >
            <Ionicons
              name={isBulkMode ? 'close' : 'checkbox-outline'}
              size={22}
              color={isBulkMode ? '#ef4444' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{enrolledCourses.length}</Text>
            <Text style={styles.statLabel}>Alınan Ders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTotalCredits()}</Text>
            <Text style={styles.statLabel}>Toplam Kredi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTotalECTS()}</Text>
            <Text style={styles.statLabel}>Toplam AKTS</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Bulk Selection Info */}
      {isBulkMode && (
        <View style={styles.bulkInfo}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={styles.bulkInfoText}>
            {selectedCourseIds.size} ders seçili ({getSelectedCredits()} kredi)
          </Text>
          {selectedCourseIds.size > 0 && (
            <TouchableOpacity onPress={() => setSelectedCourseIds(new Set())}>
              <Text style={styles.bulkClearText}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScrollView}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={14}
              color={selectedFilter === filter.key ? colors.primary : colors.textTertiary}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Course List */}
      <ScrollView
        style={styles.courseList}
        contentContainerStyle={styles.courseListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.listTitle}>
          Dersler <Text style={styles.listCount}>({filteredCourses.length})</Text>
        </Text>

        {filteredCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Bu filtreye uygun ders bulunamadı</Text>
          </View>
        ) : (
          filteredCourses.map((course) => {
            const enrolled = isEnrolled(course.id!);
            const isSelected = selectedCourseIds.has(course.id!);
            const canSelect = isBulkMode && course.is_eligible && !enrolled;

            return (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseCard,
                  !course.is_eligible && !enrolled && styles.courseCardDisabled,
                  enrolled && styles.courseCardEnrolled,
                  isSelected && styles.courseCardSelected,
                ]}
                onPress={() => handleCoursePress(course)}
                activeOpacity={0.7}
              >
                {/* Bulk Selection Checkbox */}
                {isBulkMode && (
                  <View style={styles.checkboxContainer}>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxActive,
                        !canSelect && styles.checkboxDisabled,
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                      {enrolled && <Ionicons name="checkmark" size={16} color={colors.textTertiary} />}
                    </View>
                  </View>
                )}

                <View style={[styles.courseContent, isBulkMode && { marginLeft: 12 }]}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseCodeContainer}>
                      <Text style={styles.courseCode}>{course.code}</Text>
                      <View
                        style={[
                          styles.courseBadge,
                          course.is_mandatory ? styles.mandatoryBadge : styles.electiveBadge,
                        ]}
                      >
                        <Text style={styles.courseBadgeText}>
                          {course.is_mandatory ? 'Zorunlu' : 'Seçmeli'}
                        </Text>
                      </View>
                    </View>
                    {enrolled && (
                      <View style={styles.enrolledBadge}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                        <Text style={styles.enrolledBadgeText}>Alındı</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.courseName}>{course.name}</Text>

                  <View style={styles.courseDetails}>
                    <View style={styles.courseDetailItem}>
                      <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                      <Text style={styles.courseDetailText}>{course.instructor}</Text>
                    </View>
                    <View style={styles.courseDetailItem}>
                      <Ionicons name="school-outline" size={14} color={colors.textTertiary} />
                      <Text style={styles.courseDetailText}>{course.class_year}. Sınıf</Text>
                    </View>
                  </View>

                  <View style={styles.courseFooter}>
                    <View style={styles.courseCredits}>
                      <Text style={styles.creditText}>{course.credits} Kredi</Text>
                      <Text style={styles.ectsText}>{course.ects} AKTS</Text>
                    </View>

                    {!enrolled && !course.is_eligible && (
                      <View style={styles.ineligibleContainer}>
                        <Ionicons name="close-circle" size={16} color={colors.error} />
                        <Text style={styles.ineligibleText} numberOfLines={1}>
                          {course.eligibility_reason}
                        </Text>
                      </View>
                    )}
                  </View>

                  {course.schedules && course.schedules.length > 0 && (
                    <View style={styles.schedulePreview}>
                      {course.schedules.map((schedule, idx) => (
                        <View key={idx} style={styles.scheduleItem}>
                          <Ionicons name="time-outline" size={12} color={colors.primary} />
                          <Text style={styles.scheduleText}>
                            {schedule.day} {schedule.start_time}-{schedule.end_time} | {schedule.classroom}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bulk Action Button */}
      {isBulkMode && selectedCourseIds.size > 0 && (
        <View style={styles.bulkActionContainer}>
          <TouchableOpacity
            style={styles.bulkEnrollButton}
            onPress={handleBulkEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle" size={22} color="#fff" />
                <Text style={styles.bulkEnrollText}>
                  {selectedCourseIds.size} Dersi Programa Ekle
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Course Detail Modal */}
      <Modal
        visible={showCourseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCourseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalCode}>{selectedCourse?.code}</Text>
                <Text style={styles.modalTitle}>{selectedCourse?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Course Info */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Ders Bilgileri</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>Öğretim Üyesi:</Text>
                  <Text style={styles.infoValue}>{selectedCourse?.instructor}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="school" size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>Sınıf:</Text>
                  <Text style={styles.infoValue}>{selectedCourse?.class_year}. Sınıf</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="bookmark" size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>Tür:</Text>
                  <Text style={styles.infoValue}>
                    {selectedCourse?.is_mandatory ? 'Zorunlu' : 'Seçmeli'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="ribbon" size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>Kredi/AKTS:</Text>
                  <Text style={styles.infoValue}>
                    {selectedCourse?.credits} Kredi / {selectedCourse?.ects} AKTS
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="people" size={18} color={colors.primary} />
                  <Text style={styles.infoLabel}>Kontenjan:</Text>
                  <Text style={styles.infoValue}>
                    {selectedCourse?.enrolled_count || 0} / {selectedCourse?.quota}
                  </Text>
                </View>
              </View>

              {/* Schedule */}
              {selectedCourse?.schedules && selectedCourse.schedules.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Ders Programı</Text>
                  {selectedCourse.schedules.map((schedule, idx) => (
                    <View key={idx} style={styles.scheduleCard}>
                      <View style={styles.scheduleDay}>
                        <Text style={styles.scheduleDayText}>{schedule.day}</Text>
                      </View>
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.scheduleTimeText}>
                          {schedule.start_time} - {schedule.end_time}
                        </Text>
                        <Text style={styles.scheduleLocation}>
                          {schedule.classroom} | {schedule.faculty}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Exams */}
              {selectedCourse?.exams && selectedCourse.exams.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Sınav Takvimi</Text>
                  {selectedCourse.exams.map((exam, idx) => (
                    <View key={idx} style={styles.examCard}>
                      <View
                        style={[
                          styles.examTypeBadge,
                          exam.exam_type === 'midterm'
                            ? styles.midtermBadge
                            : exam.exam_type === 'final'
                            ? styles.finalBadge
                            : styles.makeupBadge,
                        ]}
                      >
                        <Text style={styles.examTypeText}>
                          {exam.exam_type === 'midterm'
                            ? 'Vize'
                            : exam.exam_type === 'final'
                            ? 'Final'
                            : 'Bütünleme'}
                        </Text>
                      </View>
                      <View style={styles.examInfo}>
                        <Text style={styles.examDate}>
                          {new Date(exam.exam_date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.examTime}>
                          {exam.start_time} - {exam.end_time}
                        </Text>
                        <Text style={styles.examLocation}>
                          {exam.classroom} | {exam.faculty}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Eligibility Status */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Kayıt Durumu</Text>
                <View
                  style={[
                    styles.eligibilityCard,
                    selectedCourse?.is_eligible || isEnrolled(selectedCourse?.id || 0)
                      ? styles.eligibleCard
                      : styles.ineligibleCard,
                  ]}
                >
                  <Ionicons
                    name={
                      isEnrolled(selectedCourse?.id || 0)
                        ? 'checkmark-circle'
                        : selectedCourse?.is_eligible
                        ? 'checkmark-circle-outline'
                        : 'close-circle'
                    }
                    size={24}
                    color={
                      selectedCourse?.is_eligible || isEnrolled(selectedCourse?.id || 0)
                        ? colors.success
                        : colors.error
                    }
                  />
                  <Text
                    style={[
                      styles.eligibilityText,
                      selectedCourse?.is_eligible || isEnrolled(selectedCourse?.id || 0)
                        ? styles.eligibleText
                        : styles.ineligibleTextModal,
                    ]}
                  >
                    {isEnrolled(selectedCourse?.id || 0)
                      ? 'Bu ders programınızda'
                      : selectedCourse?.eligibility_reason}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Button */}
            <View style={styles.modalFooter}>
              {isEnrolled(selectedCourse?.id || 0) ? (
                <TouchableOpacity
                  style={styles.unenrollButton}
                  onPress={handleUnenrollCourse}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Dersi Kaldır</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : selectedCourse?.is_eligible ? (
                <TouchableOpacity
                  style={styles.enrollButton}
                  onPress={handleEnrollCourse}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Programa Ekle</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.disabledButton}>
                  <Ionicons name="lock-closed" size={20} color={colors.textTertiary} />
                  <Text style={styles.disabledButtonText}>Eklenemez</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  bulkButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  bulkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  bulkInfoText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  bulkClearText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.background,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.card,
    marginRight: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary + '40',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  filterTextActive: {
    color: colors.primary,
  },
  courseList: {
    flex: 1,
  },
  courseListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  listCount: {
    color: colors.textTertiary,
    fontWeight: '400',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    marginTop: 12,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  courseCardDisabled: {
    opacity: 0.6,
  },
  courseCardEnrolled: {
    borderColor: colors.success + '40',
    backgroundColor: colors.success + '08',
  },
  courseCardSelected: {
    borderColor: colors.primary + '60',
    backgroundColor: colors.primary + '10',
  },
  checkboxContainer: {
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  checkboxDisabled: {
    borderColor: colors.textTertiary,
    opacity: 0.5,
  },
  courseContent: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  courseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mandatoryBadge: {
    backgroundColor: colors.error + '20',
  },
  electiveBadge: {
    backgroundColor: colors.success + '20',
  },
  courseBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  enrolledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  courseDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  courseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseDetailText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCredits: {
    flexDirection: 'row',
    gap: 12,
  },
  creditText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  ectsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ineligibleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  ineligibleText: {
    fontSize: 11,
    color: colors.error,
    maxWidth: 150,
  },
  schedulePreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bulkActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  bulkEnrollButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bulkEnrollText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 280,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    width: 100,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scheduleDay: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  scheduleDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  scheduleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  scheduleTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  examCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  examTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  midtermBadge: {
    backgroundColor: '#F59E0B',
  },
  finalBadge: {
    backgroundColor: '#EF4444',
  },
  makeupBadge: {
    backgroundColor: '#8B5CF6',
  },
  examTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  examInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  examDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  examTime: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  examLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eligibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  eligibleCard: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  ineligibleCard: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  eligibilityText: {
    fontSize: 14,
    flex: 1,
  },
  eligibleText: {
    color: colors.success,
  },
  ineligibleTextModal: {
    color: colors.error,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  enrollButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  unenrollButton: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textTertiary,
  },
});
