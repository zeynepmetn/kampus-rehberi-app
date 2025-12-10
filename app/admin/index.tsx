import { useAuth } from '@/context/AuthContext';
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
];

export default function AdminDashboard() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
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
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    color: '#94a3b8',
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
    color: '#fff',
    marginBottom: 16,
  },
  menuGrid: {
    gap: 12,
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#fff',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#64748b',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
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
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
});

