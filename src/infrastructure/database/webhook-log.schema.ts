import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webhook_logs')
export class WebhookLogSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column()
  signature: string;

  @Column({ default: false })
  processed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
