import { IsUUID } from 'class-validator';

export class EndInterviewDto {
  @IsUUID()
  sessionId: string;
}
