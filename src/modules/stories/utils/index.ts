type PhotoRow = { photo_id: number };

export type StoredStoryPhotos = {
  hero_image_id: number | null;
  pair_image_stories: PhotoRow[];
  gallery_image_stories: PhotoRow[];
  carousel_stories: PhotoRow[];
};

export type RequestedStoryPhotos = {
  heroImageId?: number | null;
  pairPhotoIds?: number[];
  galleryPhotoIds?: number[];
  carouselPhotoIds?: number[];
};

export const storedStoryPhotosSelect = {
  hero_image_id: true,
  pair_image_stories: { select: { photo_id: true } },
  gallery_image_stories: { select: { photo_id: true } },
  carousel_stories: { select: { photo_id: true } },
} as const;

const toPhotoIds = (rows: PhotoRow[]) => rows.map(({ photo_id }) => photo_id);

export const hasRequestedPhotos = (requested: RequestedStoryPhotos) =>
  Object.values(requested).some((value) => value !== undefined);

export const listRequestedPhotoIds = ({
  heroImageId,
  pairPhotoIds = [],
  galleryPhotoIds = [],
  carouselPhotoIds = [],
}: RequestedStoryPhotos): number[] => [
  ...(heroImageId === null || heroImageId === undefined ? [] : [heroImageId]),
  ...pairPhotoIds,
  ...galleryPhotoIds,
  ...carouselPhotoIds,
];

export const resolveStoryPhotoIds = (
  requested: RequestedStoryPhotos,
  stored: StoredStoryPhotos,
): number[] =>
  listRequestedPhotoIds({
    heroImageId:
      requested.heroImageId === undefined
        ? stored.hero_image_id
        : requested.heroImageId,
    pairPhotoIds:
      requested.pairPhotoIds ?? toPhotoIds(stored.pair_image_stories),
    galleryPhotoIds:
      requested.galleryPhotoIds ?? toPhotoIds(stored.gallery_image_stories),
    carouselPhotoIds:
      requested.carouselPhotoIds ?? toPhotoIds(stored.carousel_stories),
  });

export const findDuplicatedIds = (ids: number[]): number[] => {
  const seen = new Set<number>();
  const duplicated = new Set<number>();

  for (const id of ids) {
    if (seen.has(id)) duplicated.add(id);
    seen.add(id);
  }

  return [...duplicated];
};
