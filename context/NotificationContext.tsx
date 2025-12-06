import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

// Mock initial notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'event',
    title: 'Kariyer Günleri Başlıyor! 🎯',
    message: 'Bu hafta sonu kampüste kariyer günleri etkinliği düzenleniyor.',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Ders Hatırlatması',
    message: 'Algoritma dersiniz 30 dakika içinde başlıyor.',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
  {
    id: '3',
    type: 'cafeteria',
    title: 'Yeni Menü Eklendi 🍕',
    message: 'Bugün yemekhanede özel İtalyan menüsü var!',
    timestamp: new Date(Date.now() - 86400000),
    read: true,
  },
  {
    id: '4',
    type: 'announcement',
    title: 'Sınav Tarihleri Açıklandı',
    message: 'Final sınavları için tarihler belirlendi. Detaylar için öğrenci portalını kontrol edin.',
    timestamp: new Date(Date.now() - 172800000),
    read: true,
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

