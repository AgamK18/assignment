# Project Setup and Usage

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [npm](https://www.npmjs.com/)

## Setup Instructions

Follow these steps to run the project:

### 1. Install Dependencies

In the project root directory, run the following command to install the required dependencies:

```
npm install
```

### 2. Add OpenAI API Key
Create a .env file in the root directory of the project. Add your OpenAI API key like so:

```
OPENAI_KEY=your_openai_api_key_here
CHECKLIST_PDF_PATH={path_to_cloned_repo}/checklist.pdf
OUTPUT_PDF_PATH={path_to_cloned_repo}/output.pdf
```

### 3. Start the Development Server
Run the following command to start the development server:
```
npm run dev
```

## Using the Project
1. Open your browser and go to http://localhost:4111.
2. Navigate to the workflow section.
3. Enter the absolute path of the directory containing all the files you want to process.


