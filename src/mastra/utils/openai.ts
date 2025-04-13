import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const processChecklistWithFile = async (prompt: string, filePath: string) => {
  // Upload file
  const uploadedFile = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants",
  });

  // Create a thread
  const thread = await openai.beta.threads.create();

  // Send a message to the thread
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
    file_ids: [uploadedFile.id],
  });

  // Run the assistant
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });

  // Wait for run to complete
  let runStatus = run.status;
  while (runStatus === "queued" || runStatus === "in_progress") {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    runStatus = updatedRun.status;
  }

  // Get messages from the thread
  const messages = await openai.beta.threads.messages.list(thread.id);
  const message = messages.data[0];

  const fileAttachment = message.content.find(
    (content) => content.type === "file"
  ) as { type: "file"; file_id: string } | undefined;

  if (!fileAttachment) {
    throw new Error("No file response from assistant.");
  }

  const fileId = fileAttachment.file_id;
  const fileData = await openai.files.retrieve(fileId);
  const fileBuffer = await openai.files.download(fileId);

  const outputPath = path.join("output", fileData.filename || `output_${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, Buffer.from(await fileBuffer.arrayBuffer()));

  return outputPath;
}
