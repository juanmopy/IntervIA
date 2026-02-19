import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class StartInterviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200, { message: 'Role name cannot exceed 200 characters' })
  role: string;

  @IsEnum(['technical', 'behavioral', 'mixed'])
  type: 'technical' | 'behavioral' | 'mixed';

  @IsEnum(['junior', 'mid', 'senior'])
  difficulty: 'junior' | 'mid' | 'senior';

  @IsOptional()
  @IsEnum(['en', 'es'])
  language?: 'en' | 'es';

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(15)
  totalQuestions?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Resume text cannot exceed 10000 characters' })
  resumeText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Job description cannot exceed 10000 characters' })
  jobDescription?: string;

  @IsOptional()
  @IsEnum(['friendly', 'strict', 'casual'])
  persona?: 'friendly' | 'strict' | 'casual';
}
