
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';

import { kycAgent } from './agents';
import kycWorkflow from './workflows';

export const mastra = new Mastra({
  agents: { kycAgent },
  workflows: { kycWorkflow },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
