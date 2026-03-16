import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSellerDto } from '../dtos/create-seller.dto';
import { UpdateSellerDto } from '../dtos/update-seller.dto';
import { UserSchema } from '../../infrastructure/database/user.schema';

@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(UserSchema)
    private readonly userRepo: Repository<UserSchema>,
  ) {}

  async createSeller(dto: CreateSellerDto) {
    const existingSeller = await this.userRepo.findOne({
      where: { sellerId: dto.sellerId },
    });

    if (existingSeller) {
      throw new ConflictException('Seller already exists');
    }

    const seller = this.userRepo.create({
      sellerId: dto.sellerId,
      bankName: dto.bankName,
      bankAccount: dto.bankAccount,
      accountName: dto.accountName,
    });

    return this.userRepo.save(seller);
  }

  async getSeller(sellerId: string) {
    const seller = await this.userRepo.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return seller;
  }

  async updateSeller(sellerId: string, dto: UpdateSellerDto) {
    const seller = await this.userRepo.findOne({
      where: { sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (dto.bankName !== undefined) {
      seller.bankName = dto.bankName;
    }

    if (dto.bankAccount !== undefined) {
      seller.bankAccount = dto.bankAccount;
    }

    if (dto.accountName !== undefined) {
      seller.accountName = dto.accountName;
    }

    return this.userRepo.save(seller);
  }

  async deleteSeller(sellerId: string) {
    const result = await this.userRepo.delete({ sellerId });

    if (!result.affected) {
      throw new NotFoundException('Seller not found');
    }

    return {
      message: 'Seller deleted successfully',
    };
  }
}
