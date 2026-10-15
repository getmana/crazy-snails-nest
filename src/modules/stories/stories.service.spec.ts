import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { StoriesService } from './stories.service';
import { PrismaService } from '../prisma/prisma.service';
import { SharedUsersService } from '../shared/users/shared-users.service';
import { StoryNotFoundException } from 'src/exceptions/story-not-found.exception';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { PhotoNotOwnedException } from 'src/exceptions/photo-not-owned.exception';
import { ActiveUserNotFoundException } from 'src/exceptions';
import { ErrorCodes } from 'src/constants/error-codes';
import { type UserStrategyPayload } from '../auth/strategies';
import { asyncMock } from 'src/testing/jest-mocks';

const mockPrisma = {
  story: {
    create: asyncMock(),
    findUnique: asyncMock(),
    findMany: asyncMock(),
    update: asyncMock(),
    delete: asyncMock(),
  },
  photo: { count: asyncMock() },
};

const mockSharedUsers = {
  assertActiveUser: jest.fn<SharedUsersService['assertActiveUser']>(),
};

describe('StoriesService', () => {
  let service: StoriesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StoriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SharedUsersService, useValue: mockSharedUsers },
      ],
    }).compile();

    service = module.get(StoriesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('stores the titles for the user and returns the new id', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 5 });

      const result = await service.create({
        title: 'Trip',
        titleEn: 'Trip',
        titleUk: 'Подорож',
        userId: 42,
      });

      expect(result).toEqual({ id: 5 });
      expect(mockPrisma.story.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            title: 'Trip',
            title_en: 'Trip',
            title_uk: 'Подорож',
            user_id: 42,
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws StoryNotFoundException when the story does not exist', async () => {
      mockPrisma.story.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, null)).rejects.toBeInstanceOf(
        StoryNotFoundException,
      );
    });

    it.each([
      ['another user', 99],
      ['an anonymous visitor', null],
    ])(
      'hides an unpublished story from %s',
      async (_requester, requesterId) => {
        mockPrisma.story.findUnique.mockResolvedValue({
          id: 1,
          is_published: false,
          user_id: 10,
        });

        const call = service.findOne(1, requesterId);

        await expect(call).rejects.toBeInstanceOf(EntityNotPublished);
        await expect(call).rejects.toMatchObject({
          code: ErrorCodes.STORY_NOT_FOUND,
        });
      },
    );

    it('returns a published story to anyone', async () => {
      const story = { id: 1, is_published: true, user_id: 10 };
      mockPrisma.story.findUnique.mockResolvedValue(story);

      await expect(service.findOne(1, null)).resolves.toBe(story);
    });

    it('returns an unpublished story to its owner', async () => {
      const story = { id: 1, is_published: false, user_id: 10 };
      mockPrisma.story.findUnique.mockResolvedValue(story);

      await expect(service.findOne(1, 10)).resolves.toBe(story);
    });

    it('only finds stories of active users', async () => {
      mockPrisma.story.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, null)).rejects.toThrow();

      expect(mockPrisma.story.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, user: { is_active: true } },
        }),
      );
    });
  });

  describe('findManyByUser', () => {
    const dto = { userId: 5, publishedOnly: true, limit: 10 };

    it('checks the user is active', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      await service.findManyByUser(dto);

      expect(mockSharedUsers.assertActiveUser).toHaveBeenCalledWith(5);
    });

    it('propagates ActiveUserNotFoundException', async () => {
      mockSharedUsers.assertActiveUser.mockRejectedValue(
        new ActiveUserNotFoundException('User not found'),
      );

      await expect(service.findManyByUser(dto)).rejects.toBeInstanceOf(
        ActiveUserNotFoundException,
      );
    });

    it("lists that user's published stories", async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      await service.findManyByUser(dto);

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 5, is_published: true }),
        }),
      );
    });
  });

  describe('findMany', () => {
    it('filters by user and publication when given', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      await service.findMany({ userId: 3, publishedOnly: false, limit: 10 });

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 3, is_published: false, user: { is_active: true } },
        }),
      );
    });

    it('applies only the active-user filter when nothing else is given', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      await service.findMany({ limit: 10 });

      expect(mockPrisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user: { is_active: true } } }),
      );
    });
  });

  describe('update', () => {
    const base = { id: 1, userId: 42 };

    const updateData = () => {
      const [[args]] = mockPrisma.story.update.mock.calls as [
        [{ data: Record<string, unknown> }],
      ];
      return args.data;
    };

    it('checks ownership of the photos from every section', async () => {
      mockPrisma.photo.count.mockResolvedValue(5);
      mockPrisma.story.update.mockResolvedValue({ id: 1 });

      await service.update({
        ...base,
        heroImageId: 1,
        pairPhotoIds: [2],
        galleryPhotoIds: [3, 4],
        carouselPhotos: [{ photoId: 5 }],
      });

      expect(mockPrisma.photo.count).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3, 4, 5] }, user_id: 42 },
      });
    });

    it('clears the hero image without checking it for ownership', async () => {
      mockPrisma.photo.count.mockResolvedValue(0);
      mockPrisma.story.update.mockResolvedValue({ id: 1 });

      await service.update({ ...base, heroImageId: null });

      expect(mockPrisma.photo.count).toHaveBeenCalledWith({
        where: { id: { in: [] }, user_id: 42 },
      });
      expect(updateData()).toMatchObject({ hero_image_id: null });
    });

    it('throws PhotoNotOwnedException and does not update when a photo is not owned', async () => {
      mockPrisma.photo.count.mockResolvedValue(1);

      await expect(
        service.update({ ...base, galleryPhotoIds: [3, 4] }),
      ).rejects.toBeInstanceOf(PhotoNotOwnedException);
      expect(mockPrisma.story.update).not.toHaveBeenCalled();
    });

    it('leaves omitted sections untouched', async () => {
      mockPrisma.photo.count.mockResolvedValue(0);
      mockPrisma.story.update.mockResolvedValue({ id: 1 });

      await service.update({ ...base, title: 'Renamed' });

      const data = updateData();
      expect(data).not.toHaveProperty('pair_image_stories');
      expect(data).not.toHaveProperty('gallery_image_stories');
      expect(data).not.toHaveProperty('carousel_stories');
    });

    it('replaces a sent section, keeping the given order', async () => {
      mockPrisma.photo.count.mockResolvedValue(2);
      mockPrisma.story.update.mockResolvedValue({ id: 1 });

      await service.update({ ...base, galleryPhotoIds: [8, 3] });

      expect(updateData().gallery_image_stories).toEqual({
        deleteMany: { story_id: 1 },
        create: [
          { position: 0, photo: { connect: { id: 8 } } },
          { position: 1, photo: { connect: { id: 3 } } },
        ],
      });
    });

    it('maps carousel captions to their columns', async () => {
      mockPrisma.photo.count.mockResolvedValue(1);
      mockPrisma.story.update.mockResolvedValue({ id: 1 });

      await service.update({
        ...base,
        carouselPhotos: [
          { photoId: 7, caption: 'Sea', captionEn: 'Sea', captionUk: 'Море' },
        ],
      });

      expect(updateData().carousel_stories).toEqual({
        deleteMany: { story_id: 1 },
        create: [
          {
            position: 0,
            photo: { connect: { id: 7 } },
            caption: 'Sea',
            caption_en: 'Sea',
            caption_uk: 'Море',
          },
        ],
      });
    });

    it('clears a section sent as an empty list', async () => {
      mockPrisma.photo.count.mockResolvedValue(0);
      mockPrisma.story.update.mockResolvedValue({ id: 1 });

      await service.update({ ...base, pairPhotoIds: [] });

      expect(updateData().pair_image_stories).toEqual({
        deleteMany: { story_id: 1 },
        create: [],
      });
    });
  });

  describe('remove', () => {
    const editor: UserStrategyPayload = {
      id: 42,
      email: 'editor@example.com',
      role: Role.editor,
    };
    const admin: UserStrategyPayload = {
      id: 1,
      email: 'admin@example.com',
      role: Role.admin,
    };

    it('restricts a non-admin to their own story', async () => {
      mockPrisma.story.delete.mockResolvedValue({ id: 1 });

      await service.remove(1, editor);

      expect(mockPrisma.story.delete).toHaveBeenCalledWith({
        where: { id: 1, user_id: 42 },
      });
    });

    it("lets an admin delete anyone's story", async () => {
      mockPrisma.story.delete.mockResolvedValue({ id: 1 });

      await service.remove(1, admin);

      expect(mockPrisma.story.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
