import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CafeteriaPost, MenuItem, Comment } from '@/types';

interface CafeteriaContextType {
  posts: CafeteriaPost[];
  menuItems: MenuItem[];
  toggleLike: (postId: string) => void;
  addComment: (postId: string, userName: string, content: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
}

// Mock menu items
const initialMenuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Mercimek Çorbası',
    description: 'Geleneksel Türk mercimek çorbası',
    price: 15,
    category: 'main',
    available: true,
  },
  {
    id: 'm2',
    name: 'Tavuk Sote',
    description: 'Sebzeli tavuk sote, pilav ile servis edilir',
    price: 45,
    category: 'main',
    available: true,
  },
  {
    id: 'm3',
    name: 'Karnıyarık',
    description: 'Kıymalı patlıcan dolması',
    price: 50,
    category: 'main',
    available: true,
  },
  {
    id: 'm4',
    name: 'Pilav',
    description: 'Tereyağlı pirinç pilavı',
    price: 12,
    category: 'side',
    available: true,
  },
  {
    id: 'm5',
    name: 'Sütlaç',
    description: 'Geleneksel fırın sütlaç',
    price: 20,
    category: 'dessert',
    available: true,
  },
  {
    id: 'm6',
    name: 'Ayran',
    description: 'Taze köpüklü ayran',
    price: 8,
    category: 'drink',
    available: true,
  },
];

// Mock cafeteria posts
const initialPosts: CafeteriaPost[] = [
  {
    id: 'p1',
    title: '🍕 İtalyan Haftası Başladı!',
    content: 'Bu hafta yemekhanede İtalyan mutfağından lezzetler sizlerle! Pizza, makarna ve tiramisu günlük menümüzde. Kaçırmayın!',
    date: new Date(Date.now() - 3600000),
    likes: 47,
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'Ahmet Yılmaz',
        content: 'Pizza çok güzeldi, kesinlikle tavsiye ederim! 🍕',
        timestamp: new Date(Date.now() - 1800000),
      },
      {
        id: 'c2',
        userId: 'u2',
        userName: 'Ayşe Demir',
        content: 'Tiramisu için uzun kuyruk var ama değer!',
        timestamp: new Date(Date.now() - 900000),
      },
    ],
    isLiked: false,
  },
  {
    id: 'p2',
    title: '🥗 Sağlıklı Yaşam Menüsü',
    content: 'Fit menümüz artık her gün mevcut! Düşük kalorili, yüksek proteinli seçenekler için 2. kata bekleriz.',
    date: new Date(Date.now() - 86400000),
    likes: 32,
    comments: [
      {
        id: 'c3',
        userId: 'u3',
        userName: 'Mehmet Can',
        content: 'Sonunda! Spor sonrası için harika olacak.',
        timestamp: new Date(Date.now() - 43200000),
      },
    ],
    isLiked: true,
  },
  {
    id: 'p3',
    title: '☕ Kahve Köşesi Açıldı',
    content: 'Yemekhanemizin girişinde yeni kahve köşemiz hizmetinizde! Americano, Latte, Cappuccino ve daha fazlası öğrenci fiyatlarıyla.',
    date: new Date(Date.now() - 172800000),
    likes: 89,
    comments: [],
    isLiked: false,
  },
  {
    id: 'p4',
    title: '🎉 Mezuniyet Özel Menüsü',
    content: 'Mezuniyet haftasına özel olarak menümüzde şef tavsiyesi yemekler ve ücretsiz tatlı kampanyamız başladı!',
    date: new Date(Date.now() - 259200000),
    likes: 156,
    comments: [
      {
        id: 'c4',
        userId: 'u4',
        userName: 'Zeynep Kaya',
        content: 'En güzel haber bu oldu! ❤️',
        timestamp: new Date(Date.now() - 216000000),
      },
    ],
    isLiked: true,
  },
];

const CafeteriaContext = createContext<CafeteriaContextType | undefined>(undefined);

export function CafeteriaProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<CafeteriaPost[]>(initialPosts);
  const [menuItems] = useState<MenuItem[]>(initialMenuItems);

  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  }, []);

  const addComment = useCallback((postId: string, userName: string, content: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: `user-${Date.now()}`,
      userName,
      content,
      timestamp: new Date(),
    };

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
  }, []);

  const deleteComment = useCallback((postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments.filter((c) => c.id !== commentId) }
          : post
      )
    );
  }, []);

  return (
    <CafeteriaContext.Provider
      value={{
        posts,
        menuItems,
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

