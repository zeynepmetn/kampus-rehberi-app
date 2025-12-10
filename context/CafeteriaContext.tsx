import {
  CafeteriaSnack,
  createAnnouncementComment,
  deleteAnnouncementComment,
  Event,
  getAnnouncementComments,
  getAnnouncements,
  getCafeteriaSnacks,
  getEvents,
  getTodayCafeteriaMenu,
  toggleAnnouncementLike
} from '@/database/database';
import { CafeteriaPost, Comment, MenuItem } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useDatabase } from './DatabaseContext';

interface CafeteriaContextType {
  posts: CafeteriaPost[];
  menuItems: MenuItem[];
  snacks: CafeteriaSnack[];
  events: Event[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, userName: string, content: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
}

const CafeteriaContext = createContext<CafeteriaContextType | undefined>(undefined);

export function CafeteriaProvider({ children }: { children: ReactNode }) {
  const { isReady } = useDatabase();
  const { student } = useAuth();
  const [posts, setPosts] = useState<CafeteriaPost[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [snacks, setSnacks] = useState<CafeteriaSnack[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isReady) return;

    try {
      setIsLoading(true);

      // Load menu
      const menu = await getTodayCafeteriaMenu();
      const formattedMenu: MenuItem[] = menu.map((item) => ({
        id: item.id!.toString(),
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category as 'main' | 'side' | 'dessert' | 'drink',
        available: item.available === 1,
      }));
      setMenuItems(formattedMenu);

      // Load snacks
      const snacksData = await getCafeteriaSnacks();
      setSnacks(snacksData);

      // Load announcements
      const announcements = await getAnnouncements(student?.id);
      const formattedPosts: CafeteriaPost[] = await Promise.all(
        announcements.map(async (ann) => {
          const comments = await getAnnouncementComments(ann.id!);
          const formattedComments: Comment[] = comments.map((c) => ({
            id: c.id!.toString(),
            userId: c.student_id?.toString() || '',
            userName: c.user_name,
            content: c.content,
            timestamp: new Date(c.created_at!),
          }));

          return {
            id: ann.id!.toString(),
            title: ann.title,
            content: ann.description,
            date: new Date(ann.created_at!),
            likes: ann.likes_count || 0,
            comments: formattedComments,
            isLiked: (ann.is_liked || 0) === 1,
          };
        })
      );
      setPosts(formattedPosts);

      // Load events
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading cafeteria data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, student?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!student?.id) return;

      try {
        const announcementId = parseInt(postId);
        await toggleAnnouncementLike(announcementId, student.id);
        await loadData(); // Reload to get updated like count
      } catch (error) {
        console.error('Error toggling like:', error);
      }
    },
    [student?.id, loadData]
  );

  const addComment = useCallback(
    async (postId: string, userName: string, content: string) => {
      if (!student?.id) return;

      try {
        const announcementId = parseInt(postId);
        await createAnnouncementComment({
          announcement_id: announcementId,
          student_id: student.id,
          user_name: userName,
          content: content.trim(),
        });
        await loadData(); // Reload to get updated comments
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    },
    [student?.id, loadData]
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      try {
        await deleteAnnouncementComment(parseInt(commentId));
        await loadData(); // Reload to get updated comments
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    },
    [loadData]
  );

  return (
    <CafeteriaContext.Provider
      value={{
        posts,
        menuItems,
        snacks,
        events,
        isLoading,
        refreshData,
        toggleLike,
        addComment,
        deleteComment,
      }}
    >
      {children}
    </CafeteriaContext.Provider>
  );
}

export function useCafeteria() {
  const context = useContext(CafeteriaContext);
  if (context === undefined) {
    throw new Error('useCafeteria must be used within a CafeteriaProvider');
  }
  return context;
}
