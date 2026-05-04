import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class SyncRepositoryItemDto {
  @ApiProperty({
    example: 123456789,
    description: 'GitHub repository numeric identifier',
  })
  @IsInt()
  githubRepoId!: number;

  @ApiProperty({
    example: 'weekly_narrator',
    description: 'Repository short name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Jaume/weekly_narrator',
    description: 'Repository full name in owner/name format',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;
}
