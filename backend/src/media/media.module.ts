import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

// ConfigModule đã isGlobal ở AppModule nên không cần import lại.
@Module({
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
