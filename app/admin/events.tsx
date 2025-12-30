import {
    createEvent,
    deleteEvent,
    Event,
    getEvents,
    updateEvent,
} from '@/database/database';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EventsManagement() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);
    
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '',
        event_time: '',
        organizer: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await getEvents();
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            location: '',
            event_date: '',
            event_time: '',
            organizer: '',
        });
        setEditingEvent(null);
    };

    const openModal = (event?: Event) => {
        if (event) {
            setEditingEvent(event);
            const eventDate = new Date(event.event_date);
            setFormData({
                title: event.title,
                description: event.description || '',
                location: event.location || '',
                event_date: eventDate.toISOString().split('T')[0],
                event_time: eventDate.toTimeString().split(' ')[0].substring(0, 5),
                organizer: event.organizer || '',
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.event_date.trim()) {
            Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            const eventDateTime = formData.event_time
                ? `${formData.event_date}T${formData.event_time}:00`
                : `${formData.event_date}T12:00:00`;

            if (editingEvent) {
                await updateEvent(editingEvent.id!, {
                    title: formData.title.trim(),
                    description: formData.description.trim() || undefined,
                    location: formData.location.trim() || undefined,
                    event_date: eventDateTime,
                    organizer: formData.organizer.trim() || undefined,
                });
                Alert.alert('Başarılı', 'Etkinlik güncellendi');
            } else {
                await createEvent({
                    title: formData.title.trim(),
                    description: formData.description.trim() || undefined,
                    location: formData.location.trim() || undefined,
                    event_date: eventDateTime,
                    organizer: formData.organizer.trim() || undefined,
                });
                Alert.alert('Başarılı', 'Etkinlik eklendi');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Hata', 'Etkinlik kaydedilemedi');
        }
    };

    const handleDelete = async (event: Event) => {
        Alert.alert(
            'Etkinliği Sil',
            `"${event.title}" etkinliğini silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEvent(event.id!);
                            Alert.alert('Başarılı', 'Etkinlik silindi');
                            loadData();
                        } catch (error) {
                            console.error('Error deleting event:', error);
                            Alert.alert('Hata', 'Etkinlik silinemedi');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={colors.headerGradient} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Etkinlik Yönetimi</Text>
                    <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Events List */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#667eea" />
                }
            >
                {events.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#64748b" />
                        <Text style={styles.emptyText}>Etkinlik bulunmuyor</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyButtonText}>Etkinlik Ekle</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    events.map((event) => {
                        const eventDate = new Date(event.event_date);
                        return (
                            <View key={event.id} style={styles.eventCard}>
                                <View style={styles.eventHeader}>
                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventTitle}>{event.title}</Text>
                                        {event.organizer && (
                                            <Text style={styles.eventOrganizer}>👤 {event.organizer}</Text>
                                        )}
                                    </View>
                                    <View style={styles.eventDateBadge}>
                                        <Text style={styles.eventDateDay}>{eventDate.getDate()}</Text>
                                        <Text style={styles.eventDateMonth}>
                                            {eventDate.toLocaleDateString('tr-TR', { month: 'short' })}
                                        </Text>
                                    </View>
                                </View>

                                {event.description && (
                                    <Text style={styles.eventDescription}>{event.description}</Text>
                                )}

                                <View style={styles.eventFooter}>
                                    <View style={styles.eventMeta}>
                                        {event.location && (
                                            <View style={styles.eventMetaItem}>
                                                <Ionicons name="location-outline" size={16} color="#667eea" />
                                                <Text style={styles.eventMetaText}>{event.location}</Text>
                                            </View>
                                        )}
                                        <View style={styles.eventMetaItem}>
                                            <Ionicons name="time-outline" size={16} color="#667eea" />
                                            <Text style={styles.eventMetaText}>{formatDate(event.event_date)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.eventActions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => openModal(event)}
                                        >
                                            <Ionicons name="create-outline" size={18} color="#667eea" />
                                            <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleDelete(event)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                            <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Form Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Etkinlik Adı *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={formData.title}
                                    onChangeText={(v) => setFormData({ ...formData, title: v })}
                                    placeholder="Konser"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Açıklama</Text>
                                <TextInput
                                    style={[styles.formInput, { minHeight: 100, textAlignVertical: 'top' }]}
                                    value={formData.description}
                                    onChangeText={(v) => setFormData({ ...formData, description: v })}
                                    placeholder="Etkinlik açıklaması..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Yer</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={formData.location}
                                    onChangeText={(v) => setFormData({ ...formData, location: v })}
                                    placeholder="Spor Salonu"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.formLabel}>Tarih * (YYYY-MM-DD)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={formData.event_date}
                                        onChangeText={(v) => setFormData({ ...formData, event_date: v })}
                                        placeholder="2025-01-15"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>Saat (HH:MM)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={formData.event_time}
                                        onChangeText={(v) => setFormData({ ...formData, event_time: v })}
                                        placeholder="18:00"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Etkinlik Sahibi</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={formData.organizer}
                                    onChangeText={(v) => setFormData({ ...formData, organizer: v })}
                                    placeholder="Öğrenci Konseyi"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>
                                    {editingEvent ? 'Güncelle' : 'Kaydet'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#667eea',
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
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: colors.textTertiary,
        fontSize: 14,
        marginTop: 12,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#667eea',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 20,
        gap: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    eventCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6,
    },
    eventOrganizer: {
        fontSize: 13,
        color: '#667eea',
        fontWeight: '500',
    },
    eventDateBadge: {
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 60,
    },
    eventDateDay: {
        fontSize: 20,
        fontWeight: '700',
        color: '#667eea',
    },
    eventDateMonth: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    eventDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    eventFooter: {
        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,
        paddingTop: 12,
    },
    eventMeta: {
        marginBottom: 12,
        gap: 6,
    },
    eventMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventMetaText: {
        fontSize: 13,
        color: colors.textTertiary,
    },
    eventActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: 8,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    formContainer: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    formRow: {
        flexDirection: 'row',
    },
    formLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: 10,
        padding: 12,
        color: colors.text,
        fontSize: 14,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    saveButton: {
        backgroundColor: '#667eea',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

