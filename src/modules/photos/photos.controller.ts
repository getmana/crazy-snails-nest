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
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileUploadInterceptor } from 'src/interceptors';
import { PhotosService } from './photos.service';
import { MAX_IMAGE_SIZE } from 'src/constants';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { type UserStrategyPayload } from '../auth/strategies';
import { CreatePhotoDto } from './dto/create-photo.dto';

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileUploadInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a photo (jpg/jpeg/png, max 10MB)' })
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
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
    @CurrentUser() user: UserStrategyPayload,
  ): Promise<CreatePhotoDto> {
    return this.photosService.create({ file, userId: user.id });
  }
}
