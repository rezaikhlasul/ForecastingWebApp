/**
 * Gemini API Service
 * Handles AI recommendations and chat functionality
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

function getModel() {
    if (!model) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.');
        }
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
    }
    return model;
}

/**
 * Use AI to intelligently map messy dataset columns into standard internal keywords
 * such as 'Date', 'Product', 'Region', 'Revenue', 'Quantity', 'Profit', 'Customer_Type'.
 * Unknown columns or non-matching columns will be kept with their original name.
 */
export async function mapDatasetColumns(columns) {
    const m = getModel();

    const prompt = `You are an expert Data Engineer. We have an application that expects standard core column headers to power its charts, but users upload CSVs with varying naming conventions (even in Indonesian, abbreviated, or messy).

The standard target keywords are: "Date", "Product", "Region", "Revenue", "Quantity", "Profit", "Customer_Type".

Here is the list of column headers from the uploaded file:
${JSON.stringify(columns)}

Map the headers to the standard target keywords. Try to be smart (e.g., "Tanggal", "Tgl", "Waktu" -> "Date", "Terjual", "Jml", "Qty" -> "Quantity", "Pendapatan", "Sales" -> "Revenue", "Produk", "Barang" -> "Product").
If a column DOES NOT clearly map to one of the 7 standard targets, leave it mapped to its EXACT original name. DO NOT invent new target keywords. Every original column must be present as a key in the output JSON.

Respond ONLY with a valid JSON object where keys are the original column names, and values are the mapped names. Example format:
{
  "Tanggal_Transaksi": "Date",
  "Nama Barang": "Product",
  "Qty": "Quantity",
  "Total Sales": "Revenue",
  "Employee ID": "Employee ID"
}`;

    try {
        const result = await m.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        console.warn('Could not parse AI column mapping, returning original headers');
        return Object.fromEntries(columns.map(col => [col, col]));
    } catch (error) {
        console.error('Error in AI column mapping:', error);
        // Fallback to original columns if Gemini fails
        return Object.fromEntries(columns.map(col => [col, col]));
    }
}

/**
 * Build the system context from the dataset
 */
function buildDataContext(dataContext) {
    const { columns, dataTypes, statistics, missingValues, rowCount, sampleData, correlationMatrix, fileName } = dataContext;

    let context = `You are an expert AI Data Analyst. You are analyzing a dataset called "${fileName}" with the following characteristics:\n\n`;
    context += `📊 Dataset Overview:\n`;
    context += `- Total Rows: ${rowCount}\n`;
    context += `- Total Columns: ${columns.length}\n`;
    context += `- Columns: ${columns.join(', ')}\n\n`;

    context += `📋 Data Types:\n`;
    columns.forEach(col => {
        context += `- ${col}: ${dataTypes[col]}\n`;
    });

    if (statistics && Object.keys(statistics).length > 0) {
        context += `\n📈 Statistics (numeric columns):\n`;
        Object.entries(statistics).forEach(([col, stats]) => {
            if (stats) {
                context += `- ${col}: mean=${stats.mean?.toFixed(2)}, median=${stats.median?.toFixed(2)}, stdDev=${stats.stdDev?.toFixed(2)}, min=${stats.min}, max=${stats.max}\n`;
            }
        });
    }

    if (missingValues) {
        const missingCols = Object.entries(missingValues).filter(([, v]) => v.count > 0);
        if (missingCols.length > 0) {
            context += `\n⚠️ Missing Values:\n`;
            missingCols.forEach(([col, v]) => {
                context += `- ${col}: ${v.count} missing (${v.percentage.toFixed(1)}%)\n`;
            });
        }
    }

    if (sampleData && sampleData.length > 0) {
        context += `\n🔍 Sample Data (first 5 rows):\n`;
        context += JSON.stringify(sampleData.slice(0, 5), null, 2) + '\n';
    }

    if (correlationMatrix) {
        context += `\n🔗 Correlation Matrix:\n`;
        context += JSON.stringify(correlationMatrix, null, 2) + '\n';
    }

    return context;
}

/**
 * Get AI recommendations from the dataset
 */
export async function getRecommendations(dataContext) {
    const m = getModel();
    const context = buildDataContext(dataContext);

    const prompt = `${context}

Based on the dataset above, provide exactly 5 strategic recommendations in the following JSON format. Each recommendation should be actionable and helpful for business decision-making.

Return ONLY a valid JSON array, no other text:
[
  {
    "id": 1,
    "category": "Sales|Operations|Marketing|Finance|HR|General",
    "title": "Short descriptive title",
    "insight": "What the data reveals",
    "recommendation": "Specific action to take",
    "impact": "High|Medium|Low",
    "confidence": 85
  }
]

Make the recommendations specific to the actual data columns and values. Use Bahasa Indonesia for the content.`;

    try {
        const result = await m.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Could not parse AI recommendations');
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}

/**
 * Chat with AI about the data
 */
export async function chatWithData(message, chatHistory, dataContext) {
    const m = getModel();
    const context = buildDataContext(dataContext);

    const systemPrompt = `${context}

You are a helpful AI data analyst assistant. Answer the user's questions about this dataset clearly and concisely. 
- Use Bahasa Indonesia in your responses
- Provide specific numbers and references to the data when possible
- Format your responses with markdown for readability
- If the user asks for recommendations, be specific and actionable
- If you're uncertain about something, be transparent about it`;

    const contents = [];

    // Add system context as first user message
    contents.push({
        role: 'user',
        parts: [{ text: systemPrompt + '\n\nPlease acknowledge you understand the dataset and are ready to help.' }],
    });
    contents.push({
        role: 'model',
        parts: [{ text: 'Saya sudah memahami dataset Anda. Saya siap membantu menganalisis data dan menjawab pertanyaan Anda. Silakan bertanya!' }],
    });

    // Add chat history
    chatHistory.forEach(msg => {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        });
    });

    // Add the new user message
    contents.push({
        role: 'user',
        parts: [{ text: message }],
    });

    try {
        const result = await m.generateContent({ contents });
        const response = result?.response;
        if (!response) {
            throw new Error('Tidak ada respons dari AI.');
        }
        const text = response.text();
        if (!text) {
            throw new Error('AI mengembalikan respons kosong.');
        }
        return text;
    } catch (error) {
        console.error('Error in chat:', error);
        throw error;
    }
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured() {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
}
