import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import axios from 'axios';

type BankItem = {
  code: string;
  name: string;
  shortName: string;
  bin: string;
  logo?: string;
};

@Injectable()
export class BankService {
  private readonly logger = new Logger(BankService.name);
  private readonly cacheKey = 'banks:list';

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  async getBanks() {
    try {
      const cached = await this.cacheManager.get<BankItem[]>(this.cacheKey);
      if (cached?.length) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Read bank cache failed: ${error.message}`);
    }

    const banks = await this.fetchBanks();

    await this.cacheManager.set(this.cacheKey, banks, 30000);

    return banks;
  }

  private async fetchBanks(): Promise<BankItem[]> {
    const url =
      this.configService.get<string>('BANK_LIST_API_URL') ||
      'https://api.vietqr.io/v2/banks';

    try {
      const { data: payload } = await axios.get(url, {
        timeout: 10000,
      });
      const rawItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const items = rawItems
        .map((item: any) => ({
          code: String(item.code || item.short_name || item.shortName || ''),
          name: String(item.name || ''),
          shortName: String(
            item.shortName || item.short_name || item.code || '',
          ),
          bin: String(item.bin || item.bankBin || ''),
          logo: item.logo ? String(item.logo) : undefined,
        }))
        .filter((item: BankItem) => item.bin && item.name)
        .sort((a: BankItem, b: BankItem) =>
          a.shortName.localeCompare(b.shortName),
        );

      if (!items.length) {
        throw new Error('Bank list is empty');
      }

      return items;
    } catch (error) {
      this.logger.error(`Fetch bank list failed: ${error.message}`);
      throw new ServiceUnavailableException(
        'Khong the lay danh sach ngan hang tu VietQR',
      );
    }
  }
}
