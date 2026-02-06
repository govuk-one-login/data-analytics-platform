import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { join } from 'path';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });

export const uploadReplayConfigToS3 = async (bucket: string, replayId: string): Promise<void> => {
  const configPath = join(__dirname, '../../../../../raw-to-stage/config/raw_to_stage_config_rules.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  config.event_record_selection.event_processing_testing_criteria.enabled = true;
  config.event_record_selection.event_processing_testing_criteria.filter = `txma like '%${replayId}%'`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: 'txma/raw_stage_optimisation_solution/configuration_rules/raw_to_stage_replay_config.json',
      Body: JSON.stringify(config, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
    }),
  );
};
