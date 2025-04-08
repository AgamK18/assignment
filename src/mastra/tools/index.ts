import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { extractData } from "../utils";

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