import { ApiProperty } from '@nestjs/swagger';
import { SyncRepositoryItemDto } from './sync-repository-item.dto';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class SyncRepositoriesDto {
  @ApiProperty({
    type: [SyncRepositoryItemDto],
    description: 'List of repositories selected by the user to monitor',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRepositoryItemDto)
  repositories!: SyncRepositoryItemDto[];
}
