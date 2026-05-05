import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { KioskStatus } from '@prisma/client';

export class UpdateKioskStatusDto {
    @IsEnum(KioskStatus)
    @IsOptional()
    status?: KioskStatus;

    @IsInt()
    @Min(0)
    @Max(100)
    @IsOptional()
    paperLevel?: number;

    @IsInt()
    @Min(0)
    @Max(100)
    @IsOptional()
    inkLevel?: number;
}