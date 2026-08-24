import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CountriesService } from './countries.service';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all available countries' })
  @ApiResponse({
    status: 200,
    description: 'Array of countries with id, code, name_en and name_uk',
  })
  findAll() {
    return this.countriesService.findAll();
  }
}
