import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterviewService } from './interview.service';
import { StartInterviewDto, SendMessageDto, EndInterviewDto } from './dto';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  /**
   * POST /api/interview/start
   * Creates a new interview session and returns the first AI greeting/question.
   */
  @Post('start')
  async start(@Body() dto: StartInterviewDto) {
    return this.interviewService.startInterview(dto);
  }

  /**
   * POST /api/interview/message
   * Sends a candidate message and returns the AI interviewer's response.
   */
  @Post('message')
  async message(@Body() dto: SendMessageDto) {
    return this.interviewService.sendMessage(dto.sessionId, dto.message);
  }

  /**
   * POST /api/interview/end
   * Ends the interview and triggers the AI evaluation.
   * Returns the full report.
   */
  @Post('end')
  async end(@Body() dto: EndInterviewDto) {
    return this.interviewService.endInterview(dto.sessionId);
  }

  /**
   * POST /api/interview/parse-resume
   * Accepts a PDF file upload (max 5MB) and returns extracted text.
   */
  @Post('parse-resume')
  @UseInterceptors(FileInterceptor('file'))
  async parseResume(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.interviewService.parseResume(file.buffer);
  }

  /**
   * GET /api/interview/:id
   * Returns the current state of an interview session.
   */
  @Get(':id')
  getSession(@Param('id') id: string) {
    return this.interviewService.getSessionState(id);
  }
}
