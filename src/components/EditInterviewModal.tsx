import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, addMinutes, startOfDay, addDays } from 'date-fns';
import { Interview, Test } from '../types';
import { updateInterview, isSlotTaken } from '../lib/db';

interface EditInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  onUpdate: () => void;
}

const AVAILABLE_DURATIONS = [30, 45, 60, 90, 120];

const availableTests: Test[] = [
  { id: '1', title: 'Docker & Kubernetes', category: 'devops', duration: 60, description: 'Test container orchestration knowledge', isBuiltIn: true },
  { id: '2', title: 'CI/CD Pipeline', category: 'devops', duration: 45, description: 'Implement a deployment pipeline', isBuiltIn: true },
  { id: '3', title: 'React Frontend', category: 'development', duration: 90, description: 'Build a React application', isBuiltIn: true },
  { id: '4', title: 'Node.js Backend', category: 'development', duration: 60, description: 'Create REST API endpoints', isBuiltIn: true },
  { id: '5', title: 'Security Assessment', category: 'cybersecurity', duration: 75, description: 'Evaluate security vulnerabilities', isBuiltIn: true }
];

export default function EditInterviewModal({ isOpen, onClose, interview, onUpdate }: EditInterviewModalProps) {
  const [title, setTitle] = useState(interview.title);
  const [candidateName, setCandidateName] = useState(interview.candidateName);
  const [position, setPosition] = useState(interview.position);
  const [selectedDate, setSelectedDate] = useState(format(new Date(interview.scheduledFor), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(format(new Date(interview.scheduledFor), 'HH:mm'));
  const [duration, setDuration] = useState(
    Math.round((new Date(interview.endTime).getTime() - new Date(interview.scheduledFor).getTime()) / (1000 * 60))
  );
  const [selectedTests, setSelectedTests] = useState<Test[]>(interview.tests || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    const endDateTime = addMinutes(startDateTime, duration);

    if (startDateTime < new Date()) {
      alert('Cannot schedule interviews in the past. Please select a future date and time.');
      return;
    }
    
    // Check if the new time slot is available (excluding the current interview)
    const slotTaken = await isSlotTaken(startDateTime, endDateTime, interview.id);
    if (slotTaken) {
      alert('This time slot is already taken by another interview. Please choose a different time.');
      return;
    }

    try {
      await updateInterview({
        id: interview.id,
        title,
        candidateName,
        position,
        scheduledFor: startDateTime,
        endTime: endDateTime,
        testIds: selectedTests.map(test => test.id)
      });
      await onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update interview:', error);
      alert('Failed to update interview. Please try again.');
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = startOfDay(selectedDateObj).getTime() === startOfDay(now).getTime();
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

  const toggleTest = (test: Test) => {
    setSelectedTests(prev =>
      prev.find(t => t.id === test.id)
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    // Generate next 60 days
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }
    
    return dates;
  };

  const endTime = addMinutes(new Date(selectedDate + 'T' + startTime), duration);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Edit Interview
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <select
                      id="selectedDate"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {getAvailableDates().map(date => (
                        <option key={date} value={date}>
                          {format(new Date(date), 'MMM dd, yyyy')}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      {getTimeSlots().map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
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
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Update Interview
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}