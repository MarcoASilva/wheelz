# Wheelz - AI Image Transformer

Transform your images using Google AI Studio's image generation capabilities.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```
GOOGLE_AI_API_KEY=your_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Configure the Prompt

Open `app/page.tsx` and find the `prompt` variable near the top of the component:

```typescript
// The prompt to send to the AI - leave blank for user to fill in later
const prompt = '';
```

Fill in your desired prompt for image transformation.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Upload an image by clicking the upload area or dragging and dropping
2. Click "Transform Image" to send the image to Google AI Studio
3. View and download the transformed result

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Google Generative AI SDK (`@google/generative-ai`)

