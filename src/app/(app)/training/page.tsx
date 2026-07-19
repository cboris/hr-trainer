'use client';

import { useState } from 'react';
import { Card, Badge, Button, ProgressBar } from '@/components/ui';

interface TrainingSession {
  id: string;
  type: 'cv-review' | 'interview-prep' | 'cover-letter-review';
  title: string;
  status: 'in-progress' | 'completed' | 'scheduled';
  progress: number;
  lastActivity: string;
  aiScore?: number;
}

const mockSessions: TrainingSession[] = [
  {
    id: '1',
    type: 'cv-review',
    title: 'CV Review - Senior Frontend Developer',
    status: 'in-progress',
    progress: 65,
    lastActivity: '10 min ago',
    aiScore: 82,
  },
  {
    id: '2',
    type: 'interview-prep',
    title: 'Technical Interview Prep - React',
    status: 'scheduled',
    progress: 0,
    lastActivity: 'Scheduled for tomorrow',
  },
  {
    id: '3',
    type: 'cover-letter-review',
    title: 'Cover Letter Review - TechCorp',
    status: 'completed',
    progress: 100,
    lastActivity: '2 hours ago',
    aiScore: 91,
  },
  {
    id: '4',
    type: 'cv-review',
    title: 'General CV Review',
    status: 'completed',
    progress: 100,
    lastActivity: '1 day ago',
    aiScore: 78,
  },
];

export default function TrainingPage() {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed' | 'scheduled'>('all');

  const filteredSessions = mockSessions.filter(
    (session) => filter === 'all' || session.status === filter
  );

  const getTypeIcon = (type: TrainingSession['type']) => {
    switch (type) {
      case 'cv-review': return '📄';
      case 'interview-prep': return '🎯';
      case 'cover-letter-review': return '✉️';
    }
  };

  const getTypeLabel = (type: TrainingSession['type']) => {
    switch (type) {
      case 'cv-review': return 'CV Review';
      case 'interview-prep': return 'Interview Prep';
      case 'cover-letter-review': return 'Cover Letter Review';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Training Sessions</h1>
          <p className="text-surface-500 mt-1">AI-powered review and preparation</p>
        </div>
        <Button variant="primary">+ New Session</Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-surface-500">Active Sessions</p>
          <p className="text-2xl font-bold text-primary-600">
            {mockSessions.filter(s => s.status === 'in-progress').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Completed</p>
          <p className="text-2xl font-bold text-success-600">
            {mockSessions.filter(s => s.status === 'completed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Scheduled</p>
          <p className="text-2xl font-bold text-surface-700">
            {mockSessions.filter(s => s.status === 'scheduled').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Avg. AI Score</p>
          <p className="text-2xl font-bold text-primary-600">
            {Math.round(
              mockSessions
                .filter(s => s.aiScore)
                .reduce((acc, s) => acc + (s.aiScore || 0), 0) /
              mockSessions.filter(s => s.aiScore).length
            )}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'in-progress', 'completed', 'scheduled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <span className="text-3xl">{getTypeIcon(session.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900">{session.title}</h3>
                    <Badge
                      variant={
                        session.status === 'completed'
                          ? 'success'
                          : session.status === 'in-progress'
                          ? 'primary'
                          : 'default'
                      }
                    >
                      {session.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-surface-500 mb-3">
                    {getTypeLabel(session.type)} · {session.lastActivity}
                  </p>
                  
                  {session.status === 'in-progress' && (
                    <div className="max-w-md">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-600">Progress</span>
                        <span className="text-surface-700 font-medium">{session.progress}%</span>
                      </div>
                      <ProgressBar value={session.progress} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {session.aiScore && (
                  <div className="text-center">
                    <p className="text-xs text-surface-500">AI Score</p>
                    <p className={`text-xl font-bold ${
                      session.aiScore >= 85 ? 'text-success-600' :
                      session.aiScore >= 70 ? 'text-primary-600' :
                      'text-warning-600'
                    }`}>
                      {session.aiScore}
                    </p>
                  </div>
                )}
                <Button variant="secondary" size="sm">
                  {session.status === 'completed' ? 'View Results' : 'Continue'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-surface-400 text-lg">No training sessions found</p>
          <p className="text-surface-400 text-sm mt-2">
            Start a new training session to get AI-powered feedback
          </p>
        </div>
      )}
    </div>
  );
}