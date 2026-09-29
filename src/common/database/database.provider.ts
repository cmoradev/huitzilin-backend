import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigKey, DatabaseEnvs } from '../config';

export const DatabaseProvider = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    const options = configService.get<DatabaseEnvs>(ConfigKey.DB);

    return {
      type: 'postgres',
      host: options!.host,
      port: options!.port,
      username: options!.username,
      password: options!.password,
      database: options!.database,
      synchronize: false,
      entities: [__dirname + '/../../**/**/entities/*.entity{.ts,.js}'],
    };
  },
});
