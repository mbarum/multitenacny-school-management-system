
import { Module, Global, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { TenancySubscriber } from './tenancy.subscriber';
import { TenancyMiddleware } from './tenancy.middleware';

@Global()
@Module({
  providers: [TenancySubscriber],
  exports: [TenancySubscriber],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenancyMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
