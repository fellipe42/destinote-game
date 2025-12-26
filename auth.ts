import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/entrar',
  },
  providers: [
    CredentialsProvider({
      name: 'Credenciais',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const passwordOk = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordOk) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          accessLevel: (user as any).accessLevel ?? 'public',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.accessLevel = (user as any).accessLevel ?? 'public';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessLevel =
          (token as any).accessLevel ?? 'public';
      }
      return session;
    },
  },
};




//////////////////////////////////////// substituindo v5 por v4 do next-auth. Voltaremos para V5 futuramente. ////////////////////////////////////////

// import NextAuth from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import { PrismaAdapter } from '@auth/prisma-adapter';
// import prisma from '@/lib/prisma';
// import bcrypt from 'bcryptjs';

// // Configuração do NextAuth com adaptador Prisma e provedor de credenciais 
// // para autenticação personalizada e validação de usuários, incluindo hashing de senhas com bcrypt.
// export const { auth, handlers, signIn, signOut } = NextAuth({
//   adapter: PrismaAdapter(prisma),
//   session: {
//     strategy: 'jwt',
//   },
//   providers: [
//     Credentials({
//       name: 'credentials',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' },
//       },
//       // Função de autorização personalizada, valida usuário com Prisma e bcrypt e retorna dados do usuário
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials.password) {
//           return null;
//         }
//         // Busca o usuário pelo email e verifica a senha, retornando os dados do usuário se válidos
//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email },
//         });

//         if (!user || !user.password) {
//           return null;
//         }

//         const isValid = await bcrypt.compare(
//           credentials.password,
//           user.password
//         );

//         if (!isValid) return null;
//         // Retorna apenas os campos essenciais do usuário, sem a senha, para a sessão
//         return {
//           id: String(user.id),
//           email: user.email,
//           name: user.name,
//         };
//       },
//     }),
//   ],
// });
