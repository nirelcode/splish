const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface DetectionResult {
  detected: boolean;
  estimatedMl: number;   // Gemini's best guess at volume
  message: string;
}

export async function detectWaterInPhoto(base64Image: string): Promise<DetectionResult> {
  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Look at this photo and answer in exactly this format:
DETECTED: YES or NO
ML: a number (your best estimate of the drink volume in millilitres, e.g. 200, 350, 500)
REASON: one short sentence describing what you see

Rules:
- YES only if you can clearly see a cup, glass, bottle, or container that appears to hold water or a clear/light drink
- For ML: small glass = ~200, regular glass = ~300, large glass = ~400, small bottle = ~350, standard bottle = ~500, large bottle = ~750
- If DETECTED is NO, still provide your best ML guess of 250`,
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 80, temperature: 0.1 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const json = await response.json();
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const detectedMatch = text.match(/DETECTED:\s*(YES|NO)/i);
  const mlMatch = text.match(/ML:\s*(\d+)/i);
  const reasonMatch = text.match(/REASON:\s*(.+)/i);

  const detected = detectedMatch?.[1]?.toUpperCase() === 'YES';
  const estimatedMl = mlMatch ? parseInt(mlMatch[1], 10) : 250;
  const message = reasonMatch?.[1]?.trim() ?? text.trim();

  return { detected, estimatedMl, message };
}
