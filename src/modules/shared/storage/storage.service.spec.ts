import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getLoggerToken } from 'pino-nestjs';
import { StorageService } from './storage.service';
import { FileWriteException } from 'src/exceptions/file-write.exception';
import { FILE_UPLOAD_URL } from 'src/constants';

const NOW = new Date('2026-10-14T10:00:00Z');
const DATE_FOLDER = '2026-10-14';
const UUID = '11111111-2222-3333-4444-555555555555';
const UPLOADS_DIR = join(process.cwd(), FILE_UPLOAD_URL);

const fileNamed = (originalname: string) =>
  ({ originalname, buffer: Buffer.from('bytes') }) as Express.Multer.File;

const mockLogger = { error: jest.fn() };

describe('StorageService', () => {
  let service: StorageService;
  let mkdir: jest.SpiedFunction<typeof fs.mkdir>;
  let writeFile: jest.SpiedFunction<typeof fs.writeFile>;
  let rm: jest.SpiedFunction<typeof fs.rm>;

  beforeEach(async () => {
    jest.useFakeTimers({ now: NOW });
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(UUID);
    mkdir = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    writeFile = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    rm = jest.spyOn(fs, 'rm').mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: getLoggerToken(StorageService.name), useValue: mockLogger },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    mockLogger.error.mockReset();
  });

  describe('saveFile', () => {
    it('writes the buffer into a date folder under a random name', async () => {
      const file = fileNamed('photo.png');

      await service.saveFile(file);

      expect(mkdir).toHaveBeenCalledWith(join(UPLOADS_DIR, DATE_FOLDER), {
        recursive: true,
      });
      expect(writeFile).toHaveBeenCalledWith(
        join(UPLOADS_DIR, DATE_FOLDER, `${UUID}.png`),
        file.buffer,
      );
    });

    it('returns the storage key relative to the uploads folder', async () => {
      await expect(service.saveFile(fileNamed('photo.png'))).resolves.toBe(
        join(DATE_FOLDER, `${UUID}.png`),
      );
    });

    it('stores the extension in lowercase', async () => {
      await expect(service.saveFile(fileNamed('photo.PNG'))).resolves.toBe(
        join(DATE_FOLDER, `${UUID}.png`),
      );
    });

    it('throws FileWriteException and logs when writing fails', async () => {
      writeFile.mockRejectedValue(new Error('disk full'));

      await expect(
        service.saveFile(fileNamed('photo.png')),
      ).rejects.toBeInstanceOf(FileWriteException);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteFile', () => {
    const key = join(DATE_FOLDER, `${UUID}.png`);

    it('removes the stored file, ignoring an already missing one', async () => {
      await service.deleteFile(key);

      expect(rm).toHaveBeenCalledWith(join(UPLOADS_DIR, key), { force: true });
    });

    it('logs and rethrows when removal fails', async () => {
      const error = new Error('permission denied');
      rm.mockRejectedValue(error);

      await expect(service.deleteFile(key)).rejects.toBe(error);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPublicFilePath', () => {
    it('maps a storage key to its public URL path', () => {
      expect(service.getPublicFilePath('2026-10-14/a.png')).toBe(
        `/${FILE_UPLOAD_URL}/2026-10-14/a.png`,
      );
    });
  });
});
