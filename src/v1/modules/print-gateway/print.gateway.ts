import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Production-e specific domain dite hobe
  },
  namespace: '/kiosk',
})
export class PrintGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PrintGateway.name);

  // Kon socket kon kiosk-er - { deviceId -> socketId }
  private kioskSockets = new Map<string, string>();

  // ─── Connection Events ────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Disconnect hole map theke remove koro
    for (const [deviceId, socketId] of this.kioskSockets.entries()) {
      if (socketId === client.id) {
        this.kioskSockets.delete(deviceId);
        this.logger.log(`Kiosk OFFLINE: ${deviceId}`);
        break;
      }
    }
  }

  // ─── Kiosk Register ───────────────────────────────────────────────────────
  // Dokan-er Agent prothomei ei event pathay nijeke register korar jonno

  @SubscribeMessage('kiosk:register')
  handleRegister(
    @MessageBody() data: { deviceId: string; printers: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    this.kioskSockets.set(data.deviceId, client.id);
    this.logger.log(
      `Kiosk ONLINE: ${data.deviceId} | Printers: ${data.printers?.length || 0}`,
    );

    // Confirm pathao agent-ke
    client.emit('kiosk:registered', {
      success: true,
      message: `Kiosk ${data.deviceId} registered successfully`,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Print Status Update ──────────────────────────────────────────────────
  // Agent jakhon print sesh kore, ei event pathay

  @SubscribeMessage('print:status')
  handlePrintStatus(
    @MessageBody()
    data: { orderId: string; status: string; deviceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Print status update - Order: ${data.orderId} | Status: ${data.status}`,
    );
    // Ei status frontend-eo pathano jabe (order tracking page-er jonno)
    this.server.emit(`order:${data.orderId}:status`, { status: data.status });
  }

  // ─── Send Print Job to Kiosk ──────────────────────────────────────────────
  // Payment complete hole Order Service ei method call korbe

  sendPrintJob(deviceId: string, orderData: any): boolean {
    const socketId = this.kioskSockets.get(deviceId);

    if (!socketId) {
      this.logger.warn(`Kiosk NOT connected: ${deviceId}`);
      return false;
    }

    // Specific kiosk-ke print job pathao
    this.server.to(socketId).emit('print:new-job', orderData);
    this.logger.log(
      `Print job sent to Kiosk: ${deviceId} | Order: ${orderData.orderId}`,
    );
    return true;
  }

  // ─── Check Kiosk Online ───────────────────────────────────────────────────

  isKioskOnline(deviceId: string): boolean {
    return this.kioskSockets.has(deviceId);
  }

  // ─── Get All Online Kiosks ────────────────────────────────────────────────

  getOnlineKiosks(): string[] {
    return Array.from(this.kioskSockets.keys());
  }
}
