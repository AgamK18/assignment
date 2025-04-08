import { Step, Workflow, Mastra } from "@mastra/core";
import { z } from "zod";
import { extractData } from "../utils";
import { kycAgent } from "../agents";
import fs from 'fs';
import path from 'path';

const mastra = new Mastra();

const dataExtractorStep = new Step({
  id: "extractData",
  description: "Extract data from all document files in the directory",
  inputSchema: z.object({
    directory: z.object({
      path: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    const dirPath = context?.getStepResult<{
      directoryPath: string;
    }>('trigger')?.directoryPath;
    
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.docx') || file.endsWith('.pdf'))
      .map(file => path.join(dirPath, file));

    const extractedData = [];
    for (const filePath of files) {
      const data = await extractData(filePath);
      extractedData.push({
        fileName: path.basename(filePath),
        extractedData: data
      });
    }

    return { extractedData };
  },
});

const informationProcessorStep = new Step({
  id: "information-processor",
  description: "Process the extracted data from all documents",
  inputSchema: z.object({
    data: z.array(z.object({
      fileName: z.string(),
      extractedData: z.string()
    })),
  }),
  execute: async ({ context }) => {
    const data = context?.getStepResult<{
      extractedData: Array<{ fileName: string; extractedData: string }>;
    }>('extractData')?.extractedData;

    const processedData = [];
    for (const doc of data) {
      const prompt = `Extract the useful information from the given string and convert it to an object and do not include any other text. String ${doc.extractedData}`;
      const res = await kycAgent.generate(prompt);
      const responseMessage = res?.response?.messages[0];
      const responseContent = responseMessage?.content[0];
      const responseText = responseContent?.text;
      processedData.push({
        fileName: doc.fileName,
        processedData: responseText
      });
    }

    return { processedData };
  },
});

const mappingStep = new Step({
  id: "mapping",
  description: "Map the processed data from all documents to the corresponding checklist items",
  inputSchema: z.object({
    data: z.array(z.object({
      fileName: z.string(),
      processedData: z.string()
    })),
  }),
  execute: async ({ context }) => {
    const input = context.getStepResult("information-processor");
    
    const mappedData = [];
    for (const doc of input.processedData) {
      const prompt = `Map the given data to the corresponding checklist items do not include any other text. Data ${doc.processedData}`;
      const res = await kycAgent.generate(prompt);
      const responseMessage = res?.response?.messages[0];
      const responseContent = responseMessage?.content[0];
      const responseText = responseContent?.text;
      mappedData.push({
        fileName: doc.fileName,
        mappedData: responseText
      });
    }

    return { mappedData };
  },
});

const kycWorkflow = new Workflow({
  name: "kyc-workflow",
  triggerSchema: z.object({
    directoryPath: z.string(),
  }),
});

kycWorkflow.step(dataExtractorStep).then(informationProcessorStep).then(mappingStep).commit();

export default kycWorkflow;