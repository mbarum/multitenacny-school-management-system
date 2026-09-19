import { Entity, Column, Index, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

export enum ArticleStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}

@Entity('edtech_articles')
export class EdTechArticle {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ length: 255 })
  title!: string;

  @Index()
  @Column({ length: 255 })
  slug!: string;

  @Index()
  @Column({ length: 100, default: 'General' })
  category!: string;

  @Column({ length: 100, default: '' })
  date!: string;

  @Column({ length: 50, default: '3 min read' })
  readTime!: string;

  @Column('text')
  excerpt!: string;

  @Column({ length: 150, default: 'SaasLink Editorial Team' })
  author!: string;

  @Column({ length: 200, default: 'Education Specialist' })
  authorRole!: string;

  @Column({ length: 500, nullable: true })
  authorAvatar?: string;

  @Column({ length: 500, nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'json' })
  content!: string[];

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Index()
  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.PUBLISHED })
  status!: ArticleStatus;

  @Index()
  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @Column({ type: 'json', nullable: true })
  learningObjectives?: string[];

  @Column({ type: 'json' })
  media!: any[];

  @Column({ type: 'int', default: 0 })
  viewsCount!: number;
}
