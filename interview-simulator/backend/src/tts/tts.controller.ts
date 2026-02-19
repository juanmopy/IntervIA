import { Controller, Post, Body } from '@nestjs/common';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { TtsService } from './tts.service';

class SynthesizeDto {
  @IsString()
  @MinLength(1)
  text: string;

  @IsOptional()
  @IsEnum(['en-US', 'es-ES'])
  language?: 'en-US' | 'es-ES';

  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';
}

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  /**
   * POST /api/tts/synthesize
   * Synthesize text to speech with lipsync data.
   */
  @Post('synthesize')
  async synthesize(@Body() dto: SynthesizeDto) {
    return this.ttsService.synthesize({
      text: dto.text,
      language: dto.language,
      gender: dto.gender,
    });
  }
}
