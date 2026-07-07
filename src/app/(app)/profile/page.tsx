'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  headline: string;
  summary: string;
  location: string;
  yearsExperience: number;
}

interface Skill {
  id?: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    headline: '',
    summary: '',
    location: '',
    yearsExperience: 0,
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<Skill['level']>('INTERMEDIATE');

  // Load existing profile
  useEffect(() => {
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setProfile(data.data.profile ?? profile);
          setSkills(data.data.skills ?? []);
        }
      })
      .catch(() => {});
  }, []);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills((prev) => [...prev, { name: newSkill.trim(), level: newSkillLevel }]);
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, skills }),
      });

      if (res.ok) {
        router.push('/dashboard');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-surface-900">Set Up Your Profile</h1>
      <p className="text-surface-500 mt-1">
        Step {step} of 2 — {step === 1 ? 'Basic Info' : 'Skills'}
      </p>

      {/* Progress bar */}
      <div className="mt-4 h-2 bg-surface-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${step * 50}%` }}
        />
      </div>

      <div className="mt-8">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={profile.headline}
                onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
                placeholder="e.g. Full-Stack Developer"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. San Francisco, CA"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                value={profile.yearsExperience}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, yearsExperience: parseInt(e.target.value) || 0 }))
                }
                className="w-32 rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Professional Summary
              </label>
              <textarea
                value={profile.summary}
                onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Brief overview of your background and career goals..."
                rows={4}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Next: Add Skills →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Skill input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill (e.g. React, Python, SQL)"
                className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as Skill['level'])}
                className="rounded-lg border border-surface-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Skills list */}
            {skills.length > 0 && (
              <div className="space-y-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-surface-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-surface-800">{skill.name}</span>
                      <span className="text-xs text-surface-500 bg-surface-200 px-2 py-0.5 rounded-full">
                        {skill.level}
                      </span>
                    </div>
                    <button
                      onClick={() => removeSkill(index)}
                      className="text-surface-400 hover:text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {skills.length === 0 && (
              <p className="text-center text-surface-400 py-8">
                No skills added yet. Add at least one skill to continue.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-surface-200 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={saveProfile}
                disabled={skills.length === 0 || saving}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}