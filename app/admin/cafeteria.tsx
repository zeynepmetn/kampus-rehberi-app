import {
    CafeteriaMenu,
    CafeteriaSnack,
    createCafeteriaMenu,
    createCafeteriaSnack,
    deleteCafeteriaMenu,
    deleteCafeteriaSnack,
    getCafeteriaMenuByDate,
    getCafeteriaSnacks,
    updateCafeteriaMenu,
    updateCafeteriaSnack
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

type Tab = 'menu' | 'snacks';

export default function CafeteriaManagement() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);
    
    const [activeTab, setActiveTab] = useState<Tab>('menu');
    const [menuItems, setMenuItems] = useState<CafeteriaMenu[]>([]);
    const [snacks, setSnacks] = useState<CafeteriaSnack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showSnackModal, setShowSnackModal] = useState(false);
    const [editingMenu, setEditingMenu] = useState<CafeteriaMenu | null>(null);
    const [editingSnack, setEditingSnack] = useState<CafeteriaSnack | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [menuForm, setMenuForm] = useState({
        name: '',
        description: '',
        price: '',
        category: 'main',
        available: true,
        menu_date: new Date().toISOString().split('T')[0],
    });

    const [snackForm, setSnackForm] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        available: true,
    });

    useEffect(() => {
        loadData();
    }, [selectedDate, activeTab]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            if (activeTab === 'menu') {
                const menu = await getCafeteriaMenuByDate(selectedDate);
                setMenuItems(menu);
            } else {
                const snacksData = await getCafeteriaSnacks();
                setSnacks(snacksData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    };

    const resetMenuForm = () => {
        setMenuForm({
            name: '',
            description: '',
            price: '',
            category: 'main',
            available: true,
            menu_date: selectedDate,
        });
        setEditingMenu(null);
    };

    const resetSnackForm = () => {
        setSnackForm({
            name: '',
            description: '',
            price: '',
            category: '',
            available: true,
        });
        setEditingSnack(null);
    };

    const openMenuModal = (menu?: CafeteriaMenu) => {
        if (menu) {
            setEditingMenu(menu);
            setMenuForm({
                name: menu.name,
                description: menu.description || '',
                price: menu.price.toString(),
                category: menu.category,
                available: menu.available === 1,
                menu_date: menu.menu_date,
            });
        } else {
            resetMenuForm();
        }
        setShowMenuModal(true);
    };

    const openSnackModal = (snack?: CafeteriaSnack) => {
        if (snack) {
            setEditingSnack(snack);
            setSnackForm({
                name: snack.name,
                description: snack.description || '',
                price: snack.price.toString(),
                category: snack.category || '',
                available: snack.available === 1,
            });
        } else {
            resetSnackForm();
        }
        setShowSnackModal(true);
    };

    const handleSaveMenu = async () => {
        if (!menuForm.name.trim() || !menuForm.price.trim()) {
            Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            if (editingMenu) {
                await updateCafeteriaMenu(editingMenu.id!, {
                    name: menuForm.name.trim(),
                    description: menuForm.description.trim() || undefined,
                    price: parseFloat(menuForm.price),
                    category: menuForm.category,
                    available: menuForm.available ? 1 : 0,
                    menu_date: menuForm.menu_date,
                });
                Alert.alert('Başarılı', 'Menü güncellendi');
            } else {
                await createCafeteriaMenu({
                    name: menuForm.name.trim(),
                    description: menuForm.description.trim() || undefined,
                    price: parseFloat(menuForm.price),
                    category: menuForm.category,
                    available: menuForm.available ? 1 : 0,
                    menu_date: menuForm.menu_date,
                });
                Alert.alert('Başarılı', 'Menü eklendi');
            }

            setShowMenuModal(false);
            resetMenuForm();
            loadData();
        } catch (error) {
            console.error('Error saving menu:', error);
            Alert.alert('Hata', 'Menü kaydedilemedi');
        }
    };

    const handleSaveSnack = async () => {
        if (!snackForm.name.trim() || !snackForm.price.trim()) {
            Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            if (editingSnack) {
                await updateCafeteriaSnack(editingSnack.id!, {
                    name: snackForm.name.trim(),
                    description: snackForm.description.trim() || undefined,
                    price: parseFloat(snackForm.price),
                    category: snackForm.category.trim() || undefined,
                    available: snackForm.available ? 1 : 0,
                });
                Alert.alert('Başarılı', 'Aperatif güncellendi');
            } else {
                await createCafeteriaSnack({
                    name: snackForm.name.trim(),
                    description: snackForm.description.trim() || undefined,
                    price: parseFloat(snackForm.price),
                    category: snackForm.category.trim() || undefined,
                    available: snackForm.available ? 1 : 0,
                });
                Alert.alert('Başarılı', 'Aperatif eklendi');
            }

            setShowSnackModal(false);
            resetSnackForm();
            loadData();
        } catch (error) {
            console.error('Error saving snack:', error);
            Alert.alert('Hata', 'Aperatif kaydedilemedi');
        }
    };

    const handleDeleteMenu = async (menu: CafeteriaMenu) => {
        Alert.alert(
            'Menüyü Sil',
            `"${menu.name}" menü öğesini silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCafeteriaMenu(menu.id!);
                            Alert.alert('Başarılı', 'Menü silindi');
                            loadData();
                        } catch (error) {
                            console.error('Error deleting menu:', error);
                            Alert.alert('Hata', 'Menü silinemedi');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteSnack = async (snack: CafeteriaSnack) => {
        Alert.alert(
            'Aperatifi Sil',
            `"${snack.name}" aperatifini silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCafeteriaSnack(snack.id!);
                            Alert.alert('Başarılı', 'Aperatif silindi');
                            loadData();
                        } catch (error) {
                            console.error('Error deleting snack:', error);
                            Alert.alert('Hata', 'Aperatif silinemedi');
                        }
                    },
                },
            ]
        );
    };

    const categoryLabels: Record<string, string> = {
        main: 'Ana Yemek',
        side: 'Yan Lezzet',
        dessert: 'Tatlı',
        drink: 'İçecek',
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
                    <Text style={styles.headerTitle}>Yemekhane Yönetimi</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => (activeTab === 'menu' ? openMenuModal() : openSnackModal())}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'menu' && styles.tabActive]}
                        onPress={() => setActiveTab('menu')}
                    >
                        <Ionicons
                            name="restaurant-outline"
                            size={18}
                            color={activeTab === 'menu' ? '#fff' : '#64748b'}
                        />
                        <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
                            Günlük Menü
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'snacks' && styles.tabActive]}
                        onPress={() => setActiveTab('snacks')}
                    >
                        <Ionicons
                            name="fast-food-outline"
                            size={18}
                            color={activeTab === 'snacks' ? '#fff' : '#64748b'}
                        />
                        <Text style={[styles.tabText, activeTab === 'snacks' && styles.tabTextActive]}>
                            Aperatifler
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Date Picker for Menu */}
                {activeTab === 'menu' && (
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateLabel}>Tarih:</Text>
                        <TextInput
                            style={styles.dateInput}
                            value={selectedDate}
                            onChangeText={setSelectedDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#64748b"
                        />
                    </View>
                )}
            </LinearGradient>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#667eea" />
                }
            >
                {activeTab === 'menu' ? (
                    menuItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="restaurant-outline" size={64} color="#64748b" />
                            <Text style={styles.emptyText}>Bu tarih için menü bulunmuyor</Text>
                            <TouchableOpacity style={styles.emptyButton} onPress={() => openMenuModal()}>
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.emptyButtonText}>Menü Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        menuItems.map((item) => (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        {item.description && (
                                            <Text style={styles.itemDescription}>{item.description}</Text>
                                        )}
                                    </View>
                                    <View style={styles.itemBadges}>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>
                                                {categoryLabels[item.category] || item.category}
                                            </Text>
                                        </View>
                                        <View style={[styles.availableBadge, item.available === 0 && styles.unavailableBadge]}>
                                            <Text style={styles.availableText}>
                                                {item.available === 1 ? 'Mevcut' : 'Tükendi'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.itemFooter}>
                                    <Text style={styles.priceText}>₺{item.price.toFixed(2)}</Text>
                                    <View style={styles.itemActions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => openMenuModal(item)}
                                        >
                                            <Ionicons name="create-outline" size={18} color="#667eea" />
                                            <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleDeleteMenu(item)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                            <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )
                ) : (
                    snacks.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="fast-food-outline" size={64} color="#64748b" />
                            <Text style={styles.emptyText}>Aperatif bulunmuyor</Text>
                            <TouchableOpacity style={styles.emptyButton} onPress={() => openSnackModal()}>
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.emptyButtonText}>Aperatif Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        snacks.map((snack) => (
                            <View key={snack.id} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{snack.name}</Text>
                                        {snack.description && (
                                            <Text style={styles.itemDescription}>{snack.description}</Text>
                                        )}
                                        {snack.category && (
                                            <Text style={styles.categoryText}>{snack.category}</Text>
                                        )}
                                    </View>
                                    <View style={[styles.availableBadge, snack.available === 0 && styles.unavailableBadge]}>
                                        <Text style={styles.availableText}>
                                            {snack.available === 1 ? 'Mevcut' : 'Tükendi'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.itemFooter}>
                                    <Text style={styles.priceText}>₺{snack.price.toFixed(2)}</Text>
                                    <View style={styles.itemActions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => openSnackModal(snack)}
                                        >
                                            <Ionicons name="create-outline" size={18} color="#667eea" />
                                            <Text style={[styles.actionText, { color: '#667eea' }]}>Düzenle</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleDeleteSnack(snack)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                            <Text style={[styles.actionText, { color: '#ef4444' }]}>Sil</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )
                )}
            </ScrollView>

            {/* Menu Modal */}
            <Modal
                visible={showMenuModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowMenuModal(false);
                    resetMenuForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingMenu ? 'Menü Düzenle' : 'Yeni Menü'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowMenuModal(false);
                                    resetMenuForm();
                                }}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>İsim *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={menuForm.name}
                                    onChangeText={(v) => setMenuForm({ ...menuForm, name: v })}
                                    placeholder="Mercimek Çorbası"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Açıklama</Text>
                                <TextInput
                                    style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                                    value={menuForm.description}
                                    onChangeText={(v) => setMenuForm({ ...menuForm, description: v })}
                                    placeholder="Geleneksel Türk mercimek çorbası"
                                    placeholderTextColor="#64748b"
                                    multiline
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.formLabel}>Fiyat *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={menuForm.price}
                                        onChangeText={(v) => setMenuForm({ ...menuForm, price: v })}
                                        placeholder="15.00"
                                        placeholderTextColor="#64748b"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>Kategori *</Text>
                                    <View style={styles.buttonGroup}>
                                        {['main', 'side', 'dessert', 'drink'].map((cat) => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[
                                                    styles.selectButton,
                                                    menuForm.category === cat && styles.selectButtonActive,
                                                ]}
                                                onPress={() => setMenuForm({ ...menuForm, category: cat })}
                                            >
                                                <Text
                                                    style={[
                                                        styles.selectButtonText,
                                                        menuForm.category === cat && styles.selectButtonTextActive,
                                                    ]}
                                                >
                                                    {categoryLabels[cat]}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Tarih *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={menuForm.menu_date}
                                    onChangeText={(v) => setMenuForm({ ...menuForm, menu_date: v })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setMenuForm({ ...menuForm, available: !menuForm.available })}
                                >
                                    <Ionicons
                                        name={menuForm.available ? 'checkbox' : 'checkbox-outline'}
                                        size={24}
                                        color={menuForm.available ? '#667eea' : '#64748b'}
                                    />
                                    <Text style={styles.checkboxLabel}>Mevcut</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMenu}>
                                <Text style={styles.saveButtonText}>
                                    {editingMenu ? 'Güncelle' : 'Kaydet'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Snack Modal */}
            <Modal
                visible={showSnackModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowSnackModal(false);
                    resetSnackForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingSnack ? 'Aperatif Düzenle' : 'Yeni Aperatif'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowSnackModal(false);
                                    resetSnackForm();
                                }}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>İsim *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={snackForm.name}
                                    onChangeText={(v) => setSnackForm({ ...snackForm, name: v })}
                                    placeholder="Patates Kızartması"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Açıklama</Text>
                                <TextInput
                                    style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                                    value={snackForm.description}
                                    onChangeText={(v) => setSnackForm({ ...snackForm, description: v })}
                                    placeholder="Klasik patates kızartması"
                                    placeholderTextColor="#64748b"
                                    multiline
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.formLabel}>Fiyat *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={snackForm.price}
                                        onChangeText={(v) => setSnackForm({ ...snackForm, price: v })}
                                        placeholder="25.00"
                                        placeholderTextColor="#64748b"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>Kategori</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={snackForm.category}
                                        onChangeText={(v) => setSnackForm({ ...snackForm, category: v })}
                                        placeholder="Atıştırmalık"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setSnackForm({ ...snackForm, available: !snackForm.available })}
                                >
                                    <Ionicons
                                        name={snackForm.available ? 'checkbox' : 'checkbox-outline'}
                                        size={24}
                                        color={snackForm.available ? '#667eea' : '#64748b'}
                                    />
                                    <Text style={styles.checkboxLabel}>Mevcut</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSnack}>
                                <Text style={styles.saveButtonText}>
                                    {editingSnack ? 'Güncelle' : 'Kaydet'}
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
        marginBottom: 12,
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
    tabsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    tabActive: {
        backgroundColor: '#667eea',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textTertiary,
    },
    tabTextActive: {
        color: '#fff',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    dateInput: {
        flex: 1,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: 8,
        padding: 10,
        color: colors.text,
        fontSize: 14,
        borderWidth: 1,
        borderColor: colors.cardBorder,
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
    itemCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    itemHeader: {
        marginBottom: 12,
    },
    itemInfo: {
        marginBottom: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 13,
        color: colors.textTertiary,
        marginBottom: 4,
    },
    itemBadges: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    categoryBadge: {
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#667eea',
    },
    availableBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    unavailableBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    availableText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10b981',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,
        paddingTop: 12,
    },
    priceText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#667eea',
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
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
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    selectButtonActive: {
        backgroundColor: '#667eea',
    },
    selectButtonText: {
        color: colors.textTertiary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    selectButtonTextActive: {
        color: '#fff',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkboxLabel: {
        fontSize: 14,
        color: colors.text,
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

