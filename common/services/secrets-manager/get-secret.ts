import { secretsManagerClient } from '../../clients';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { ensureDefined, getErrorMessage } from '../../utilities/utils';
import type { SecretRotationStage } from '../../types/secrets-manager';

export const getSecret = async <T>(
  secretId: string,
  stage: SecretRotationStage = 'AWSCURRENT',
  clientRequestToken: string | undefined = undefined,
): Promise<T> => {
  try {
    const secretString = await secretsManagerClient
      .send(
        new GetSecretValueCommand({
          SecretId: secretId,
          VersionStage: stage,
          ...(stage === 'AWSPENDING' ? { VersionId: clientRequestToken } : {}),
        }),
      )
      .then(response => ensureDefined(() => response.SecretString));
    return JSON.parse(secretString);
  } catch (error) {
    throw new Error(`Error getting secret - ${getErrorMessage(error)}`);
  }
};
