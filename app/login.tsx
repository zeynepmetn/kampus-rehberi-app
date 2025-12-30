import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { useTheme } from '@/context/ThemeContext';
import { Department, getDepartments } from '@/database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const { isReady } = useDatabase();
  const { login, register, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);

  // Login fields
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [classYear, setClassYear] = useState('1');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = createStyles(colors, isDark);

  useEffect(() => {
    if (isReady) {
      loadDepartments();
    }
  }, [isReady]);

  const loadDepartments = async () => {
    try {
      const deps = await getDepartments();
      setDepartments(deps);
      if (deps.length > 0) {
        setSelectedDepartment(deps[0]);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};

    if (!studentNumber.trim()) {
      newErrors.studentNumber = 'Öğrenci numarası gerekli';
    }
    if (!password.trim()) {
      newErrors.password = 'Şifre gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Ad gerekli';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Soyad gerekli';
    }
    if (!studentNumber.trim()) {
      newErrors.studentNumber = 'Öğrenci numarası gerekli';
    } else if (!/^\d{9,11}$/.test(studentNumber.trim())) {
      newErrors.studentNumber = 'Geçerli bir öğrenci numarası girin';
    }
    if (!email.trim()) {
      newErrors.email = 'E-posta gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta girin';
    }
    if (!password.trim()) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 4) {
      newErrors.password = 'Şifre en az 4 karakter olmalı';
    }
    if (!selectedDepartment) {
      newErrors.department = 'Bölüm seçimi gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    const result = await login(studentNumber.trim(), password);

    if (result.success) {
      // Admin girişi ise admin paneline yönlendir
      if (result.isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert('Hata', result.error || 'Giriş yapılamadı');
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;

    const result = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      studentNumber: studentNumber.trim(),
      email: email.trim(),
      password: password,
      departmentId: selectedDepartment!.id!,
      classYear: parseInt(classYear),
    });

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Hata', result.error || 'Kayıt yapılamadı');
    }
  };

  const clearFields = () => {
    setStudentNumber('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setErrors({});
  };

  const switchMode = (newMode: AuthMode) => {
    clearFields();
    setMode(newMode);
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  // Login sayfası için gradient renkleri
  const loginGradient: [string, string, string] = isDark 
    ? ['#1a1a2e', '#16213e', '#0f3460'] 
    : ['#667eea', '#764ba2', '#667eea'];

  return (
    <LinearGradient
      colors={loginGradient}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={60} color="#fff" />
            </View>
            <Text style={styles.title}>Kampüs</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Öğrenci Girişi' : 'Yeni Kayıt'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {mode === 'login' && (
              <>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="card-outline" size={22} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.input, errors.studentNumber && styles.inputError]}
                    placeholder="Öğrenci Numarası"
                    placeholderTextColor={colors.placeholder}
                    value={studentNumber}
                    onChangeText={setStudentNumber}
                    keyboardType="numeric"
                    maxLength={11}
                  />
                </View>
                {errors.studentNumber && <Text style={styles.errorText}>{errors.studentNumber}</Text>}

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Şifre"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Giriş Yap</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {mode === 'register' && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                    <TextInput
                      style={[styles.input, styles.inputSmall, errors.firstName && styles.inputError]}
                      placeholder="Ad"
                      placeholderTextColor={colors.placeholder}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={[styles.input, styles.inputSmall, errors.lastName && styles.inputError]}
                      placeholder="Soyad"
                      placeholderTextColor={colors.placeholder}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
                {(errors.firstName || errors.lastName) && (
                  <Text style={styles.errorText}>{errors.firstName || errors.lastName}</Text>
                )}

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="card-outline" size={22} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.input, errors.studentNumber && styles.inputError]}
                    placeholder="Öğrenci Numarası"
                    placeholderTextColor={colors.placeholder}
                    value={studentNumber}
                    onChangeText={setStudentNumber}
                    keyboardType="numeric"
                    maxLength={11}
                  />
                </View>
                {errors.studentNumber && <Text style={styles.errorText}>{errors.studentNumber}</Text>}

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail-outline" size={22} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="E-posta"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Şifre"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TouchableOpacity
                  style={[styles.inputWrapper, styles.pickerButton]}
                  onPress={() => setShowDepartmentPicker(true)}
                >
                  <View style={styles.inputIcon}>
                    <Ionicons name="school-outline" size={22} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.input, styles.pickerText]}>
                    {selectedDepartment?.name || 'Bölüm Seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}

                <View style={styles.row}>
                  <Text style={styles.yearLabel}>Sınıf:</Text>
                  {['1', '2', '3', '4'].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearButton,
                        classYear === year && styles.yearButtonActive,
                      ]}
                      onPress={() => setClassYear(year)}
                    >
                      <Text
                        style={[
                          styles.yearButtonText,
                          classYear === year && styles.yearButtonTextActive,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Kayıt Ol</Text>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Mode Switchers */}
            <View style={styles.modeSwitcher}>
              {mode !== 'login' && (
                <TouchableOpacity onPress={() => switchMode('login')}>
                  <Text style={styles.switchText}>Giriş Yap</Text>
                </TouchableOpacity>
              )}
              {mode !== 'register' && (
                <TouchableOpacity onPress={() => switchMode('register')}>
                  <Text style={styles.switchText}>Kayıt Ol</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Üniversite Kampüs Uygulaması</Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
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
                  <View>
                    <Text style={styles.modalItemText}>{dept.name}</Text>
                    <Text style={styles.modalItemSubtext}>{dept.faculty}</Text>
                  </View>
                  {selectedDepartment?.id === dept.id && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.1,
    shadowRadius: 12,
    elevation: isDark ? 0 : 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  inputIcon: {
    paddingLeft: 14,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    fontSize: 15,
    color: colors.inputText,
  },
  inputSmall: {
    paddingLeft: 14,
  },
  inputError: {
    borderColor: colors.error,
  },
  pickerButton: {
    paddingRight: 14,
  },
  pickerText: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  yearLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginRight: 12,
  },
  yearButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  yearButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearButtonText: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: '600',
  },
  yearButtonTextActive: {
    color: '#fff',
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modeSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  switchText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 4,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalItemActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '40',
  },
  modalItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  modalItemSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
