import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { FileFilterCallback } from 'multer';
import { FILE_UPLOAD_URL } from 'src/constants';

export const multerConfig = {
  storage: diskStorage({
    destination: `./${FILE_UPLOAD_URL}`,
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExt = extname(file.originalname);
      const fileName = `${file.fieldname}-${uniqueSuffix}${fileExt}`;
      callback(null, fileName);
    },
  }),
};

export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
    return callback(new Error('Only image files are allowed'));
  }

  callback(null, true);
};
