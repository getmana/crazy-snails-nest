import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { CountriesService } from './countries.service';
import { PrismaService } from '../prisma/prisma.service';
import { CountryCodesNotFoundException } from 'src/exceptions';
import { asyncMock } from 'src/testing/jest-mocks';

const mockPrisma = {
  country: { findMany: asyncMock() },
};

describe('CountriesService', () => {
  let service: CountriesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CountriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CountriesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findCountryByCode', () => {
    it('returns ids in the order of the input codes', async () => {
      mockPrisma.country.findMany.mockResolvedValue([
        { id: 2, code: 'PL' },
        { id: 1, code: 'UA' },
      ]);

      const result = await service.findIdsByCodes(['UA', 'PL']);

      expect(result).toEqual([1, 2]);
    });

    it('throws CountryCodesNotFoundException listing the missing codes', async () => {
      mockPrisma.country.findMany.mockResolvedValue([{ id: 1, code: 'UA' }]);

      const call = service.findIdsByCodes(['XX', 'UA', 'YY']);

      await expect(call).rejects.toBeInstanceOf(CountryCodesNotFoundException);
      await expect(call).rejects.toThrow('Unknown country codes: XX, YY');
    });

    it('returns an id for every input position when codes repeat', async () => {
      mockPrisma.country.findMany.mockResolvedValue([
        { id: 1, code: 'UA' },
        { id: 2, code: 'PL' },
      ]);

      const result = await service.findIdsByCodes(['UA', 'PL', 'UA']);

      expect(result).toEqual([1, 2, 1]);
    });

    it('returns an empty array for empty input', async () => {
      mockPrisma.country.findMany.mockResolvedValue([]);

      const result = await service.findIdsByCodes([]);

      expect(result).toEqual([]);
    });
  });
});
