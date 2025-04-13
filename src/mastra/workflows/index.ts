import { Step, Workflow, Mastra } from "@mastra/core";
import { z } from "zod";
import { extractData, fillPdfWithAI } from "../utils";
import fs from "fs";
import path from "path";
import { kycAgent } from "../agents";

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
    const dirPath = context?.getStepResult<{ directoryPath: string }>('trigger')?.directoryPath;

    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.docx') || file.endsWith('.pdf'))
      .map(file => path.join(dirPath, file));

    const extractedData = [];
    for (const filePath of files) {
      const data = await extractData(filePath);
      extractedData.push({
        fileName: path.basename(filePath),
        extractedData: data,
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
    for (const [index, doc] of data.entries()) {
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 75000));
      }

      const prompt = `Extract the useful information from the given string and convert it to an object and do not include any other text. String ${doc.extractedData}`;
      const res = await kycAgent.generate(prompt);
      const responseText = res?.response?.messages?.[0]?.content?.[0]?.text;

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
  description: "Map processed data to checklist PDF and return filled file",
  inputSchema: z.object({
    data: z.array(z.object({
      fileName: z.string(),
      processedData: z.string()
    })),
  }),
  execute: async ({ context }) => {
    const input = context.getStepResult<{ processedData: Array<{ fileName: string, processedData: string }> }>("information-processor");
    const processedData = input?.processedData;

    if (!processedData || processedData.length === 0) {
      throw new Error("No processed data found.");
    }

    const checklistFilePath = process.env.CHECKLIST_PDF_PATH || path.join(process.cwd(), 'checklist.pdf');
    const outputFilePath = process.env.OUTPUT_PDF_PATH || path.join(process.cwd(), 'output.pdf');
    
    await fillPdfWithAI(JSON.stringify(processedData), checklistFilePath, outputFilePath);

    return {
      outputFilePath,
    };
  },
});


const kycWorkflow = new Workflow({
  name: "kyc-workflow",
  triggerSchema: z.object({
    directoryPath: z.string(),
  }),
});

kycWorkflow
  .step(dataExtractorStep)
  .then(informationProcessorStep)
  .then(mappingStep)
  .commit();

export default kycWorkflow;
