import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  message: string;
}
