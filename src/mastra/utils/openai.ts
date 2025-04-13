const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const fillPdfWithAI = async (data: string, pdfPath: string, outputPdfPath: string) => {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  let pageTexts = [];

  for (const page of pages) {
    const { width, height } = page.getSize();
    pageTexts.push({ width, height });
  }

  const prompt = `
You are given the following PDF structure:

${JSON.stringify(pageTexts, null, 2)}

And the following data to be written into the PDF:

"${data}"

Return a JSON array of objects with this format:
[{ page: number, x: number, y: number, text: string }]

Only include coordinates for adding the text in appropriate places and not any other text and any notes.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  const match = completion.choices[0].message.content.match(/\[\s*{[\s\S]*?}\s*\]/);
  const coordinates = match ? JSON.parse(match[0]) : [];

  console.log(coordinates);

  for (const item of coordinates) {
    const pageIndex = item.page - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
  
    const page = pages[pageIndex];
    if (!page || !item.text) continue;
  
    page.drawText(item.text, {
      x: item.x ?? 0,
      y: item.y ?? 0,
      size: 12,
    });
  }
  
  const pdfBytesModified = await pdfDoc.save();
  fs.writeFileSync(outputPdfPath, pdfBytesModified);
}