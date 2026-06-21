import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFirstAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'zentriel' },
    });

    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash('ASER2007', 10);

    // Create admin account
    const admin = await prisma.user.create({
      data: {
        username: 'zentriel',
        password: hashedPassword,
        nickname: 'Admin',
        isAdmin: true,
      },
    });

    console.log('✅ Admin account created successfully!');
    console.log('Username: zentriel');
    console.log('Password: ASER2007');
    console.log('Admin ID:', admin.id);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin();
