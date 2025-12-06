import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [errors, setErrors] = useState<{ name?: string; studentNumber?: string }>({});
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: { name?: string; studentNumber?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Ad Soyad gerekli';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Ad Soyad en az 3 karakter olmalı';
    }
    
    if (!studentNumber.trim()) {
      newErrors.studentNumber = 'Öğrenci numarası gerekli';
    } else if (!/^\d{9,11}$/.test(studentNumber.trim())) {
      newErrors.studentNumber = 'Geçerli bir öğrenci numarası girin (9-11 haneli)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (validateForm()) {
      login(name.trim(), studentNumber.trim());
      router.replace('/department-selection');
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
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
            <Text style={styles.subtitle}>Öğrenci Portalı</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Ionicons name="person-outline" size={22} color="#94a3b8" />
              </View>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Ad Soyad"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Ionicons name="card-outline" size={22} color="#94a3b8" />
              </View>
              <TextInput
                style={[styles.input, errors.studentNumber && styles.inputError]}
                placeholder="Öğrenci Numarası"
                placeholderTextColor="#64748b"
                value={studentNumber}
                onChangeText={(text) => {
                  setStudentNumber(text);
                  if (errors.studentNumber) setErrors((prev) => ({ ...prev, studentNumber: undefined }));
                }}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
            {errors.studentNumber && <Text style={styles.errorText}>{errors.studentNumber}</Text>}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Üniversite Kampüs Uygulaması
            </Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 48,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 8,
  },
  loginButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
  },
});

