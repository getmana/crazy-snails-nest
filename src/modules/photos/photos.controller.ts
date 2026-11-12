import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_TYPES_REGEXP,
  MAX_IMAGE_SIZE,
} from 'src/constants';
import { ImageExtensionValidator } from 'src/pipes';
import { CurrentUser } from 'src/decorators';
import { type UserStrategyPayload } from 'src/modules/auth/strategies';
import { CreatePhotoDto } from './dto/create-photo.dto';

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  // Multer stops reading the upload once it passes the limit and responds with 413.
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE } }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a photo (jpg/jpeg/png/webp, max 10MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Photo uploaded, returns photo id and original URL',
  })
  @ApiResponse({ status: 400, description: 'Invalid file type' })
  @ApiResponse({ status: 413, description: 'File larger than 10 MB' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: ALLOWED_IMAGE_TYPES_REGEXP }),
          new ImageExtensionValidator({
            allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: UserStrategyPayload,
  ): Promise<CreatePhotoDto> {
    return this.photosService.create({ file, userId: user.id });
  }
}
