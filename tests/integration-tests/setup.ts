import { AWS_REGION, STACK_NAME } from '../shared-test-code/constants';

module.exports = async () => {
  process.env.STACK_NAME = process.env.STACK_NAME ?? STACK_NAME;
  process.env.AWS_REGION = process.env.AWS_REGION ?? AWS_REGION;
};
