import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { PhotosService } from './photos.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from 'src/modules/shared/storage/storage.service';
import { FileWriteException } from 'src/exceptions/file-write.exception';
import { asyncMock } from 'src/testing/jest-mocks';

const KEY = '2026-10-14/photo-key.png';
const file = { originalname: 'photo.png' } as Express.Multer.File;

const mockStorage = {
  saveFile: asyncMock(),
  deleteFile: asyncMock(),
  getPublicFilePath: jest.fn((key: string) => `/uploads/${key}`),
};
const mockPrisma = { photo: { create: asyncMock() } };

describe('PhotosService.create', () => {
  let service: PhotosService;

  beforeEach(async () => {
    mockStorage.saveFile.mockResolvedValue(KEY);
    mockStorage.deleteFile.mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: StorageService, useValue: mockStorage },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(PhotosService);
  });

  afterEach(() => {
    mockStorage.saveFile.mockReset();
    mockStorage.deleteFile.mockReset();
    mockPrisma.photo.create.mockReset();
  });

  it('stores the file, records a pending photo and returns its public URL', async () => {
    mockPrisma.photo.create.mockResolvedValue({ id: 3 });

    const result = await service.create({ file, userId: 7 });

    expect(mockStorage.saveFile).toHaveBeenCalledWith(file);
    expect(mockPrisma.photo.create).toHaveBeenCalledWith({
      data: { original_key: KEY, status: 'pending', user_id: 7 },
    });
    expect(result).toEqual({
      photoId: 3,
      originalUrl: `/uploads/${KEY}`,
      status: 'pending',
      thumbnailSmUrl: null,
      thumbnailMdUrl: null,
    });
  });

  it('does not record a photo when storing the file fails', async () => {
    mockStorage.saveFile.mockRejectedValue(
      new FileWriteException('Error writing file: photo.png'),
    );

    await expect(service.create({ file, userId: 7 })).rejects.toBeInstanceOf(
      FileWriteException,
    );
    expect(mockPrisma.photo.create).not.toHaveBeenCalled();
  });

  it('removes the stored file and rethrows when recording the photo fails', async () => {
    const dbError = new Error('db down');
    mockPrisma.photo.create.mockRejectedValue(dbError);

    await expect(service.create({ file, userId: 7 })).rejects.toBe(dbError);
    expect(mockStorage.deleteFile).toHaveBeenCalledWith(KEY);
  });

  it('still rethrows the database error when the cleanup also fails', async () => {
    const dbError = new Error('db down');
    mockPrisma.photo.create.mockRejectedValue(dbError);
    mockStorage.deleteFile.mockRejectedValue(new Error('permission denied'));

    await expect(service.create({ file, userId: 7 })).rejects.toBe(dbError);
  });
});
