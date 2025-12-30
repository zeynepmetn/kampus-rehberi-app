import { useAuth } from '@/context/AuthContext';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { getEnrolledCourses, StudentCourse } from '@/database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { student, settings, updateSettings, logout } = useAuth();
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [enrolledCourses, setEnrolledCourses] = useState<StudentCourse[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalEcts, setTotalEcts] = useState(0);

  useEffect(() => {
    if (student?.id) {
      loadEnrolledCourses();
    }
  }, [student]);

  const loadEnrolledCourses = async () => {
    if (!student?.id) return;
    try {
      const courses = await getEnrolledCourses(student.id);
      setEnrolledCourses(courses);
      setTotalCredits(courses.reduce((sum, c) => sum + (c.credits || 0), 0));
      setTotalEcts(courses.reduce((sum, c) => sum + (c.ects || 0), 0));
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleToggleSetting = (key: keyof typeof settings.notifications) => {
    const newNotifications = {
      ...localSettings.notifications,
      [key]: !localSettings.notifications[key],
    };
    setLocalSettings((prev) => ({ ...prev, notifications: newNotifications }));
    updateSettings({ notifications: newNotifications });
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Açık', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Koyu', icon: 'moon-outline' },
    { mode: 'system', label: 'Sistem', icon: 'phone-portrait-outline' },
  ];

  const settingsGroups = [
    {
      title: 'Bildirim Ayarları',
      icon: 'notifications-outline',
      items: [
        {
          key: 'events' as const,
          label: 'Etkinlik Bildirimleri',
          description: 'Kampüsteki etkinliklerden haberdar ol',
          icon: 'calendar-outline',
        },
        {
          key: 'classReminders' as const,
          label: 'Ders Hatırlatıcıları',
          description: 'Derslerden 15 dakika önce hatırlat',
          icon: 'alarm-outline',
        },
        {
          key: 'cafeteriaUpdates' as const,
          label: 'Yemekhane Güncellemeleri',
          description: 'Yeni menü ve duyurular',
          icon: 'restaurant-outline',
        },
        {
          key: 'announcements' as const,
          label: 'Genel Duyurular',
          description: 'Üniversite duyuruları',
          icon: 'megaphone-outline',
        },
      ],
    },
  ];

  const menuItems = [
    {
      label: 'Bildirimler',
      icon: 'notifications-outline',
      color: '#667eea',
      onPress: () => router.push('/notifications'),
    },
    {
      label: 'Ders Seçimi',
      icon: 'school-outline',
      color: '#4ECDC4',
      badge: enrolledCourses.length > 0 ? `${enrolledCourses.length} ders` : undefined,
      onPress: () => router.push('/course-selection'),
    },
    {
      label: 'Akademik Takvim',
      icon: 'calendar-outline',
      color: '#FF6B6B',
      onPress: () => router.push('/academic-calendar'),
    },
    {
      label: 'Yardım & Destek',
      icon: 'help-circle-outline',
      color: '#F7DC6F',
      onPress: () => {},
    },
    {
      label: 'Hakkında',
      icon: 'information-circle-outline',
      color: '#96CEB4',
      onPress: () => {},
    },
  ];

  // Get initials for avatar
  const getInitials = () => {
    if (student?.first_name && student?.last_name) {
      return `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();
    }
    return 'Ö';
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Header with Profile */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {student?.first_name} {student?.last_name}
            </Text>
            <Text style={styles.profileNumber}>{student?.student_number}</Text>
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentText}>{student?.department_name}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{student?.class_year || 1}</Text>
            <Text style={styles.statLabel}>Sınıf</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{student?.gno?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>GNO</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalEcts}</Text>
            <Text style={styles.statLabel}>AKTS</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Enrolled Courses Summary */}
        {enrolledCourses.length > 0 && (
          <TouchableOpacity 
            style={styles.courseSummary}
            onPress={() => router.push('/course-selection')}
          >
            <View style={styles.courseSummaryHeader}>
              <Text style={styles.courseSummaryTitle}>Bu Dönem</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
            <View style={styles.courseSummaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{enrolledCourses.length}</Text>
                <Text style={styles.summaryStatLabel}>Ders</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{totalCredits}</Text>
                <Text style={styles.summaryStatLabel}>Kredi</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{totalEcts}</Text>
                <Text style={styles.summaryStatLabel}>AKTS</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Theme Settings */}
        <View style={styles.settingsGroup}>
          <View style={styles.groupHeader}>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            <Text style={styles.groupTitle}>Tema Ayarları</Text>
          </View>
          <View style={styles.themeSelector}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.themeOption,
                  themeMode === option.mode && styles.themeOptionActive,
                ]}
                onPress={() => setThemeMode(option.mode)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={themeMode === option.mode ? '#fff' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    themeMode === option.mode && styles.themeOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Settings */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.settingsGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name={group.icon as any} size={20} color={colors.primary} />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            {group.items.map((item) => (
              <View key={item.key} style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDesc}>{item.description}</Text>
                </View>
                <Switch
                  value={localSettings.notifications[item.key]}
                  onValueChange={() => handleToggleSetting(item.key)}
                  trackColor={{ false: colors.inputBackground, true: colors.primary + '60' }}
                  thumbColor={localSettings.notifications[item.key] ? colors.primary : colors.textSecondary}
                />
              </View>
            ))}
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Kampüs Uygulaması v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Üniversite</Text>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? '#1a1a2e' : '#fff',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  profileNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  departmentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  departmentText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  courseSummary: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  courseSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  courseSummaryStats: {
    flexDirection: 'row',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsGroup: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    gap: 8,
  },
  themeOptionActive: {
    backgroundColor: colors.primary,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  themeOptionTextActive: {
    color: '#fff',
  },
  menuSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  menuBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '15',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  copyrightText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
});
