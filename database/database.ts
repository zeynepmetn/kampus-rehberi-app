import * as SQLite from 'expo-sqlite';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Database version - increment this when schema changes
const DB_VERSION = 3;

// Initialize database
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('kampus_rehberi.db');

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Check database version
  const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionResult?.user_version || 0;

  if (currentVersion < DB_VERSION) {
    console.log(`Database version ${currentVersion} is outdated. Upgrading to version ${DB_VERSION}...`);
    
    // Drop all old tables to reset schema
    await db.execAsync(`
      DROP TABLE IF EXISTS announcement_likes;
      DROP TABLE IF EXISTS announcement_comments;
      DROP TABLE IF EXISTS announcements;
      DROP TABLE IF EXISTS cafeteria_snacks;
      DROP TABLE IF EXISTS cafeteria_menu;
      DROP TABLE IF EXISTS academic_calendar;
      DROP TABLE IF EXISTS favorites;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS settings;
      DROP TABLE IF EXISTS student_courses;
      DROP TABLE IF EXISTS course_prerequisites;
      DROP TABLE IF EXISTS exams;
      DROP TABLE IF EXISTS course_schedules;
      DROP TABLE IF EXISTS courses;
      DROP TABLE IF EXISTS students;
      DROP TABLE IF EXISTS departments;
      DROP TABLE IF EXISTS bus_schedules;
      DROP TABLE IF EXISTS events;
      DROP TABLE IF EXISTS locations;
      DROP TABLE IF EXISTS users;
    `);

    // Create new tables
    await createTables();

    // Update version
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
    console.log('Database upgraded successfully');
  } else {
    // Ensure tables exist
    await createTables();
  }

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
    -- Departments table (Bölümler)
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Students table (Öğrenciler)
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT,
      department_id INTEGER NOT NULL,
      class_year INTEGER NOT NULL DEFAULT 1,
      gno REAL DEFAULT 0.0,
      yno REAL DEFAULT 0.0,
      profile_image TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    -- Courses table (Dersler)
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      class_year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      credits INTEGER NOT NULL DEFAULT 3,
      ects INTEGER NOT NULL DEFAULT 5,
      is_mandatory INTEGER NOT NULL DEFAULT 1,
      instructor TEXT,
      description TEXT,
      quota INTEGER DEFAULT 50,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      UNIQUE(code, department_id)
    );

    -- Course Schedules table (Ders Saatleri)
    CREATE TABLE IF NOT EXISTS course_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      classroom TEXT NOT NULL,
      faculty TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    -- Exams table (Sınavlar)
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      exam_type TEXT NOT NULL,
      exam_date DATE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      classroom TEXT NOT NULL,
      faculty TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    -- Student Courses table (Öğrencinin Aldığı Dersler)
    CREATE TABLE IF NOT EXISTS student_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      semester TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      midterm_grade REAL,
      final_grade REAL,
      makeup_grade REAL,
      letter_grade TEXT,
      grade_point REAL,
      status TEXT DEFAULT 'enrolled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id, academic_year, semester)
    );

    -- Course Prerequisites table (Ön Koşullu Dersler)
    CREATE TABLE IF NOT EXISTS course_prerequisites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      prerequisite_course_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(course_id, prerequisite_course_id)
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
      student_id INTEGER,
      location_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
      UNIQUE(student_id, location_id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER UNIQUE,
      notifications_enabled INTEGER DEFAULT 1,
      dark_mode INTEGER DEFAULT 1,
      language TEXT DEFAULT 'tr',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
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

    -- Cafeteria Menu table (Yemekhane Günlük Menü)
    CREATE TABLE IF NOT EXISTS cafeteria_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      available INTEGER DEFAULT 1,
      menu_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cafeteria Snacks table (Aperatifler)
    CREATE TABLE IF NOT EXISTS cafeteria_snacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Announcements table (Duyurular)
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Announcement Comments table (Duyuru Yorumları)
    CREATE TABLE IF NOT EXISTS announcement_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      student_id INTEGER,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
    );

    -- Announcement Likes table (Duyuru Beğenileri)
    CREATE TABLE IF NOT EXISTS announcement_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      student_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(announcement_id, student_id)
    );

    -- Academic Calendar table (Akademik Takvim)
    CREATE TABLE IF NOT EXISTS academic_calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      end_date DATE,
      event_type TEXT NOT NULL,
      icon TEXT,
      course_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// ==================== DEPARTMENT OPERATIONS ====================

export interface Department {
  id?: number;
  code: string;
  name: string;
  faculty: string;
  created_at?: string;
}

export const createDepartment = async (department: Department): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO departments (code, name, faculty) VALUES (?, ?, ?)',
    [department.code, department.name, department.faculty]
  );

  return result.lastInsertRowId;
};

export const getDepartments = async (): Promise<Department[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Department>('SELECT * FROM departments ORDER BY name');
};

export const getDepartmentById = async (id: number): Promise<Department | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Department>('SELECT * FROM departments WHERE id = ?', [id]);
};

export const getDepartmentByCode = async (code: string): Promise<Department | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Department>('SELECT * FROM departments WHERE code = ?', [code]);
};

// ==================== STUDENT OPERATIONS ====================

export interface Student {
  id?: number;
  student_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  password?: string;
  department_id: number;
  class_year: number;
  gno?: number;
  yno?: number;
  profile_image?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  department_name?: string;
  department_code?: string;
  faculty?: string;
}

export const createStudent = async (student: Student): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    `INSERT INTO students (student_number, first_name, last_name, email, password, department_id, class_year, gno, yno, profile_image) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      student.student_number,
      student.first_name,
      student.last_name,
      student.email || null,
      student.password || null,
      student.department_id,
      student.class_year,
      student.gno || 0,
      student.yno || 0,
      student.profile_image || null
    ]
  );

  return result.lastInsertRowId;
};

export const getStudentById = async (id: number): Promise<Student | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Student>(
    `SELECT s.*, d.name as department_name, d.code as department_code, d.faculty
     FROM students s
     JOIN departments d ON s.department_id = d.id
     WHERE s.id = ?`,
    [id]
  );
};

export const getStudentByNumber = async (studentNumber: string): Promise<Student | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Student>(
    `SELECT s.*, d.name as department_name, d.code as department_code, d.faculty
     FROM students s
     JOIN departments d ON s.department_id = d.id
     WHERE s.student_number = ?`,
    [studentNumber]
  );
};

export const getStudentByEmail = async (email: string): Promise<Student | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Student>(
    `SELECT s.*, d.name as department_name, d.code as department_code, d.faculty
     FROM students s
     JOIN departments d ON s.department_id = d.id
     WHERE s.email = ?`,
    [email]
  );
};

export const getAllStudents = async (): Promise<Student[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Student>(
    `SELECT s.*, d.name as department_name, d.code as department_code, d.faculty
     FROM students s
     JOIN departments d ON s.department_id = d.id
     ORDER BY s.student_number`
  );
};

export const updateStudent = async (id: number, student: Partial<Student>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: any[] = [];

  if (student.first_name !== undefined) { fields.push('first_name = ?'); values.push(student.first_name); }
  if (student.last_name !== undefined) { fields.push('last_name = ?'); values.push(student.last_name); }
  if (student.email !== undefined) { fields.push('email = ?'); values.push(student.email); }
  if (student.password !== undefined) { fields.push('password = ?'); values.push(student.password); }
  if (student.department_id !== undefined) { fields.push('department_id = ?'); values.push(student.department_id); }
  if (student.class_year !== undefined) { fields.push('class_year = ?'); values.push(student.class_year); }
  if (student.gno !== undefined) { fields.push('gno = ?'); values.push(student.gno); }
  if (student.yno !== undefined) { fields.push('yno = ?'); values.push(student.yno); }
  if (student.profile_image !== undefined) { fields.push('profile_image = ?'); values.push(student.profile_image); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.runAsync(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteStudent = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM students WHERE id = ?', [id]);
};

// ==================== COURSE OPERATIONS ====================

export interface Course {
  id?: number;
  code: string;
  name: string;
  department_id: number;
  class_year: number;
  semester: number;
  credits: number;
  ects: number;
  is_mandatory: number;
  instructor?: string;
  description?: string;
  quota?: number;
  created_at?: string;
  // Joined fields
  department_name?: string;
  department_code?: string;
  enrolled_count?: number;
}

export const createCourse = async (course: Course): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    `INSERT INTO courses (code, name, department_id, class_year, semester, credits, ects, is_mandatory, instructor, description, quota)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      course.code,
      course.name,
      course.department_id,
      course.class_year,
      course.semester,
      course.credits,
      course.ects,
      course.is_mandatory,
      course.instructor || null,
      course.description || null,
      course.quota || 50
    ]
  );

  return result.lastInsertRowId;
};

export const getCourseById = async (id: number): Promise<Course | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Course>(
    `SELECT c.*, d.name as department_name, d.code as department_code,
            (SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id AND sc.status = 'enrolled') as enrolled_count
     FROM courses c
     JOIN departments d ON c.department_id = d.id
     WHERE c.id = ?`,
    [id]
  );
};

export const getCoursesByDepartment = async (departmentId: number): Promise<Course[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Course>(
    `SELECT c.*, d.name as department_name, d.code as department_code,
            (SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id AND sc.status = 'enrolled') as enrolled_count
     FROM courses c
     JOIN departments d ON c.department_id = d.id
     WHERE c.department_id = ?
     ORDER BY c.class_year, c.semester, c.code`,
    [departmentId]
  );
};

export const getCoursesByDepartmentAndYear = async (departmentId: number, classYear: number): Promise<Course[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Course>(
    `SELECT c.*, d.name as department_name, d.code as department_code,
            (SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id AND sc.status = 'enrolled') as enrolled_count
     FROM courses c
     JOIN departments d ON c.department_id = d.id
     WHERE c.department_id = ? AND c.class_year <= ?
     ORDER BY c.class_year, c.semester, c.code`,
    [departmentId, classYear]
  );
};

export const updateCourse = async (id: number, course: Partial<Course>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: any[] = [];

  if (course.code !== undefined) { fields.push('code = ?'); values.push(course.code); }
  if (course.name !== undefined) { fields.push('name = ?'); values.push(course.name); }
  if (course.class_year !== undefined) { fields.push('class_year = ?'); values.push(course.class_year); }
  if (course.semester !== undefined) { fields.push('semester = ?'); values.push(course.semester); }
  if (course.credits !== undefined) { fields.push('credits = ?'); values.push(course.credits); }
  if (course.ects !== undefined) { fields.push('ects = ?'); values.push(course.ects); }
  if (course.is_mandatory !== undefined) { fields.push('is_mandatory = ?'); values.push(course.is_mandatory); }
  if (course.instructor !== undefined) { fields.push('instructor = ?'); values.push(course.instructor); }
  if (course.description !== undefined) { fields.push('description = ?'); values.push(course.description); }
  if (course.quota !== undefined) { fields.push('quota = ?'); values.push(course.quota); }

  values.push(id);
  await db.runAsync(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteCourse = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM courses WHERE id = ?', [id]);
};

// ==================== COURSE SCHEDULE OPERATIONS ====================

export interface CourseSchedule {
  id?: number;
  course_id: number;
  day: string;
  start_time: string;
  end_time: string;
  classroom: string;
  faculty: string;
  created_at?: string;
  // Joined fields
  course_code?: string;
  course_name?: string;
  instructor?: string;
}

export const createCourseSchedule = async (schedule: CourseSchedule): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO course_schedules (course_id, day, start_time, end_time, classroom, faculty) VALUES (?, ?, ?, ?, ?, ?)',
    [schedule.course_id, schedule.day, schedule.start_time, schedule.end_time, schedule.classroom, schedule.faculty]
  );

  return result.lastInsertRowId;
};

export const getCourseSchedules = async (courseId: number): Promise<CourseSchedule[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<CourseSchedule>(
    `SELECT cs.*, c.code as course_code, c.name as course_name, c.instructor
     FROM course_schedules cs
     JOIN courses c ON cs.course_id = c.id
     WHERE cs.course_id = ?
     ORDER BY cs.day, cs.start_time`,
    [courseId]
  );
};

export const getSchedulesByDay = async (day: string): Promise<CourseSchedule[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<CourseSchedule>(
    `SELECT cs.*, c.code as course_code, c.name as course_name, c.instructor
     FROM course_schedules cs
     JOIN courses c ON cs.course_id = c.id
     WHERE cs.day = ?
     ORDER BY cs.start_time`,
    [day]
  );
};

export const getAllSchedules = async (): Promise<CourseSchedule[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<CourseSchedule>(
    `SELECT cs.*, c.code as course_code, c.name as course_name, c.instructor, d.name as department_name
     FROM course_schedules cs
     JOIN courses c ON cs.course_id = c.id
     JOIN departments d ON c.department_id = d.id
     ORDER BY cs.day, cs.start_time`
  );
};

export const deleteCourseSchedule = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM course_schedules WHERE id = ?', [id]);
};

// ==================== EXAM OPERATIONS ====================

export interface Exam {
  id?: number;
  course_id: number;
  exam_type: string; // 'midterm', 'final', 'makeup'
  exam_date: string;
  start_time: string;
  end_time: string;
  classroom: string;
  faculty: string;
  created_at?: string;
  // Joined fields
  course_code?: string;
  course_name?: string;
}

export const createExam = async (exam: Exam): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO exams (course_id, exam_type, exam_date, start_time, end_time, classroom, faculty) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [exam.course_id, exam.exam_type, exam.exam_date, exam.start_time, exam.end_time, exam.classroom, exam.faculty]
  );

  return result.lastInsertRowId;
};

export const getExamsByCourse = async (courseId: number): Promise<Exam[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Exam>(
    `SELECT e.*, c.code as course_code, c.name as course_name
     FROM exams e
     JOIN courses c ON e.course_id = c.id
     WHERE e.course_id = ?
     ORDER BY e.exam_date, e.start_time`,
    [courseId]
  );
};

export const getExamsByStudent = async (studentId: number): Promise<Exam[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Exam>(
    `SELECT e.*, c.code as course_code, c.name as course_name
     FROM exams e
     JOIN courses c ON e.course_id = c.id
     JOIN student_courses sc ON c.id = sc.course_id
     WHERE sc.student_id = ? AND sc.status = 'enrolled'
     ORDER BY e.exam_date, e.start_time`,
    [studentId]
  );
};

export const getUpcomingExams = async (studentId: number): Promise<Exam[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Exam>(
    `SELECT e.*, c.code as course_code, c.name as course_name
     FROM exams e
     JOIN courses c ON e.course_id = c.id
     JOIN student_courses sc ON c.id = sc.course_id
     WHERE sc.student_id = ? AND sc.status = 'enrolled' AND e.exam_date >= date('now')
     ORDER BY e.exam_date, e.start_time`,
    [studentId]
  );
};

export const getAllExams = async (): Promise<Exam[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Exam>(
    `SELECT e.*, c.code as course_code, c.name as course_name, d.name as department_name
     FROM exams e
     JOIN courses c ON e.course_id = c.id
     JOIN departments d ON c.department_id = d.id
     ORDER BY e.exam_date, e.start_time`
  );
};

export const updateExam = async (id: number, exam: Partial<Exam>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const updates: string[] = [];
  const values: any[] = [];

  if (exam.course_id !== undefined) {
    updates.push('course_id = ?');
    values.push(exam.course_id);
  }
  if (exam.exam_type !== undefined) {
    updates.push('exam_type = ?');
    values.push(exam.exam_type);
  }
  if (exam.exam_date !== undefined) {
    updates.push('exam_date = ?');
    values.push(exam.exam_date);
  }
  if (exam.start_time !== undefined) {
    updates.push('start_time = ?');
    values.push(exam.start_time);
  }
  if (exam.end_time !== undefined) {
    updates.push('end_time = ?');
    values.push(exam.end_time);
  }
  if (exam.classroom !== undefined) {
    updates.push('classroom = ?');
    values.push(exam.classroom);
  }
  if (exam.faculty !== undefined) {
    updates.push('faculty = ?');
    values.push(exam.faculty);
  }

  if (updates.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE exams SET ${updates.join(', ')} WHERE id = ?`, values);
};

export const deleteExam = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM exams WHERE id = ?', [id]);
};

// ==================== STUDENT COURSE OPERATIONS ====================

export interface StudentCourse {
  id?: number;
  student_id: number;
  course_id: number;
  semester: string; // 'fall', 'spring'
  academic_year: string; // '2024-2025'
  midterm_grade?: number;
  final_grade?: number;
  makeup_grade?: number;
  letter_grade?: string;
  grade_point?: number;
  status: string; // 'enrolled', 'passed', 'failed', 'dropped'
  created_at?: string;
  updated_at?: string;
  // Joined fields
  course_code?: string;
  course_name?: string;
  credits?: number;
  ects?: number;
  instructor?: string;
  class_year?: number;
  is_mandatory?: number;
}

export const enrollCourse = async (studentCourse: StudentCourse): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    `INSERT INTO student_courses (student_id, course_id, semester, academic_year, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      studentCourse.student_id,
      studentCourse.course_id,
      studentCourse.semester,
      studentCourse.academic_year,
      studentCourse.status || 'enrolled'
    ]
  );

  return result.lastInsertRowId;
};

export const getStudentCourses = async (studentId: number, academicYear?: string, semester?: string): Promise<StudentCourse[]> => {
  if (!db) throw new Error('Database not initialized');

  let query = `
    SELECT sc.*, c.code as course_code, c.name as course_name, c.credits, c.ects, 
           c.instructor, c.class_year, c.is_mandatory
    FROM student_courses sc
    JOIN courses c ON sc.course_id = c.id
    WHERE sc.student_id = ?
  `;
  const params: any[] = [studentId];

  if (academicYear) {
    query += ' AND sc.academic_year = ?';
    params.push(academicYear);
  }
  if (semester) {
    query += ' AND sc.semester = ?';
    params.push(semester);
  }

  query += ' ORDER BY c.class_year, c.code';

  return await db.getAllAsync<StudentCourse>(query, params);
};

export const getEnrolledCourses = async (studentId: number): Promise<StudentCourse[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<StudentCourse>(
    `SELECT sc.*, c.code as course_code, c.name as course_name, c.credits, c.ects, 
            c.instructor, c.class_year, c.is_mandatory
     FROM student_courses sc
     JOIN courses c ON sc.course_id = c.id
     WHERE sc.student_id = ? AND sc.status = 'enrolled'
     ORDER BY c.class_year, c.code`,
    [studentId]
  );
};

export const updateStudentCourse = async (id: number, data: Partial<StudentCourse>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: any[] = [];

  if (data.midterm_grade !== undefined) { fields.push('midterm_grade = ?'); values.push(data.midterm_grade); }
  if (data.final_grade !== undefined) { fields.push('final_grade = ?'); values.push(data.final_grade); }
  if (data.makeup_grade !== undefined) { fields.push('makeup_grade = ?'); values.push(data.makeup_grade); }
  if (data.letter_grade !== undefined) { fields.push('letter_grade = ?'); values.push(data.letter_grade); }
  if (data.grade_point !== undefined) { fields.push('grade_point = ?'); values.push(data.grade_point); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.runAsync(`UPDATE student_courses SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const dropCourse = async (studentId: number, courseId: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `UPDATE student_courses SET status = 'dropped', updated_at = CURRENT_TIMESTAMP 
     WHERE student_id = ? AND course_id = ? AND status = 'enrolled'`,
    [studentId, courseId]
  );
};

export const unenrollCourse = async (studentId: number, courseId: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'DELETE FROM student_courses WHERE student_id = ? AND course_id = ? AND status = "enrolled"',
    [studentId, courseId]
  );
};

// ==================== COURSE ELIGIBILITY CHECK ====================

export interface CourseWithEligibility extends Course {
  is_eligible: boolean;
  eligibility_reason?: string;
  schedules?: CourseSchedule[];
  exams?: Exam[];
}

// Check if student can enroll in a course
export const checkCourseEligibility = async (
  studentId: number,
  courseId: number
): Promise<{ eligible: boolean; reason: string }> => {
  if (!db) throw new Error('Database not initialized');

  // Get student info
  const student = await getStudentById(studentId);
  if (!student) {
    return { eligible: false, reason: 'Öğrenci bulunamadı' };
  }

  // Get course info
  const course = await getCourseById(courseId);
  if (!course) {
    return { eligible: false, reason: 'Ders bulunamadı' };
  }

  // Check 1: Department match
  if (course.department_id !== student.department_id) {
    return { eligible: false, reason: 'Bu ders sizin bölümünüze ait değil' };
  }

  // Check 2: Class year (cannot take upper class courses, but can take lower)
  if (course.class_year > student.class_year) {
    return { eligible: false, reason: `Bu ders ${course.class_year}. sınıf dersidir. Üst sınıf dersi alamazsınız.` };
  }

  // Check 3: Already enrolled or passed
  const existingEnrollment = await db.getFirstAsync<StudentCourse>(
    `SELECT * FROM student_courses 
     WHERE student_id = ? AND course_id = ? AND (status = 'enrolled' OR status = 'passed')`,
    [studentId, courseId]
  );

  if (existingEnrollment) {
    if (existingEnrollment.status === 'enrolled') {
      return { eligible: false, reason: 'Bu derse zaten kayıtlısınız' };
    }
    if (existingEnrollment.status === 'passed') {
      return { eligible: false, reason: 'Bu dersi zaten geçtiniz' };
    }
  }

  // Check 4: Quota check
  if (course.quota && course.enrolled_count && course.enrolled_count >= course.quota) {
    return { eligible: false, reason: 'Ders kontenjanı dolmuş' };
  }

  // Check 5: Schedule conflict
  const courseSchedules = await getCourseSchedules(courseId);
  const studentEnrolledCourses = await getEnrolledCourses(studentId);

  for (const schedule of courseSchedules) {
    for (const enrolledCourse of studentEnrolledCourses) {
      const enrolledSchedules = await getCourseSchedules(enrolledCourse.course_id);

      for (const enrolledSchedule of enrolledSchedules) {
        if (schedule.day === enrolledSchedule.day) {
          // Check time overlap
          const newStart = timeToMinutes(schedule.start_time);
          const newEnd = timeToMinutes(schedule.end_time);
          const existingStart = timeToMinutes(enrolledSchedule.start_time);
          const existingEnd = timeToMinutes(enrolledSchedule.end_time);

          if (!(newEnd <= existingStart || newStart >= existingEnd)) {
            return {
              eligible: false,
              reason: `Bu ders "${enrolledCourse.course_name}" dersi ile çakışıyor (${schedule.day} ${schedule.start_time}-${schedule.end_time})`
            };
          }
        }
      }
    }
  }

  // Check 6: Prerequisites (if any)
  const prerequisites = await db.getAllAsync<{ prerequisite_course_id: number }>(
    'SELECT prerequisite_course_id FROM course_prerequisites WHERE course_id = ?',
    [courseId]
  );

  for (const prereq of prerequisites) {
    const passedPrereq = await db.getFirstAsync<StudentCourse>(
      `SELECT * FROM student_courses 
       WHERE student_id = ? AND course_id = ? AND status = 'passed'`,
      [studentId, prereq.prerequisite_course_id]
    );

    if (!passedPrereq) {
      const prereqCourse = await getCourseById(prereq.prerequisite_course_id);
      return {
        eligible: false,
        reason: `Ön koşul dersi "${prereqCourse?.name}" henüz geçilmemiş`
      };
    }
  }

  return { eligible: true, reason: 'Derse kayıt olabilirsiniz' };
};

// Get available courses for student with eligibility info
export const getAvailableCoursesForStudent = async (studentId: number): Promise<CourseWithEligibility[]> => {
  if (!db) throw new Error('Database not initialized');

  const student = await getStudentById(studentId);
  if (!student) return [];

  // Get all courses from student's department up to their class year
  const courses = await getCoursesByDepartmentAndYear(student.department_id, student.class_year);

  const coursesWithEligibility: CourseWithEligibility[] = [];

  for (const course of courses) {
    const eligibility = await checkCourseEligibility(studentId, course.id!);
    const schedules = await getCourseSchedules(course.id!);
    const exams = await getExamsByCourse(course.id!);

    coursesWithEligibility.push({
      ...course,
      is_eligible: eligibility.eligible,
      eligibility_reason: eligibility.reason,
      schedules,
      exams
    });
  }

  return coursesWithEligibility;
};

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Get student's weekly schedule
export const getStudentWeeklySchedule = async (studentId: number): Promise<Record<string, CourseSchedule[]>> => {
  if (!db) throw new Error('Database not initialized');

  const enrolledCourses = await getEnrolledCourses(studentId);
  const weeklySchedule: Record<string, CourseSchedule[]> = {
    'Pazartesi': [],
    'Salı': [],
    'Çarşamba': [],
    'Perşembe': [],
    'Cuma': []
  };

  for (const course of enrolledCourses) {
    const schedules = await getCourseSchedules(course.course_id);
    for (const schedule of schedules) {
      if (weeklySchedule[schedule.day]) {
        weeklySchedule[schedule.day].push(schedule);
      }
    }
  }

  // Sort each day by start time
  for (const day of Object.keys(weeklySchedule)) {
    weeklySchedule[day].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  }

  return weeklySchedule;
};

// Calculate GPA
export const calculateGPA = async (studentId: number): Promise<{ gno: number; yno: number }> => {
  if (!db) throw new Error('Database not initialized');

  // Calculate overall GPA (GNO)
  const allGrades = await db.getAllAsync<{ credits: number; grade_point: number }>(
    `SELECT c.credits, sc.grade_point
     FROM student_courses sc
     JOIN courses c ON sc.course_id = c.id
     WHERE sc.student_id = ? AND sc.status = 'passed' AND sc.grade_point IS NOT NULL`,
    [studentId]
  );

  let totalCredits = 0;
  let totalPoints = 0;

  for (const grade of allGrades) {
    totalCredits += grade.credits;
    totalPoints += grade.credits * grade.grade_point;
  }

  const gno = totalCredits > 0 ? totalPoints / totalCredits : 0;

  // Calculate semester GPA (YNO) - current academic year
  const currentYear = new Date().getFullYear();
  const academicYear = new Date().getMonth() >= 8 
    ? `${currentYear}-${currentYear + 1}` 
    : `${currentYear - 1}-${currentYear}`;

  const semesterGrades = await db.getAllAsync<{ credits: number; grade_point: number }>(
    `SELECT c.credits, sc.grade_point
     FROM student_courses sc
     JOIN courses c ON sc.course_id = c.id
     WHERE sc.student_id = ? AND sc.academic_year = ? AND sc.status = 'passed' AND sc.grade_point IS NOT NULL`,
    [studentId, academicYear]
  );

  let semesterCredits = 0;
  let semesterPoints = 0;

  for (const grade of semesterGrades) {
    semesterCredits += grade.credits;
    semesterPoints += grade.credits * grade.grade_point;
  }

  const yno = semesterCredits > 0 ? semesterPoints / semesterCredits : 0;

  // Update student record
  await updateStudent(studentId, { gno: Math.round(gno * 100) / 100, yno: Math.round(yno * 100) / 100 });

  return { gno: Math.round(gno * 100) / 100, yno: Math.round(yno * 100) / 100 };
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

export const addFavorite = async (studentId: number, locationId: number): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT OR IGNORE INTO favorites (student_id, location_id) VALUES (?, ?)',
    [studentId, locationId]
  );

  return result.lastInsertRowId;
};

export const removeFavorite = async (studentId: number, locationId: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM favorites WHERE student_id = ? AND location_id = ?', [studentId, locationId]);
};

export const getFavorites = async (studentId: number): Promise<Location[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<Location>(
    `SELECT l.* FROM locations l 
     INNER JOIN favorites f ON l.id = f.location_id 
     WHERE f.student_id = ? 
     ORDER BY f.created_at DESC`,
    [studentId]
  );
};

export const isFavorite = async (studentId: number, locationId: number): Promise<boolean> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorites WHERE student_id = ? AND location_id = ?',
    [studentId, locationId]
  );

  return (result?.count || 0) > 0;
};

// ==================== NOTIFICATION OPERATIONS ====================

export interface Notification {
  id?: number;
  student_id?: number;
  title: string;
  message: string;
  type?: string;
  is_read?: number;
  created_at?: string;
}

export const createNotification = async (notification: Notification): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO notifications (student_id, title, message, type) VALUES (?, ?, ?, ?)',
    [notification.student_id || null, notification.title, notification.message, notification.type || 'info']
  );

  return result.lastInsertRowId;
};

export const getNotifications = async (studentId?: number): Promise<Notification[]> => {
  if (!db) throw new Error('Database not initialized');

  if (studentId) {
    return await db.getAllAsync<Notification>(
      'SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
  }
  return await db.getAllAsync<Notification>('SELECT * FROM notifications ORDER BY created_at DESC');
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
};

export const markAllNotificationsAsRead = async (studentId: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE student_id = ?', [studentId]);
};

export const deleteNotification = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM notifications WHERE id = ?', [id]);
};

export const getUnreadNotificationCount = async (studentId: number): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE student_id = ? AND is_read = 0',
    [studentId]
  );

  return result?.count || 0;
};

// ==================== SETTINGS OPERATIONS ====================

export interface Settings {
  id?: number;
  student_id?: number;
  notifications_enabled?: number;
  dark_mode?: number;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export const getSettings = async (studentId: number): Promise<Settings | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE student_id = ?', [studentId]);
};

export const createOrUpdateSettings = async (studentId: number, settings: Partial<Settings>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const existing = await getSettings(studentId);

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

    values.push(studentId);
    await db.runAsync(`UPDATE settings SET ${fields.join(', ')} WHERE student_id = ?`, values);
  } else {
    await db.runAsync(
      'INSERT INTO settings (student_id, notifications_enabled, dark_mode, language) VALUES (?, ?, ?, ?)',
      [studentId, settings.notifications_enabled ?? 1, settings.dark_mode ?? 1, settings.language ?? 'tr']
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

export const updateEvent = async (id: number, event: Partial<Event>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const updates: string[] = [];
  const values: any[] = [];

  if (event.title !== undefined) {
    updates.push('title = ?');
    values.push(event.title);
  }
  if (event.description !== undefined) {
    updates.push('description = ?');
    values.push(event.description);
  }
  if (event.location !== undefined) {
    updates.push('location = ?');
    values.push(event.location);
  }
  if (event.event_date !== undefined) {
    updates.push('event_date = ?');
    values.push(event.event_date);
  }
  if (event.organizer !== undefined) {
    updates.push('organizer = ?');
    values.push(event.organizer);
  }

  if (updates.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`, values);
};

export const deleteEvent = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
};

// ==================== CAFETERIA MENU OPERATIONS ====================

export interface CafeteriaMenu {
  id?: number;
  name: string;
  description?: string;
  price: number;
  category: string; // 'main', 'side', 'dessert', 'drink'
  available?: number;
  menu_date: string; // YYYY-MM-DD
  created_at?: string;
}

export const createCafeteriaMenu = async (menu: CafeteriaMenu): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO cafeteria_menu (name, description, price, category, available, menu_date) VALUES (?, ?, ?, ?, ?, ?)',
    [menu.name, menu.description || null, menu.price, menu.category, menu.available ?? 1, menu.menu_date]
  );

  return result.lastInsertRowId;
};

export const getCafeteriaMenuByDate = async (date: string): Promise<CafeteriaMenu[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<CafeteriaMenu>(
    'SELECT * FROM cafeteria_menu WHERE menu_date = ? ORDER BY category, name',
    [date]
  );
};

export const getTodayCafeteriaMenu = async (): Promise<CafeteriaMenu[]> => {
  if (!db) throw new Error('Database not initialized');

  const today = new Date().toISOString().split('T')[0];
  return getCafeteriaMenuByDate(today);
};

export const updateCafeteriaMenu = async (id: number, menu: Partial<CafeteriaMenu>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const updates: string[] = [];
  const values: any[] = [];

  if (menu.name !== undefined) {
    updates.push('name = ?');
    values.push(menu.name);
  }
  if (menu.description !== undefined) {
    updates.push('description = ?');
    values.push(menu.description);
  }
  if (menu.price !== undefined) {
    updates.push('price = ?');
    values.push(menu.price);
  }
  if (menu.category !== undefined) {
    updates.push('category = ?');
    values.push(menu.category);
  }
  if (menu.available !== undefined) {
    updates.push('available = ?');
    values.push(menu.available);
  }
  if (menu.menu_date !== undefined) {
    updates.push('menu_date = ?');
    values.push(menu.menu_date);
  }

  if (updates.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE cafeteria_menu SET ${updates.join(', ')} WHERE id = ?`, values);
};

export const deleteCafeteriaMenu = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM cafeteria_menu WHERE id = ?', [id]);
};

// ==================== CAFETERIA SNACKS OPERATIONS ====================

export interface CafeteriaSnack {
  id?: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  available?: number;
  created_at?: string;
}

export const createCafeteriaSnack = async (snack: CafeteriaSnack): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO cafeteria_snacks (name, description, price, category, available) VALUES (?, ?, ?, ?, ?)',
    [snack.name, snack.description || null, snack.price, snack.category || null, snack.available ?? 1]
  );

  return result.lastInsertRowId;
};

export const getCafeteriaSnacks = async (): Promise<CafeteriaSnack[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<CafeteriaSnack>(
    'SELECT * FROM cafeteria_snacks WHERE available = 1 ORDER BY category, name'
  );
};

export const updateCafeteriaSnack = async (id: number, snack: Partial<CafeteriaSnack>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const updates: string[] = [];
  const values: any[] = [];

  if (snack.name !== undefined) {
    updates.push('name = ?');
    values.push(snack.name);
  }
  if (snack.description !== undefined) {
    updates.push('description = ?');
    values.push(snack.description);
  }
  if (snack.price !== undefined) {
    updates.push('price = ?');
    values.push(snack.price);
  }
  if (snack.category !== undefined) {
    updates.push('category = ?');
    values.push(snack.category);
  }
  if (snack.available !== undefined) {
    updates.push('available = ?');
    values.push(snack.available);
  }

  if (updates.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE cafeteria_snacks SET ${updates.join(', ')} WHERE id = ?`, values);
};

export const deleteCafeteriaSnack = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM cafeteria_snacks WHERE id = ?', [id]);
};

// ==================== ANNOUNCEMENT OPERATIONS ====================

export interface Announcement {
  id?: number;
  owner: string;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  likes_count?: number;
  comments_count?: number;
  is_liked?: number;
}

export const createAnnouncement = async (announcement: Announcement): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO announcements (owner, title, description) VALUES (?, ?, ?)',
    [announcement.owner, announcement.title, announcement.description]
  );

  return result.lastInsertRowId;
};

export const getAnnouncements = async (studentId?: number): Promise<Announcement[]> => {
  if (!db) throw new Error('Database not initialized');

  const announcements = await db.getAllAsync<Announcement>(
    `SELECT a.*,
      (SELECT COUNT(*) FROM announcement_likes WHERE announcement_id = a.id) as likes_count,
      (SELECT COUNT(*) FROM announcement_comments WHERE announcement_id = a.id) as comments_count,
      ${studentId ? `(SELECT COUNT(*) FROM announcement_likes WHERE announcement_id = a.id AND student_id = ?) as is_liked` : '0 as is_liked'}
    FROM announcements a
    ORDER BY a.created_at DESC`,
    studentId ? [studentId] : []
  );

  return announcements;
};

export const getAnnouncementById = async (id: number, studentId?: number): Promise<Announcement | null> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getFirstAsync<Announcement>(
    `SELECT a.*,
      (SELECT COUNT(*) FROM announcement_likes WHERE announcement_id = a.id) as likes_count,
      (SELECT COUNT(*) FROM announcement_comments WHERE announcement_id = a.id) as comments_count,
      ${studentId ? `(SELECT COUNT(*) FROM announcement_likes WHERE announcement_id = a.id AND student_id = ?) as is_liked` : '0 as is_liked'}
    FROM announcements a
    WHERE a.id = ?`,
    studentId ? [studentId, id] : [id]
  );
};

export const updateAnnouncement = async (id: number, announcement: Partial<Announcement>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const values: any[] = [];

  if (announcement.owner !== undefined) {
    updates.push('owner = ?');
    values.push(announcement.owner);
  }
  if (announcement.title !== undefined) {
    updates.push('title = ?');
    values.push(announcement.title);
  }
  if (announcement.description !== undefined) {
    updates.push('description = ?');
    values.push(announcement.description);
  }

  if (updates.length === 1) return; // Only updated_at

  values.push(id);
  await db.runAsync(`UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`, values);
};

export const deleteAnnouncement = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM announcements WHERE id = ?', [id]);
};

// ==================== ANNOUNCEMENT COMMENT OPERATIONS ====================

export interface AnnouncementComment {
  id?: number;
  announcement_id: number;
  student_id?: number;
  user_name: string;
  content: string;
  created_at?: string;
}

export const createAnnouncementComment = async (comment: AnnouncementComment): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO announcement_comments (announcement_id, student_id, user_name, content) VALUES (?, ?, ?, ?)',
    [comment.announcement_id, comment.student_id || null, comment.user_name, comment.content]
  );

  return result.lastInsertRowId;
};

export const getAnnouncementComments = async (announcementId: number): Promise<AnnouncementComment[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<AnnouncementComment>(
    'SELECT * FROM announcement_comments WHERE announcement_id = ? ORDER BY created_at ASC',
    [announcementId]
  );
};

export const deleteAnnouncementComment = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM announcement_comments WHERE id = ?', [id]);
};

// ==================== ANNOUNCEMENT LIKE OPERATIONS ====================

export const toggleAnnouncementLike = async (announcementId: number, studentId: number): Promise<boolean> => {
  if (!db) throw new Error('Database not initialized');

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM announcement_likes WHERE announcement_id = ? AND student_id = ?',
    [announcementId, studentId]
  );

  if (existing) {
    await db.runAsync(
      'DELETE FROM announcement_likes WHERE announcement_id = ? AND student_id = ?',
      [announcementId, studentId]
    );
    return false; // Unliked
  } else {
    await db.runAsync(
      'INSERT INTO announcement_likes (announcement_id, student_id) VALUES (?, ?)',
      [announcementId, studentId]
    );
    return true; // Liked
  }
};

// ==================== ACADEMIC CALENDAR OPERATIONS ====================

export interface AcademicCalendar {
  id?: number;
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  event_type: string; // 'semester', 'exam', 'holiday', 'deadline', 'registration', 'course_exam'
  icon?: string;
  course_code?: string;
  created_at?: string;
}

export const createAcademicCalendar = async (calendar: AcademicCalendar): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.runAsync(
    'INSERT INTO academic_calendar (title, description, event_date, end_date, event_type, icon, course_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      calendar.title,
      calendar.description || null,
      calendar.event_date,
      calendar.end_date || null,
      calendar.event_type,
      calendar.icon || null,
      calendar.course_code || null,
    ]
  );

  return result.lastInsertRowId;
};

export const getAcademicCalendar = async (): Promise<AcademicCalendar[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<AcademicCalendar>(
    'SELECT * FROM academic_calendar ORDER BY event_date ASC'
  );
};

export const getAcademicCalendarByType = async (type: string): Promise<AcademicCalendar[]> => {
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<AcademicCalendar>(
    'SELECT * FROM academic_calendar WHERE event_type = ? ORDER BY event_date ASC',
    [type]
  );
};

export const updateAcademicCalendar = async (id: number, calendar: Partial<AcademicCalendar>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const updates: string[] = [];
  const values: any[] = [];

  if (calendar.title !== undefined) {
    updates.push('title = ?');
    values.push(calendar.title);
  }
  if (calendar.description !== undefined) {
    updates.push('description = ?');
    values.push(calendar.description);
  }
  if (calendar.event_date !== undefined) {
    updates.push('event_date = ?');
    values.push(calendar.event_date);
  }
  if (calendar.end_date !== undefined) {
    updates.push('end_date = ?');
    values.push(calendar.end_date);
  }
  if (calendar.event_type !== undefined) {
    updates.push('event_type = ?');
    values.push(calendar.event_type);
  }
  if (calendar.icon !== undefined) {
    updates.push('icon = ?');
    values.push(calendar.icon);
  }
  if (calendar.course_code !== undefined) {
    updates.push('course_code = ?');
    values.push(calendar.course_code);
  }

  if (updates.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE academic_calendar SET ${updates.join(', ')} WHERE id = ?`, values);
};

export const deleteAcademicCalendar = async (id: number): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM academic_calendar WHERE id = ?', [id]);
};

// ==================== SEED DATA ====================

export const seedSampleData = async (): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  // Check if data already exists
  const existingDepartments = await getDepartments();
  if (existingDepartments.length > 0) {
    console.log('Sample data already exists');
    return;
  }

  console.log('Seeding sample data...');

  // Create departments
  const bilgisayarMuh = await createDepartment({
    code: 'BM',
    name: 'Bilgisayar Mühendisliği',
    faculty: 'Mühendislik Fakültesi'
  });

  const elektrikMuh = await createDepartment({
    code: 'EEM',
    name: 'Elektrik-Elektronik Mühendisliği',
    faculty: 'Mühendislik Fakültesi'
  });

  // Create sample courses for Bilgisayar Mühendisliği
  const courses = [
    // 1. Sınıf - Güz
    { code: 'BM101', name: 'Programlamaya Giriş', class_year: 1, semester: 1, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Prof. Dr. Ali Yılmaz' },
    { code: 'BM103', name: 'Matematik I', class_year: 1, semester: 1, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Doç. Dr. Ayşe Kara' },
    { code: 'BM105', name: 'Fizik I', class_year: 1, semester: 1, credits: 3, ects: 5, is_mandatory: 1, instructor: 'Prof. Dr. Mehmet Demir' },
    // 1. Sınıf - Bahar
    { code: 'BM102', name: 'Nesne Yönelimli Programlama', class_year: 1, semester: 2, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Dr. Zeynep Ak' },
    { code: 'BM104', name: 'Matematik II', class_year: 1, semester: 2, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Doç. Dr. Ayşe Kara' },
    { code: 'BM106', name: 'Fizik II', class_year: 1, semester: 2, credits: 3, ects: 5, is_mandatory: 1, instructor: 'Prof. Dr. Mehmet Demir' },
    // 2. Sınıf - Güz
    { code: 'BM201', name: 'Veri Yapıları', class_year: 2, semester: 1, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Prof. Dr. Ali Yılmaz' },
    { code: 'BM203', name: 'Algoritma Analizi', class_year: 2, semester: 1, credits: 3, ects: 5, is_mandatory: 1, instructor: 'Doç. Dr. Hakan Yıldız' },
    { code: 'BM205', name: 'Ayrık Matematik', class_year: 2, semester: 1, credits: 3, ects: 5, is_mandatory: 1, instructor: 'Dr. Can Özkan' },
    // 2. Sınıf - Bahar
    { code: 'BM202', name: 'Veritabanı Sistemleri', class_year: 2, semester: 2, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Dr. Zeynep Ak' },
    { code: 'BM204', name: 'İşletim Sistemleri', class_year: 2, semester: 2, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Prof. Dr. Okan Türk' },
    { code: 'BM206', name: 'Bilgisayar Ağları', class_year: 2, semester: 2, credits: 3, ects: 5, is_mandatory: 1, instructor: 'Doç. Dr. Hakan Yıldız' },
    // 3. Sınıf - Güz
    { code: 'BM301', name: 'Yazılım Mühendisliği', class_year: 3, semester: 1, credits: 4, ects: 6, is_mandatory: 1, instructor: 'Prof. Dr. Okan Türk' },
    { code: 'BM303', name: 'Web Programlama', class_year: 3, semester: 1, credits: 3, ects: 5, is_mandatory: 1, instructor: 'Dr. Selin Ay' },
    { code: 'BM305', name: 'Yapay Zeka', class_year: 3, semester: 1, credits: 3, ects: 5, is_mandatory: 0, instructor: 'Doç. Dr. Elif Güneş' },
    // 3. Sınıf - Bahar
    { code: 'BM302', name: 'Mobil Programlama', class_year: 3, semester: 2, credits: 3, ects: 5, is_mandatory: 1, instructor: 'Dr. Can Özkan' },
    { code: 'BM304', name: 'Siber Güvenlik', class_year: 3, semester: 2, credits: 3, ects: 5, is_mandatory: 0, instructor: 'Doç. Dr. Hakan Yıldız' },
    { code: 'BM306', name: 'Makine Öğrenmesi', class_year: 3, semester: 2, credits: 3, ects: 5, is_mandatory: 0, instructor: 'Doç. Dr. Elif Güneş' },
    // 4. Sınıf - Güz
    { code: 'BM401', name: 'Bitirme Projesi I', class_year: 4, semester: 1, credits: 4, ects: 8, is_mandatory: 1, instructor: 'Tüm Öğretim Üyeleri' },
    { code: 'BM403', name: 'Derin Öğrenme', class_year: 4, semester: 1, credits: 3, ects: 5, is_mandatory: 0, instructor: 'Doç. Dr. Elif Güneş' },
    // 4. Sınıf - Bahar
    { code: 'BM402', name: 'Bitirme Projesi II', class_year: 4, semester: 2, credits: 4, ects: 8, is_mandatory: 1, instructor: 'Tüm Öğretim Üyeleri' },
    { code: 'BM404', name: 'Bulut Bilişim', class_year: 4, semester: 2, credits: 3, ects: 5, is_mandatory: 0, instructor: 'Dr. Selin Ay' },
  ];

  const courseIds: Record<string, number> = {};
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const courseId = await createCourse({
      ...course,
      department_id: bilgisayarMuh,
      quota: 40
    });
    courseIds[course.code] = courseId;

    // Add schedule
    const dayIndex = i % 5;
    const timeIndex = Math.floor(i / 5) % times.length;
    await createCourseSchedule({
      course_id: courseId,
      day: days[dayIndex],
      start_time: times[timeIndex],
      end_time: addHours(times[timeIndex], 2),
      classroom: `A-${100 + (i % 10)}`,
      faculty: 'Mühendislik Fakültesi'
    });

    // Add exams
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 30 + i * 2);
    
    await createExam({
      course_id: courseId,
      exam_type: 'midterm',
      exam_date: examDate.toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '12:00',
      classroom: `S-${100 + (i % 5)}`,
      faculty: 'Mühendislik Fakültesi'
    });

    examDate.setDate(examDate.getDate() + 45);
    await createExam({
      course_id: courseId,
      exam_type: 'final',
      exam_date: examDate.toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '12:00',
      classroom: `S-${100 + (i % 5)}`,
      faculty: 'Mühendislik Fakültesi'
    });
  }

  // Create sample student
  const studentId = await createStudent({
    student_number: '2021123456',
    first_name: 'Ahmet',
    last_name: 'Yılmaz',
    email: 'ahmet.yilmaz@ogrenci.edu.tr',
    password: '123456',
    department_id: bilgisayarMuh,
    class_year: 2,
    gno: 2.85,
    yno: 3.10
  });

  // Enroll student in some courses (1st year courses as passed, some 2nd year as enrolled)
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  // Mark 1st year courses as passed
  const firstYearCourses = ['BM101', 'BM103', 'BM105', 'BM102', 'BM104', 'BM106'];
  for (const code of firstYearCourses) {
    await enrollCourse({
      student_id: studentId,
      course_id: courseIds[code],
      semester: code.endsWith('1') || code.endsWith('3') || code.endsWith('5') ? 'fall' : 'spring',
      academic_year: `${currentYear - 1}-${currentYear}`,
      status: 'passed'
    });
    await updateStudentCourse(courseIds[code], {
      midterm_grade: 70 + Math.random() * 20,
      final_grade: 65 + Math.random() * 25,
      letter_grade: 'BB',
      grade_point: 3.0
    });
  }

  // Enroll in current semester courses
  const currentCourses = ['BM201', 'BM203', 'BM205'];
  for (const code of currentCourses) {
    await enrollCourse({
      student_id: studentId,
      course_id: courseIds[code],
      semester: 'fall',
      academic_year: academicYear,
      status: 'enrolled'
    });
  }

  // Add cafeteria menu items for today
  const today = new Date().toISOString().split('T')[0];
  await createCafeteriaMenu({
    name: 'Mercimek Çorbası',
    description: 'Geleneksel Türk mercimek çorbası',
    price: 15,
    category: 'main',
    available: 1,
    menu_date: today,
  });
  await createCafeteriaMenu({
    name: 'Tavuk Sote',
    description: 'Sebzeli tavuk sote, pilav ile servis edilir',
    price: 45,
    category: 'main',
    available: 1,
    menu_date: today,
  });
  await createCafeteriaMenu({
    name: 'Karnıyarık',
    description: 'Kıymalı patlıcan dolması',
    price: 50,
    category: 'main',
    available: 1,
    menu_date: today,
  });
  await createCafeteriaMenu({
    name: 'Pilav',
    description: 'Tereyağlı pirinç pilavı',
    price: 12,
    category: 'side',
    available: 1,
    menu_date: today,
  });
  await createCafeteriaMenu({
    name: 'Sütlaç',
    description: 'Geleneksel fırın sütlaç',
    price: 20,
    category: 'dessert',
    available: 1,
    menu_date: today,
  });
  await createCafeteriaMenu({
    name: 'Ayran',
    description: 'Taze köpüklü ayran',
    price: 8,
    category: 'drink',
    available: 1,
    menu_date: today,
  });

  // Add cafeteria snacks
  await createCafeteriaSnack({
    name: 'Patates Kızartması',
    description: 'Klasik patates kızartması',
    price: 25,
    category: 'Atıştırmalık',
    available: 1,
  });
  await createCafeteriaSnack({
    name: 'Hamburger',
    description: 'Klasik hamburger',
    price: 40,
    category: 'Atıştırmalık',
    available: 1,
  });
  await createCafeteriaSnack({
    name: 'Tost',
    description: 'Kaşarlı tost',
    price: 20,
    category: 'Atıştırmalık',
    available: 1,
  });
  await createCafeteriaSnack({
    name: 'Çay',
    description: 'Türk çayı',
    price: 5,
    category: 'İçecek',
    available: 1,
  });
  await createCafeteriaSnack({
    name: 'Kahve',
    description: 'Türk kahvesi',
    price: 15,
    category: 'İçecek',
    available: 1,
  });

  // Add announcements
  await createAnnouncement({
    owner: 'Yemekhane',
    title: '🍕 İtalyan Haftası Başladı!',
    description: 'Bu hafta yemekhanede İtalyan mutfağından lezzetler sizlerle! Pizza, makarna ve tiramisu günlük menümüzde. Kaçırmayın!',
  });
  await createAnnouncement({
    owner: 'Yemekhane',
    title: '🥗 Sağlıklı Yaşam Menüsü',
    description: 'Fit menümüz artık her gün mevcut! Düşük kalorili, yüksek proteinli seçenekler için 2. kata bekleriz.',
  });
  await createAnnouncement({
    owner: 'Yemekhane',
    title: '☕ Kahve Köşesi Açıldı',
    description: 'Yemekhanemizin girişinde yeni kahve köşemiz hizmetinizde! Americano, Latte, Cappuccino ve daha fazlası öğrenci fiyatlarıyla.',
  });
  await createAnnouncement({
    owner: 'Öğrenci İşleri',
    title: '📚 Ders Kayıt Tarihleri',
    description: '2024-2025 Güz dönemi ders kayıt işlemleri 16-20 Eylül tarihleri arasında yapılacaktır. Detaylı bilgi için öğrenci işlerine başvurunuz.',
  });
  await createAnnouncement({
    owner: 'Kütüphane',
    title: '📖 24 Saat Açık Çalışma Alanı',
    description: 'Kütüphanemiz artık 7/24 hizmetinizde! Gece çalışmak isteyen öğrencilerimiz için özel çalışma alanları hazırlandı.',
  });

  // Add events
  const eventDate1 = new Date();
  eventDate1.setDate(eventDate1.getDate() + 7);
  await createEvent({
    title: 'Konser',
    description: 'Üniversite öğrenci toplulukları konseri',
    location: 'Spor Salonu',
    event_date: eventDate1.toISOString(),
    organizer: 'Öğrenci Konseyi',
  });
  const eventDate2 = new Date();
  eventDate2.setDate(eventDate2.getDate() + 14);
  await createEvent({
    title: 'Teknoloji Fuarı',
    description: 'Bilgisayar Mühendisliği Bölümü teknoloji fuarı',
    location: 'Mühendislik Fakültesi',
    event_date: eventDate2.toISOString(),
    organizer: 'Bilgisayar Mühendisliği Topluluğu',
  });
  const eventDate3 = new Date();
  eventDate3.setDate(eventDate3.getDate() + 21);
  await createEvent({
    title: 'Kariyer Günleri',
    description: 'İş dünyasından profesyonellerle buluşma',
    location: 'Konferans Salonu',
    event_date: eventDate3.toISOString(),
    organizer: 'Kariyer Merkezi',
  });
  const eventDate4 = new Date();
  eventDate4.setDate(eventDate4.getDate() + 28);
  await createEvent({
    title: 'Spor Turnuvası',
    description: 'Fakülteler arası futbol turnuvası',
    location: 'Spor Salonu',
    event_date: eventDate4.toISOString(),
    organizer: 'Spor Kulübü',
  });
  const eventDate5 = new Date();
  eventDate5.setDate(eventDate5.getDate() + 35);
  await createEvent({
    title: 'Kültür Gecesi',
    description: 'Geleneksel kültür gecesi etkinliği',
    location: 'Amfi Tiyatro',
    event_date: eventDate5.toISOString(),
    organizer: 'Kültür ve Sanat Topluluğu',
  });

  // Add more cafeteria menu items for different days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  await createCafeteriaMenu({
    name: 'Ezogelin Çorbası',
    description: 'Geleneksel ezogelin çorbası',
    price: 15,
    category: 'main',
    available: 1,
    menu_date: tomorrowStr,
  });
  await createCafeteriaMenu({
    name: 'Izgara Köfte',
    description: 'Izgara köfte, pilav ve salata',
    price: 50,
    category: 'main',
    available: 1,
    menu_date: tomorrowStr,
  });
  await createCafeteriaMenu({
    name: 'Mantı',
    description: 'Ev yapımı mantı, yoğurt ve tereyağı ile',
    price: 45,
    category: 'main',
    available: 1,
    menu_date: tomorrowStr,
  });
  await createCafeteriaMenu({
    name: 'Baklava',
    description: 'Cevizli baklava',
    price: 25,
    category: 'dessert',
    available: 1,
    menu_date: tomorrowStr,
  });
  await createCafeteriaMenu({
    name: 'Limonata',
    description: 'Taze sıkılmış limonata',
    price: 10,
    category: 'drink',
    available: 1,
    menu_date: tomorrowStr,
  });

  // Add more snacks
  await createCafeteriaSnack({
    name: 'Simit',
    description: 'Taze simit',
    price: 8,
    category: 'Atıştırmalık',
    available: 1,
  });
  await createCafeteriaSnack({
    name: 'Poğaça',
    description: 'Kaşarlı poğaça',
    price: 12,
    category: 'Atıştırmalık',
    available: 1,
  });
  await createCafeteriaSnack({
    name: 'Su',
    description: '500ml pet şişe su',
    price: 3,
    category: 'İçecek',
    available: 1,
  });

  // Add more announcements
  await createAnnouncement({
    owner: 'Spor Bilimleri Fakültesi',
    title: '🏃 Fitness Salonu Açıldı',
    description: 'Yeni fitness salonumuz tüm öğrencilerimize açıldı! Modern ekipmanlar ve uzman antrenörlerle hizmetinizdeyiz. Ücretsiz deneme dersleri için başvurun.',
  });
  await createAnnouncement({
    owner: 'Öğrenci İşleri',
    title: '💰 Burs Başvuruları Başladı',
    description: '2024-2025 akademik yılı burs başvuruları başlamıştır. Başvuru için gerekli belgeler ve detaylı bilgi öğrenci işleri sayfasında yayınlanmıştır.',
  });
  await createAnnouncement({
    owner: 'Kültür ve Sanat Topluluğu',
    title: '🎭 Tiyatro Gösterisi',
    description: 'Üniversitemiz tiyatro topluluğu yeni sezon gösterisi için hazırlanıyor. Oyunculuk ve teknik ekibinde yer almak isteyen öğrencilerimiz başvurabilir.',
  });
  await createAnnouncement({
    owner: 'Mühendislik Fakültesi',
    title: '🔬 Laboratuvar Kullanım Saatleri',
    description: 'Mühendislik fakültesi laboratuvarları hafta içi 08:00-18:00 saatleri arasında açıktır. Rezervasyon için laboratuvar sorumlusu ile iletişime geçiniz.',
  });
  await createAnnouncement({
    owner: 'Sağlık Merkezi',
    title: '🏥 Aşı Kampanyası',
    description: 'Grip aşısı kampanyamız başlamıştır. Tüm öğrencilerimiz ücretsiz aşı yaptırabilir. Randevu için sağlık merkezine başvurun.',
  });

  // Add more events
  const eventDate6 = new Date();
  eventDate6.setDate(eventDate6.getDate() + 10);
  await createEvent({
    title: 'Bilim Şenliği',
    description: 'Fen bilimleri fakültesi bilim şenliği etkinliği',
    location: 'Fen Fakültesi',
    event_date: eventDate6.toISOString(),
    organizer: 'Fen Bilimleri Topluluğu',
  });
  const eventDate7 = new Date();
  eventDate7.setDate(eventDate7.getDate() + 17);
  await createEvent({
    title: 'Kitap Fuarı',
    description: 'Kampüs içi kitap fuarı ve imza günleri',
    location: 'Kütüphane Önü',
    event_date: eventDate7.toISOString(),
    organizer: 'Kütüphane',
  });
  const eventDate8 = new Date();
  eventDate8.setDate(eventDate8.getDate() + 24);
  await createEvent({
    title: 'Müzik Gecesi',
    description: 'Öğrenci müzik grupları konseri',
    location: 'Amfi Tiyatro',
    event_date: eventDate8.toISOString(),
    organizer: 'Müzik Topluluğu',
  });
  const eventDate9 = new Date();
  eventDate9.setDate(eventDate9.getDate() + 31);
  await createEvent({
    title: 'Seminer: Yapay Zeka',
    description: 'Yapay zeka ve geleceği konulu seminer',
    location: 'Konferans Salonu',
    event_date: eventDate9.toISOString(),
    organizer: 'Bilgisayar Mühendisliği Bölümü',
  });
  const eventDate10 = new Date();
  eventDate10.setDate(eventDate10.getDate() + 38);
  await createEvent({
    title: 'Fotoğraf Sergisi',
    description: 'Öğrenci fotoğraf sergisi açılışı',
    location: 'Sanat Galerisi',
    event_date: eventDate10.toISOString(),
    organizer: 'Fotoğrafçılık Topluluğu',
  });

  // Add academic calendar for 2024-2025 Fall Semester
  await createAcademicCalendar({
    title: 'Güz Dönemi Başlangıcı',
    description: '2024-2025 Güz dönemi derslerinin başlangıcı',
    event_date: '2024-09-16',
    event_type: 'semester',
    icon: 'school-outline',
  });
  await createAcademicCalendar({
    title: 'Vize Haftası',
    description: 'Güz dönemi vize sınavları',
    event_date: '2024-11-04',
    event_type: 'exam',
    icon: 'document-text-outline',
  });
  await createAcademicCalendar({
    title: 'Vize Haftası Bitişi',
    description: 'Güz dönemi vize sınavlarının bitişi',
    event_date: '2024-11-08',
    event_type: 'exam',
    icon: 'document-text-outline',
  });
  await createAcademicCalendar({
    title: 'Final Haftası',
    description: 'Güz dönemi final sınavları',
    event_date: '2024-12-23',
    event_type: 'exam',
    icon: 'document-text-outline',
  });
  await createAcademicCalendar({
    title: 'Final Haftası Bitişi',
    description: 'Güz dönemi final sınavlarının bitişi',
    event_date: '2024-12-27',
    event_type: 'exam',
    icon: 'document-text-outline',
  });
  await createAcademicCalendar({
    title: 'Bütünleme Sınavları',
    description: 'Güz dönemi bütünleme sınavları',
    event_date: '2025-01-13',
    event_type: 'exam',
    icon: 'document-text-outline',
  });
  await createAcademicCalendar({
    title: 'Güz Dönemi Bitişi',
    description: '2024-2025 Güz döneminin sona ermesi',
    event_date: '2025-01-17',
    event_type: 'semester',
    icon: 'school-outline',
  });
  await createAcademicCalendar({
    title: 'Bahar Dönemi Başlangıcı',
    description: '2024-2025 Bahar dönemi derslerinin başlangıcı',
    event_date: '2025-02-10',
    event_type: 'semester',
    icon: 'school-outline',
  });

  console.log('Sample data seeded successfully');
};

// Helper function to add hours to time string
const addHours = (time: string, hours: number): string => {
  const [h, m] = time.split(':').map(Number);
  const newHour = (h + hours) % 24;
  return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// ==================== UTILITY FUNCTIONS ====================

export const clearAllData = async (): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.execAsync(`
    DELETE FROM favorites;
    DELETE FROM notifications;
    DELETE FROM settings;
    DELETE FROM student_courses;
    DELETE FROM course_prerequisites;
    DELETE FROM exams;
    DELETE FROM course_schedules;
    DELETE FROM courses;
    DELETE FROM students;
    DELETE FROM departments;
    DELETE FROM bus_schedules;
    DELETE FROM events;
    DELETE FROM locations;
  `);
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};
