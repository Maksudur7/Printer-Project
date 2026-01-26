export class UpdateKioskStatusDto {
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'OUT_OF_PAPER';
    paperLevel?: number;
    inkLevel?: number;
}