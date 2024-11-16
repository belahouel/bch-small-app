import { openDB, DBSchema } from 'idb';
import { Test, Question, Interview } from '../types';

interface InterviewDB extends DBSchema {
  interviews: {
    key: string;
    value: {
      id: string;
      title: string;
      candidateName: string;
      position: string;
      scheduledFor: string;
      endTime: string;
      status: 'scheduled' | 'completed' | 'cancelled';
    };
    indexes: { 'by-date': string };
  };
  'interview-tests': {
    key: string;
    value: {
      id?: number;
      interviewId: string;
      testId: string;
    };
    indexes: { 'by-interview': string };
  };
  tests: {
    key: string;
    value: Test;
  };
  questions: {
    key: string;
    value: Question;
    indexes: { 'by-test': string };
  };
}

const DB_NAME = 'interview-scheduler';
const DB_VERSION = 4;

let dbPromise: Promise<IDBDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    await initDb();
  }
  return (await dbPromise)!;
}

export async function initDb() {
  if (!dbPromise) {
    dbPromise = openDB<InterviewDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('interviews')) {
          const interviewStore = db.createObjectStore('interviews', { keyPath: 'id' });
          interviewStore.createIndex('by-date', 'scheduledFor');
        }

        if (!db.objectStoreNames.contains('interview-tests')) {
          const interviewTestStore = db.createObjectStore('interview-tests', { 
            keyPath: ['interviewId', 'testId'],
            autoIncrement: true 
          });
          interviewTestStore.createIndex('by-interview', 'interviewId');
        }

        if (!db.objectStoreNames.contains('tests')) {
          const testStore = db.createObjectStore('tests', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('questions')) {
          const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
          questionStore.createIndex('by-test', 'testId');
        }
      },
    });
  }
  return dbPromise;
}

export async function getScheduledInterviews(): Promise<Interview[]> {
  const db = await getDb();
  const tx = db.transaction(['interviews', 'interview-tests', 'tests'], 'readonly');
  
  const interviews = await tx.objectStore('interviews').getAll();
  const interviewTests = await tx.objectStore('interview-tests').getAll();
  const tests = await tx.objectStore('tests').getAll();

  const result = await Promise.all(
    interviews.map(async (interview) => {
      const testIds = interviewTests
        .filter(it => it.interviewId === interview.id)
        .map(it => it.testId);
      
      const interviewTestsList = tests.filter(test => testIds.includes(test.id));

      return {
        ...interview,
        scheduledFor: new Date(interview.scheduledFor),
        endTime: new Date(interview.endTime),
        tests: interviewTestsList
      };
    })
  );

  return result;
}

export async function isSlotTaken(start: Date, end: Date, excludeInterviewId?: string): Promise<boolean> {
  const db = await getDb();
  const tx = db.transaction('interviews', 'readonly');
  const store = tx.objectStore('interviews');
  const interviews = await store.getAll();

  return interviews.some(interview => {
    if (excludeInterviewId && interview.id === excludeInterviewId) return false;
    if (interview.status === 'cancelled') return false;

    const interviewStart = new Date(interview.scheduledFor);
    const interviewEnd = new Date(interview.endTime);

    return (
      (start >= interviewStart && start < interviewEnd) ||
      (end > interviewStart && end <= interviewEnd) ||
      (start <= interviewStart && end >= interviewEnd)
    );
  });
}

export async function createInterview(data: {
  id: string;
  title: string;
  candidateName: string;
  position: string;
  scheduledFor: Date;
  endTime: Date;
  testIds: string[];
}) {
  const db = await getDb();
  const tx = db.transaction(['interviews', 'interview-tests'], 'readwrite');

  await tx.objectStore('interviews').add({
    id: data.id,
    title: data.title,
    candidateName: data.candidateName,
    position: data.position,
    scheduledFor: data.scheduledFor.toISOString(),
    endTime: data.endTime.toISOString(),
    status: 'scheduled'
  });

  for (const testId of data.testIds) {
    await tx.objectStore('interview-tests').add({
      interviewId: data.id,
      testId
    });
  }

  await tx.done;
}

export async function updateInterview(data: {
  id: string;
  title: string;
  candidateName: string;
  position: string;
  scheduledFor: Date;
  endTime: Date;
  testIds: string[];
}) {
  const db = await getDb();
  const tx = db.transaction(['interviews', 'interview-tests'], 'readwrite');

  await tx.objectStore('interviews').put({
    id: data.id,
    title: data.title,
    candidateName: data.candidateName,
    position: data.position,
    scheduledFor: data.scheduledFor.toISOString(),
    endTime: data.endTime.toISOString(),
    status: 'scheduled'
  });

  // Delete existing test associations
  const testStore = tx.objectStore('interview-tests');
  const existingTests = await testStore.getAll();
  for (const test of existingTests) {
    if (test.interviewId === data.id) {
      await testStore.delete([test.interviewId, test.testId]);
    }
  }

  // Add new test associations
  for (const testId of data.testIds) {
    await testStore.add({
      interviewId: data.id,
      testId
    });
  }

  await tx.done;
}

export async function cancelInterview(id: string) {
  const db = await getDb();
  const tx = db.transaction('interviews', 'readwrite');
  const store = tx.objectStore('interviews');
  
  const interview = await store.get(id);
  if (!interview) throw new Error('Interview not found');
  
  interview.status = 'cancelled';
  await store.put(interview);
  await tx.done;
}

export async function getQuestions(testId: string): Promise<Question[]> {
  const db = await getDb();
  const tx = db.transaction('questions', 'readonly');
  const store = tx.objectStore('questions');
  const index = store.index('by-test');
  return index.getAll(testId);
}

export async function addQuestion(question: Question) {
  const db = await getDb();
  const tx = db.transaction('questions', 'readwrite');
  await tx.objectStore('questions').add(question);
  await tx.done;
}

export async function updateQuestion(question: Question) {
  const db = await getDb();
  const tx = db.transaction('questions', 'readwrite');
  await tx.objectStore('questions').put(question);
  await tx.done;
}

export async function deleteQuestion(id: string) {
  const db = await getDb();
  const tx = db.transaction('questions', 'readwrite');
  await tx.objectStore('questions').delete(id);
  await tx.done;
}

export async function deleteTest(id: string) {
  const db = await getDb();
  const tx = db.transaction(['interviews', 'interview-tests', 'tests', 'questions'], 'readwrite');

  // Check if test is used in any upcoming interviews
  const interviews = await tx.objectStore('interviews').getAll();
  const interviewTests = await tx.objectStore('interview-tests').getAll();
  
  const hasUpcomingInterviews = interviews.some(interview => {
    if (interview.status === 'cancelled') return false;
    const isUpcoming = new Date(interview.scheduledFor) > new Date();
    const usesTest = interviewTests.some(it => 
      it.interviewId === interview.id && it.testId === id
    );
    return isUpcoming && usesTest;
  });

  if (hasUpcomingInterviews) {
    throw new Error('Cannot delete test: Test is being used in upcoming interviews');
  }

  // Delete all questions associated with the test
  const questionStore = tx.objectStore('questions');
  const index = questionStore.index('by-test');
  const questions = await index.getAllKeys(id);
  for (const questionId of questions) {
    await questionStore.delete(questionId);
  }

  // Delete test associations
  const testAssociations = await tx.objectStore('interview-tests').getAll();
  for (const assoc of testAssociations) {
    if (assoc.testId === id) {
      await tx.objectStore('interview-tests').delete([assoc.interviewId, assoc.testId]);
    }
  }

  // Delete the test itself
  await tx.objectStore('tests').delete(id);
  await tx.done;
}