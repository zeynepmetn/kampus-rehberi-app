import {
    Announcement,
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncements,
    updateAnnouncement,
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

export default function AnnouncementsManagement() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);
    
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const [formData, setFormData] = useState({
        owner: '',
        title: '',
        description: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await getAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error loading announcements:', error);
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
            owner: '',
            title: '',
            description: '',
        });
        setEditingAnnouncement(null);
    };

    const openModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                owner: announcement.owner,
                title: announcement.title,
                description: announcement.description,
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.owner.trim() || !formData.title.trim() || !formData.description.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
            return;
        }

        try {
            if (editingAnnouncement) {
                await updateAnnouncement(editingAnnouncement.id!, {
                    owner: formData.owner.trim(),
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                });
                Alert.alert('Başarılı', 'Duyuru güncellendi');
            } else {
                await createAnnouncement({
                    owner: formData.owner.trim(),
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                });
                Alert.alert('Başarılı', 'Duyuru eklendi');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving announcement:', error);
            Alert.alert('Hata', 'Duyuru kaydedilemedi');
        }
    };

    const handleDelete = async (announcement: Announcement) => {
        Alert.alert(
            'Duyuruyu Sil',
            `"${announcement.title}" duyurusunu silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAnnouncement(announcement.id!);
                            Alert.alert('Başarılı', 'Duyuru silindi');
                            loadData();
                        } catch (error) {
                            console.error('Error deleting announcement:', error);
                            Alert.alert('Hata', 'Duyuru silinemedi');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
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
                <ActivityIndicator size="large" color={colors.primary} />
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
                    <Text style={styles.headerTitle}>Duyuru Yönetimi</Text>
                    <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Announcements List */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                }
            >
                {announcements.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="megaphone-outline" size={64} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>Duyuru bulunmuyor</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyButtonText}>Duyuru Ekle</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    announcements.map((announcement) => (
                        <View key={announcement.id} style={styles.announcementCard}>
                            <View style={styles.announcementHeader}>
                                <View style={styles.announcementInfo}>
                                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                                    <Text style={styles.announcementOwner}>👤 {announcement.owner}</Text>
                                </View>
                                <View style={styles.announcementStats}>
                                    <View style={styles.statBadge}>
                                        <Ionicons name="heart" size={14} color="#ef4444" />
                                        <Text style={styles.statText}>{announcement.likes_count || 0}</Text>
                                    </View>
                                    <View style={styles.statBadge}>
                                        <Ionicons name="chatbubble" size={14} color="#667eea" />
                                        <Text style={styles.statText}>{announcement.comments_count || 0}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.announcementDescription}>{announcement.description}</Text>

                            <View style={styles.announcementFooter}>
                                <Text style={styles.announcementDate}>{formatDate(announcement.created_at)}</Text>
                                <View style={styles.announcementActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => openModal(announcement)}
                                    >
                                        <Ionicons name="create-outline" size={18} color="#667eea" />
                                        <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleDelete(announcement)}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                        <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
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
                                {editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Duyuru Sahibi *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={formData.owner}
                                    onChangeText={(v) => setFormData({ ...formData, owner: v })}
                                    placeholder="Yemekhane"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Başlık *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={formData.title}
                                    onChangeText={(v) => setFormData({ ...formData, title: v })}
                                    placeholder="🍕 İtalyan Haftası Başladı!"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Açıklama *</Text>
                                <TextInput
                                    style={[styles.formInput, { minHeight: 120, textAlignVertical: 'top' }]}
                                    value={formData.description}
                                    onChangeText={(v) => setFormData({ ...formData, description: v })}
                                    placeholder="Duyuru içeriği..."
                                    placeholderTextColor={colors.textTertiary}
                                    multiline
                                />
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>
                                    {editingAnnouncement ? 'Güncelle' : 'Kaydet'}
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
    announcementCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    announcementHeader: {
        marginBottom: 12,
    },
    announcementInfo: {
        marginBottom: 8,
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6,
    },
    announcementOwner: {
        fontSize: 13,
        color: '#667eea',
        fontWeight: '500',
    },
    announcementStats: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    announcementDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    announcementFooter: {
        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,
        paddingTop: 12,
    },
    announcementDate: {
        fontSize: 12,
        color: colors.textTertiary,
        marginBottom: 12,
    },
    announcementActions: {
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
