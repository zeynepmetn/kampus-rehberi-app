import { useAuth } from '@/context/AuthContext';
import { useCafeteria } from '@/context/CafeteriaContext';
import { campusEvents } from '@/data/schedule';
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
  const { posts, menuItems, toggleLike, addComment } = useCafeteria();
  const { student } = useAuth();
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleAddComment = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (content && student?.name) {
      addComment(postId, student.name, content);
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

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>📅 Bugünün Menüsü</Text>
      
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
                color={post.isLiked ? '#ef4444' : '#94a3b8'}
              />
              <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                {post.likes}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#94a3b8" />
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
              placeholderTextColor="#64748b"
              value={commentInputs[post.id] || ''}
              onChangeText={(text) =>
                setCommentInputs((prev) => ({ ...prev, [post.id]: text }))
              }
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleAddComment(post.id)}
            >
              <Ionicons name="send" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderEvents = () => (
    <View style={styles.eventsContainer}>
      {campusEvents.map((event) => (
        <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.8}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.1)']}
            style={styles.eventGradient}
          >
            <View style={styles.eventDate}>
              <Text style={styles.eventDateDay}>
                {event.date.getDate()}
              </Text>
              <Text style={styles.eventDateMonth}>
                {event.date.toLocaleDateString('tr-TR', { month: 'short' })}
              </Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>
              <View style={styles.eventMeta}>
                <View style={styles.eventMetaItem}>
                  <Ionicons name="location-outline" size={14} color="#94a3b8" />
                  <Text style={styles.eventMetaText}>{event.location}</Text>
                </View>
                <View style={styles.eventMetaItem}>
                  <Ionicons name="people-outline" size={14} color="#94a3b8" />
                  <Text style={styles.eventMetaText}>{event.organizer}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
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
            color={activeTab === 'menu' ? '#667eea' : '#64748b'}
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
            color={activeTab === 'posts' ? '#667eea' : '#64748b'}
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
            color={activeTab === 'events' ? '#667eea' : '#64748b'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
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
    color: '#94a3b8',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#667eea',
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  menuItemDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  menuItemPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  availableBadge: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  availableText: {
    fontSize: 10,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  unavailableText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '600',
  },
  // Posts styles
  postsContainer: {
    gap: 16,
  },
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeaderInfo: {
    marginLeft: 12,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  postDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  likedText: {
    color: '#ef4444',
  },
  commentsSection: {
    marginTop: 12,
    gap: 8,
  },
  commentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 13,
    color: '#94a3b8',
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
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
    borderColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 16,
  },
  eventDate: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  eventDateMonth: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 13,
    color: '#94a3b8',
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
    color: '#64748b',
  },
});

