import {
    Course,
    CourseSchedule,
    Department,
    Exam,
    createCourse,
    createCourseSchedule,
    createExam,
    deleteCourse,
    deleteCourseSchedule,
    deleteExam,
    getCourseSchedules,
    getCoursesByDepartment,
    getDepartments,
    getExamsByCourse,
    updateCourse,
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const examTypes = [
  { value: 'midterm', label: 'Vize' },
  { value: 'final', label: 'Final' },
  { value: 'makeup', label: 'Bütünleme' },
];

export default function CoursesManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    classYear: '1',
    semester: '1',
    credits: '3',
    ects: '5',
    isMandatory: true,
    instructor: '',
    description: '',
    quota: '40',
  });

  // Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    day: 'Pazartesi',
    startTime: '09:00',
    endTime: '11:00',
    classroom: '',
    faculty: '',
  });

  // Exam Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examForm, setExamForm] = useState({
    examType: 'midterm',
    examDate: '',
    startTime: '10:00',
    endTime: '12:00',
    classroom: '',
    faculty: '',
  });

  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadCourses();
    }
  }, [selectedDepartment]);

  const loadDepartments = async () => {
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

  const loadCourses = async () => {
    if (!selectedDepartment) return;
    try {
      const data = await getCoursesByDepartment(selectedDepartment.id!);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCourses();
    setIsRefreshing(false);
  };

  const resetCourseForm = () => {
    setCourseForm({
      code: '',
      name: '',
      classYear: '1',
      semester: '1',
      credits: '3',
      ects: '5',
      isMandatory: true,
      instructor: '',
      description: '',
      quota: '40',
    });
    setEditingCourse(null);
  };

  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        code: course.code,
        name: course.name,
        classYear: course.class_year.toString(),
        semester: course.semester.toString(),
        credits: course.credits.toString(),
        ects: course.ects.toString(),
        isMandatory: course.is_mandatory === 1,
        instructor: course.instructor || '',
        description: course.description || '',
        quota: (course.quota || 40).toString(),
      });
    } else {
      resetCourseForm();
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.code.trim() || !courseForm.name.trim()) {
      Alert.alert('Hata', 'Ders kodu ve adı gereklidir');
      return;
    }

    if (!selectedDepartment) {
      Alert.alert('Hata', 'Lütfen bir bölüm seçin');
      return;
    }

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id!, {
          code: courseForm.code.trim(),
          name: courseForm.name.trim(),
          class_year: parseInt(courseForm.classYear),
          semester: parseInt(courseForm.semester),
          credits: parseInt(courseForm.credits),
          ects: parseInt(courseForm.ects),
          is_mandatory: courseForm.isMandatory ? 1 : 0,
          instructor: courseForm.instructor.trim() || undefined,
          description: courseForm.description.trim() || undefined,
          quota: parseInt(courseForm.quota),
        });
        Alert.alert('Başarılı', 'Ders güncellendi');
      } else {
        await createCourse({
          code: courseForm.code.trim(),
          name: courseForm.name.trim(),
          department_id: selectedDepartment.id!,
          class_year: parseInt(courseForm.classYear),
          semester: parseInt(courseForm.semester),
          credits: parseInt(courseForm.credits),
          ects: parseInt(courseForm.ects),
          is_mandatory: courseForm.isMandatory ? 1 : 0,
          instructor: courseForm.instructor.trim() || undefined,
          description: courseForm.description.trim() || undefined,
          quota: parseInt(courseForm.quota),
        });
        Alert.alert('Başarılı', 'Ders eklendi');
      }

      setShowCourseModal(false);
      resetCourseForm();
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      Alert.alert('Hata', 'Ders kaydedilemedi');
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    Alert.alert(
      'Dersi Sil',
      `"${course.name}" dersini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourse(course.id!);
              Alert.alert('Başarılı', 'Ders silindi');
              loadCourses();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Hata', 'Ders silinemedi');
            }
          },
        },
      ]
    );
  };

  // Schedule Functions
  const openScheduleModal = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const data = await getCourseSchedules(course.id!);
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
    setShowScheduleModal(true);
  };

  const handleAddSchedule = async () => {
    if (!selectedCourse || !scheduleForm.classroom.trim() || !scheduleForm.faculty.trim()) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    try {
      await createCourseSchedule({
        course_id: selectedCourse.id!,
        day: scheduleForm.day,
        start_time: scheduleForm.startTime,
        end_time: scheduleForm.endTime,
        classroom: scheduleForm.classroom.trim(),
        faculty: scheduleForm.faculty.trim(),
      });

      const data = await getCourseSchedules(selectedCourse.id!);
      setSchedules(data);

      setScheduleForm({
        day: 'Pazartesi',
        startTime: '09:00',
        endTime: '11:00',
        classroom: '',
        faculty: '',
      });

      Alert.alert('Başarılı', 'Program eklendi');
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('Hata', 'Program eklenemedi');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await deleteCourseSchedule(id);
      const data = await getCourseSchedules(selectedCourse!.id!);
      setSchedules(data);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  // Exam Functions
  const openExamModal = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const data = await getExamsByCourse(course.id!);
      setExams(data);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
    setShowExamModal(true);
  };

  const handleAddExam = async () => {
    if (!selectedCourse || !examForm.examDate || !examForm.classroom.trim() || !examForm.faculty.trim()) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    try {
      await createExam({
        course_id: selectedCourse.id!,
        exam_type: examForm.examType,
        exam_date: examForm.examDate,
        start_time: examForm.startTime,
        end_time: examForm.endTime,
        classroom: examForm.classroom.trim(),
        faculty: examForm.faculty.trim(),
      });

      const data = await getExamsByCourse(selectedCourse.id!);
      setExams(data);

      setExamForm({
        examType: 'midterm',
        examDate: '',
        startTime: '10:00',
        endTime: '12:00',
        classroom: '',
        faculty: '',
      });

      Alert.alert('Başarılı', 'Sınav eklendi');
    } catch (error) {
      console.error('Error adding exam:', error);
      Alert.alert('Hata', 'Sınav eklenemedi');
    }
  };

  const handleDeleteExam = async (id: number) => {
    try {
      await deleteExam(id);
      const data = await getExamsByCourse(selectedCourse!.id!);
      setExams(data);
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
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
          <Text style={styles.headerTitle}>Ders Yönetimi</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openCourseModal()}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Department Selector */}
        <TouchableOpacity
          style={styles.departmentSelector}
          onPress={() => setShowDepartmentPicker(true)}
        >
          <Ionicons name="business" size={20} color="#667eea" />
          <Text style={styles.departmentText}>
            {selectedDepartment?.name || 'Bölüm Seçin'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#667eea" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Course List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#667eea" />
        }
      >
        {courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>Bu bölümde ders bulunmuyor</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => openCourseModal()}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Ders Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          courses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseCodeBadge}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    course.is_mandatory ? styles.mandatoryBadge : styles.electiveBadge,
                  ]}
                >
                  <Text style={styles.typeBadgeText}>
                    {course.is_mandatory ? 'Zorunlu' : 'Seçmeli'}
                  </Text>
                </View>
              </View>

              <Text style={styles.courseName}>{course.name}</Text>

              <View style={styles.courseInfo}>
                <Text style={styles.courseInfoText}>
                  {course.class_year}. Sınıf • {course.semester}. Dönem • {course.credits} Kredi
                </Text>
                {course.instructor && (
                  <Text style={styles.instructorText}>{course.instructor}</Text>
                )}
              </View>

              <View style={styles.courseActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openScheduleModal(course)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#4ECDC4" />
                  <Text style={[styles.actionText, { color: '#4ECDC4' }]}>Program</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openExamModal(course)}
                >
                  <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
                  <Text style={[styles.actionText, { color: '#F59E0B' }]}>Sınav</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openCourseModal(course)}
                >
                  <Ionicons name="create-outline" size={18} color="#667eea" />
                  <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteCourse(course)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Department Picker Modal */}
      <Modal
        visible={showDepartmentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepartmentPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bölüm Seçin</Text>
              <TouchableOpacity onPress={() => setShowDepartmentPicker(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.modalItem,
                    selectedDepartment?.id === dept.id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDepartment(dept);
                    setShowDepartmentPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{dept.name}</Text>
                  {selectedDepartment?.id === dept.id && (
                    <Ionicons name="checkmark" size={24} color="#667eea" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Course Form Modal */}
      <Modal
        visible={showCourseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCourse ? 'Ders Düzenle' : 'Yeni Ders'}
              </Text>
              <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Ders Kodu *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={courseForm.code}
                    onChangeText={(v) => setCourseForm({ ...courseForm, code: v })}
                    placeholder="BM101"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Kontenjan</Text>
                  <TextInput
                    style={styles.formInput}
                    value={courseForm.quota}
                    onChangeText={(v) => setCourseForm({ ...courseForm, quota: v })}
                    keyboardType="numeric"
                    placeholder="40"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ders Adı *</Text>
                <TextInput
                  style={styles.formInput}
                  value={courseForm.name}
                  onChangeText={(v) => setCourseForm({ ...courseForm, name: v })}
                  placeholder="Programlamaya Giriş"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Öğretim Üyesi</Text>
                <TextInput
                  style={styles.formInput}
                  value={courseForm.instructor}
                  onChangeText={(v) => setCourseForm({ ...courseForm, instructor: v })}
                  placeholder="Prof. Dr. Ali Yılmaz"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Sınıf</Text>
                  <View style={styles.buttonGroup}>
                    {['1', '2', '3', '4'].map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[
                          styles.selectButton,
                          courseForm.classYear === y && styles.selectButtonActive,
                        ]}
                        onPress={() => setCourseForm({ ...courseForm, classYear: y })}
                      >
                        <Text
                          style={[
                            styles.selectButtonText,
                            courseForm.classYear === y && styles.selectButtonTextActive,
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Dönem</Text>
                  <View style={styles.buttonGroup}>
                    {['1', '2'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.selectButton,
                          courseForm.semester === s && styles.selectButtonActive,
                        ]}
                        onPress={() => setCourseForm({ ...courseForm, semester: s })}
                      >
                        <Text
                          style={[
                            styles.selectButtonText,
                            courseForm.semester === s && styles.selectButtonTextActive,
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Kredi</Text>
                  <TextInput
                    style={styles.formInput}
                    value={courseForm.credits}
                    onChangeText={(v) => setCourseForm({ ...courseForm, credits: v })}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>AKTS</Text>
                  <TextInput
                    style={styles.formInput}
                    value={courseForm.ects}
                    onChangeText={(v) => setCourseForm({ ...courseForm, ects: v })}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ders Türü</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      { flex: 1 },
                      courseForm.isMandatory && styles.selectButtonActive,
                    ]}
                    onPress={() => setCourseForm({ ...courseForm, isMandatory: true })}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        courseForm.isMandatory && styles.selectButtonTextActive,
                      ]}
                    >
                      Zorunlu
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      { flex: 1 },
                      !courseForm.isMandatory && styles.selectButtonActive,
                    ]}
                    onPress={() => setCourseForm({ ...courseForm, isMandatory: false })}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        !courseForm.isMandatory && styles.selectButtonTextActive,
                      ]}
                    >
                      Seçmeli
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Açıklama</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  value={courseForm.description}
                  onChangeText={(v) => setCourseForm({ ...courseForm, description: v })}
                  placeholder="Ders açıklaması..."
                  placeholderTextColor="#64748b"
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCourse}>
                <Text style={styles.saveButtonText}>
                  {editingCourse ? 'Güncelle' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ders Programı</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.subTitle}>{selectedCourse?.name}</Text>

              {/* Existing Schedules */}
              {schedules.length > 0 && (
                <View style={styles.existingList}>
                  {schedules.map((sch) => (
                    <View key={sch.id} style={styles.existingItem}>
                      <View>
                        <Text style={styles.existingItemTitle}>
                          {sch.day} {sch.start_time}-{sch.end_time}
                        </Text>
                        <Text style={styles.existingItemSubtitle}>
                          {sch.classroom} • {sch.faculty}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteSchedule(sch.id!)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.formSectionTitle}>Yeni Program Ekle</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gün</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.buttonGroup}>
                    {days.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.selectButton,
                          scheduleForm.day === d && styles.selectButtonActive,
                        ]}
                        onPress={() => setScheduleForm({ ...scheduleForm, day: d })}
                      >
                        <Text
                          style={[
                            styles.selectButtonText,
                            scheduleForm.day === d && styles.selectButtonTextActive,
                          ]}
                        >
                          {d.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Başlangıç</Text>
                  <TextInput
                    style={styles.formInput}
                    value={scheduleForm.startTime}
                    onChangeText={(v) => setScheduleForm({ ...scheduleForm, startTime: v })}
                    placeholder="09:00"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Bitiş</Text>
                  <TextInput
                    style={styles.formInput}
                    value={scheduleForm.endTime}
                    onChangeText={(v) => setScheduleForm({ ...scheduleForm, endTime: v })}
                    placeholder="11:00"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sınıf *</Text>
                <TextInput
                  style={styles.formInput}
                  value={scheduleForm.classroom}
                  onChangeText={(v) => setScheduleForm({ ...scheduleForm, classroom: v })}
                  placeholder="A-301"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fakülte/Bina *</Text>
                <TextInput
                  style={styles.formInput}
                  value={scheduleForm.faculty}
                  onChangeText={(v) => setScheduleForm({ ...scheduleForm, faculty: v })}
                  placeholder="Mühendislik Fakültesi"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleAddSchedule}>
                <Text style={styles.saveButtonText}>Program Ekle</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Exam Modal */}
      <Modal
        visible={showExamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sınav Takvimi</Text>
              <TouchableOpacity onPress={() => setShowExamModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.subTitle}>{selectedCourse?.name}</Text>

              {/* Existing Exams */}
              {exams.length > 0 && (
                <View style={styles.existingList}>
                  {exams.map((exam) => (
                    <View key={exam.id} style={styles.existingItem}>
                      <View>
                        <Text style={styles.existingItemTitle}>
                          {examTypes.find((t) => t.value === exam.exam_type)?.label} -{' '}
                          {exam.exam_date}
                        </Text>
                        <Text style={styles.existingItemSubtitle}>
                          {exam.start_time}-{exam.end_time} • {exam.classroom}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteExam(exam.id!)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.formSectionTitle}>Yeni Sınav Ekle</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sınav Türü</Text>
                <View style={styles.buttonGroup}>
                  {examTypes.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.selectButton,
                        { flex: 1 },
                        examForm.examType === t.value && styles.selectButtonActive,
                      ]}
                      onPress={() => setExamForm({ ...examForm, examType: t.value })}
                    >
                      <Text
                        style={[
                          styles.selectButtonText,
                          examForm.examType === t.value && styles.selectButtonTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sınav Tarihi * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  value={examForm.examDate}
                  onChangeText={(v) => setExamForm({ ...examForm, examDate: v })}
                  placeholder="2025-01-15"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Başlangıç</Text>
                  <TextInput
                    style={styles.formInput}
                    value={examForm.startTime}
                    onChangeText={(v) => setExamForm({ ...examForm, startTime: v })}
                    placeholder="10:00"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Bitiş</Text>
                  <TextInput
                    style={styles.formInput}
                    value={examForm.endTime}
                    onChangeText={(v) => setExamForm({ ...examForm, endTime: v })}
                    placeholder="12:00"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sınıf *</Text>
                <TextInput
                  style={styles.formInput}
                  value={examForm.classroom}
                  onChangeText={(v) => setExamForm({ ...examForm, classroom: v })}
                  placeholder="S-101"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fakülte/Bina *</Text>
                <TextInput
                  style={styles.formInput}
                  value={examForm.faculty}
                  onChangeText={(v) => setExamForm({ ...examForm, faculty: v })}
                  placeholder="Mühendislik Fakültesi"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleAddExam}>
                <Text style={styles.saveButtonText}>Sınav Ekle</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  departmentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  departmentText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCodeBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseCode: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: 13,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mandatoryBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  electiveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  courseInfo: {
    marginBottom: 12,
  },
  courseInfoText: {
    fontSize: 13,
    color: '#64748b',
  },
  instructorText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  courseActions: {
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
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  modalItemActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },
  modalItemText: {
    color: '#fff',
    fontSize: 15,
  },
  formContainer: {
    padding: 20,
  },
  subTitle: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectButtonActive: {
    backgroundColor: '#667eea',
  },
  selectButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  existingList: {
    marginBottom: 16,
  },
  existingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  existingItemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  existingItemSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
});

