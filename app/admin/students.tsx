import {
  createStudent,
  deleteStudent,
  Department,
  getAllStudents,
  getDepartments,
  Student,
  updateStudent,
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

export default function StudentsManagement() {
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#667eea" />
        }
      >
        {students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#64748b" />
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
                  <Ionicons name="business-outline" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{student.department_name}</Text>
                </View>
                {student.email && (
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={16} color="#64748b" />
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
                    formData.department_id === dept.id?.toString() && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, department_id: dept.id!.toString() });
                    setShowDepartmentPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{dept.name}</Text>
                  {formData.department_id === dept.id?.toString() && (
                    <Ionicons name="checkmark" size={24} color="#667eea" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                <Ionicons name="close" size={24} color="#fff" />
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
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Soyad *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.last_name}
                    onChangeText={(v) => setFormData({ ...formData, last_name: v })}
                    placeholder="Yılmaz"
                    placeholderTextColor="#64748b"
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
                  placeholderTextColor="#64748b"
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
                  placeholderTextColor="#64748b"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bölüm *</Text>
                <TouchableOpacity
                  style={styles.formInput}
                  onPress={() => setShowDepartmentPicker(true)}
                >
                  <Text style={[styles.formInputText, !selectedDepartment && styles.placeholder]}>
                    {selectedDepartment?.name || 'Bölüm Seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>
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
                    placeholderTextColor="#64748b"
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
                    placeholderTextColor="#64748b"
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
  studentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#fff',
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
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpaBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
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
    color: '#64748b',
  },
  studentActions: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formInputText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  placeholder: {
    color: '#64748b',
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
});

