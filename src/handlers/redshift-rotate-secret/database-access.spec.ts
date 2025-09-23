import { DatabaseAccess } from './database-access';
import type { RedshiftSecret } from '../../../common/types/secrets-manager';
import { getLogger } from '../../../common/powertools';
import { knex } from 'knex';

jest.mock('knex', () => ({
  knex: jest.fn(),
}));

const mockKnex = knex as jest.MockedFunction<typeof knex>;

const mockSecret: RedshiftSecret = {
  engine: 'redshift',
  host: 'test-host',
  username: 'testuser',
  password: 'testpass',
  dbname: 'testdb',
  port: '5439',
};

const logger = getLogger('test');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DatabaseAccess', () => {
  test('getDatabaseConnection returns connection on success', async () => {
    const mockRawResult = {
      timeout: jest.fn().mockResolvedValue({}),
    };
    const mockConnection = {
      raw: jest.fn().mockReturnValue(mockRawResult),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    mockKnex.mockReturnValue(mockConnection as unknown as ReturnType<typeof knex>);

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(mockConnection);
    expect(mockKnex).toHaveBeenCalledWith({
      client: 'pg',
      connection: {
        host: 'test-host',
        user: 'testuser',
        password: 'testpass',
        database: 'testdb',
        port: 5439,
      },
    });
    expect(mockConnection.raw).toHaveBeenCalledWith('select now()');
    expect(mockRawResult.timeout).toHaveBeenCalledWith(1000);
  });

  test('getDatabaseConnection returns null on connection error', async () => {
    mockKnex.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(null);
  });

  test('getDatabaseConnection returns null on validation error', async () => {
    const mockRawResult = {
      timeout: jest.fn().mockRejectedValue(new Error('Validation failed')),
    };
    const mockConnection = {
      raw: jest.fn().mockReturnValue(mockRawResult),
    };

    mockKnex.mockReturnValue(mockConnection as unknown as ReturnType<typeof knex>);

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(null);
  });

  test('getDatabaseConnection handles null validation internally', async () => {
    const mockConnection = {
      raw: jest.fn().mockReturnValue({
        timeout: jest.fn().mockResolvedValue({}),
      }),
    };

    mockKnex.mockReturnValue(mockConnection as unknown as ReturnType<typeof knex>);

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(mockConnection);
  });

  test('getDatabaseConnection handles knex returning null', async () => {
    mockKnex.mockReturnValue(null as unknown as ReturnType<typeof knex>);

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(null);
  });
});
