
export interface User {
  enrollmentId: string;
  mobile: string;
  karmaPoints: number;
  isAuthenticated: boolean;
  profilePic?: string; // Base64 string
  registrationDate: number;
  level: number;
  xp: number;
  branch: string;
  role: 'student' | 'admin';
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  data: string; // Base64 string for mock storage
}

export interface ContentItem {
  id: string;
  subjectId: string;
  title: string;
  type: 'note' | 'deadline' | 'cancellation' | 'test' | 'lab' | 'other';
  content: string; // URL or text
  uploaderId: string;
  uploaderBranch: string;
  timestamp: number;
  upvotes: number;
  downvotes: number;
  isVerified: boolean;
  deadlineDate?: string;
  file?: FileMetadata;
  votedUsers: string[]; // List of enrollmentIds who have voted
}

export interface GeminiExtraction {
  subjectName: string;
  assignmentTitle: string;
  deadlineDate: string;
}
