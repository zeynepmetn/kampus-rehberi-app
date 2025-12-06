import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/context/NotificationContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
  event: { icon: 'calendar', color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.15)' },
  reminder: { icon: 'alarm', color: '#4ECDC4', bgColor: 'rgba(78, 205, 196, 0.15)' },
  cafeteria: { icon: 'restaurant', color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.15)' },
  announcement: { icon: 'megaphone', color: '#F7DC6F', bgColor: 'rgba(247, 220, 111, 0.15)' },
};

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead, clearNotification, unreadCount } = useNotifications();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const handleNotificationPress = (id: string) => {
    markAsRead(id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Bildirimler</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} yeni</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done" size={22} color="#667eea" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={64} color="#64748b" />
            </View>
            <Text style={styles.emptyTitle}>Bildirim Yok</Text>
            <Text style={styles.emptySubtitle}>
              Yeni bildirimler burada görünecek
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const config = typeConfig[notification.type];
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => handleNotificationPress(notification.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.notificationIcon, { backgroundColor: config.bgColor }]}>
                  <Ionicons name={config.icon as any} size={22} color={config.color} />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTimestamp(notification.timestamp)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => clearNotification(notification.id)}
                >
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
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
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  unreadBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  notificationUnread: {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});

