'use client';

import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';

type DocumentType = 'cv' | 'cover-letter';

interface Document {
  id: string;
  type: DocumentType;
  title: string;
  targetJob?: string;
  lastModified: string;
  status: 'draft' | 'ready' | 'tailored';
}

const mockDocuments: Document[] = [
  {
    id: '1',
    type: 'cv',
    title: 'Software Engineer CV',
    targetJob: 'Senior Frontend Developer at TechCorp',
    lastModified: '2 hours ago',
    status: 'tailored',
  },
  {
    id: '2',
    type: 'cv',
    title: 'General CV',
    lastModified: '1 day ago',
    status: 'ready',
  },
  {
    id: '3',
    type: 'cover-letter',
    title: 'Cover Letter - TechCorp',
    targetJob: 'Senior Frontend Developer at TechCorp',
    lastModified: '2 hours ago',
    status: 'tailored',
  },
  {
    id: '4',
    type: 'cover-letter',
    title: 'General Cover Letter',
    lastModified: '3 days ago',
    status: 'draft',
  },
];

export default function DocumentsPage() {
  const [filter, setFilter] = useState<'all' | DocumentType>('all');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const filteredDocs = mockDocuments.filter(
    (doc) => filter === 'all' || doc.type === filter
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Documents</h1>
        <div className="flex gap-2">
          <Button variant="primary">+ New CV</Button>
          <Button variant="secondary">+ Cover Letter</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'cv', 'cover-letter'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {type === 'all' ? 'All' : type === 'cv' ? 'CVs' : 'Cover Letters'}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <Card
            key={doc.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedDoc === doc.id ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => setSelectedDoc(doc.id)}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{doc.type === 'cv' ? '📄' : '✉️'}</span>
                  <div>
                    <h3 className="font-semibold text-surface-900">{doc.title}</h3>
                    {doc.targetJob && (
                      <p className="text-sm text-surface-500 truncate max-w-[200px]">
                        {doc.targetJob}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    doc.status === 'tailored'
                      ? 'success'
                      : doc.status === 'ready'
                      ? 'primary'
                      : 'default'
                  }
                >
                  {doc.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-4 text-sm text-surface-500">
                <span>Modified {doc.lastModified}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle edit
                  }}
                  className="text-primary-600 hover:text-primary-700"
                >
                  Edit
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-surface-400 text-lg">No documents found</p>
          <p className="text-surface-400 text-sm mt-2">
            Create your first {filter === 'cv' ? 'CV' : filter === 'cover-letter' ? 'cover letter' : 'document'} to get started
          </p>
        </div>
      )}
    </div>
  );
}