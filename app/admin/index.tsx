import { useAuth } from '@/context/AuthContext';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AdminMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

const menuItems: AdminMenuItem[] = [
  {
    id: 'departments',
    title: 'Bölümler',
    description: 'Bölüm ekle, düzenle, sil',
    icon: 'business',
    color: '#667eea',
    route: '/admin/departments',
  },
  {
    id: 'students',
    title: 'Öğrenciler',
    description: 'Öğrenci kayıtlarını yönet',
    icon: 'people',
    color: '#4ECDC4',
    route: '/admin/students',
  },
  {
    id: 'courses',
    title: 'Dersler',
    description: 'Ders ekle, düzenle, sil ve program yönet',
    icon: 'book',
    color: '#FF6B6B',
    route: '/admin/courses',
  },
  {
    id: 'exams',
    title: 'Sınavlar',
    description: 'Sınav takvimini yönet',
    icon: 'document-text',
    color: '#8B5CF6',
    route: '/admin/exams',
  },
  {
    id: 'cafeteria',
    title: 'Yemekhane',
    description: 'Menü ve aperatifleri yönet',
    icon: 'restaurant',
    color: '#FF6B6B',
    route: '/admin/cafeteria',
  },
  {
    id: 'announcements',
    title: 'Duyurular',
    description: 'Duyuru ekle, düzenle, sil',
    icon: 'megaphone',
    color: '#F7DC6F',
    route: '/admin/announcements',
  },
  {
    id: 'events',
    title: 'Etkinlikler',
    description: 'Etkinlik takvimini yönet',
    icon: 'calendar',
    color: '#4ECDC4',
    route: '/admin/events',
  },
  {
    id: 'academic-calendar',
    title: 'Akademik Takvim',
    description: 'Akademik takvimi yönet',
    icon: 'calendar-outline',
    color: '#96CEB4',
    route: '/admin/academic-calendar',
  },
];

// Tema seçenekleri
const themeOptions: { key: ThemeMode; label: string; icon: string }[] = [
  { key: 'light', label: 'Açık', icon: 'sunny' },
  { key: 'dark', label: 'Koyu', icon: 'moon' },
  { key: 'system', label: 'Sistem', icon: 'phone-portrait' },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  const styles = createStyles(colors, isDark);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Admin Paneli</Text>
              <Text style={styles.headerSubtitle}>Yönetim Merkezi</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Yönetim Seçenekleri</Text>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
              <View style={styles.menuArrow}>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Hızlı Bilgiler</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="school" size={24} color="#667eea" />
            <Text style={styles.statLabel}>Sistem Durumu</Text>
            <Text style={styles.statValue}>Aktif</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="server" size={24} color="#4ECDC4" />
            <Text style={styles.statLabel}>Veritabanı</Text>
            <Text style={styles.statValue}>Çalışıyor</Text>
          </View>
        </View>

        {/* Theme Switcher */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Tema Ayarları</Text>
        <View style={styles.themeContainer}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.themeOption,
                themeMode === option.key && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode(option.key)}
            >
              <Ionicons
                name={option.icon as any}
                size={24}
                color={themeMode === option.key ? '#667eea' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === option.key && styles.themeOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Help */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle" size={24} color="#667eea" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Yardım</Text>
            <Text style={styles.helpText}>
              Admin panelinden bölüm, öğrenci, ders ve sınav verilerini yönetebilirsiniz.
              Her bölümde ekleme, düzenleme ve silme işlemleri yapabilirsiniz.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  menuGrid: {
    gap: 12,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  menuArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 4,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.15)',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  themeOptionActive: {
    borderColor: '#667eea',
    backgroundColor: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
  },
  themeOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
});
