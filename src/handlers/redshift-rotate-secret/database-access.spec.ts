import { DatabaseAccess } from './database-access';
import type { RedshiftSecret } from '../../shared/types/secrets-manager';
import { getLogger } from '../../shared/powertools';
import { knex } from 'knex';
import type { MockedFunction } from 'vitest';

vi.mock('knex', () => ({
  knex: vi.fn(),
}));

const mockKnex = knex as MockedFunction<typeof knex>;

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
  vi.clearAllMocks();
});

describe('DatabaseAccess', () => {
  test('getDatabaseConnection returns connection on success', async () => {
    // Unit Test
    const mockRawResult = {
      timeout: vi.fn().mockResolvedValue({}),
    };
    const mockConnection = {
      raw: vi.fn().mockReturnValue(mockRawResult),
      destroy: vi.fn().mockResolvedValue(undefined),
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
    // Unit Test
    mockKnex.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(null);
  });

  test('getDatabaseConnection returns null on validation error', async () => {
    // Unit Test
    const mockRawResult = {
      timeout: vi.fn().mockRejectedValue(new Error('Validation failed')),
    };
    const mockConnection = {
      raw: vi.fn().mockReturnValue(mockRawResult),
    };

    mockKnex.mockReturnValue(mockConnection as unknown as ReturnType<typeof knex>);

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(null);
  });

  test('getDatabaseConnection handles null validation internally', async () => {
    // Unit Test
    const mockConnection = {
      raw: vi.fn().mockReturnValue({
        timeout: vi.fn().mockResolvedValue({}),
      }),
    };

    mockKnex.mockReturnValue(mockConnection as unknown as ReturnType<typeof knex>);

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(mockConnection);
  });

  test('getDatabaseConnection handles knex returning null', async () => {
    // Unit Test
    mockKnex.mockReturnValue(null as unknown as ReturnType<typeof knex>);

    const dbAccess = new DatabaseAccess(logger);
    const connection = await dbAccess.getDatabaseConnection(mockSecret);

    expect(connection).toBe(null);
  });
});
