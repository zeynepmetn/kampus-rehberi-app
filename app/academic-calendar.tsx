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

// Akademik Takvim Verileri
const academicEvents = [
  {
    id: '1',
    title: 'Güz Dönemi Başlangıcı',
    date: new Date(2024, 8, 16), // 16 Eylül 2024
    type: 'semester',
    description: 'Güz dönemi derslerinin başlangıcı',
    icon: 'school-outline',
  },
  {
    id: '2',
    title: 'Ders Ekleme/Bırakma',
    date: new Date(2024, 8, 23), // 23 Eylül 2024
    endDate: new Date(2024, 8, 27), // 27 Eylül 2024
    type: 'registration',
    description: 'Son ders ekleme ve bırakma tarihleri',
    icon: 'create-outline',
  },
  {
    id: '3',
    title: 'Cumhuriyet Bayramı',
    date: new Date(2024, 9, 29), // 29 Ekim 2024
    type: 'holiday',
    description: 'Resmi tatil - Dersler yapılmayacak',
    icon: 'flag-outline',
  },
  {
    id: '4',
    title: 'Vize Haftası Başlangıcı',
    date: new Date(2024, 10, 4), // 4 Kasım 2024
    endDate: new Date(2024, 10, 15), // 15 Kasım 2024
    type: 'exam',
    description: 'Ara sınav haftası',
    icon: 'document-text-outline',
  },
  {
    id: '5',
    title: 'Veri Yapıları Vize',
    date: new Date(2024, 10, 6), // 6 Kasım 2024
    type: 'course_exam',
    description: 'BIL201 - Saat: 10:00 - Yer: A-301',
    icon: 'clipboard-outline',
    course: 'BIL201',
  },
  {
    id: '6',
    title: 'Algoritma Analizi Vize',
    date: new Date(2024, 10, 8), // 8 Kasım 2024
    type: 'course_exam',
    description: 'BIL203 - Saat: 14:00 - Yer: B-102',
    icon: 'clipboard-outline',
    course: 'BIL203',
  },
  {
    id: '7',
    title: 'Veritabanı Sistemleri Vize',
    date: new Date(2024, 10, 11), // 11 Kasım 2024
    type: 'course_exam',
    description: 'BIL205 - Saat: 10:00 - Yer: LAB-1',
    icon: 'clipboard-outline',
    course: 'BIL205',
  },
  {
    id: '8',
    title: 'Lineer Cebir Vize',
    date: new Date(2024, 10, 13), // 13 Kasım 2024
    type: 'course_exam',
    description: 'MAT201 - Saat: 09:00 - Yer: C-201',
    icon: 'clipboard-outline',
    course: 'MAT201',
  },
  {
    id: '9',
    title: 'Ders Çekilme Son Tarihi',
    date: new Date(2024, 10, 22), // 22 Kasım 2024
    type: 'deadline',
    description: 'Dersten çekilme için son gün',
    icon: 'warning-outline',
  },
  {
    id: '10',
    title: 'Güz Dönemi Dersleri Bitişi',
    date: new Date(2024, 11, 27), // 27 Aralık 2024
    type: 'semester',
    description: 'Güz dönemi derslerinin son günü',
    icon: 'school-outline',
  },
  {
    id: '11',
    title: 'Final Haftası Başlangıcı',
    date: new Date(2025, 0, 6), // 6 Ocak 2025
    endDate: new Date(2025, 0, 17), // 17 Ocak 2025
    type: 'exam',
    description: 'Final sınav haftası',
    icon: 'document-text-outline',
  },
  {
    id: '12',
    title: 'Veri Yapıları Final',
    date: new Date(2025, 0, 7), // 7 Ocak 2025
    type: 'course_exam',
    description: 'BIL201 - Saat: 10:00 - Yer: Spor Salonu',
    icon: 'clipboard-outline',
    course: 'BIL201',
  },
  {
    id: '13',
    title: 'Algoritma Analizi Final',
    date: new Date(2025, 0, 9), // 9 Ocak 2025
    type: 'course_exam',
    description: 'BIL203 - Saat: 14:00 - Yer: Spor Salonu',
    icon: 'clipboard-outline',
    course: 'BIL203',
  },
  {
    id: '14',
    title: 'Veritabanı Sistemleri Final',
    date: new Date(2025, 0, 13), // 13 Ocak 2025
    type: 'course_exam',
    description: 'BIL205 - Saat: 10:00 - Yer: A Blok',
    icon: 'clipboard-outline',
    course: 'BIL205',
  },
  {
    id: '15',
    title: 'Lineer Cebir Final',
    date: new Date(2025, 0, 15), // 15 Ocak 2025
    type: 'course_exam',
    description: 'MAT201 - Saat: 09:00 - Yer: C Blok',
    icon: 'clipboard-outline',
    course: 'MAT201',
  },
  {
    id: '16',
    title: 'Yarıyıl Tatili',
    date: new Date(2025, 0, 20), // 20 Ocak 2025
    endDate: new Date(2025, 1, 7), // 7 Şubat 2025
    type: 'holiday',
    description: 'Yarıyıl tatili',
    icon: 'sunny-outline',
  },
  {
    id: '17',
    title: 'Bahar Dönemi Başlangıcı',
    date: new Date(2025, 1, 10), // 10 Şubat 2025
    type: 'semester',
    description: 'Bahar dönemi derslerinin başlangıcı',
    icon: 'school-outline',
  },
  {
    id: '18',
    title: 'Bütünleme Sınavları',
    date: new Date(2025, 0, 27), // 27 Ocak 2025
    endDate: new Date(2025, 1, 5), // 5 Şubat 2025
    type: 'exam',
    description: 'Bütünleme sınav haftası',
    icon: 'refresh-outline',
  },
];

const eventTypes = [
  { key: 'all', label: 'Tümü', color: '#667eea' },
  { key: 'exam', label: 'Sınavlar', color: '#FF6B6B' },
  { key: 'course_exam', label: 'Ders Sınavları', color: '#F7DC6F' },
  { key: 'semester', label: 'Dönem', color: '#4ECDC4' },
  { key: 'holiday', label: 'Tatiller', color: '#96CEB4' },
  { key: 'deadline', label: 'Son Tarihler', color: '#ef4444' },
  { key: 'registration', label: 'Kayıt', color: '#BB8FCE' },
];

const months = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const getEventColor = (type: string) => {
  const typeConfig = eventTypes.find(t => t.key === type);
  return typeConfig?.color || '#667eea';
};

const formatDate = (date: Date) => {
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

const formatDateRange = (start: Date, end?: Date) => {
  if (end) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${months[start.getMonth()]}`;
    }
    return `${formatDate(start)} - ${formatDate(end)}`;
  }
  return formatDate(start);
};

const getDaysUntil = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function AcademicCalendarScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredEvents = selectedFilter === 'all'
    ? academicEvents
    : academicEvents.filter(event => event.type === selectedFilter);

  const sortedEvents = [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Yaklaşan etkinlikler (30 gün içinde)
  const upcomingEvents = academicEvents
    .filter(event => {
      const daysUntil = getDaysUntil(event.date);
      return daysUntil >= 0 && daysUntil <= 30;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Akademik Takvim</Text>
            <Text style={styles.headerSubtitle}>2024-2025 Güz Dönemi</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={28} color="#667eea" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Yaklaşan Etkinlikler */}
        {upcomingEvents.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
            {upcomingEvents.map((event) => {
              const daysUntil = getDaysUntil(event.date);
              return (
                <View key={event.id} style={styles.upcomingCard}>
                  <View style={[styles.upcomingAccent, { backgroundColor: getEventColor(event.type) }]} />
                  <View style={styles.upcomingContent}>
                    <View style={styles.upcomingHeader}>
                      <Text style={styles.upcomingTitle}>{event.title}</Text>
                      <View style={[styles.daysUntilBadge, daysUntil <= 7 && styles.daysUntilBadgeUrgent]}>
                        <Text style={styles.daysUntilText}>
                          {daysUntil === 0 ? 'Bugün' : daysUntil === 1 ? 'Yarın' : `${daysUntil} gün`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.upcomingDate}>{formatDateRange(event.date, event.endDate)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Filtreler */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {eventTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.filterButton,
                  selectedFilter === type.key && { backgroundColor: type.color },
                ]}
                onPress={() => setSelectedFilter(type.key)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === type.key && styles.filterButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Takvim Listesi */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === 'all' ? 'Tüm Etkinlikler' : eventTypes.find(t => t.key === selectedFilter)?.label}
          </Text>
          
          {sortedEvents.map((event, index) => {
            const daysUntil = getDaysUntil(event.date);
            const isPast = daysUntil < 0;
            
            return (
              <View 
                key={event.id} 
                style={[styles.eventCard, isPast && styles.eventCardPast]}
              >
                <View style={styles.eventDateContainer}>
                  <Text style={[styles.eventDay, isPast && styles.eventDayPast]}>
                    {event.date.getDate()}
                  </Text>
                  <Text style={[styles.eventMonth, isPast && styles.eventMonthPast]}>
                    {months[event.date.getMonth()].substring(0, 3)}
                  </Text>
                  {event.endDate && (
                    <>
                      <View style={styles.eventDateDivider} />
                      <Text style={[styles.eventDay, isPast && styles.eventDayPast]}>
                        {event.endDate.getDate()}
                      </Text>
                      <Text style={[styles.eventMonth, isPast && styles.eventMonthPast]}>
                        {months[event.endDate.getMonth()].substring(0, 3)}
                      </Text>
                    </>
                  )}
                </View>
                
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventIcon, { backgroundColor: getEventColor(event.type) + '20' }]}>
                      <Ionicons 
                        name={event.icon as any} 
                        size={18} 
                        color={getEventColor(event.type)} 
                      />
                    </View>
                    <View style={styles.eventTitleContainer}>
                      <Text style={[styles.eventTitle, isPast && styles.eventTitlePast]}>
                        {event.title}
                      </Text>
                      {event.course && (
                        <View style={styles.courseBadge}>
                          <Text style={styles.courseBadgeText}>{event.course}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.eventDescription, isPast && styles.eventDescriptionPast]}>
                    {event.description}
                  </Text>
                  {!isPast && daysUntil <= 14 && (
                    <View style={styles.countdownContainer}>
                      <Ionicons name="time-outline" size={12} color="#4ECDC4" />
                      <Text style={styles.countdownText}>
                        {daysUntil === 0 ? 'Bugün!' : daysUntil === 1 ? 'Yarın!' : `${daysUntil} gün kaldı`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Dönem Özeti */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Dönem Özeti</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Ionicons name="school-outline" size={24} color="#4ECDC4" />
              <Text style={styles.summaryValue}>16 Hafta</Text>
              <Text style={styles.summaryLabel}>Ders Süresi</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="document-text-outline" size={24} color="#FF6B6B" />
              <Text style={styles.summaryValue}>2 Hafta</Text>
              <Text style={styles.summaryLabel}>Vize Dönemi</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="clipboard-outline" size={24} color="#F7DC6F" />
              <Text style={styles.summaryValue}>2 Hafta</Text>
              <Text style={styles.summaryLabel}>Final Dönemi</Text>
            </View>
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
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
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
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
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
  // Yaklaşan Etkinlikler
  upcomingSection: {
    marginBottom: 24,
  },
  upcomingCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  upcomingAccent: {
    width: 4,
  },
  upcomingContent: {
    flex: 1,
    padding: 14,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  daysUntilBadge: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysUntilBadgeUrgent: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  daysUntilText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  upcomingDate: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  // Filtreler
  filterSection: {
    marginBottom: 24,
  },
  filterScroll: {
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  // Takvim Listesi
  calendarSection: {
    marginBottom: 24,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventCardPast: {
    opacity: 0.5,
  },
  eventDateContainer: {
    width: 70,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
  },
  eventDayPast: {
    color: '#64748b',
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    textTransform: 'uppercase',
  },
  eventMonthPast: {
    color: '#64748b',
  },
  eventDateDivider: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    marginVertical: 4,
  },
  eventContent: {
    flex: 1,
    padding: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eventTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  eventTitlePast: {
    color: '#94a3b8',
  },
  courseBadge: {
    backgroundColor: 'rgba(247, 220, 111, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F7DC6F',
  },
  eventDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  eventDescriptionPast: {
    color: '#475569',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  // Dönem Özeti
  summarySection: {
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
});

