import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Put,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Express, Response } from 'express';
import { FahrradFileService, type FileFindError } from '../service/index.js';
import { JwtAuthGuard, Roles, RolesGuard } from '../../security/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { FileInterceptor } from '@nestjs/platform-express';
import fileTypePkg from 'file-type';

@Controller('file')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('REST-API')
export class FahrradFileController {
    readonly #service: FahrradFileService;

    readonly #logger = getLogger(FahrradFileController.name);

    constructor(service: FahrradFileService) {
        this.#service = service;
    }

    @Put(':id')
    @Roles('admin', 'mitarbeiter')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    async upload(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        this.#logger.debug('upload: id=%s', id);
        const { fieldname, originalname, size, buffer } = file;
        this.#logger.debug(
            'upload: fieldname=&s, originalname=%s, mimetype=%s, size=%d',
            fieldname,
            originalname,
            size,
        );

        const fileType = await fileTypePkg.fromBuffer(buffer);
        this.#logger.debug('upload: fileType=%o', fileType);

        await this.#service.save(id, buffer, fileType);
    }

    @Get(':id')
    async download(@Param('id') id: string, @Res() res: Response) {
        this.#logger.debug('download: %s', id);

        const findResult = await this.#service.find(id);
        if (findResult.type !== 'FileFindSuccess') {
            return this.#handleFileFindError(findResult, res);
        }

        const file = findResult;
        const { readStream, contentType } = file;
        res.contentType(contentType);
        return readStream.pipe(res);
    }

    #handleFileFindError(err: FileFindError, res: Response) {
        switch (err.type) {
            case 'FahrradNotExists': {
                const { id } = err;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const msg = `Es gibt kein Fahrrad mit der ID "${id!}.`;
                this.#logger.debug(
                    'FahrradFileRequestHandler.handleDownloadError(): msg=%s',
                    msg,
                );
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'FileNotFound': {
                const { filename } = err;
                const msg = `Es gibt kein File mit Name ${filename}`;
                this.#logger.debug(
                    'FahrradFileRequestHandler.handleDownloadError(): msg=%s',
                    msg,
                );
                return res.status(HttpStatus.NOT_FOUND).send(msg);
            }

            case 'MultipleFiles': {
                const { filename } = err;
                const msg = `Es gibt mehr als eine File mit Namen ${filename}`;
                this.#logger.debug(
                    'FahrradFileRequestHandler.handleDownloadError(): msg=%s',
                    msg,
                );
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(msg);
            }

            default:
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
