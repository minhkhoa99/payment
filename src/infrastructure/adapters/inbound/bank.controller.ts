import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BankService } from '../../../application/services/bank.service';

@ApiTags('Banks')
@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get()
  @ApiOperation({ summary: 'Get bank list with BIN' })
  async getBanks() {
    return this.bankService.getBanks();
  }
}
