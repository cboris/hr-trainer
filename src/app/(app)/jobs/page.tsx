'use client';

import { useState } from 'react';
import { Card, Badge, Button, ProgressBar } from '@/components/ui';

// Mock data - will be replaced with API calls
const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'Remote',
    salary: '$120k - $150k',
    matchScore: 92,
    tags: ['React', 'TypeScript', 'Next.js'],
    posted: '2 days ago',
    type: 'Full-time',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'San Francisco, CA',
    salary: '$130k - $160k',
    matchScore: 85,
    tags: ['Node.js', 'React', 'PostgreSQL'],
    posted: '1 day ago',
    type: 'Full-time',
  },
  {
    id: '3',
    title: 'Software Engineer',
    company: 'BigTech Inc',
    location: 'New York, NY',
    salary: '$140k - $180k',
    matchScore: 78,
    tags: ['Python', 'AWS', 'Docker'],
    posted: '3 days ago',
    type: 'Full-time',
  },
  {
    id: '4',
    title: 'Frontend Developer',
    company: 'DesignStudio',
    location: 'Remote',
    salary: '$90k - $120k',
    matchScore: 88,
    tags: ['Vue.js', 'CSS', 'Figma'],
    posted: '5 hours ago',
    type: 'Full-time',
  },
];

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const filteredJobs = mockJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-full">
      {/* Job List */}
      <div className="w-1/2 border-r border-surface-200 overflow-y-auto">
        <div className="p-4 border-b border-surface-200">
          <h1 className="text-2xl font-bold text-surface-900 mb-4">Job Search</h1>
          <input
            type="text"
            placeholder="Search jobs, companies, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="divide-y divide-surface-200">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className={`p-4 cursor-pointer hover:bg-surface-50 transition-colors ${
                selectedJob === job.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-surface-900">{job.title}</h3>
                  <p className="text-surface-600 text-sm">{job.company}</p>
                  <p className="text-surface-500 text-sm">{job.location}</p>
                </div>
                <Badge variant={job.matchScore >= 85 ? 'success' : job.matchScore >= 70 ? 'warning' : 'default'}>
                  {job.matchScore}% match
                </Badge>
              </div>
              <div className="flex gap-2 mt-2">
                {job.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-surface-500">
                <span>{job.salary}</span>
                <span>{job.posted}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Detail */}
      <div className="w-1/2 overflow-y-auto">
        {selectedJob ? (
          <JobDetail job={mockJobs.find((j) => j.id === selectedJob)!} />
        ) : (
          <div className="flex items-center justify-center h-full text-surface-400">
            <p>Select a job to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobDetail({ job }: { job: typeof mockJobs[0] }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{job.title}</h1>
          <p className="text-lg text-surface-600">{job.company}</p>
          <p className="text-surface-500">{job.location} · {job.type}</p>
        </div>
        <Badge variant={job.matchScore >= 85 ? 'success' : 'warning'}>
          {job.matchScore}% match
        </Badge>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <h3 className="font-semibold text-surface-900 mb-2">Match Analysis</h3>
          <ProgressBar value={job.matchScore} label="Overall Match" variant="primary" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-surface-500">Skills Match</p>
              <p className="font-semibold text-surface-900">{job.matchScore + 5}%</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Experience Match</p>
              <p className="font-semibold text-surface-900">{job.matchScore - 3}%</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="p-4">
          <h3 className="font-semibold text-surface-900 mb-2">Job Description</h3>
          <p className="text-surface-600">
            We are looking for a talented {job.title} to join our team. 
            The ideal candidate will have experience with {job.tags.join(', ')}, 
            and a passion for building great products.
          </p>
          <h4 className="font-semibold text-surface-900 mt-4 mb-2">Requirements</h4>
          <ul className="list-disc list-inside text-surface-600 space-y-1">
            <li>3+ years of experience with {job.tags[0]}</li>
            <li>Strong understanding of modern web development</li>
            <li>Experience with {job.tags[1]} or similar technologies</li>
            <li>Excellent communication skills</li>
          </ul>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="primary">Apply Now</Button>
        <Button variant="secondary">Save Job</Button>
        <Button variant="ghost">Generate Cover Letter</Button>
      </div>
    </div>
  );
}