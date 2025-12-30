import {
    createDepartment,
    Department,
    getCoursesByDepartment,
    getDepartments
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

export default function DepartmentsManagement() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    faculty: '',
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDepartments();
    setIsRefreshing(false);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim() || !formData.faculty.trim()) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    try {
      await createDepartment({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        faculty: formData.faculty.trim(),
      });

      setShowModal(false);
      setFormData({ code: '', name: '', faculty: '' });
      loadDepartments();
      Alert.alert('Başarılı', 'Bölüm eklendi');
    } catch (error) {
      console.error('Error creating department:', error);
      Alert.alert('Hata', 'Bölüm eklenemedi. Kod zaten kullanılıyor olabilir.');
    }
  };

  const handleDelete = async (dept: Department) => {
    // Check if department has courses
    const courses = await getCoursesByDepartment(dept.id!);
    
    if (courses.length > 0) {
      Alert.alert(
        'Uyarı',
        `Bu bölümde ${courses.length} ders bulunuyor. Silmek için önce dersleri silmelisiniz.`,
        [{ text: 'Tamam' }]
      );
      return;
    }

    Alert.alert(
      'Bölümü Sil',
      `"${dept.name}" bölümünü silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: Add deleteDepartment function if needed
              Alert.alert('Bilgi', 'Bölüm silme işlemi şu an aktif değil');
            } catch (error) {
              console.error('Error deleting department:', error);
            }
          },
        },
      ]
    );
  };

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
          <Text style={styles.headerTitle}>Bölüm Yönetimi</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Department List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {departments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Bölüm bulunmuyor</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowModal(true)}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Bölüm Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          departments.map((dept) => (
            <View key={dept.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{dept.code}</Text>
                </View>
              </View>
              <Text style={styles.name}>{dept.name}</Text>
              <Text style={styles.faculty}>{dept.faculty}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/admin/courses')}
                >
                  <Ionicons name="book-outline" size={18} color="#667eea" />
                  <Text style={[styles.actionText, { color: '#667eea' }]}>Dersler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(dept)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Bölüm</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bölüm Kodu *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.code}
                  onChangeText={(v) => setFormData({ ...formData, code: v })}
                  placeholder="BM"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bölüm Adı *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(v) => setFormData({ ...formData, name: v })}
                  placeholder="Bilgisayar Mühendisliği"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fakülte *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.faculty}
                  onChangeText={(v) => setFormData({ ...formData, faculty: v })}
                  placeholder="Mühendislik Fakültesi"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: 13,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  faculty: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  cardActions: {
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
  saveButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
