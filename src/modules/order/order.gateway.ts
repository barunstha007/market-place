import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' }, // allow your frontend origin
})
export class OrderGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.disconnect();
      return;
    }
  }

  // Ping/pong test
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any, client: Socket) {
    client.emit('pong', data);
  }

  // Notify a single user about their order status
  sendOrderStatusUpdate(userId: number, orderId: number, status: string) {
    this.server
      .to(`user_${userId}`)
      .emit('orderStatusUpdated', { orderId, status });
  }

  // Notify all admins about a new order
  sendNewOrderNotification(orderId: number) {
    this.server.to('admins').emit('newOrder', { orderId });
  }
}
