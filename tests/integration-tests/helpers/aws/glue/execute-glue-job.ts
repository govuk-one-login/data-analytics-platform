/* eslint-disable no-console */
import { execSync } from 'child_process';
import {
  DEFAULT_POLL_INTERVAL_MS,
  GLUE_JOB_TIMEOUT_MS,
  GLUE_JOB_STATUS_RUNNING,
  GLUE_JOB_STATUS_SUCCEEDED,
} from '../../../constants';

export const executeGlueJob = async (
  jobName: string,
  args: Record<string, string>,
): Promise<{ jobRunId: string; status: string }> => {
  try {
    console.log(`⚙️ Starting Glue job via AWS CLI: ${jobName}`);

    const command = `aws glue start-job-run --job-name ${jobName} --arguments '${JSON.stringify(args)}'`;
    const result = execSync(command, { encoding: 'utf-8' });
    const { JobRunId } = JSON.parse(result);

    console.log(`✓ Glue job started with ID: ${JobRunId}`);

    let status = GLUE_JOB_STATUS_RUNNING;
    const startTime = Date.now();
    const timeoutMs = GLUE_JOB_TIMEOUT_MS;

    while (status === GLUE_JOB_STATUS_RUNNING) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Glue job timed out after 10 minutes. Job Run ID: ${JobRunId}`);
      }

      await new Promise(resolve => setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS));
      const getCommand = `aws glue get-job-run --job-name ${jobName} --run-id ${JobRunId}`;
      const getResult = execSync(getCommand, { encoding: 'utf-8' });
      const jobRun = JSON.parse(getResult);
      status = jobRun.JobRun.JobRunState;
    }

    if (status !== GLUE_JOB_STATUS_SUCCEEDED) {
      throw new Error(`Glue job failed with status: ${status}. Job Run ID: ${JobRunId}`);
    }

    console.log(`✓ Glue job completed successfully`);
    return { jobRunId: JobRunId, status };
  } catch (error) {
    console.error('Glue job execution failed:', error);
    throw error;
  }
};
