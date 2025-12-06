import { useAuth } from '@/context/AuthContext';
import { useCourses } from '@/context/CourseContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

export default function ProfileScreen() {
  const { student, settings, updateSettings, logout } = useAuth();
  const { 
    toggleCourse, 
    isCourseSelected, 
    getCoursesForDay, 
    clearDaySelection, 
    clearAllSelections,
    getTotalSelectedCount,
    getSelectedCountForDay,
  } = useCourses();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Pazartesi');

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

  const totalSelected = getTotalSelectedCount();

  const menuItems = [
    {
      label: 'Bildirimler',
      icon: 'notifications-outline',
      color: '#667eea',
      onPress: () => router.push('/notifications'),
    },
    {
      label: 'Derslerim',
      icon: 'book-outline',
      color: '#4ECDC4',
      badge: totalSelected > 0 ? `${totalSelected} ders` : undefined,
      onPress: () => setShowCoursesModal(true),
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

  const currentDayCourses = getCoursesForDay(selectedDay);
  const currentDaySelectedCount = getSelectedCountForDay(selectedDay);

  return (
    <View style={styles.container}>
      {/* Header with Profile */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {student?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'Ö'}
              </Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{student?.name || 'Öğrenci'}</Text>
            <Text style={styles.profileNumber}>{student?.studentNumber}</Text>
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentText}>{student?.department}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{student?.year || 2}</Text>
            <Text style={styles.statLabel}>Sınıf</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3.45</Text>
            <Text style={styles.statLabel}>GNO</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>85</Text>
            <Text style={styles.statLabel}>AKTS</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Settings */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.settingsGroup}>
            <View style={styles.groupHeader}>
              <Ionicons name={group.icon as any} size={20} color="#667eea" />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            {group.items.map((item) => (
              <View key={item.key} style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Ionicons name={item.icon as any} size={20} color="#94a3b8" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDesc}>{item.description}</Text>
                </View>
                <Switch
                  value={localSettings.notifications[item.key]}
                  onValueChange={() => handleToggleSetting(item.key)}
                  trackColor={{ false: '#334155', true: 'rgba(102, 126, 234, 0.4)' }}
                  thumbColor={localSettings.notifications[item.key] ? '#667eea' : '#94a3b8'}
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
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Kampüs Uygulaması v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Üniversite</Text>
        </View>
      </ScrollView>

      {/* Ders Seçimi Modal */}
      <Modal
        visible={showCoursesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCoursesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Derslerim</Text>
              <TouchableOpacity onPress={() => setShowCoursesModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Her gün için ayrı ayrı ders seçebilirsiniz
            </Text>

            {/* Gün Seçici */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.dayTabsContainer}
              contentContainerStyle={styles.dayTabs}
            >
              {days.map((day) => {
                const dayCount = getSelectedCountForDay(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayTab,
                      selectedDay === day && styles.dayTabActive,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayTabText,
                        selectedDay === day && styles.dayTabTextActive,
                      ]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                    {dayCount > 0 && (
                      <View style={[
                        styles.dayTabBadge,
                        selectedDay === day && styles.dayTabBadgeActive,
                      ]}>
                        <Text style={styles.dayTabBadgeText}>{dayCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Seçili Gün Başlığı */}
            <View style={styles.selectedDayHeader}>
              <Text style={styles.selectedDayTitle}>{selectedDay}</Text>
              <Text style={styles.selectedDayCount}>
                {currentDaySelectedCount}/{currentDayCourses.length} ders seçili
              </Text>
            </View>

            {/* Ders Listesi */}
            <ScrollView style={styles.courseList}>
              {currentDayCourses.length === 0 ? (
                <View style={styles.emptyDayState}>
                  <Ionicons name="cafe-outline" size={48} color="#64748b" />
                  <Text style={styles.emptyDayText}>Bu gün ders yok</Text>
                </View>
              ) : (
                currentDayCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.courseSelectItem,
                      isCourseSelected(selectedDay, course.id) && styles.courseSelectItemActive,
                    ]}
                    onPress={() => toggleCourse(selectedDay, course.id)}
                  >
                    <View style={[styles.courseSelectColor, { backgroundColor: course.color }]} />
                    <View style={styles.courseSelectInfo}>
                      <View style={styles.courseSelectHeader}>
                        <Text style={styles.courseSelectCode}>{course.code}</Text>
                        <Text style={styles.courseSelectTime}>
                          {course.startTime} - {course.endTime}
                        </Text>
                      </View>
                      <Text style={styles.courseSelectName}>{course.name}</Text>
                      <Text style={styles.courseSelectInstructor}>{course.instructor}</Text>
                    </View>
                    <View
                      style={[
                        styles.courseSelectCheck,
                        isCourseSelected(selectedDay, course.id) && styles.courseSelectCheckActive,
                      ]}
                    >
                      {isCourseSelected(selectedDay, course.id) && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.clearDayButton} 
                onPress={() => clearDaySelection(selectedDay)}
              >
                <Text style={styles.clearDayButtonText}>{selectedDay} Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.clearAllButton} 
                onPress={clearAllSelections}
              >
                <Text style={styles.clearAllButtonText}>Tümünü Temizle</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowCoursesModal(false)}
            >
              <Text style={styles.applyButtonText}>
                Tamam ({totalSelected} ders seçili)
              </Text>
            </TouchableOpacity>
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
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
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
    color: '#94a3b8',
    marginTop: 2,
  },
  departmentBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  departmentText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#94a3b8',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#fff',
    fontWeight: '500',
  },
  menuBadge: {
    backgroundColor: '#4ECDC4',
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
  settingsGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#fff',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#64748b',
  },
  copyrightText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  dayTabsContainer: {
    marginBottom: 16,
  },
  dayTabs: {
    gap: 8,
  },
  dayTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayTabActive: {
    backgroundColor: '#667eea',
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  dayTabTextActive: {
    color: '#fff',
  },
  dayTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dayTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dayTabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  selectedDayCount: {
    fontSize: 13,
    color: '#4ECDC4',
  },
  courseList: {
    maxHeight: 300,
  },
  emptyDayState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDayText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  courseSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  courseSelectItemActive: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  courseSelectColor: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  courseSelectInfo: {
    flex: 1,
  },
  courseSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  courseSelectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
  },
  courseSelectTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  courseSelectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  courseSelectInstructor: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  courseSelectCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseSelectCheckActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearDayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  clearDayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  clearAllButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  applyButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    marginTop: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
