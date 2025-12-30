import { useAuth } from '@/context/AuthContext';
import { useCafeteria } from '@/context/CafeteriaContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type Tab = 'menu' | 'posts' | 'events';

export default function CameraScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const { posts, menuItems, snacks, events, toggleLike, addComment } = useCafeteria();
  const { student } = useAuth();
  const { colors, isDark } = useTheme();
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const styles = createStyles(colors, isDark);

  const handleAddComment = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (content && student?.first_name) {
      addComment(postId, `${student.first_name} ${student.last_name}`, content);
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Az önce';
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>📅 Bugünün Menüsü</Text>
      
      {menuItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Bugün için menü bulunmuyor</Text>
        </View>
      ) : (
        <>
          {['main', 'side', 'dessert', 'drink'].map((category) => {
            const items = menuItems.filter((item) => item.category === category);
            if (items.length === 0) return null;
            
            const categoryTitles: Record<string, string> = {
              main: '🍽️ Ana Yemekler',
              side: '🥗 Yan Lezzetler',
              dessert: '🍰 Tatlılar',
              drink: '🥤 İçecekler',
            };

            return (
              <View key={category} style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>{categoryTitles[category]}</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.menuItem}>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemDesc}>{item.description}</Text>
                    </View>
                    <View style={styles.menuItemPrice}>
                      <Text style={styles.priceText}>₺{item.price}</Text>
                      {item.available ? (
                        <View style={styles.availableBadge}>
                          <Text style={styles.availableText}>Mevcut</Text>
                        </View>
                      ) : (
                        <View style={styles.unavailableBadge}>
                          <Text style={styles.unavailableText}>Tükendi</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
          
          {snacks.length > 0 && (
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>🍿 Aperatifler</Text>
              {snacks.map((snack) => (
                <View key={snack.id} style={styles.menuItem}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>{snack.name}</Text>
                    {snack.description && (
                      <Text style={styles.menuItemDesc}>{snack.description}</Text>
                    )}
                  </View>
                  <View style={styles.menuItemPrice}>
                    <Text style={styles.priceText}>₺{snack.price}</Text>
                    {snack.available === 1 ? (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>Mevcut</Text>
                      </View>
                    ) : (
                      <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableText}>Tükendi</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderPosts = () => (
    <View style={styles.postsContainer}>
      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.postAvatar}>
              <Ionicons name="restaurant" size={20} color="#fff" />
            </View>
            <View style={styles.postHeaderInfo}>
              <Text style={styles.postAuthor}>Yemekhane</Text>
              <Text style={styles.postDate}>{formatDate(post.date)}</Text>
            </View>
          </View>
          
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>
          
          {/* Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleLike(post.id)}
            >
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={post.isLiked ? colors.error : colors.textSecondary}
              />
              <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                {post.likes}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.actionText}>{post.comments.length}</Text>
            </View>
          </View>

          {/* Comments */}
          {post.comments.length > 0 && (
            <View style={styles.commentsSection}>
              {post.comments.slice(-3).map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{comment.userName}</Text>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Yorum yaz..."
              placeholderTextColor={colors.placeholder}
              value={commentInputs[post.id] || ''}
              onChangeText={(text) =>
                setCommentInputs((prev) => ({ ...prev, [post.id]: text }))
              }
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleAddComment(post.id)}
            >
              <Ionicons name="send" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderEvents = () => (
    <View style={styles.eventsContainer}>
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Henüz etkinlik bulunmuyor</Text>
        </View>
      ) : (
        events.map((event) => {
          const eventDate = new Date(event.event_date);
          return (
            <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.primary + '30', colors.primary + '10']}
                style={styles.eventGradient}
              >
                <View style={styles.eventDate}>
                  <Text style={styles.eventDateDay}>
                    {eventDate.getDate()}
                  </Text>
                  <Text style={styles.eventDateMonth}>
                    {eventDate.toLocaleDateString('tr-TR', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description && (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                  <View style={styles.eventMeta}>
                    {event.location && (
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.eventMetaText}>{event.location}</Text>
                      </View>
                    )}
                    {event.organizer && (
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.eventMetaText}>{event.organizer}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.lcdIcon}>
            <Ionicons name="tv-outline" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Ana Sayfa</Text>
          <Text style={styles.headerSubtitle}>Yemekhane & Etkinlikler</Text>
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'menu' && styles.tabButtonActive]}
          onPress={() => setActiveTab('menu')}
        >
          <Ionicons
            name="restaurant-outline"
            size={20}
            color={activeTab === 'menu' ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
            Menü
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="newspaper-outline"
            size={20}
            color={activeTab === 'posts' ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
            Duyurular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'events' && styles.tabButtonActive]}
          onPress={() => setActiveTab('events')}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={activeTab === 'events' ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
            Etkinlikler
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'menu' && renderMenu()}
        {activeTab === 'posts' && renderPosts()}
        {activeTab === 'events' && renderEvents()}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  lcdIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.background,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary + '40',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  // Menu styles
  menuContainer: {
    gap: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  menuSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuItemDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  menuItemPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  availableBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  availableText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  unavailableText: {
    fontSize: 10,
    color: colors.error,
    fontWeight: '600',
  },
  // Posts styles
  postsContainer: {
    gap: 16,
  },
  postCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeaderInfo: {
    marginLeft: 12,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  postDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  likedText: {
    color: colors.error,
  },
  commentsSection: {
    marginTop: 12,
    gap: 8,
  },
  commentItem: {
    backgroundColor: colors.inputBackground,
    padding: 10,
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.inputText,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Events styles
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventGradient: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 16,
  },
  eventDate: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: isDark ? '#fff' : colors.primary,
  },
  eventDateMonth: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  eventMeta: {
    gap: 4,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 12,
  },
});
