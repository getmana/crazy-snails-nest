export {
  ErrorCodes,
  type ErrorCode,
  HTTP_STATUS_ERROR_CODES,
  PUBLIC_ERROR_CODES,
  type PublicErrorCode,
} from './error-codes';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_TYPES_REGEXP = /(jpg|jpeg|png|webp)$/;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const FILE_UPLOAD_URL = 'uploads';
