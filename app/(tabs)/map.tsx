import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

type LocationType = 'all' | 'building' | 'parking' | 'cafeteria' | 'mosque' | 'bus' | 'other';

interface CampusLocation {
  id: string;
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  description?: string;
}

const typeConfig: Record<string, { icon: string; color: string; label: string; markerColor: string }> = {
  building: { icon: 'business', color: '#667eea', label: 'Binalar', markerColor: '#667eea' },
  parking: { icon: 'car', color: '#F59E0B', label: 'Otopark', markerColor: '#F59E0B' },
  cafeteria: { icon: 'cafe', color: '#10B981', label: 'Kafeterya', markerColor: '#10B981' },
  mosque: { icon: 'moon', color: '#8B5CF6', label: 'Cami', markerColor: '#8B5CF6' },
  bus: { icon: 'bus', color: '#EC4899', label: 'Otobüs', markerColor: '#EC4899' },
  library: { icon: 'library', color: '#4ECDC4', label: 'Kütüphane', markerColor: '#4ECDC4' },
  sports: { icon: 'football', color: '#EF4444', label: 'Spor', markerColor: '#EF4444' },
  security: { icon: 'shield-checkmark', color: '#6366F1', label: 'Güvenlik', markerColor: '#6366F1' },
  service: { icon: 'bicycle', color: '#14B8A6', label: 'Hizmet', markerColor: '#14B8A6' },
  other: { icon: 'location', color: '#94a3b8', label: 'Diğer', markerColor: '#94a3b8' },
};

// Kampüs konumları
const campusLocations: CampusLocation[] = [
  {
    id: 'rektorluk',
    name: 'Rektörlük',
    type: 'building',
    latitude: 40.570986265947425,
    longitude: 34.98100311246755,
    description: 'Üniversite Rektörlük Binası',
  },
  {
    id: 'muhendislik',
    name: 'Mühendislik Fakültesi',
    type: 'building',
    latitude: 40.57038118392237,
    longitude: 34.98223970086682,
    description: 'Mühendislik Fakültesi Ana Binası',
  },
  {
    id: 'muhendislik-kafeterya',
    name: 'Mühendislik Fakültesi Kafeterya',
    type: 'cafeteria',
    latitude: 40.5705674740146,
    longitude: 34.98160595985285,
    description: 'Mühendislik Fakültesi Kafeteryası',
  },
  {
    id: 'kutuphane',
    name: 'Kütüphane',
    type: 'library',
    latitude: 40.57220041170529,
    longitude: 34.985223457019224,
    description: 'Merkez Kütüphane',
  },
  {
    id: 'ilahiyat',
    name: 'İlahiyat Fakültesi',
    type: 'building',
    latitude: 40.57326824038024,
    longitude: 34.98456114931035,
    description: 'İlahiyat Fakültesi Binası',
  },
  {
    id: 'spor-bilimleri',
    name: 'Spor Bilimleri Fakültesi',
    type: 'sports',
    latitude: 40.568905913376675,
    longitude: 34.98166313188985,
    description: 'Spor Bilimleri Fakültesi',
  },
  {
    id: 'hubtuam',
    name: 'HÜBTUAM',
    type: 'building',
    latitude: 40.56841607026478,
    longitude: 34.97893201640681,
    description: 'HÜBTUAM Binası',
  },
  {
    id: 'besyo-acik-saha',
    name: 'BESYO Açık Saha',
    type: 'sports',
    latitude: 40.568557104929646,
    longitude: 34.98024413687926,
    description: 'Beden Eğitimi ve Spor Yüksekokulu Açık Saha',
  },
  {
    id: 'otopark-1',
    name: 'Otopark',
    type: 'parking',
    latitude: 40.57125980762864,
    longitude: 34.98099340317669,
    description: 'Açık Otopark Alanı',
  },
  {
    id: 'otopark-2',
    name: 'Otopark',
    type: 'parking',
    latitude: 40.56965939110718,
    longitude: 34.980561468585854,
    description: 'Açık Otopark Alanı',
  },
  {
    id: 'otopark-3',
    name: 'Otopark',
    type: 'parking',
    latitude: 40.572027400895124,
    longitude: 34.98432350261007,
    description: 'Açık Otopark Alanı',
  },
  {
    id: 'otopark-4',
    name: 'Otopark',
    type: 'parking',
    latitude: 40.568188177258804,
    longitude: 34.97865243475386,
    description: 'Açık Otopark Alanı',
  },
  {
    id: 'otopark-5',
    name: 'Otopark',
    type: 'parking',
    latitude: 40.57017004831113,
    longitude: 34.98207571824509,
    description: 'Açık Otopark Alanı',
  },
  {
    id: 'cami',
    name: 'Cami',
    type: 'mosque',
    latitude: 40.571054967940185,
    longitude: 34.98380395541308,
    description: 'Kampüs Camii',
  },
  {
    id: 'guvenlik',
    name: 'Güvenlik',
    type: 'security',
    latitude: 40.56942621554099,
    longitude: 34.984260191061125,
    description: 'Kampüs Güvenlik Birimi',
  },
  {
    id: 'corbis',
    name: 'Çorbis (Bisiklet Kiralama)',
    type: 'service',
    latitude: 40.57157929968973,
    longitude: 34.98446307513721,
    description: 'Bisiklet Kiralama Noktası',
  },
  {
    id: 'otobus-duragi',
    name: 'Otobüs Durağı',
    type: 'bus',
    latitude: 40.57169680919635,
    longitude: 34.98447822622024,
    description: 'Kampüs Otobüs Durağı',
  },
  {
    id: 'velipasa',
    name: 'Velipaşa Kahvecisi',
    type: 'cafeteria',
    latitude: 40.57190880671348,
    longitude: 34.98507826322064,
    description: 'Velipaşa Kahvecisi',
  },
  {
    id: 'genc-ofis',
    name: 'Genç Ofis',
    type: 'building',
    latitude: 40.57228881398772,
    longitude: 34.985224325064344,
    description: 'Genç Ofis',
  },
  {
    id: 'yemekhane',
    name: 'Yemekhane',
    type: 'cafeteria',
    latitude: 40.57214404710539,
    longitude: 34.98523221917329,
    description: 'Merkez Yemekhane',
  },
  {
    id: 'guvenlik-2',
    name: 'Güvenlik',
    type: 'security',
    latitude: 40.567962135251335,
    longitude: 34.97740287752038,
    description: 'Kampüs Güvenlik Birimi',
  },
  {
    id: 'ilahiyat-kafeterya',
    name: 'İlahiyat Fakültesi Kafeterya',
    type: 'cafeteria',
    latitude: 40.57310131924957,
    longitude: 34.98443522782947,
    description: 'İlahiyat Fakültesi Kafeteryası',
  },
];

// Otobüs saatleri
const busSchedule = {
  '11-A': {
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
  '11-C': {
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
};

// Kampüs merkezi (tüm koordinatların ortası)
const CAMPUS_CENTER = {
  latitude: 40.5705,
  longitude: 34.9825,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [selectedType, setSelectedType] = useState<LocationType | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [showBusModal, setShowBusModal] = useState(false);
  const [selectedBusLine, setSelectedBusLine] = useState<string>('11-A');

  const filteredLocations =
    selectedType === 'all'
      ? campusLocations
      : campusLocations.filter((loc) => loc.type === selectedType);

  const filterTypes: (LocationType | 'all')[] = ['all', 'building', 'parking', 'cafeteria', 'bus'];

  const handleMarkerPress = (location: CampusLocation) => {
    setSelectedLocation(location);
    if (location.type === 'bus') {
      setShowBusModal(true);
    }
  };

  const handleLocationCardPress = (location: CampusLocation) => {
    setSelectedLocation(location);
    if (location.type === 'bus') {
      setShowBusModal(true);
    }
    // Haritayı konuma taşı
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    }, 500);
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

  const getMarkerColor = (type: string) => {
    return typeConfig[type]?.markerColor || '#94a3b8';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <Text style={styles.headerTitle}>Kampüs Haritası</Text>
        <Text style={styles.headerSubtitle}>Konumları keşfedin</Text>
      </LinearGradient>

      {/* Google Maps */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={CAMPUS_CENTER}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          mapType="hybrid"
        >
          {filteredLocations.map((location) => {
            const config = typeConfig[location.type] || typeConfig.other;
            return (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
                description={location.description}
                pinColor={config.markerColor}
                onPress={() => handleMarkerPress(location)}
              >
                <View style={[styles.customMarker, { backgroundColor: config.markerColor }]}>
                  <Ionicons name={config.icon as any} size={16} color="#fff" />
                </View>
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{location.name}</Text>
                    {location.description && (
                      <Text style={styles.calloutDescription}>{location.description}</Text>
                    )}
                    <View style={[styles.calloutBadge, { backgroundColor: config.markerColor }]}>
                      <Text style={styles.calloutBadgeText}>{config.label}</Text>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScrollView}
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
                size={14}
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
          {selectedType === 'all' ? 'Tüm Konumlar' : typeConfig[selectedType]?.label || 'Konumlar'}
          <Text style={styles.listCount}> ({filteredLocations.length})</Text>
        </Text>

        {filteredLocations.map((location) => {
          const config = typeConfig[location.type] || typeConfig.other;
          const isSelected = selectedLocation?.id === location.id;
          const isBus = location.type === 'bus';

          return (
            <TouchableOpacity
              key={location.id}
              style={[styles.locationCard, isSelected && styles.locationCardSelected]}
              onPress={() => handleLocationCardPress(location)}
              activeOpacity={0.7}
            >
              <View style={[styles.locationIcon, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon as any} size={24} color={config.color} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationType}>{config.label}</Text>
                {isBus ? (
                  <View style={styles.busPreview}>
                    {Object.values(busSchedule).map((bus) => {
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
                    name={isBus ? 'time-outline' : 'navigate-outline'}
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
                <View style={[styles.modalIconContainer, { backgroundColor: '#EC489920' }]}>
                  <Ionicons name="bus" size={24} color="#EC4899" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Otobüs Saatleri</Text>
                  <Text style={styles.modalSubtitle}>Kampüs Otobüs Durağı</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowBusModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Hat Seçici */}
            <View style={styles.busLineTabs}>
              {Object.values(busSchedule).map((bus) => (
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
              {busSchedule[selectedBusLine as keyof typeof busSchedule]?.schedule.map((item, index) => {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                const [hours, minutes] = item.time.split(':').map(Number);
                const busTime = hours * 60 + minutes;
                const isPast = busTime < currentTime;
                const isNext = !isPast && index === busSchedule[selectedBusLine as keyof typeof busSchedule]?.schedule.findIndex((s) => {
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
    height: 280,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContainer: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    minWidth: 150,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  calloutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  calloutBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  filterText: {
    fontSize: 11,
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
