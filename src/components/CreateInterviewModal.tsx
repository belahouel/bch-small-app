import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, addMinutes, isBefore, startOfToday } from 'date-fns';
import { Test } from '../types';
import { initDb } from '../lib/db';

interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSave: (interviewData: {
    title: string;
    candidateName: string;
    position: string;
    selectedTests: Test[];
    startTime: string;
    duration: number;
  }) => void;
}

const AVAILABLE_DURATIONS = [30, 45, 60, 90, 120];

export default function CreateInterviewModal({ isOpen, onClose, selectedDate, onSave }: CreateInterviewModalProps) {
  const [title, setTitle] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [position, setPosition] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);

  useEffect(() => {
    const loadTests = async () => {
      const db = await initDb();
      const tx = db.transaction('tests', 'readonly');
      const tests = await tx.store.getAll();
      setAvailableTests(tests);
    };
    loadTests();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    if (isBefore(startDateTime, new Date())) {
      alert('Cannot schedule interviews in the past. Please select a future date and time.');
      return;
    }

    onSave({
      title,
      candidateName,
      position,
      selectedTests,
      startTime,
      duration
    });
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setCandidateName('');
    setPosition('');
    setStartTime('09:00');
    setDuration(60);
    setSelectedTests([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleTest = (test: Test) => {
    setSelectedTests(prev =>
      prev.find(t => t.id === test.id)
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const getTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip past time slots if it's today
        if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinutes))) {
          continue;
        }
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const endTime = addMinutes(new Date(selectedDate.setHours(
    parseInt(startTime.split(':')[0]),
    parseInt(startTime.split(':')[1])
  )), duration);

  const timeSlots = getTimeSlots();
  if (timeSlots.length === 0) {
    return (
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm w-full bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Time Slots</h3>
              <p className="text-gray-600">Please select a future date to schedule interviews.</p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Schedule New Interview
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <p className="text-sm text-gray-600">
                  Selected Date: <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <select
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <select
                      id="duration"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {AVAILABLE_DURATIONS.map(d => (
                        <option key={d} value={d}>{d} minutes</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  End Time: <span className="font-medium">{format(endTime, 'HH:mm')}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Interview Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Technical Interview - Frontend Developer"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    id="candidateName"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    type="text"
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tests
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableTests.map((test) => (
                      <div
                        key={test.id}
                        onClick={() => toggleTest(test)}
                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                          selectedTests.find(t => t.id === test.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-sm">{test.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Duration: {test.duration} min
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Schedule Interview
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}