import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  PORT = 3000;

  @IsString()
  OPENROUTER_API_KEY: string;

  @IsString()
  GOOGLE_TTS_API_KEY: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN = 'http://localhost:4200';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  THROTTLE_TTL = 60000;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  THROTTLE_LIMIT = 30;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
