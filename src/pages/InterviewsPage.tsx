import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InterviewCard from '../components/InterviewCard';
import { Interview } from '../types';
import { getScheduledInterviews, initDb } from '../lib/db';
import { isPast } from 'date-fns';

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);

  const loadInterviews = async () => {
    const data = await getScheduledInterviews();
    // Filter out cancelled and completed interviews
    setInterviews(data.filter(interview => {
      const isCompleted = isPast(new Date(interview.scheduledFor));
      return !isCompleted && interview.status !== 'cancelled';
    }));
  };

  useEffect(() => {
    const setup = async () => {
      await initDb();
      await loadInterviews();
    };
    setup();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upcoming Interviews</h1>
        <button 
          onClick={() => navigate('/schedule')}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Schedule Interview
        </button>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No upcoming interviews scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {interviews.map((interview) => (
            <InterviewCard 
              key={interview.id} 
              interview={interview} 
              onUpdate={loadInterviews} 
            />
          ))}
        </div>
      )}
    </div>
  );
}