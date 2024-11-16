import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfMonth, getWeeksInMonth, 
         isSameMonth, isSameDay, addMonths, addWeeks, startOfDay, addHours,
         isWithinInterval, addMinutes, isBefore, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import CreateInterviewModal from '../components/CreateInterviewModal';
import { getScheduledInterviews, createInterview, isSlotTaken, initDb } from '../lib/db';
import { Interview } from '../types';
import clsx from 'clsx';

type ViewType = 'month' | 'week' | 'day';

export default function SchedulePage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<ViewType>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [scheduledInterviews, setScheduledInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    const setup = async () => {
      await initDb();
      await loadInterviews();
    };
    setup();
  }, []);

  const loadInterviews = async () => {
    const interviews = await getScheduledInterviews();
    setScheduledInterviews(interviews);
  };

  const isSlotAvailable = (date: Date) => {
    const now = new Date();
    if (isBefore(date, now)) {
      return false;
    }

    return !scheduledInterviews.some(interview => {
      if (interview.status === 'cancelled') return false;
      
      const start = new Date(interview.scheduledFor);
      const end = new Date(interview.endTime);
      return isWithinInterval(date, { start, end });
    });
  };

  const handleSlotClick = (date: Date) => {
    if (!isBefore(date, new Date())) {
      setSelectedSlot(date);
      setIsModalOpen(true);
    }
  };

  const handleSaveInterview = async (interviewData: any) => {
    const startDateTime = new Date(selectedSlot!);
    const [hours, minutes] = interviewData.startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = addMinutes(startDateTime, interviewData.duration);
    
    const slotTaken = await isSlotTaken(startDateTime, endDateTime);
    if (slotTaken) {
      alert('This time slot is already taken by another interview. Please choose a different time.');
      return;
    }

    try {
      await createInterview({
        id: crypto.randomUUID(),
        title: interviewData.title,
        candidateName: interviewData.candidateName,
        position: interviewData.position,
        scheduledFor: startDateTime,
        endTime: endDateTime,
        testIds: interviewData.selectedTests.map((test: any) => test.id)
      });
      await loadInterviews();
      setIsModalOpen(false);
      navigate('/interviews');
    } catch (error) {
      console.error('Failed to create interview:', error);
      alert('Failed to create interview. Please try again.');
    }
  };

  const navigatePrevious = () => {
    if (selectedView === 'month') setSelectedDate(prev => addMonths(prev, -1));
    if (selectedView === 'week') setSelectedDate(prev => addWeeks(prev, -1));
    if (selectedView === 'day') setSelectedDate(prev => addDays(prev, -1));
  };

  const navigateNext = () => {
    if (selectedView === 'month') setSelectedDate(prev => addMonths(prev, 1));
    if (selectedView === 'week') setSelectedDate(prev => addWeeks(prev, 1));
    if (selectedView === 'day') setSelectedDate(prev => addDays(prev, 1));
  };

  const getInterviewsForDate = (date: Date) => {
    return scheduledInterviews.filter(interview => {
      const interviewDate = new Date(interview.scheduledFor);
      return isSameDay(date, interviewDate);
    });
  };

  const renderMonthView = () => {
    const start = startOfMonth(selectedDate);
    const weeks = getWeeksInMonth(selectedDate);
    const firstDayOfWeek = startOfWeek(start);

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {Array.from({ length: weeks * 7 }).map((_, index) => {
          const date = addDays(firstDayOfWeek, index);
          const isCurrentMonth = isSameMonth(date, selectedDate);
          const interviews = getInterviewsForDate(date);
          const isPastDate = isBefore(date, startOfDay(new Date()));

          return (
            <div
              key={index}
              onClick={() => !isPastDate && handleSlotClick(date)}
              className={clsx(
                'min-h-[100px] bg-white p-2 transition-colors duration-200',
                !isCurrentMonth && 'text-gray-400',
                isSameDay(date, new Date()) && 'bg-blue-50',
                !isPastDate && 'cursor-pointer hover:bg-indigo-50',
                isPastDate && 'bg-gray-50 cursor-not-allowed'
              )}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm">{format(date, 'd')}</span>
                {interviews.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {interviews.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {interviews.map((interview, i) => (
                  <div
                    key={interview.id}
                    className={clsx(
                      'text-xs p-1 rounded truncate',
                      interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      interview.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-green-100 text-green-800'
                    )}
                  >
                    {format(new Date(interview.scheduledFor), 'HH:mm')} - {interview.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            <div className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
              Time
            </div>
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(weekStart, i);
              return (
                <div key={i} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
                  {format(date, 'EEE MM/dd')}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {hours.map(hour => (
              <React.Fragment key={hour}>
                <div className="bg-white p-2 text-center text-sm text-gray-500">
                  {format(new Date().setHours(hour), 'ha')}
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const date = addHours(addDays(weekStart, dayIndex), hour);
                  const interviews = scheduledInterviews.filter(interview => {
                    const start = new Date(interview.scheduledFor);
                    const end = new Date(interview.endTime);
                    return isWithinInterval(date, { start, end });
                  });
                  const isPastTime = isBefore(date, new Date());

                  return (
                    <div
                      key={`${hour}-${dayIndex}`}
                      onClick={() => !isPastTime && handleSlotClick(date)}
                      className={clsx(
                        'bg-white p-2 transition-colors duration-200',
                        !isPastTime && 'cursor-pointer hover:bg-indigo-50',
                        isPastTime && 'bg-gray-50 cursor-not-allowed'
                      )}
                    >
                      {interviews.map(interview => (
                        <div
                          key={interview.id}
                          className={clsx(
                            'text-xs p-1 rounded mb-1',
                            interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            interview.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-green-100 text-green-800'
                          )}
                        >
                          {interview.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
    const day = startOfDay(selectedDate);

    return (
      <div className="bg-white">
        {hours.map(hour => {
          const date = addHours(day, hour);
          const interviews = scheduledInterviews.filter(interview => {
            const start = new Date(interview.scheduledFor);
            const end = new Date(interview.endTime);
            return isWithinInterval(date, { start, end });
          });
          const isPastTime = isBefore(date, new Date());

          return (
            <div
              key={hour}
              onClick={() => !isPastTime && handleSlotClick(date)}
              className={clsx(
                'grid grid-cols-12 border-b py-3 transition-colors duration-200',
                !isPastTime && 'cursor-pointer hover:bg-indigo-50',
                isPastTime && 'bg-gray-50 cursor-not-allowed'
              )}
            >
              <div className="col-span-2 px-4 text-right text-sm text-gray-500">
                {format(date, 'h:mm a')}
              </div>
              <div className="col-span-10 px-4 space-y-1">
                {interviews.map(interview => (
                  <div
                    key={interview.id}
                    className={clsx(
                      'p-2 rounded',
                      interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      interview.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-green-100 text-green-800'
                    )}
                  >
                    <div className="font-medium">{interview.title}</div>
                    <div className="text-sm">
                      {format(new Date(interview.scheduledFor), 'HH:mm')} - 
                      {format(new Date(interview.endTime), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Interview</h1>
        <div className="flex items-center space-x-4">
          <Tab.Group onChange={(index) => setSelectedView(['month', 'week', 'day'][index] as ViewType)}>
            <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-1">
              {['Month', 'Week', 'Day'].map((view) => (
                <Tab
                  key={view}
                  className={({ selected }) =>
                    clsx(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200',
                      selected
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-500 hover:text-gray-900'
                    )
                  }
                >
                  {view}
                </Tab>
              ))}
            </Tab.List>
          </Tab.Group>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                {format(selectedDate, 'MMMM yyyy')}
              </h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {selectedView === 'month' && renderMonthView()}
          {selectedView === 'week' && renderWeekView()}
          {selectedView === 'day' && renderDayView()}
        </div>
      </div>

      <CreateInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedSlot || new Date()}
        onSave={handleSaveInterview}
      />
    </div>
  );
}