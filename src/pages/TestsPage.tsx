import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { Test } from '../types';
import TestQuestionsModal from '../components/TestQuestionsModal';
import { initDb, deleteTest } from '../lib/db';
import clsx from 'clsx';

const categories = [
  { id: 'development', name: 'Development', color: 'blue' },
  { id: 'devops', name: 'DevOps', color: 'green' },
  { id: 'cybersecurity', name: 'Cybersecurity', color: 'purple' }
] as const;

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [newTest, setNewTest] = useState({
    title: '',
    category: 'development' as Test['category'],
    duration: 60,
    description: ''
  });

  useEffect(() => {
    const setup = async () => {
      await initDb();
      await loadTests();
    };
    setup();
  }, []);

  const loadTests = async () => {
    const db = await initDb();
    const tx = db.transaction('tests', 'readonly');
    const tests = await tx.store.getAll();
    setTests(tests);
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = await initDb();
      const tx = db.transaction('tests', 'readwrite');
      await tx.store.add({
        ...newTest,
        id: crypto.randomUUID(),
        isBuiltIn: false
      });
      await tx.done;
      await loadTests();
      setIsNewTestModalOpen(false);
      setNewTest({
        title: '',
        category: 'development',
        duration: 60,
        description: ''
      });
    } catch (error) {
      console.error('Failed to create test:', error);
      alert('Failed to create test. Please try again.');
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;

    try {
      await deleteTest(selectedTest.id);
      await loadTests();
      setIsDeleteModalOpen(false);
      setSelectedTest(null);
      setDeleteError(null);
    } catch (error) {
      console.error('Failed to delete test:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete test. Please try again.');
    }
  };

  const getCategoryColor = (category: Test['category']) => {
    const categoryConfig = categories.find(c => c.id === category);
    return categoryConfig?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Technical Tests</h1>
        <button
          onClick={() => setIsNewTestModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {tests.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                <span className={clsx(
                  'inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium',
                  getCategoryColor(test.category) === 'blue' && 'bg-blue-100 text-blue-800',
                  getCategoryColor(test.category) === 'green' && 'bg-green-100 text-green-800',
                  getCategoryColor(test.category) === 'purple' && 'bg-purple-100 text-purple-800'
                )}>
                  {categories.find(c => c.id === test.category)?.name}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedTest(test);
                    setIsQuestionsModalOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTest(test);
                    setDeleteError(null);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">{test.description}</p>
            
            <div className="text-sm text-gray-500">
              Duration: {test.duration} minutes
            </div>
          </div>
        ))}
      </div>

      {/* Modals remain the same */}
      {/* ... */}
    </div>
  );
}