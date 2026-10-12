import { Buffer } from "node:buffer"
import { NextResponse } from "next/server"

const MAX_PDF_SIZE = 4 * 1024 * 1024
const MODEL_NAME = "gemini-2.5-flash"

const transactionSchema = {
  type: "ARRAY",
  description: "Transactions extracted from the bank statement.",
  items: {
    type: "OBJECT",
    properties: {
      date: { type: "STRING", description: "Transaction date in YYYY-MM-DD format." },
      description: { type: "STRING", description: "Transaction description." },
      amount: { type: "NUMBER", description: "Positive for expenses and negative for income." },
      category: { type: "STRING", description: "A broad transaction category." },
    },
    required: ["date", "description", "amount", "category"],
    propertyOrdering: ["date", "description", "amount", "category"],
  },
}

type Transaction = {
  date: string
  description: string
  amount: number
  category: string
}

function isTransactionArray(value: unknown): value is Transaction[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.date === "string" &&
        typeof item.description === "string" &&
        typeof item.amount === "number" &&
        Number.isFinite(item.amount) &&
        typeof item.category === "string"
    )
  )
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Statement analysis is not configured on the server." },
      { status: 500 }
    )
  }

  if (!request.headers.get("content-type")?.startsWith("application/pdf")) {
    return NextResponse.json({ error: "Please upload a PDF file." }, { status: 415 })
  }

  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_PDF_SIZE) {
    return NextResponse.json({ error: "PDF files must be 4 MB or smaller." }, { status: 413 })
  }

  const pdf = Buffer.from(await request.arrayBuffer())
  if (pdf.byteLength > MAX_PDF_SIZE) {
    return NextResponse.json({ error: "PDF files must be 4 MB or smaller." }, { status: 413 })
  }
  if (pdf.byteLength < 5 || pdf.toString("ascii", 0, 5) !== "%PDF-") {
    return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 400 })
  }

  let response: Response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Analyze this HDFC bank statement PDF. Extract every transaction with its date, description, amount, and broad category. Use positive amounts for expenses/debits and negative amounts for income/credits. Return only the required JSON transaction array.",
                },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: pdf.toString("base64"),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: transactionSchema,
          },
        }),
      }
    )
  } catch (error) {
    console.error("Gemini API request failed:", error)
    return NextResponse.json({ error: "Could not connect to the analysis service." }, { status: 502 })
  }

  if (!response.ok) {
    console.error(`Gemini API returned HTTP ${response.status}.`)
    return NextResponse.json(
      {
        error:
          response.status === 429
            ? "The analysis service is busy. Please try again shortly."
            : `The analysis service returned an error (${response.status}).`,
      },
      { status: response.status === 429 ? 429 : 502 }
    )
  }

  let result: {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  try {
    result = await response.json()
  } catch (error) {
    console.error("Gemini API returned invalid JSON:", error)
    return NextResponse.json({ error: "The analysis service returned an invalid response." }, { status: 502 })
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return NextResponse.json({ error: "The analysis service returned no transaction data." }, { status: 502 })
  }

  let transactions: unknown
  try {
    transactions = JSON.parse(text)
  } catch (error) {
    console.error("Gemini API returned malformed transaction JSON:", error)
    return NextResponse.json({ error: "The analysis service returned invalid transaction data." }, { status: 502 })
  }

  if (!isTransactionArray(transactions)) {
    return NextResponse.json({ error: "The analysis service returned invalid transaction data." }, { status: 502 })
  }

  return NextResponse.json({ transactions })
}
