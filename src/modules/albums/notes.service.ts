import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetNoteDto,
  type NoteContextDto,
  UpdateNoteDto,
} from './dto/update-note.dto';
import { toJsonInput } from 'src/utils';
import { PhotoNotOwnedException } from 'src/exceptions/photo-not-owned.exception';
import { EntityNotPublished } from 'src/exceptions/entity-not-published.exception';
import { ErrorCodes } from 'src/constants/error-codes';
import { NoteNotFoundException } from 'src/exceptions';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  private async verifyOwnership({ photoId, userId, albumId }: NoteContextDto) {
    const owned = await this.prisma.photoAlbum.count({
      where: {
        photo_id: photoId,
        album_id: albumId,
        photo: { user_id: userId },
        album: { user_id: userId },
      },
    });
    if (!owned) {
      throw new PhotoNotOwnedException(
        "Some resources don't belong to the user",
      );
    }
  }

  async update(updateNoteDto: UpdateNoteDto) {
    const {
      userId,
      photoId,
      albumId,
      country = null,
      title = null,
      titleEn = null,
      titleUk = null,
      description,
      descriptionEn = null,
      descriptionUk = null,
      date = null,
    } = updateNoteDto;

    await this.verifyOwnership({ userId, photoId, albumId });

    const note = await this.prisma.note.upsert({
      where: {
        photo_id_album_id: { photo_id: photoId, album_id: albumId },
      },
      create: {
        title,
        title_en: titleEn,
        title_uk: titleUk,
        description: toJsonInput(description)!,
        description_en: toJsonInput(descriptionEn),
        description_uk: toJsonInput(descriptionUk),
        user_id: userId,
        photo_id: photoId,
        album_id: albumId,
        country_id: country,
        date,
      },
      update: {
        title,
        title_en: titleEn,
        title_uk: titleUk,
        description: toJsonInput(description),
        description_en: toJsonInput(descriptionEn),
        description_uk: toJsonInput(descriptionUk),
        country_id: country,
        date,
      },
      include: {
        country: true,
      },
    });

    return note;
  }

  async findOne({ albumId, photoId, userId }: GetNoteDto) {
    const note = await this.prisma.note.findUnique({
      where: {
        photo_id_album_id: { photo_id: photoId, album_id: albumId },
      },
      include: {
        country: true,
        album: {
          select: {
            is_published: true,
            user_id: true,
          },
        },
      },
    });

    if (!note)
      throw new NoteNotFoundException(
        `Note related to the photo ID ${photoId} and album ID ${albumId} not found`,
      );

    if (note.album.user_id !== userId && !note.album.is_published)
      throw new EntityNotPublished(
        `Note belongs to not published album`,
        ErrorCodes.ALBUM_NOT_FOUND,
      );

    return note;
  }

  async remove({ photoId, userId, albumId }: NoteContextDto) {
    await this.verifyOwnership({ userId, photoId, albumId });

    await this.prisma.note.delete({
      where: {
        photo_id_album_id: { photo_id: photoId, album_id: albumId },
      },
    });
  }
}
