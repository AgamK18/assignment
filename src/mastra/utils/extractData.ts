import fs from 'fs/promises';
import mammoth from 'mammoth';

export const extractData = async (filePath: string) => {
    try {
        const buffer = await fs.readFile(filePath);
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    } catch (error) {
        console.error('Error:', error);
    }
};