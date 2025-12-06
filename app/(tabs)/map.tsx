import { campusLocations } from '@/data/schedule';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type LocationType = 'all' | 'building' | 'library' | 'bus';

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  building: { icon: 'business', color: '#667eea', label: 'Binalar' },
  library: { icon: 'library', color: '#4ECDC4', label: 'Kütüphane' },
  bus: { icon: 'bus', color: '#BB8FCE', label: 'Otobüs' },
  other: { icon: 'location', color: '#94a3b8', label: 'Diğer' },
};

// Otobüs durakları ve saatleri
const busStops = [
  {
    id: 'bus1',
    name: 'Kampüs Otobüs Durağı',
    type: 'bus',
    description: 'Ana giriş yanı otobüs durağı',
    buses: [
      {
        line: '11-A',
        route: 'Kampüs - Şehir Merkezi',
        color: '#FF6B6B',
        schedule: [
          { time: '07:30', note: 'İlk sefer' },
          { time: '08:00', note: '' },
          { time: '08:30', note: 'Yoğun' },
          { time: '09:00', note: '' },
          { time: '09:30', note: '' },
          { time: '10:00', note: '' },
          { time: '10:30', note: '' },
          { time: '11:00', note: '' },
          { time: '11:30', note: '' },
          { time: '12:00', note: 'Öğle' },
          { time: '12:30', note: '' },
          { time: '13:00', note: '' },
          { time: '13:30', note: '' },
          { time: '14:00', note: '' },
          { time: '15:00', note: '' },
          { time: '16:00', note: '' },
          { time: '17:00', note: 'Yoğun' },
          { time: '17:30', note: 'Yoğun' },
          { time: '18:00', note: '' },
          { time: '18:30', note: '' },
          { time: '19:00', note: '' },
          { time: '20:00', note: '' },
          { time: '21:00', note: 'Son sefer' },
        ],
      },
      {
        line: '11-C',
        route: 'Kampüs - Terminal',
        color: '#4ECDC4',
        schedule: [
          { time: '07:00', note: 'İlk sefer' },
          { time: '07:45', note: '' },
          { time: '08:15', note: 'Yoğun' },
          { time: '08:45', note: '' },
          { time: '09:15', note: '' },
          { time: '09:45', note: '' },
          { time: '10:15', note: '' },
          { time: '10:45', note: '' },
          { time: '11:15', note: '' },
          { time: '11:45', note: '' },
          { time: '12:15', note: 'Öğle' },
          { time: '12:45', note: '' },
          { time: '13:15', note: '' },
          { time: '14:00', note: '' },
          { time: '15:00', note: '' },
          { time: '16:00', note: '' },
          { time: '17:15', note: 'Yoğun' },
          { time: '17:45', note: '' },
          { time: '18:15', note: '' },
          { time: '19:00', note: '' },
          { time: '20:00', note: '' },
          { time: '21:30', note: 'Son sefer' },
        ],
      },
    ],
  },
];

// Tüm konumları birleştir
const allLocations = [...campusLocations, ...busStops];

export default function MapScreen() {
  const [selectedType, setSelectedType] = useState<LocationType>('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showBusModal, setShowBusModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<typeof busStops[0] | null>(null);
  const [selectedBusLine, setSelectedBusLine] = useState<string>('11-A');

  const filteredLocations =
    selectedType === 'all'
      ? allLocations
      : allLocations.filter((loc) => loc.type === selectedType);

  const filterTypes: LocationType[] = ['all', 'building', 'library', 'bus'];

  const handleBusPress = (busStop: typeof busStops[0]) => {
    setSelectedBus(busStop);
    setShowBusModal(true);
  };

  const getNextBus = (schedule: { time: string; note: string }[]) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const item of schedule) {
      const [hours, minutes] = item.time.split(':').map(Number);
      const busTime = hours * 60 + minutes;
      if (busTime > currentTime) {
        const diff = busTime - currentTime;
        return { time: item.time, minutesUntil: diff };
      }
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <Text style={styles.headerTitle}>Kampüs Haritası</Text>
        <Text style={styles.headerSubtitle}>Konumları keşfedin</Text>
      </LinearGradient>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={styles.mapPlaceholder}
        >
          {/* Grid pattern */}
          <View style={styles.gridOverlay}>
            {[...Array(5)].map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${20 * (i + 1)}%` }]} />
            ))}
            {[...Array(5)].map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${20 * (i + 1)}%` }]} />
            ))}
          </View>

          {/* Location markers */}
          <View style={styles.markersContainer}>
            {filteredLocations.map((loc, index) => {
              const config = typeConfig[loc.type];
              const positions = [
                { top: '20%', left: '30%' },
                { top: '35%', left: '60%' },
                { top: '50%', left: '25%' },
                { top: '45%', left: '70%' },
                { top: '65%', left: '40%' },
                { top: '30%', left: '15%' },
                { top: '75%', left: '65%' },
                { top: '55%', left: '50%' },
                { top: '15%', left: '75%' }, // Otobüs durağı pozisyonu
              ];
              const pos = positions[index % positions.length];

              return (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.marker,
                    { top: pos.top, left: pos.left },
                    selectedLocation === loc.id && styles.markerSelected,
                  ]}
                  onPress={() => {
                    if (loc.type === 'bus') {
                      handleBusPress(loc as typeof busStops[0]);
                    } else {
                      setSelectedLocation(selectedLocation === loc.id ? null : loc.id);
                    }
                  }}
                >
                  <View style={[styles.markerIcon, { backgroundColor: config.color }]}>
                    <Ionicons name={config.icon as any} size={16} color="#fff" />
                  </View>
                  {selectedLocation === loc.id && (
                    <View style={styles.markerLabel}>
                      <Text style={styles.markerLabelText}>{loc.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Compass */}
          <View style={styles.compass}>
            <Text style={styles.compassText}>N</Text>
            <Ionicons name="navigate" size={24} color="#667eea" />
          </View>
        </LinearGradient>
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filterTypes.map((type) => {
          const config = type === 'all' ? { icon: 'apps', color: '#667eea', label: 'Tümü' } : typeConfig[type];
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedType === type && styles.filterButtonActive,
                selectedType === type && { borderColor: config.color },
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Ionicons
                name={config.icon as any}
                size={18}
                color={selectedType === type ? config.color : '#64748b'}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedType === type && { color: config.color },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Location List */}
      <ScrollView
        style={styles.locationList}
        contentContainerStyle={styles.locationListContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listTitle}>
          {selectedType === 'all' ? 'Tüm Konumlar' : typeConfig[selectedType].label}
          <Text style={styles.listCount}> ({filteredLocations.length})</Text>
        </Text>

        {filteredLocations.map((location) => {
          const config = typeConfig[location.type];
          const isSelected = selectedLocation === location.id;
          const isBus = location.type === 'bus';
          const busData = isBus ? location as typeof busStops[0] : null;

          return (
            <TouchableOpacity
              key={location.id}
              style={[styles.locationCard, isSelected && styles.locationCardSelected]}
              onPress={() => {
                if (isBus && busData) {
                  handleBusPress(busData);
                } else {
                  setSelectedLocation(isSelected ? null : location.id);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.locationIcon, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon as any} size={24} color={config.color} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationType}>{config.label}</Text>
                {isBus && busData ? (
                  <View style={styles.busPreview}>
                    {busData.buses.map((bus) => {
                      const nextBus = getNextBus(bus.schedule);
                      return (
                        <View key={bus.line} style={styles.busPreviewItem}>
                          <View style={[styles.busLineBadge, { backgroundColor: bus.color }]}>
                            <Text style={styles.busLineText}>{bus.line}</Text>
                          </View>
                          {nextBus && (
                            <Text style={styles.nextBusText}>
                              {nextBus.minutesUntil} dk
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.locationDescription} numberOfLines={2}>
                    {location.description}
                  </Text>
                )}
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity style={styles.actionIcon}>
                  <Ionicons 
                    name={isBus ? "time-outline" : "navigate-outline"} 
                    size={20} 
                    color="#667eea" 
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Otobüs Saatleri Modal */}
      <Modal
        visible={showBusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconContainer, { backgroundColor: '#BB8FCE20' }]}>
                  <Ionicons name="bus" size={24} color="#BB8FCE" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Otobüs Saatleri</Text>
                  <Text style={styles.modalSubtitle}>{selectedBus?.name}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowBusModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Hat Seçici */}
            <View style={styles.busLineTabs}>
              {selectedBus?.buses.map((bus) => (
                <TouchableOpacity
                  key={bus.line}
                  style={[
                    styles.busLineTab,
                    selectedBusLine === bus.line && { backgroundColor: bus.color },
                  ]}
                  onPress={() => setSelectedBusLine(bus.line)}
                >
                  <Text style={[
                    styles.busLineTabText,
                    selectedBusLine === bus.line && styles.busLineTabTextActive,
                  ]}>
                    {bus.line}
                  </Text>
                  <Text style={[
                    styles.busRouteText,
                    selectedBusLine === bus.line && styles.busRouteTextActive,
                  ]}>
                    {bus.route}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sefer Saatleri */}
            <ScrollView style={styles.scheduleList}>
              {selectedBus?.buses
                .find((b) => b.line === selectedBusLine)
                ?.schedule.map((item, index) => {
                  const now = new Date();
                  const currentTime = now.getHours() * 60 + now.getMinutes();
                  const [hours, minutes] = item.time.split(':').map(Number);
                  const busTime = hours * 60 + minutes;
                  const isPast = busTime < currentTime;
                  const isNext = !isPast && index === selectedBus?.buses
                    .find((b) => b.line === selectedBusLine)
                    ?.schedule.findIndex((s) => {
                      const [h, m] = s.time.split(':').map(Number);
                      return h * 60 + m > currentTime;
                    });

                  return (
                    <View
                      key={index}
                      style={[
                        styles.scheduleItem,
                        isPast && styles.scheduleItemPast,
                        isNext && styles.scheduleItemNext,
                      ]}
                    >
                      <View style={styles.scheduleTimeContainer}>
                        <Text style={[
                          styles.scheduleTime,
                          isPast && styles.scheduleTimePast,
                          isNext && styles.scheduleTimeNext,
                        ]}>
                          {item.time}
                        </Text>
                        {isNext && (
                          <View style={styles.nextBadge}>
                            <Text style={styles.nextBadgeText}>Sonraki</Text>
                          </View>
                        )}
                      </View>
                      {item.note ? (
                        <View style={[
                          styles.noteBadge,
                          item.note === 'Yoğun' && styles.noteBadgeBusy,
                          item.note === 'Son sefer' && styles.noteBadgeLast,
                          item.note === 'İlk sefer' && styles.noteBadgeFirst,
                        ]}>
                          <Text style={styles.noteText}>{item.note}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
            </ScrollView>

            {/* Alt Bilgi */}
            <View style={styles.modalFooter}>
              <Ionicons name="information-circle-outline" size={16} color="#64748b" />
              <Text style={styles.footerText}>
                Saatler tahminidir, trafik durumuna göre değişebilir.
              </Text>
            </View>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapPlaceholder: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 20,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  gridLineH: {
    height: 1,
    left: 0,
    right: 0,
  },
  gridLineV: {
    width: 1,
    top: 0,
    bottom: 0,
  },
  markersContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerSelected: {
    zIndex: 10,
  },
  markerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabel: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  markerLabelText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  compass: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compassText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  locationList: {
    flex: 1,
  },
  locationListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  listCount: {
    color: '#64748b',
    fontWeight: '400',
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  locationCardSelected: {
    borderColor: 'rgba(102, 126, 234, 0.4)',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 14,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  locationType: {
    fontSize: 12,
    color: '#667eea',
    marginTop: 2,
  },
  locationDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 16,
  },
  busPreview: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  busPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  busLineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  busLineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  nextBusText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  locationActions: {
    justifyContent: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  busLineTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  busLineTab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  busLineTabText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94a3b8',
  },
  busLineTabTextActive: {
    color: '#fff',
  },
  busRouteText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  busRouteTextActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scheduleList: {
    maxHeight: 350,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  scheduleItemPast: {
    opacity: 0.4,
  },
  scheduleItemNext: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  scheduleTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scheduleTimePast: {
    color: '#64748b',
  },
  scheduleTimeNext: {
    color: '#4ECDC4',
  },
  nextBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  noteBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  noteBadgeBusy: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  noteBadgeLast: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  noteBadgeFirst: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  noteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
  },
});
