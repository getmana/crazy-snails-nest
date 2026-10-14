import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ActivityType, Role } from '@prisma/client';
import { AlbumsService } from './albums.service';
import { PrismaService } from '../prisma/prisma.service';
import { SharedUsersService } from '../shared/users/shared-users.service';
import { AlbumNotFoundException } from 'src/exceptions/album-not-found.exception';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { PhotoNotOwnedException } from 'src/exceptions/photo-not-owned.exception';
import { PreviewPhotoInvalidException } from 'src/exceptions/preview-photo-invalid.exception';
import { ActiveUserNotFoundException } from 'src/exceptions';
import { type UserStrategyPayload } from '../auth/strategies';

type AsyncFn = (...args: unknown[]) => Promise<unknown>;
const asyncMock = () => jest.fn<AsyncFn>();

const mockTx = {
  photo: { count: asyncMock() },
  photoAlbum: { count: asyncMock() },
  note: { deleteMany: asyncMock() },
  album: { update: asyncMock() },
};

type TransactionCallback = (tx: typeof mockTx) => Promise<unknown>;

const mockPrisma = {
  album: {
    create: asyncMock(),
    findMany: asyncMock(),
    findUnique: asyncMock(),
    delete: asyncMock(),
  },
  $transaction: jest.fn<(callback: TransactionCallback) => Promise<unknown>>(),
};

const mockSharedUsers = {
  assertActiveUser: jest.fn<SharedUsersService['assertActiveUser']>(),
};

describe('AlbumsService', () => {
  let service: AlbumsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AlbumsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SharedUsersService, useValue: mockSharedUsers },
      ],
    }).compile();

    service = module.get(AlbumsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns { id } on success', async () => {
      mockPrisma.album.create.mockResolvedValue({ id: 1 });

      const result = await service.create({
        title: 'Trip',
        titleEn: 'Trip',
        titleUk: 'Подорож',
        countries: [1],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        userId: 42,
        activityTypes: [ActivityType.cycling],
      });

      expect(result).toEqual({ id: 1 });
      expect(mockPrisma.album.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── findManyByUser ──────────────────────────────────────────────────────────

  describe('findManyByUser', () => {
    it('calls assertActiveUser with userId', async () => {
      mockPrisma.album.findMany.mockResolvedValue([]);

      await service.findManyByUser({
        userId: 5,
        publishedOnly: true,
        limit: 10,
      });

      expect(mockSharedUsers.assertActiveUser).toHaveBeenCalledWith(5);
    });

    it('propagates ActiveUserNotFoundException from assertActiveUser', async () => {
      mockSharedUsers.assertActiveUser.mockRejectedValue(
        new ActiveUserNotFoundException('User not found'),
      );

      await expect(
        service.findManyByUser({ userId: 99, publishedOnly: true, limit: 10 }),
      ).rejects.toBeInstanceOf(ActiveUserNotFoundException);
    });

    it('delegates to findMany on success', async () => {
      mockPrisma.album.findMany.mockResolvedValue([]);

      await service.findManyByUser({
        userId: 5,
        publishedOnly: true,
        limit: 10,
      });

      expect(mockPrisma.album.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 5, is_published: true }),
        }),
      );
    });
  });

  // ─── findMany ───────────────────────────────────────────────────────────────

  describe('findMany', () => {
    it('passes user_id filter when userId provided', async () => {
      mockPrisma.album.findMany.mockResolvedValue([]);

      await service.findMany({ userId: 3, publishedOnly: true, limit: 10 });

      expect(mockPrisma.album.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 3 }),
        }),
      );
    });

    it('omits user_id filter when userId absent', async () => {
      mockPrisma.album.findMany.mockResolvedValue([]);

      await service.findMany({ publishedOnly: false, limit: 10 });

      expect(mockPrisma.album.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ user_id: expect.anything() }),
        }),
      );
    });

    it('always includes user: { is_active: true } filter', async () => {
      mockPrisma.album.findMany.mockResolvedValue([]);

      await service.findMany({ limit: 10 });

      expect(mockPrisma.album.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user: { is_active: true } }),
        }),
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws AlbumNotFoundException when album not found', async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, null)).rejects.toBeInstanceOf(
        AlbumNotFoundException,
      );
    });

    it('throws EntityNotPublished when album is unpublished and requester is not owner', async () => {
      mockPrisma.album.findUnique.mockResolvedValue({
        id: 1,
        is_published: false,
        user_id: 10,
      });

      await expect(service.findOne(1, 99)).rejects.toBeInstanceOf(
        EntityNotPublished,
      );
    });

    it('returns album when published regardless of requester', async () => {
      const album = { id: 1, is_published: true, user_id: 10 };
      mockPrisma.album.findUnique.mockResolvedValue(album);

      const result = await service.findOne(1, null);

      expect(result).toBe(album);
    });

    it('returns unpublished album when requester is the owner', async () => {
      const album = { id: 1, is_published: false, user_id: 10 };
      mockPrisma.album.findUnique.mockResolvedValue(album);

      const result = await service.findOne(1, 10);

      expect(result).toBe(album);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const baseDto = {
      id: 1,
      userId: 42,
      title: 'Updated',
      isPublished: true,
    };

    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation((callback) =>
        callback(mockTx),
      );
    });

    it('throws PhotoNotOwnedException when not all photos are owned', async () => {
      mockTx.photo.count.mockResolvedValue(1);

      await expect(
        service.update({ ...baseDto, albumPhotoIds: [1, 2] }),
      ).rejects.toBeInstanceOf(PhotoNotOwnedException);
    });

    it('throws PreviewPhotoInvalidException when previewImageId is not in album', async () => {
      mockTx.photoAlbum.count.mockResolvedValue(0);

      await expect(
        service.update({ ...baseDto, previewImageId: 99 }),
      ).rejects.toBeInstanceOf(PreviewPhotoInvalidException);
    });

    it('forces is_published false when albumPhotoIds is empty', async () => {
      mockTx.photo.count.mockResolvedValue(0);
      mockTx.note.deleteMany.mockResolvedValue({ count: 0 });
      mockTx.album.update.mockResolvedValue({ id: 1, preview_image_id: null });

      await service.update({
        ...baseDto,
        albumPhotoIds: [],
        isPublished: true,
      });

      expect(mockTx.album.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_published: false }),
        }),
      );
    });

    it('calls note.deleteMany when albumPhotoIds is provided', async () => {
      mockTx.photo.count.mockResolvedValue(2);
      mockTx.note.deleteMany.mockResolvedValue({ count: 0 });
      mockTx.album.update.mockResolvedValue({ id: 1, preview_image_id: null });

      await service.update({ ...baseDto, albumPhotoIds: [1, 2] });

      expect(mockTx.note.deleteMany).toHaveBeenCalledWith({
        where: { album_id: 1, photo_id: { notIn: [1, 2] } },
      });
    });

    it('does not call note.deleteMany when albumPhotoIds is undefined', async () => {
      mockTx.album.update.mockResolvedValue({ id: 1, preview_image_id: null });

      await service.update({ ...baseDto });

      expect(mockTx.note.deleteMany).not.toHaveBeenCalled();
    });

    it('issues second update to reset preview when current preview is not in new photos', async () => {
      mockTx.photo.count.mockResolvedValue(2);
      mockTx.note.deleteMany.mockResolvedValue({ count: 0 });
      mockTx.album.update
        .mockResolvedValueOnce({ id: 1, preview_image_id: 99 })
        .mockResolvedValueOnce({ id: 1, preview_image_id: 1 });

      await service.update({ ...baseDto, albumPhotoIds: [1, 2] });

      expect(mockTx.album.update).toHaveBeenCalledTimes(2);
      expect(mockTx.album.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ preview_image_id: 1 }),
        }),
      );
    });

    it('does not issue second update when preview is still in new photos', async () => {
      mockTx.photo.count.mockResolvedValue(2);
      mockTx.note.deleteMany.mockResolvedValue({ count: 0 });
      mockTx.album.update.mockResolvedValue({ id: 1, preview_image_id: 1 });

      await service.update({ ...baseDto, albumPhotoIds: [1, 2] });

      expect(mockTx.album.update).toHaveBeenCalledTimes(1);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    const editor: UserStrategyPayload = {
      id: 42,
      email: 'editor@example.com',
      role: Role.editor,
    };
    const admin: UserStrategyPayload = {
      id: 42,
      email: 'admin@example.com',
      role: Role.admin,
    };

    it('includes user_id in where clause for non-admin', async () => {
      mockPrisma.album.delete.mockResolvedValue({ id: 1 });

      await service.remove(1, editor);

      expect(mockPrisma.album.delete).toHaveBeenCalledWith({
        where: { id: 1, user_id: 42 },
      });
    });

    it('omits user_id in where clause for admin', async () => {
      mockPrisma.album.delete.mockResolvedValue({ id: 1 });

      await service.remove(1, admin);

      expect(mockPrisma.album.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  // ─── readActivityType ────────────────────────────────────────────────────────

  describe('readActivityType', () => {
    it('returns all ActivityType enum values', () => {
      expect(service.readActivityType()).toEqual(Object.values(ActivityType));
    });
  });
});
