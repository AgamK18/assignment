import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { extractData, fillPdfWithAI } from "../utils";

export const extractDataTool = createTool({
    id: "extractData",
    description: "Extract data from a document file",
    inputSchema: z.object({
        file: z.object({
            path: z.string(),
        }),
    }),
    execute: async ({ context }) => {
        return {
            document: context.file,
            extractedData: await extractData(context.file.path),
        };
    },
});

export const getPdf = createTool({
    id: "fillPdfWithAI",
    description: "Fill a PDF with AI",
    inputSchema: z.object({
        data: z.string(),
        pdfPath: z.string(),
        outputPdfPath: z.string(),
    }),
    execute: async ({ context }) => {
        return {
            outputFilePath: await fillPdfWithAI(context.data, context.pdfPath, context.outputPdfPath),
        };
    },
});