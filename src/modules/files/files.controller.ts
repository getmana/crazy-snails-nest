import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileUploadInterceptor } from 'src/interceptors';
import { FilesService } from './files.service';
import { MAX_IMAGE_SIZE } from 'src/constants';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('photos')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileUploadInterceptor)
  createPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<string> {
    return this.filesService.create(file);
  }
}
