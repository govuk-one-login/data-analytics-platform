import type { RedshiftSecret } from '../../shared/types/secrets-manager';
import type { Knex } from 'knex';
import { knex } from 'knex';
import type { Logger } from '@aws-lambda-powertools/logger';

export abstract class Database {
  abstract destroy(): Promise<void>;

  abstract raw(query: string): Promise<void>;
}

export class DatabaseAccess {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async getDatabaseConnection(secret: RedshiftSecret): Promise<Database | null> {
    try {
      const connectionDetails = {
        host: secret.host,
        user: secret.username,
        password: secret.password,
        database: secret.dbname,
        port: parseInt(secret.port),
      };
      this.logger.info('Connection details', { connectionDetails: { ...connectionDetails, password: undefined } });
      const connection = knex({
        client: 'pg',
        connection: connectionDetails,
      });
      // this step is needed as knex will return a non-null connection even if elements of the connection are incorrect
      // and will only throw an error or hang the first time you attempt to use the connection
      return await this.validateConnection(connection);
    } catch (error) {
      this.logger.error(`Error connecting to ${secret.dbname}`, { error });
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async validateConnection(connection: Knex<any, unknown[]> | null): Promise<Knex<any, unknown[]>> {
    if (connection === null) {
      throw new Error('Connection is null');
    }
    await connection.raw('select now()').timeout(1000);
    return connection;
  }
}
