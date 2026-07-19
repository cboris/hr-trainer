import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { env } from '@/config/env';

const e = env();

const providers = [];

if (e.GOOGLE_ID && e.GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: e.GOOGLE_ID,
      clientSecret: e.GOOGLE_SECRET,
    })
  );
}

const handler = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const { prisma } = await import('@/lib/prisma');
        await prisma.user.upsert({
          where: { email: user.email! },
          update: { name: user.name, avatarUrl: user.image },
          create: {
            email: user.email!,
            name: user.name,
            avatarUrl: user.image,
          },
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export { handler as GET, handler as POST };