import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Plus, Edit, Trash2 } from 'lucide-react';
import { Test, Question } from '../types';
import { getQuestions, addQuestion, updateQuestion, deleteQuestion } from '../lib/db';
import clsx from 'clsx';

interface TestQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test;
}

export default function TestQuestionsModal({ isOpen, onClose, test }: TestQuestionsModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    answer: '',
    type: 'text' as Question['type'],
    points: 10,
    options: [''] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen, test.id]);

  const loadQuestions = async () => {
    const loadedQuestions = await getQuestions(test.id);
    setQuestions(loadedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await updateQuestion({
          ...formData,
          id: editingQuestion.id,
          testId: test.id
        });
      } else {
        await addQuestion({
          ...formData,
          id: crypto.randomUUID(),
          testId: test.id
        });
      }
      await loadQuestions();
      resetForm();
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  const handleDelete = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(questionId);
        await loadQuestions();
      } catch (error) {
        console.error('Failed to delete question:', error);
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      answer: question.answer,
      type: question.type,
      points: question.points,
      options: question.options || ['']
    });
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setFormData({
      text: '',
      answer: '',
      type: 'text',
      points: 10,
      options: ['']
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Manage Questions - {test.title}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Question Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Question['type'] }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="text">Text Answer</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Question Text
                  </label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                {formData.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Options
                    </label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Correct Answer
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Points
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  {editingQuestion && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Questions List</h3>
              <div className="space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            question.type === 'multiple_choice' ? 'bg-purple-100 text-purple-800' :
                            question.type === 'coding' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          )}>
                            {question.type}
                          </span>
                          <span className="text-sm text-gray-500">
                            {question.points} points
                          </span>
                        </div>
                        <p className="text-gray-900 mb-2">{question.text}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Answer:</span> {question.answer}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(question)}
                          className="p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No questions added yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}