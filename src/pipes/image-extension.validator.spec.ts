import { describe, expect, it } from '@jest/globals';
import { ImageExtensionValidator } from './image-extension.validator';
import { ALLOWED_IMAGE_EXTENSIONS } from 'src/constants';

const fileNamed = (originalname: string) =>
  ({ originalname, mimetype: 'image/png', size: 1 }) as Express.Multer.File;

describe('ImageExtensionValidator', () => {
  const validator = new ImageExtensionValidator({
    allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
  });

  it.each(['photo.jpg', 'photo.jpeg', 'photo.png', 'photo.webp', 'photo.PNG'])(
    'accepts %s',
    (name) => {
      expect(validator.isValid(fileNamed(name))).toBe(true);
    },
  );

  it('accepts a name whose last extension is allowed', () => {
    expect(validator.isValid(fileNamed('photo.html.png'))).toBe(true);
  });

  it.each(['evil.html', 'image.svg', 'photo.png.html', 'no-extension'])(
    'rejects %s',
    (name) => {
      expect(validator.isValid(fileNamed(name))).toBe(false);
    },
  );

  it('rejects a missing file', () => {
    expect(validator.isValid(undefined)).toBe(false);
  });

  it('rejects a multi-file payload', () => {
    expect(validator.isValid([fileNamed('photo.png')])).toBe(false);
  });

  it('lists the allowed extensions in the error message', () => {
    expect(validator.buildErrorMessage()).toBe(
      'Validation failed (file extension must be one of .jpg, .jpeg, .png, .webp)',
    );
  });
});
