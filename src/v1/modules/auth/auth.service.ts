import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // ১. রেজিস্ট্রেশন (Admin হিসেবে)
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Password hashing
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user as ADMIN but with isApproved = false
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: 'ADMIN',
        isApproved: false, // Default pending
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
      },
    });
  }

  // ২. লগইন
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException('Your account is pending admin approval');
    }

    // Here you would normally return a JWT token
    // For now, we return user info
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    };
  }

  // ৩. অ্যাডমিন অ্যাপ্রুভ করা (Super Admin এর জন্য)
  async approveAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isApproved: true },
      select: { id: true, email: true, isApproved: true },
    });
  }

  // ৪. সব পেন্ডিং অ্যাডমিনদের লিস্ট
  async getPendingAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN', isApproved: false },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }
}
