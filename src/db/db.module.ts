import { DbService } from './db.service.js';
import { Module } from '@nestjs/common';

@Module({
    providers: [DbService],
    exports: [DbService],
})
export class DbModule {}
