import {
    AcademicCalendar,
    createAcademicCalendar,
    deleteAcademicCalendar,
    getAcademicCalendar,
    updateAcademicCalendar,
} from '@/database/database';
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

const eventTypes = [
    { value: 'semester', label: 'Dönem', icon: 'school-outline' },
    { value: 'exam', label: 'Sınav', icon: 'document-text-outline' },
    { value: 'course_exam', label: 'Ders Sınavı', icon: 'clipboard-outline' },
    { value: 'holiday', label: 'Tatil', icon: 'flag-outline' },
    { value: 'deadline', label: 'Son Tarih', icon: 'warning-outline' },
    { value: 'registration', label: 'Kayıt', icon: 'create-outline' },
];

export default function AcademicCalendarManagement() {
    const [events, setEvents] = useState<AcademicCalendar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AcademicCalendar | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        end_date: '',
        event_type: 'semester',
        icon: 'calendar-outline',
        course_code: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await getAcademicCalendar();
            setEvents(data);
        } catch (error) {
            console.error('Error loading academic calendar:', error);
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
            event_date: '',
            end_date: '',
            event_type: 'semester',
            icon: 'calendar-outline',
            course_code: '',
        });
        setEditingEvent(null);
    };

    const openModal = (event?: AcademicCalendar) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                description: event.description || '',
                event_date: event.event_date,
                end_date: event.end_date || '',
                event_type: event.event_type,
                icon: event.icon || 'calendar-outline',
                course_code: event.course_code || '',
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
            if (editingEvent) {
                await updateAcademicCalendar(editingEvent.id!, {
                    title: formData.title.trim(),
                    description: formData.description.trim() || undefined,
                    event_date: formData.event_date,
                    end_date: formData.end_date.trim() || undefined,
                    event_type: formData.event_type,
                    icon: formData.icon || undefined,
                    course_code: formData.course_code.trim() || undefined,
                });
                Alert.alert('Başarılı', 'Akademik takvim güncellendi');
            } else {
                await createAcademicCalendar({
                    title: formData.title.trim(),
                    description: formData.description.trim() || undefined,
                    event_date: formData.event_date,
                    end_date: formData.end_date.trim() || undefined,
                    event_type: formData.event_type,
                    icon: formData.icon || undefined,
                    course_code: formData.course_code.trim() || undefined,
                });
                Alert.alert('Başarılı', 'Akademik takvim eklendi');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving academic calendar:', error);
            Alert.alert('Hata', 'Akademik takvim kaydedilemedi');
        }
    };

    const handleDelete = async (event: AcademicCalendar) => {
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
                            await deleteAcademicCalendar(event.id!);
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
        });
    };

    const getEventTypeInfo = (type: string) => {
        return eventTypes.find((t) => t.value === type) || eventTypes[0];
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
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Akademik Takvim</Text>
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
                        <Text style={styles.emptyText}>Akademik takvim etkinliği bulunmuyor</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyButtonText}>Etkinlik Ekle</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    events.map((event) => {
                        const typeInfo = getEventTypeInfo(event.event_type);
                        return (
                            <View key={event.id} style={styles.eventCard}>
                                <View style={styles.eventHeader}>
                                    <View style={styles.eventInfo}>
                                        <View style={styles.eventTitleRow}>
                                            <View style={[styles.eventIcon, { backgroundColor: '#667eea20' }]}>
                                                <Ionicons name={typeInfo.icon as any} size={18} color="#667eea" />
                                            </View>
                                            <Text style={styles.eventTitle}>{event.title}</Text>
                                        </View>
                                        {event.course_code && (
                                            <View style={styles.courseBadge}>
                                                <Text style={styles.courseBadgeText}>{event.course_code}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.eventTypeBadge}>
                                        <Text style={styles.eventTypeText}>{typeInfo.label}</Text>
                                    </View>
                                </View>

                                {event.description && (
                                    <Text style={styles.eventDescription}>{event.description}</Text>
                                )}

                                <View style={styles.eventFooter}>
                                    <View style={styles.eventDates}>
                                        <View style={styles.eventDateItem}>
                                            <Ionicons name="calendar-outline" size={14} color="#667eea" />
                                            <Text style={styles.eventDateText}>
                                                {formatDate(event.event_date)}
                                                {event.end_date && ` - ${formatDate(event.end_date)}`}
                                            </Text>
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
                                <Text style={styles.formLabel}>Başlık *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={formData.title}
                                    onChangeText={(v) => setFormData({ ...formData, title: v })}
                                    placeholder="Güz Dönemi Başlangıcı"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Açıklama</Text>
                                <TextInput
                                    style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                                    value={formData.description}
                                    onChangeText={(v) => setFormData({ ...formData, description: v })}
                                    placeholder="Güz dönemi derslerinin başlangıcı"
                                    placeholderTextColor="#64748b"
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Etkinlik Türü *</Text>
                                <View style={styles.buttonGroup}>
                                    {eventTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.value}
                                            style={[
                                                styles.selectButton,
                                                { flex: 1 },
                                                formData.event_type === type.value && styles.selectButtonActive,
                                            ]}
                                            onPress={() => {
                                                setFormData({
                                                    ...formData,
                                                    event_type: type.value,
                                                    icon: type.icon,
                                                });
                                            }}
                                        >
                                            <Ionicons
                                                name={type.icon as any}
                                                size={16}
                                                color={
                                                    formData.event_type === type.value ? '#fff' : '#64748b'
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.selectButtonText,
                                                    formData.event_type === type.value &&
                                                        styles.selectButtonTextActive,
                                                ]}
                                            >
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.formLabel}>Başlangıç Tarihi * (YYYY-MM-DD)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={formData.event_date}
                                        onChangeText={(v) => setFormData({ ...formData, event_date: v })}
                                        placeholder="2024-09-16"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>Bitiş Tarihi (YYYY-MM-DD)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={formData.end_date}
                                        onChangeText={(v) => setFormData({ ...formData, end_date: v })}
                                        placeholder="2024-09-20"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>

                            {formData.event_type === 'course_exam' && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Ders Kodu</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={formData.course_code}
                                        onChangeText={(v) => setFormData({ ...formData, course_code: v })}
                                        placeholder="BIL201"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            )}

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
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
        color: '#64748b',
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
    eventTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    eventIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
    },
    courseBadge: {
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    courseBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#667eea',
    },
    eventTypeBadge: {
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    eventTypeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#667eea',
    },
    eventDescription: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
        marginBottom: 12,
    },
    eventFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: 12,
    },
    eventDates: {
        marginBottom: 12,
    },
    eventDateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventDateText: {
        fontSize: 13,
        color: '#64748b',
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
        backgroundColor: '#1a1a2e',
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
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
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
        color: '#94a3b8',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    selectButtonActive: {
        backgroundColor: '#667eea',
    },
    selectButtonText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
    selectButtonTextActive: {
        color: '#fff',
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

