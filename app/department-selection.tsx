import { useAuth } from '@/context/AuthContext';
import { departments } from '@/data/schedule';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 72) / 2;

const years = [
  { id: 1, label: '1. Sınıf', subtitle: 'Hazırlık / 1. Yıl' },
  { id: 2, label: '2. Sınıf', subtitle: '2. Yıl' },
  { id: 3, label: '3. Sınıf', subtitle: '3. Yıl' },
  { id: 4, label: '4. Sınıf', subtitle: '4. Yıl / Son Sınıf' },
];

export default function DepartmentSelectionScreen() {
  const { student, selectDepartment, selectYear } = useAuth();
  const [step, setStep] = useState<'department' | 'year'>('department');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const handleSelectDepartment = (departmentId: string, departmentName: string) => {
    setSelectedDepartment(departmentName);
    selectDepartment(departmentName);
    setStep('year');
  };

  const handleSelectYear = (year: number) => {
    selectYear(year);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    setStep('department');
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {step === 'year' && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <Text style={styles.welcomeText}>Hoş geldin,</Text>
          <Text style={styles.nameText}>{student?.name || 'Öğrenci'}</Text>
          
          {step === 'department' ? (
            <Text style={styles.subtitleText}>Bölümünüzü seçin</Text>
          ) : (
            <>
              <View style={styles.selectedDeptBadge}>
                <Ionicons name="school-outline" size={14} color="#667eea" />
                <Text style={styles.selectedDeptText}>{selectedDepartment}</Text>
              </View>
              <Text style={styles.subtitleText}>Sınıfınızı seçin</Text>
            </>
          )}
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepLine, step === 'year' && styles.stepLineActive]} />
          <View style={[styles.stepDot, step === 'year' && styles.stepDotActive]} />
        </View>
        <View style={styles.stepLabels}>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Bölüm</Text>
          <Text style={[styles.stepLabel, step === 'year' && styles.stepLabelActive]}>Sınıf</Text>
        </View>

        {step === 'department' ? (
          /* Department Grid */
          <View style={styles.gridContainer}>
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={styles.cardWrapper}
                onPress={() => handleSelectDepartment(dept.id, dept.name)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.card}
                >
                  <Text style={styles.cardIcon}>{dept.icon}</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {dept.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Year Selection */
          <View style={styles.yearContainer}>
            {years.map((year) => (
              <TouchableOpacity
                key={year.id}
                style={styles.yearCard}
                onPress={() => handleSelectYear(year.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(102, 126, 234, 0.2)', 'rgba(102, 126, 234, 0.1)']}
                  style={styles.yearCardGradient}
                >
                  <View style={styles.yearNumber}>
                    <Text style={styles.yearNumberText}>{year.id}</Text>
                  </View>
                  <View style={styles.yearInfo}>
                    <Text style={styles.yearLabel}>{year.label}</Text>
                    <Text style={styles.yearSubtitle}>{year.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#667eea" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Footer Info */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={18} color="#64748b" />
          <Text style={styles.footerText}>
            {step === 'department' 
              ? 'Bölüm seçiminizi daha sonra ayarlardan değiştirebilirsiniz.'
              : 'Sınıf bilginizi daha sonra profilinizden güncelleyebilirsiniz.'}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  welcomeText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  selectedDeptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  selectedDeptText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#667eea',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#667eea',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    marginBottom: 24,
  },
  stepLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#667eea',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 18,
  },
  yearContainer: {
    gap: 12,
  },
  yearCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  yearCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 16,
  },
  yearNumber: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  yearNumberText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  yearInfo: {
    flex: 1,
  },
  yearLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  yearSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
});
