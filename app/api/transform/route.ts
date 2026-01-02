import 'server-only';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Static prompt for wheel swapping
const WHEEL_SWAP_PROMPT = 'swap the car wheels with the ones in the second image';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const carImageFile = formData.get('carImage') as File;
    const wheelzImageFile = formData.get('wheelzImage') as File;

    if (!carImageFile) {
      return NextResponse.json(
        { error: 'No car image provided' },
        { status: 400 }
      );
    }

    if (!wheelzImageFile) {
      return NextResponse.json(
        { error: 'No wheelz image provided' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    // Convert the car image to base64
    const carBytes = await carImageFile.arrayBuffer();
    const carBuffer = Buffer.from(carBytes);
    const carBase64 = carBuffer.toString('base64');
    const carMimeType = carImageFile.type || 'image/jpeg';

    // Convert the wheelz image to base64
    const wheelzBytes = await wheelzImageFile.arrayBuffer();
    const wheelzBuffer = Buffer.from(wheelzBytes);
    const wheelzBase64 = wheelzBuffer.toString('base64');
    const wheelzMimeType = wheelzImageFile.type || 'image/jpeg';

    // Use the image generation model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        // @ts-expect-error - responseModalities is a valid config for image generation models
        responseModalities: ['image', 'text'],
      },
    });

    // Create the content with both images and the static prompt
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: carMimeType,
          data: carBase64,
        },
      },
      {
        inlineData: {
          mimeType: wheelzMimeType,
          data: wheelzBase64,
        },
      },
      { text: WHEEL_SWAP_PROMPT },
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
  } as const,
};
