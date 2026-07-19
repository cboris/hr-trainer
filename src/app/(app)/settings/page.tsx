'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';

interface SettingsSection {
  id: string;
  title: string;
  icon: string;
}

const sections: SettingsSection[] = [
  { id: 'profile', title: 'Profile', icon: '👤' },
  { id: 'notifications', title: 'Notifications', icon: '🔔' },
  { id: 'ai-preferences', title: 'AI Preferences', icon: '🤖' },
  { id: 'privacy', title: 'Privacy & Security', icon: '🔒' },
  { id: 'billing', title: 'Billing', icon: '💳' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    productUpdates: true,
  });
  const [aiPreferences, setAiPreferences] = useState({
    model: 'qwen-plus',
    language: 'en',
    tone: 'professional',
    autoSave: true,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-surface-900 mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="md:w-64 flex-shrink-0">
          <Card className="p-2">
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </nav>

        {/* Main Content */}
        <div className="flex-1">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">Profile Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="john@example.com"
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Senior Frontend Developer"
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="pt-4">
                  <Button variant="primary">Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'push', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                  { key: 'marketing', label: 'Marketing Emails', desc: 'Receive promotional content' },
                  { key: 'productUpdates', label: 'Product Updates', desc: 'Stay informed about new features' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-surface-900">{item.label}</p>
                      <p className="text-sm text-surface-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof prev]
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'bg-primary-500'
                          : 'bg-surface-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications[item.key as keyof typeof notifications]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button variant="primary">Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {/* AI Preferences Section */}
          {activeSection === 'ai-preferences' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">AI Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    AI Model
                  </label>
                  <select
                    value={aiPreferences.model}
                    onChange={(e) => setAiPreferences(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="qwen-plus">Qwen Plus (Recommended)</option>
                    <option value="qwen-max">Qwen Max (Most Powerful)</option>
                    <option value="qwen-turbo">Qwen Turbo (Fastest)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Response Language
                  </label>
                  <select
                    value={aiPreferences.language}
                    onChange={(e) => setAiPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="de">German</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Response Tone
                  </label>
                  <select
                    value={aiPreferences.tone}
                    onChange={(e) => setAiPreferences(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-surface-900">Auto-save Drafts</p>
                    <p className="text-sm text-surface-500">Automatically save your work</p>
                  </div>
                  <button
                    onClick={() => setAiPreferences(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      aiPreferences.autoSave ? 'bg-primary-500' : 'bg-surface-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        aiPreferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="pt-4">
                  <Button variant="primary">Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Privacy & Security Section */}
          {activeSection === 'privacy' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-surface-900 mb-2">Change Password</h3>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mt-3">
                    <Button variant="secondary">Update Password</Button>
                  </div>
                </div>
                
                <hr className="border-surface-200" />
                
                <div>
                  <h3 className="font-medium text-surface-900 mb-2">Connected Accounts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔵</span>
                        <div>
                          <p className="font-medium text-surface-900">Google</p>
                          <p className="text-sm text-surface-500">Connected</p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">Disconnect</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚫</span>
                        <div>
                          <p className="font-medium text-surface-900">GitHub</p>
                          <p className="text-sm text-surface-500">Not connected</p>
                        </div>
                      </div>
                      <Button variant="primary" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>
                
                <hr className="border-surface-200" />
                
                <div className="pt-4">
                  <h3 className="font-medium text-danger-600 mb-2">Danger Zone</h3>
                  <p className="text-sm text-surface-500 mb-3">
                    Once you delete your account, there is no going back.
                  </p>
                  <Button variant="danger">Delete Account</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">Billing</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-primary-900">Pro Plan</p>
                      <p className="text-sm text-primary-700">$29/month · Renews on Aug 10, 2026</p>
                    </div>
                    <Button variant="secondary" size="sm">Change Plan</Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-surface-900 mb-3">Usage This Month</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-surface-600">AI Credits Used</span>
                      <span className="font-medium text-surface-900">847 / 1,000</span>
                    </div>
                    <div className="w-full bg-surface-200 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: '84.7%' }} />
                    </div>
                  </div>
                </div>
                
                <hr className="border-surface-200" />
                
                <div>
                  <h3 className="font-medium text-surface-900 mb-3">Payment Method</h3>
                  <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💳</span>
                      <div>
                        <p className="font-medium text-surface-900">•••• •••• •••• 4242</p>
                        <p className="text-sm text-surface-500">Expires 12/2027</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">Update</Button>
                  </div>
                </div>
                
                <hr className="border-surface-200" />
                
                <div>
                  <h3 className="font-medium text-surface-900 mb-3">Recent Invoices</h3>
                  <div className="space-y-2">
                    {[
                      { date: 'Jul 10, 2026', amount: '$29.00', status: 'Paid' },
                      { date: 'Jun 10, 2026', amount: '$29.00', status: 'Paid' },
                      { date: 'May 10, 2026', amount: '$29.00', status: 'Paid' },
                    ].map((invoice, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-surface-200 rounded-lg">
                        <div>
                          <p className="font-medium text-surface-900">{invoice.date}</p>
                          <p className="text-sm text-surface-500">{invoice.status}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-surface-900">{invoice.amount}</span>
                          <button className="text-primary-600 hover:text-primary-700 text-sm">
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}