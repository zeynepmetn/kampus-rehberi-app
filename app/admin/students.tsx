import {
  createStudent,
  deleteStudent,
  Department,
  getAllStudents,
  getDepartments,
  Student,
  updateStudent,
} from '@/database/database';
import { useTheme } from '@/context/ThemeContext';
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

export default function StudentsManagement() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    student_number: '',
    first_name: '',
    last_name: '',
    password: '',
    department_id: '',
    class_year: '1',
    gno: '0',
    yno: '0',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, departmentsData] = await Promise.all([
        getAllStudents(),
        getDepartments(),
      ]);
      setStudents(studentsData);
      setDepartments(departmentsData);
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

  const resetForm = () => {
    setFormData({
      student_number: '',
      first_name: '',
      last_name: '',
      password: '',
      department_id: '',
      class_year: '1',
      gno: '0',
      yno: '0',
    });
    setEditingStudent(null);
  };

  const openModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        student_number: student.student_number,
        first_name: student.first_name,
        last_name: student.last_name,
        password: '',
        department_id: student.department_id.toString(),
        class_year: student.class_year.toString(),
        gno: (student.gno || 0).toString(),
        yno: (student.yno || 0).toString(),
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (
      !formData.student_number.trim() ||
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.department_id
    ) {
      Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id!, {
          student_number: formData.student_number.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          password: formData.password.trim() || undefined,
          department_id: parseInt(formData.department_id),
          class_year: parseInt(formData.class_year),
          gno: parseFloat(formData.gno) || 0,
          yno: parseFloat(formData.yno) || 0,
        });
        Alert.alert('Başarılı', 'Öğrenci güncellendi');
      } else {
        await createStudent({
          student_number: formData.student_number.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          password: formData.password.trim() || undefined,
          department_id: parseInt(formData.department_id),
          class_year: parseInt(formData.class_year),
          gno: parseFloat(formData.gno) || 0,
          yno: parseFloat(formData.yno) || 0,
        });
        Alert.alert('Başarılı', 'Öğrenci eklendi');
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('Hata', 'Öğrenci kaydedilemedi');
    }
  };

  const handleDelete = async (student: Student) => {
    Alert.alert(
      'Öğrenciyi Sil',
      `"${student.first_name} ${student.last_name}" öğrencisini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id!);
              Alert.alert('Başarılı', 'Öğrenci silindi');
              loadData();
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Hata', 'Öğrenci silinemedi');
            }
          },
        },
      ]
    );
  };

  const selectedDepartment = departments.find(
    (d) => d.id?.toString() === formData.department_id
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.headerTitle}>Öğrenci Yönetimi</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Student List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Öğrenci bulunmuyor</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Öğrenci Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          students.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {student.first_name} {student.last_name}
                  </Text>
                  <Text style={styles.studentNumber}>{student.student_number}</Text>
                </View>
                <View style={styles.studentBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{student.class_year}. Sınıf</Text>
                  </View>
                  <View style={[styles.badge, styles.gpaBadge]}>
                    <Text style={styles.badgeText}>GNO: {student.gno?.toFixed(2) || '0.00'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.studentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={16} color={colors.textTertiary} />
                  <Text style={styles.detailText}>{student.department_name}</Text>
                </View>
                {student.email && (
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.textTertiary} />
                    <Text style={styles.detailText}>{student.email}</Text>
                  </View>
                )}
              </View>

              <View style={styles.studentActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openModal(student)}
                >
                  <Ionicons name="create-outline" size={18} color="#667eea" />
                  <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(student)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Student Form Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Ad *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.first_name}
                    onChangeText={(v) => setFormData({ ...formData, first_name: v })}
                    placeholder="Ahmet"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Soyad *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.last_name}
                    onChangeText={(v) => setFormData({ ...formData, last_name: v })}
                    placeholder="Yılmaz"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Öğrenci Numarası *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.student_number}
                  onChangeText={(v) => setFormData({ ...formData, student_number: v })}
                  placeholder="2021123456"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  editable={!editingStudent}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {editingStudent ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre'}
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.password}
                  onChangeText={(v) => setFormData({ ...formData, password: v })}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bölüm *</Text>
                <TouchableOpacity
                  style={styles.formInputButton}
                  onPress={() => setShowDepartmentPicker(!showDepartmentPicker)}
                >
                  <Text style={[styles.formInputText, !selectedDepartment && styles.placeholder]}>
                    {selectedDepartment?.name || 'Bölüm Seçin'}
                  </Text>
                  <Ionicons name={showDepartmentPicker ? "chevron-up" : "chevron-down"} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
                
                {/* Inline Department Picker */}
                {showDepartmentPicker && (
                  <View style={styles.inlinePicker}>
                    <ScrollView style={styles.inlinePickerScroll} nestedScrollEnabled>
                      {departments.map((dept) => (
                        <TouchableOpacity
                          key={dept.id}
                          style={[
                            styles.inlinePickerItem,
                            formData.department_id === dept.id?.toString() && styles.inlinePickerItemActive,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, department_id: dept.id!.toString() });
                            setShowDepartmentPicker(false);
                          }}
                        >
                          <Text style={[
                            styles.inlinePickerText,
                            formData.department_id === dept.id?.toString() && styles.inlinePickerTextActive,
                          ]}>
                            {dept.name}
                          </Text>
                          {formData.department_id === dept.id?.toString() && (
                            <Ionicons name="checkmark" size={20} color="#667eea" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
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
                          formData.class_year === y && styles.selectButtonActive,
                        ]}
                        onPress={() => setFormData({ ...formData, class_year: y })}
                      >
                        <Text
                          style={[
                            styles.selectButtonText,
                            formData.class_year === y && styles.selectButtonTextActive,
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>GNO</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.gno}
                    onChangeText={(v) => setFormData({ ...formData, gno: v })}
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>YNO</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.yno}
                    onChangeText={(v) => setFormData({ ...formData, yno: v })}
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingStudent ? 'Güncelle' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: colors.textTertiary,
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
  studentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  studentHeader: {
    marginBottom: 12,
  },
  studentInfo: {
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  studentNumber: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  studentBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpaBadge: {
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  studentDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  studentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
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
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  formInputButton: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formInputText: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  inlinePicker: {
    marginTop: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  inlinePickerScroll: {
    maxHeight: 200,
  },
  inlinePickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  inlinePickerItemActive: {
    backgroundColor: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
  },
  inlinePickerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  inlinePickerTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  },
  selectButtonActive: {
    backgroundColor: '#667eea',
  },
  selectButtonText: {
    color: colors.textTertiary,
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
});
