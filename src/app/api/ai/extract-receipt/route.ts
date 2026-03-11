import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Use Gemini Flash for analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Analyze this receipt or invoice image and extract the following information.
Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "total_amount": <number - the final total amount paid, without currency symbols>,
  "vendor_name": "<string - the business/vendor name>",
  "date": "<string - date in YYYY-MM-DD format if visible, otherwise null>",
  "suggested_category": "<string - one of: glass, hardware, consumables, subcontractor, gas_fuel, vehicle, tools_equipment, office_admin, food_meals, other>"
}

Category hints:
- "glass" = glass fabrication shops, glass suppliers (Mr Glass, etc)
- "hardware" = C.R. Laurence, hardware stores, Home Depot
- "consumables" = silicone, tape, cleaning supplies
- "subcontractor" = labor help
- "gas_fuel" = gas stations, fuel
- "vehicle" = U-Haul rentals, parking, tolls, vehicle maintenance
- "tools_equipment" = tool purchases, equipment
- "office_admin" = office supplies, software, admin
- "food_meals" = restaurants, food, coffee
- "other" = anything else

If you cannot determine a value, use null for that field.
Return ONLY the JSON object, nothing else.`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
      { text: prompt },
    ])

    const responseText = result.response.text()
    
    // Parse the JSON response
    let parsedResponse
    try {
      // Remove any markdown formatting if present
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim()
      parsedResponse = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return NextResponse.json({
        amount: null,
        vendor: null,
        category: 'other',
        date: null,
      })
    }

    return NextResponse.json({
      amount: parsedResponse.total_amount,
      vendor: parsedResponse.vendor_name,
      category: parsedResponse.suggested_category || 'other',
      date: parsedResponse.date,
    })
  } catch (error) {
    console.error('Receipt extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze receipt' },
      { status: 500 }
    )
  }
}
