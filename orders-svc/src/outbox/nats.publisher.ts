import { Injectable, Logger } from '@nestjs/common';
import { connect, NatsConnection, StringCodec } from 'nats';

@Injectable()
export class NatsPublisher {
  private readonly logger = new Logger(NatsPublisher.name);
  private nc: NatsConnection | null = null;
  private sc = StringCodec();

  async ensure(): Promise<NatsConnection> {
    if (!this.nc) {
      const url = process.env.NATS_URL || 'nats://localhost:4222';
      this.logger.log(`Connecting to NATS: ${url}`);
      this.nc = await connect({ servers: url });
    }
    return this.nc;
  }

  async publish(subject: string, data: any): Promise<void> {
    const nc = await this.ensure();
    const payload = JSON.stringify(data);
    nc.publish(subject, this.sc.encode(payload));
  }

  async close(): Promise<void> {
    try {
      await this.nc?.drain();
    } catch {
      /* empty */
    }
    this.nc = null;
  }
}
