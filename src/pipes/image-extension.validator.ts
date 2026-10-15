import { FileValidator } from '@nestjs/common';
import { extname } from 'path';

type ImageExtensionValidatorOptions = {
  allowedExtensions: string[];
};

export class ImageExtensionValidator extends FileValidator<
  ImageExtensionValidatorOptions,
  Express.Multer.File
> {
  isValid(
    file?:
      | Express.Multer.File
      | Express.Multer.File[]
      | Record<string, Express.Multer.File[]>,
  ): boolean {
    if (!file || Array.isArray(file) || typeof file.originalname !== 'string') {
      return false;
    }

    const extension = extname(file.originalname).toLowerCase();
    return this.validationOptions.allowedExtensions.includes(extension);
  }

  buildErrorMessage(): string {
    return `Validation failed (file extension must be one of ${this.validationOptions.allowedExtensions.join(', ')})`;
  }
}
