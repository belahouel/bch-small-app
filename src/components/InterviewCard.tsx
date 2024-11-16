import React, { useState } from 'react';
import { Calendar, Clock, User, Briefcase, MoreVertical, Video } from 'lucide-react';
import { format, isToday, isPast, addMinutes } from 'date-fns';
import { Interview } from '../types';
import { Menu, Dialog } from '@headlessui/react';
import EditInterviewModal from './EditInterviewModal';
import { cancelInterview } from '../lib/db';

interface InterviewCardProps {
  interview: Interview;
  onUpdate: () => void;
  showPastInterviews?: boolean;
}

export default function InterviewCard({ interview, onUpdate, showPastInterviews = false }: InterviewCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const isPastOrCancelled = interview.status === 'cancelled' || 
    (interview.status === 'completed' || isPast(new Date(interview.scheduledFor)));

  const showActions = !isPastOrCancelled || showPastInterviews;

  const isWithinMeetingTime = () => {
    const now = new Date();
    const start = new Date(interview.scheduledFor);
    const end = new Date(interview.endTime);
    return now >= start && now <= end;
  };

  const handleCancel = async () => {
    try {
      await cancelInterview(interview.id);
      await onUpdate();
      setIsConfirmingCancel(false);
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      alert('Failed to cancel interview. Please try again.');
    }
  };

  const getStatusColor = () => {
    if (interview.status === 'cancelled') return 'bg-red-100 text-red-800';
    if (interview.status === 'completed') return 'bg-gray-100 text-gray-800';
    if (isPast(new Date(interview.scheduledFor))) return 'bg-gray-100 text-gray-800';
    if (isWithinMeetingTime()) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = () => {
    if (interview.status === 'cancelled') return 'Cancelled';
    if (interview.status === 'completed') return 'Completed';
    if (isPast(new Date(interview.scheduledFor))) return 'Past';
    if (isWithinMeetingTime()) return 'In Progress';
    return 'Scheduled';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 transition-shadow ${!isPastOrCancelled ? 'hover:shadow-md' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{interview.title}</h3>
          <div className="flex items-center text-gray-500 text-sm">
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{interview.candidateName}</span>
          </div>
        </div>
        <div className="flex items-center ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {showActions && (
            <Menu as="div" className="relative ml-2">
              <Menu.Button className="p-1 rounded-full hover:bg-gray-100">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                      >
                        Edit
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsConfirmingCancel(true)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full text-left px-4 py-2 text-sm text-red-600`}
                      >
                        Cancel Interview
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-gray-500 text-sm">
          <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{interview.position}</span>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{format(new Date(interview.scheduledFor), 'MMM dd, yyyy')}</span>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm">
          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            {format(new Date(interview.scheduledFor), 'HH:mm')} - 
            {format(new Date(interview.endTime), 'HH:mm')}
          </span>
        </div>
      </div>
      
      {interview.tests && interview.tests.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-500 mb-2">Tests:</div>
          <div className="flex flex-wrap gap-2">
            {interview.tests.map((test) => (
              <span
                key={test.id}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
              >
                {test.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {isWithinMeetingTime() && !isPastOrCancelled && (
        <button
          onClick={() => setIsJoinModalOpen(true)}
          className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          <Video className="h-4 w-4 mr-2" />
          Join Meeting
        </button>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditInterviewModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          interview={interview}
          onUpdate={onUpdate}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={isConfirmingCancel}
        onClose={() => setIsConfirmingCancel(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm w-full bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Cancel Interview
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this interview? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmingCancel(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Yes, Cancel Interview
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Join Meeting Modal */}
      <Dialog
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm w-full bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Join Interview Meeting
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              You are about to join the video call for this interview. Make sure your camera and microphone are working properly.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <a
                href="https://meet.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                onClick={() => setIsJoinModalOpen(false)}
              >
                Join Meeting
              </a>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}