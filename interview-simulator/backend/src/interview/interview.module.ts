import { Module } from '@nestjs/common';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { PromptInjectionGuard } from './guards';

@Module({
  imports: [OpenRouterModule],
  controllers: [InterviewController],
  providers: [InterviewService, PromptInjectionGuard],
  exports: [InterviewService],
})
export class InterviewModule {}
