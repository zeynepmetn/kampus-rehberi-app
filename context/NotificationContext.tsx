import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Notification, NotificationType } from '@/types';
import { useAuth } from './AuthContext';
import { 
  getStudentCourses, 
  getCourseSchedules,
  getAcademicCalendar,
  getCafeteriaMenuByDate,
  getAnnouncements,
  getUpcomingEvents
} from '@/database/database';
import { useDatabase } from './DatabaseContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  checkForNewNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Varsayılan bildirim ayarları
const defaultNotificationSettings = {
  events: true,
  classReminders: true,
  cafeteriaUpdates: true,
  announcements: true,
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { student, isLoggedIn, isAdmin, settings } = useAuth();
  const { isReady } = useDatabase();
  const lastCheckRef = useRef<Date>(new Date());
  const initializedRef = useRef(false);

  // Settings yoksa varsayılan değerleri kullan
  const notificationSettings = settings?.notifications || defaultNotificationSettings;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => {
        // Aynı başlıkta bildirim varsa ekleme
        if (prev.some(n => n.title === notification.title && n.message === notification.message)) {
          return prev;
        }
        return [newNotification, ...prev];
      });
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

  // Ders hatırlatıcısı kontrolü
  const checkClassReminders = useCallback(async () => {
    if (!student?.id || !notificationSettings.classReminders) return;

    try {
      const enrolledCourses = await getStudentCourses(student.id);
      const now = new Date();
      const currentDay = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][now.getDay()];
      
      for (const enrollment of enrolledCourses) {
        if (enrollment.status !== 'enrolled') continue;
        
        const schedules = await getCourseSchedules(enrollment.course_id);
        
        for (const schedule of schedules) {
          if (schedule.day === currentDay) {
            const [hours, minutes] = schedule.start_time.split(':').map(Number);
            const classTime = new Date(now);
            classTime.setHours(hours, minutes, 0, 0);
            
            const diffMinutes = (classTime.getTime() - now.getTime()) / (1000 * 60);
            
            // 30 dakika kala bildirim
            if (diffMinutes > 0 && diffMinutes <= 30) {
              addNotification({
                type: 'reminder',
                title: 'Ders Hatırlatması ⏰',
                message: `${enrollment.course_name} dersiniz ${Math.round(diffMinutes)} dakika içinde başlıyor. Sınıf: ${schedule.classroom}`,
              });
            }
            
            // 5 dakika kala acil hatırlatma
            if (diffMinutes > 0 && diffMinutes <= 5) {
              addNotification({
                type: 'reminder',
                title: 'Ders Başlıyor! 🔔',
                message: `${enrollment.course_name} dersiniz birkaç dakika içinde başlayacak!`,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking class reminders:', error);
    }
  }, [student?.id, notificationSettings.classReminders, addNotification]);

  // Etkinlik bildirimleri kontrolü
  const checkEventNotifications = useCallback(async () => {
    if (!notificationSettings.events) return;

    try {
      const events = await getUpcomingEvents();
      const now = new Date();
      
      for (const event of events) {
        const eventDate = new Date(event.event_date);
        const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Bugün veya yarın olan etkinlikler için bildirim
        if (diffDays === 0) {
          addNotification({
            type: 'event',
            title: 'Bugün Etkinlik Var! 🎉',
            message: `${event.title} bugün gerçekleşecek. ${event.location ? `Yer: ${event.location}` : ''}`,
          });
        } else if (diffDays === 1) {
          addNotification({
            type: 'event',
            title: 'Yarın Etkinlik Var 📅',
            message: `${event.title} yarın gerçekleşecek. Kaçırmayın!`,
          });
        }
      }

      // Akademik takvim bildirimleri
      const academicEvents = await getAcademicCalendar();
      for (const event of academicEvents) {
        const eventDate = new Date(event.event_date);
        const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          addNotification({
            type: 'event',
            title: 'Akademik Takvim 📚',
            message: `Bugün: ${event.title}`,
          });
        } else if (diffDays === 1) {
          addNotification({
            type: 'event',
            title: 'Yarın Önemli Tarih 📌',
            message: `${event.title} yarın başlıyor.`,
          });
        } else if (diffDays === 3) {
          addNotification({
            type: 'event',
            title: 'Yaklaşan Önemli Tarih 📆',
            message: `${event.title} 3 gün sonra başlayacak.`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking event notifications:', error);
    }
  }, [notificationSettings.events, addNotification]);

  // Yemekhane güncellemeleri kontrolü
  const checkCafeteriaUpdates = useCallback(async () => {
    if (!notificationSettings.cafeteriaUpdates) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const menu = await getCafeteriaMenuByDate(today);
      
      if (menu.length > 0) {
        const mainDishes = menu.filter(item => item.category === 'main');
        if (mainDishes.length > 0) {
          const dishNames = mainDishes.slice(0, 2).map(d => d.name).join(', ');
          addNotification({
            type: 'cafeteria',
            title: 'Bugünün Menüsü 🍽️',
            message: `Yemekhanede bugün: ${dishNames}${mainDishes.length > 2 ? ' ve daha fazlası...' : ''}`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking cafeteria updates:', error);
    }
  }, [notificationSettings.cafeteriaUpdates, addNotification]);

  // Duyuru bildirimleri kontrolü
  const checkAnnouncementNotifications = useCallback(async () => {
    if (!notificationSettings.announcements) return;

    try {
      const announcements = await getAnnouncements();
      const now = new Date();
      
      for (const announcement of announcements.slice(0, 5)) {
        const announcementDate = new Date(announcement.created_at || now);
        const diffHours = (now.getTime() - announcementDate.getTime()) / (1000 * 60 * 60);
        
        // Son 24 saat içinde oluşturulan duyurular
        if (diffHours <= 24) {
          addNotification({
            type: 'announcement',
            title: `📢 ${announcement.title}`,
            message: announcement.description.substring(0, 100) + (announcement.description.length > 100 ? '...' : ''),
          });
        }
      }
    } catch (error) {
      console.error('Error checking announcement notifications:', error);
    }
  }, [notificationSettings.announcements, addNotification]);

  // Tüm bildirimleri kontrol et
  const checkForNewNotifications = useCallback(async () => {
    if (!isReady) return;

    try {
      await Promise.all([
        checkClassReminders(),
        checkEventNotifications(),
        checkCafeteriaUpdates(),
        checkAnnouncementNotifications(),
      ]);
      
      lastCheckRef.current = new Date();
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }, [isReady, checkClassReminders, checkEventNotifications, checkCafeteriaUpdates, checkAnnouncementNotifications]);

  // İlk yüklemede bildirimleri başlat
  useEffect(() => {
    if (!isReady || !isLoggedIn || initializedRef.current) return;

    const initializeNotifications = async () => {
      initializedRef.current = true;
      
      // Hoş geldin bildirimi
      if (student) {
        addNotification({
          type: 'announcement',
          title: `Hoş Geldin ${student.first_name}! 👋`,
          message: 'Kampüs Rehberi uygulamasına hoş geldin. Bildirimlerini buradan takip edebilirsin.',
        });
      } else if (isAdmin) {
        addNotification({
          type: 'announcement',
          title: 'Hoş Geldin Admin! 🛡️',
          message: 'Admin paneline hoş geldin. Tüm yönetim işlemlerini buradan yapabilirsin.',
        });
      }

      // Örnek bildirimler ekle
      addNotification({
        type: 'event',
        title: 'Kariyer Günleri Başlıyor! 🎯',
        message: 'Bu hafta sonu kampüste kariyer günleri etkinliği düzenleniyor.',
      });

      addNotification({
        type: 'cafeteria',
        title: 'Yeni Menü Eklendi 🍕',
        message: 'Bugün yemekhanede özel menü var! Detaylar için yemekhane sekmesini kontrol edin.',
      });

      // Veritabanından bildirimleri kontrol et
      try {
        await checkForNewNotifications();
      } catch (error) {
        console.error('Error loading initial notifications:', error);
      }
    };

    // Küçük bir gecikme ile başlat (veritabanının hazır olduğundan emin olmak için)
    const timer = setTimeout(() => {
      initializeNotifications();
    }, 500);

    return () => clearTimeout(timer);
  }, [isReady, isLoggedIn, isAdmin, student, addNotification, checkForNewNotifications]);

  // Giriş durumu değiştiğinde sıfırla
  useEffect(() => {
    if (!isLoggedIn) {
      initializedRef.current = false;
      setNotifications([]);
    }
  }, [isLoggedIn]);

  // Her 5 dakikada bir ders hatırlatıcılarını kontrol et
  useEffect(() => {
    if (!isReady || !isLoggedIn || !student) return;

    const interval = setInterval(() => {
      checkClassReminders();
    }, 5 * 60 * 1000); // 5 dakika

    return () => clearInterval(interval);
  }, [isReady, isLoggedIn, student, checkClassReminders]);

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
        checkForNewNotifications,
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
