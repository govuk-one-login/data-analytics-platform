export type SecretRotationStage = 'AWSPREVIOUS' | 'AWSCURRENT' | 'AWSPENDING';

// based on https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_secret_json_structure.html#reference_secret_json_structure_RS
export interface RedshiftSecret {
  engine: 'redshift';
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}
