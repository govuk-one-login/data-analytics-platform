/* eslint-disable no-console */
import { execSync } from 'child_process';

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

    let status = 'RUNNING';
    const startTime = Date.now();
    const timeoutMs = 10 * 60 * 1000;

    while (status === 'RUNNING') {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Glue job timed out after 10 minutes. Job Run ID: ${JobRunId}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      const getCommand = `aws glue get-job-run --job-name ${jobName} --run-id ${JobRunId}`;
      const getResult = execSync(getCommand, { encoding: 'utf-8' });
      const jobRun = JSON.parse(getResult);
      status = jobRun.JobRun.JobRunState;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Glue job failed with status: ${status}. Job Run ID: ${JobRunId}`);
    }

    console.log(`✓ Glue job completed successfully`);
    return { jobRunId: JobRunId, status };
  } catch (error) {
    console.error('Glue job execution failed:', error);
    throw error;
  }
};
