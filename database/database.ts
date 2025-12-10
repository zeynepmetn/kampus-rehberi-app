import * as SQLite from 'expo-sqlite';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Initialize database
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('kampus_rehberi.db');

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await createTables();

  console.log('Database initialized successfully');
  return db;
};

// Get database instance
export const getDatabase = (): SQLite.SQLiteDatabase | null => {
  return db;
};

// Create all tables
const createTables = async () => {
  if (!db) return;

  await db.execAsync(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      department TEXT,
      profile_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Courses table
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      instructor TEXT,
      room TEXT,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      color TEXT DEFAULT '#667eea',
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Campus locations table
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Favorite locations table
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      location_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
      UNIQUE(user_id, location_id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      notifications_enabled INTEGER DEFAULT 1,
      dark_mode INTEGER DEFAULT 1,
      language TEXT DEFAULT 'tr',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Bus schedules table
    CREATE TABLE IF NOT EXISTS bus_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line TEXT NOT NULL,
      route TEXT NOT NULL,
      time TEXT NOT NULL,
      note TEXT,
      color TEXT DEFAULT '#FF6B6B',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      event_date DATETIME NOT NULL,
      organizer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// ==================== USER OPERATIONS ====================

export interface User {
  id?: number;
  student_id?: string;
  name: string;
  email?: string;
  department?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

export const createUser = async (user: User): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO users (student_id, name, email, department, profile_image) VALUES (?, ?, ?, ?, ?)',
    [user.student_id || null, user.name, user.email || null, user.department || null, user.profile_image || null]
  );

  return result.lastInsertRowId;
};

export const getUser = async (id: number): Promise<User | null> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', [id]);
  return result;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<User>('SELECT * FROM users WHERE email = ?', [email]);
  return result;
};

export const updateUser = async (id: number, user: Partial<User>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: any[] = [];

  if (user.name !== undefined) {
    fields.push('name = ?');
    values.push(user.name);
  }
  if (user.email !== undefined) {
    fields.push('email = ?');
    values.push(user.email);
  }
  if (user.department !== undefined) {
    fields.push('department = ?');
    values.push(user.department);
  }
  if (user.profile_image !== undefined) {
    fields.push('profile_image = ?');
    values.push(user.profile_image);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.runAsync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteUser = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
};

// ==================== COURSE OPERATIONS ====================

export interface Course {
  id?: number;
  code: string;
  name: string;
  instructor?: string;
  room?: string;
  day: string;
  start_time: string;
  end_time: string;
  color?: string;
  user_id?: number;
  created_at?: string;
}

export const createCourse = async (course: Course): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO courses (code, name, instructor, room, day, start_time, end_time, color, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [course.code, course.name, course.instructor || null, course.room || null, course.day, course.start_time, course.end_time, course.color || '#667eea', course.user_id || null]
  );

  return result.lastInsertRowId;
};

export const getCourses = async (userId?: number): Promise<Course[]> => {
  if (!db) throw new Error('Database not initialized');

  if (userId) {
    return await db.getAllAsync<Course>('SELECT * FROM courses WHERE user_id = ? ORDER BY day, start_time', [userId]);
  }
  return await db.getAllAsync<Course>('SELECT * FROM courses ORDER BY day, start_time');
};

export const getCoursesByDay = async (day: string, userId?: number): Promise<Course[]> => {
  if (!db) throw new Error('Database not initialized');

  if (userId) {
    return await db.getAllAsync<Course>('SELECT * FROM courses WHERE day = ? AND user_id = ? ORDER BY start_time', [day, userId]);
  }
  return await db.getAllAsync<Course>('SELECT * FROM courses WHERE day = ? ORDER BY start_time', [day]);
};

export const updateCourse = async (id: number, course: Partial<Course>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: any[] = [];

  if (course.code !== undefined) { fields.push('code = ?'); values.push(course.code); }
  if (course.name !== undefined) { fields.push('name = ?'); values.push(course.name); }
  if (course.instructor !== undefined) { fields.push('instructor = ?'); values.push(course.instructor); }
  if (course.room !== undefined) { fields.push('room = ?'); values.push(course.room); }
  if (course.day !== undefined) { fields.push('day = ?'); values.push(course.day); }
  if (course.start_time !== undefined) { fields.push('start_time = ?'); values.push(course.start_time); }
  if (course.end_time !== undefined) { fields.push('end_time = ?'); values.push(course.end_time); }
  if (course.color !== undefined) { fields.push('color = ?'); values.push(course.color); }

  values.push(id);
  await db.runAsync(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteCourse = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM courses WHERE id = ?', [id]);
};

// ==================== LOCATION OPERATIONS ====================

export interface Location {
  id?: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  description?: string;
  created_at?: string;
}

export const createLocation = async (location: Location): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO locations (name, type, latitude, longitude, description) VALUES (?, ?, ?, ?, ?)',
    [location.name, location.type, location.latitude, location.longitude, location.description || null]
  );

  return result.lastInsertRowId;
};

export const getLocations = async (): Promise<Location[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Location>('SELECT * FROM locations ORDER BY name');
};

export const getLocationsByType = async (type: string): Promise<Location[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Location>('SELECT * FROM locations WHERE type = ? ORDER BY name', [type]);
};

export const deleteLocation = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM locations WHERE id = ?', [id]);
};

// ==================== FAVORITES OPERATIONS ====================

export const addFavorite = async (userId: number, locationId: number): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT OR IGNORE INTO favorites (user_id, location_id) VALUES (?, ?)',
    [userId, locationId]
  );

  return result.lastInsertRowId;
};

export const removeFavorite = async (userId: number, locationId: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM favorites WHERE user_id = ? AND location_id = ?', [userId, locationId]);
};

export const getFavorites = async (userId: number): Promise<Location[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Location>(
    `SELECT l.* FROM locations l 
     INNER JOIN favorites f ON l.id = f.location_id 
     WHERE f.user_id = ? 
     ORDER BY f.created_at DESC`,
    [userId]
  );
};

export const isFavorite = async (userId: number, locationId: number): Promise<boolean> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND location_id = ?',
    [userId, locationId]
  );

  return (result?.count || 0) > 0;
};

// ==================== NOTIFICATION OPERATIONS ====================

export interface Notification {
  id?: number;
  user_id?: number;
  title: string;
  message: string;
  type?: string;
  is_read?: number;
  created_at?: string;
}

export const createNotification = async (notification: Notification): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [notification.user_id || null, notification.title, notification.message, notification.type || 'info']
  );

  return result.lastInsertRowId;
};

export const getNotifications = async (userId?: number): Promise<Notification[]> => {
  if (!db) throw new Error('Database not initialized');

  if (userId) {
    return await db.getAllAsync<Notification>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }
  return await db.getAllAsync<Notification>('SELECT * FROM notifications ORDER BY created_at DESC');
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
};

export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
};

export const deleteNotification = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM notifications WHERE id = ?', [id]);
};

export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  return result?.count || 0;
};

// ==================== SETTINGS OPERATIONS ====================

export interface Settings {
  id?: number;
  user_id?: number;
  notifications_enabled?: number;
  dark_mode?: number;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export const getSettings = async (userId: number): Promise<Settings | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE user_id = ?', [userId]);
};

export const createOrUpdateSettings = async (userId: number, settings: Partial<Settings>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const existing = await getSettings(userId);

  if (existing) {
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (settings.notifications_enabled !== undefined) {
      fields.push('notifications_enabled = ?');
      values.push(settings.notifications_enabled);
    }
    if (settings.dark_mode !== undefined) {
      fields.push('dark_mode = ?');
      values.push(settings.dark_mode);
    }
    if (settings.language !== undefined) {
      fields.push('language = ?');
      values.push(settings.language);
    }

    values.push(userId);
    await db.runAsync(`UPDATE settings SET ${fields.join(', ')} WHERE user_id = ?`, values);
  } else {
    await db.runAsync(
      'INSERT INTO settings (user_id, notifications_enabled, dark_mode, language) VALUES (?, ?, ?, ?)',
      [userId, settings.notifications_enabled ?? 1, settings.dark_mode ?? 1, settings.language ?? 'tr']
    );
  }
};

// ==================== BUS SCHEDULE OPERATIONS ====================

export interface BusSchedule {
  id?: number;
  line: string;
  route: string;
  time: string;
  note?: string;
  color?: string;
  created_at?: string;
}

export const createBusSchedule = async (schedule: BusSchedule): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO bus_schedules (line, route, time, note, color) VALUES (?, ?, ?, ?, ?)',
    [schedule.line, schedule.route, schedule.time, schedule.note || null, schedule.color || '#FF6B6B']
  );

  return result.lastInsertRowId;
};

export const getBusSchedules = async (line?: string): Promise<BusSchedule[]> => {
  if (!db) throw new Error('Database not initialized');

  if (line) {
    return await db.getAllAsync<BusSchedule>(
      'SELECT * FROM bus_schedules WHERE line = ? ORDER BY time',
      [line]
    );
  }
  return await db.getAllAsync<BusSchedule>('SELECT * FROM bus_schedules ORDER BY line, time');
};

// ==================== EVENT OPERATIONS ====================

export interface Event {
  id?: number;
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  organizer?: string;
  created_at?: string;
}

export const createEvent = async (event: Event): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO events (title, description, location, event_date, organizer) VALUES (?, ?, ?, ?, ?)',
    [event.title, event.description || null, event.location || null, event.event_date, event.organizer || null]
  );

  return result.lastInsertRowId;
};

export const getEvents = async (): Promise<Event[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Event>('SELECT * FROM events ORDER BY event_date');
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Event>(
    'SELECT * FROM events WHERE event_date >= datetime("now") ORDER BY event_date LIMIT 10'
  );
};

export const deleteEvent = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
};

// ==================== UTILITY FUNCTIONS ====================

export const clearAllData = async (): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.execAsync(`
    DELETE FROM favorites;
    DELETE FROM notifications;
    DELETE FROM settings;
    DELETE FROM courses;
    DELETE FROM bus_schedules;
    DELETE FROM events;
    DELETE FROM locations;
    DELETE FROM users;
  `);
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};

