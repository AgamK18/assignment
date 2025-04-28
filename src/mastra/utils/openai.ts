import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const fillPdfWithAI = async (data: string): Promise<string> => {
  const prompt = `
  You are given a checklist and data: ${data}. Perform the following tasks carefully:
  1. **Extract Information**:
    - Extract the pertinent information from the provided documents/data corresponding to each checklist item.
    - Map the extracted information clearly to the respective checklist items.

  2. **Director-Specific Information**:
    - For checklist items related to individual directors or persons (e.g., Name, ID, Nationality, Address, Email, Phone Number, Document Details):
      - Create a separate table for each director.
      - Each director's table should list all relevant fields (e.g., Name, ID, Address, Email, Phone, etc.).

  3. **Company-Level Information**:
    - For general company-level information (e.g., Company Name, Registration Number, Shareholders, Beneficial Owners):
      - Organize them together in a single company information table.

  4. **Pending Items**:
    - Identify and list all checklist items that are still pending (i.e., items for which no corresponding information could be found yet).
    - Do not assume all information is complete — allow partial filling with missing fields marked clearly as pending.

  5. **Handling Updates**:
    - If additional documents are provided later:
      - Re-run the extraction.
      - Update the mapped tables with newly found information.
      - Provide an updated list of pending items.

  6. **Traceability**:
    - For each filled item, link it precisely to its source (e.g., document name, section title, page number, or quoted excerpt).
    - Make navigation to the source clear and simple.

  ### Output Format:

  #### Company Information Table:
  | Item                       | Status (Filled/Pending) | Extracted Information | Source (Document ID + Location) |

  #### Director Information Tables:
  Separate table for each director:
  | Field                      | Status (Filled/Pending) | Extracted Information | Source (Document ID + Location) |

  #### Pending Items List:
  List of all checklist items that remain pending. Do not include any other text. Give only relevant information.
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0].message.content ?? '';
};