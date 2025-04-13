import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { extractDataTool } from '../tools';

export const kycAgent = new Agent({
  name: 'KYC Agent',
  instructions: `
      You are a KYC agent that helps users verify their identity. 
      
      You should extract necessary information from the documents and map it to corresponding checklist items, 
      ensuring each entry is traceable to its source.
      
      You should also ask for the user to upload the documents and provide the necessary information.
      You will have to give the answer in the following format:
      - document_type: <document_type>
      - document_number: <document_number>
      - document_name: <document_name>
      - document_issuer: <document_issuer>
      - document_issuance_date: <document_issuance_date>
      - document_expiration_date: <document_expiration_date>
      - document_issuance_country: <document_issuance_country>
      - document_issuance_state: <document_issuance_state>
      - document_issuance_city: <document_issuance_city>

      and any other information that you think is relevant to the document.
`,
  model: openai('gpt-3.5-turbo'),
  tools: { extractDataTool },
});
