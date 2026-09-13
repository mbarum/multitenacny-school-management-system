
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface ActiveUserSession {
  id: string;
  socketId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  schoolName: string;
  schoolCode?: string;
  ip: string;
  userAgent: string;
  connectedAt: string;
  lastActive: string;
  currentPath: string;
  status: 'active' | 'idle';
}

@WebSocketGateway({
  cors: {
    origin: '*', // Allow connections from any origin (Front-end)
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('EventsGateway');
  private activeSessions = new Map<string, ActiveUserSession>();

  handleConnection(client: Socket) {
    const ip = (client.handshake.headers['x-forwarded-for'] as string) || client.handshake.address || '127.0.0.1';
    this.logger.log(`Client connected: ${client.id} from ${ip}`);
  }

  handleDisconnect(client: Socket) {
    this.activeSessions.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
    this.broadcastOnlineCount();
  }

  @SubscribeMessage('identify')
  handleIdentify(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const ip = (client.handshake.headers['x-forwarded-for'] as string) || client.handshake.address || '127.0.0.1';
    const userAgent = (client.handshake.headers['user-agent'] as string) || data?.userAgent || 'Web Browser';
    
    const session: ActiveUserSession = {
      id: `sess-${client.id}`,
      socketId: client.id,
      userId: data?.userId || client.id,
      name: data?.name || 'Platform User',
      email: data?.email || 'user@school.ac.ke',
      role: data?.role || 'Admin',
      schoolId: data?.schoolId,
      schoolName: data?.schoolName || 'Institution',
      schoolCode: data?.schoolCode,
      ip,
      userAgent,
      connectedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      currentPath: data?.currentPath || '/',
      status: 'active'
    };

    this.activeSessions.set(client.id, session);
    if (data?.schoolId) {
      client.join(`school_${data.schoolId}`);
    }
    if (data?.role) {
      client.join(`role_${data.role}`);
    }
    this.broadcastOnlineCount();
    return { success: true, session };
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const session = this.activeSessions.get(client.id);
    if (session) {
      session.lastActive = new Date().toISOString();
      if (data?.currentPath) session.currentPath = data.currentPath;
      session.status = 'active';
    }
    return { success: true, timestamp: new Date().toISOString() };
  }

  getOnlineUsers(): ActiveUserSession[] {
    return Array.from(this.activeSessions.values());
  }

  getOnlineCount(): number {
    return this.activeSessions.size;
  }

  private broadcastOnlineCount() {
    if (this.server) {
      try {
        this.server.emit('online_users_count', { count: this.getOnlineCount() });
      } catch {
        // Safe fail
      }
    }
  }

  // Helper method to emit events to specific rooms (e.g., specific school)
  emitToSchool(schoolId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`school_${schoolId}`).emit(event, data);
    }
  }
}
