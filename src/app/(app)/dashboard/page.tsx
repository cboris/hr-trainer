import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect('/auth/signin');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      profile: true,
      skills: true,
      trainingSessions: { orderBy: { startedAt: 'desc' }, take: 5 },
    },
  });

  if (!user) redirect('/auth/signin');

  const profileComplete = !!(user.profile?.headline && user.profile?.summary && user.skills.length > 0);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          Welcome back, {user.name ?? 'there'} 👋
        </h1>
        <p className="text-surface-500 mt-1">
          Here's an overview of your career profile and training progress.
        </p>
      </div>

      {/* Profile completion banner */}
      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-800">Complete your profile</p>
            <p className="text-sm text-amber-600 mt-1">
              Add your skills, experience, and goals to get personalized AI training recommendations.
            </p>
            <a
              href="/profile"
              className="inline-block mt-2 text-sm font-medium text-amber-700 underline hover:no-underline"
            >
              Go to profile setup →
            </a>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <p className="text-sm text-surface-500">Skills tracked</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{user.skills.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <p className="text-sm text-surface-500">Training plans</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{user.trainingSessions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <p className="text-sm text-surface-500">Profile status</p>
          <p className="text-3xl font-bold mt-1">
            {profileComplete ? (
              <span className="text-success-600">✓</span>
            ) : (
              <span className="text-amber-500">…</span>
            )}
          </p>
        </div>
      </div>

      {/* Recent trainings */}
      {user.trainingSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-surface-900 mb-3">Recent Training</h2>
          <div className="space-y-2">
            {user.trainingSessions.map((session: { id: string; type: string; score: number | null; status: string }) => (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-surface-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-surface-800">{session.type}</p>
                  <p className="text-sm text-surface-500 mt-0.5">
                    {session.score != null ? `Score: ${session.score}` : 'In progress'}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    session.status === 'completed'
                      ? 'bg-success-100 text-success-700'
                      : session.status === 'active'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-surface-100 text-surface-600'
                  }`}
                >
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-surface-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/profile"
            className="bg-white rounded-xl border border-surface-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <span className="text-xl">📝</span>
            <p className="font-medium text-surface-800 mt-2">Edit Profile</p>
            <p className="text-sm text-surface-500">Update skills and experience</p>
          </a>
          <a
            href="/jobs"
            className="bg-white rounded-xl border border-surface-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <span className="text-xl">🔍</span>
            <p className="font-medium text-surface-800 mt-2">Find Jobs</p>
            <p className="text-sm text-surface-500">Browse matching opportunities</p>
          </a>
        </div>
      </div>
    </div>
  );
}