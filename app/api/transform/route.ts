import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    // Convert the file to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Determine MIME type
    const mimeType = imageFile.type || 'image/jpeg';

    // Use the nanobanana model as specified by the user
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        // @ts-expect-error - responseModalities is a valid config for image generation models
        responseModalities: ['image', 'text'],
      },
    });

    // Create the content with image and prompt
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: prompt || 'Swap the wheels from the car picture with BBS FI-R 20 inches wheels' },
    ]);

    const response = result.response;
    
    // Look for image data in the response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        // Check if part has inline data (image)
        if ('inlineData' in part && part.inlineData) {
          const imageData = part.inlineData;
          return NextResponse.json({
            success: true,
            image: {
              data: imageData.data,
              mimeType: imageData.mimeType || 'image/png',
            },
          });
        }
      }
      
      // If no image found, check for text response
      const textPart = response.candidates[0].content.parts.find(
        (part) => 'text' in part
      );
      if (textPart && 'text' in textPart) {
        return NextResponse.json({
          success: false,
          error: 'Model returned text instead of image',
          text: textPart.text,
        }, { status: 422 });
      }
    }

    return NextResponse.json(
      { error: 'No image data in response' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error processing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

