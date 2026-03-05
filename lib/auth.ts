import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    EmailProvider({
      from: process.env.RESEND_FROM_EMAIL!,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: email,
          subject: "Sign in to CoFi Radar",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="margin:0 0 8px;font-size:20px;color:#111">Sign in to CoFi Radar</h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px">
                Click the button below to sign in. This link expires in 24 hours and can only be used once.
              </p>
              <a href="${url}" style="display:inline-block;background:#3b5bdb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600">
                Sign in to dashboard
              </a>
              <p style="margin:24px 0 0;font-size:13px;color:#999">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, attach brandId to token
      if (user?.email) {
        const brand = await prisma.brand.findUnique({
          where: { clientEmail: user.email },
          select: { id: true },
        });
        if (brand) {
          token.brandId = brand.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.brandId) {
        (session as typeof session & { brandId: string }).brandId =
          token.brandId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    newUser: "/dashboard",
  },
};

// Type augmentation
declare module "next-auth" {
  interface Session {
    brandId?: string;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    brandId?: string;
  }
}
