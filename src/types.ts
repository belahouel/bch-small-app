export interface Question {
  id: string;
  testId: string;
  text: string;
  answer: string;
  type: 'multiple_choice' | 'coding' | 'text';
  options?: string[];
  points: number;
}

export interface Test {
  id: string;
  title: string;
  category: 'devops' | 'cybersecurity' | 'development';
  duration: number;
  description: string;
  isBuiltIn: boolean;
}

export interface Interview {
  id: string;
  title: string;
  candidateName: string;
  candidateEmail?: string;
  position: string;
  scheduledFor: Date;
  endTime: Date;
  tests?: Test[];
  status?: 'scheduled' | 'completed' | 'cancelled';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'recruiter' | 'admin';
}