"use client";
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

import { Upload, Loader, TrendingUp, DollarSign, XCircle, FileText, LayoutDashboard, FileBarChart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- TYPE DEFINITIONS ---
interface Transaction {
    date: string; // YYYY-MM-DD format
    description: string;
    amount: number; // Positive for debits/expenses, negative for credits/income
    category: string;
}

interface RechartsSchemaProperty {
    type: 'STRING' | 'NUMBER' | 'OBJECT' | 'ARRAY';
    description: string;
    properties?: Record<string, RechartsSchemaProperty>;
    required?: string[];
    propertyOrdering?: string[];
    items?: RechartsSchemaProperty;
}

// --- API Configuration ---
const API_KEY: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; // Overwriting key as required by instructions
const MODEL_NAME: string = "gemini-2.5-flash-preview-09-2025";
const API_URL: string = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

// --- JSON Response Schema Definition ---
const transactionSchema: RechartsSchemaProperty = {
    type: "ARRAY",
    description: "A list of all financial transactions extracted from the bank statement.",
    items: {
        type: "OBJECT",
        properties: {
            date: { type: "STRING", description: "The date of the transaction in YYYY-MM-DD format (e.g., 2024-03-15)." },
            description: { type: "STRING", description: "A brief description of the transaction as it appears on the statement." },
            amount: { type: "NUMBER", description: "The monetary amount of the transaction. Use a positive number for debits/expenses and a negative number for credits/income (Salary, Refunds, etc.)." },
            category: { type: "STRING", description: "A broad category (e.g., 'Groceries', 'Rent', 'Salary', 'Transfer', 'Utilities', 'Dining', 'Shopping', 'Other')." }
        },
        required: ["date", "description", "amount", "category"],
        propertyOrdering: ["date", "description", "amount", "category"]
    }
};

// --- Utility Functions ---

/**
 * Converts a File object (PDF) to a Base64 string.
 * @param {File} file - The file to convert.
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("No file provided."));
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') return reject(new Error("Failed to read file as string."));
            const base64String = reader.result.split(',')[1];
            resolve({ base64: base64String, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


/**
 * Executes the API call with exponential backoff retry mechanism.
 */
async function callApiWithBackoff(payload: Record<string, any>, maxRetries: number = 5): Promise<Record<string, any>> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) { // Rate limit
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; 
                } else {
                    throw new Error("API rate limit exceeded after multiple retries.");
                }
            }

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
            }

            return await response.json();

        } catch (error) {
            if (attempt === maxRetries - 1) {
                throw error;
            }
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    // Should not be reached, but needed for TS compiler
    throw new Error("Maximum API retries reached.");
}

// --- React Components ---

const Header: React.FC = () => (
    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row pb-8 border-b border-border mb-8">
        <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
                <FileBarChart className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Statement Analyzer</h1>
                <p className="text-muted-foreground mt-1">
                    Upload your non-encrypted PDF statement to extract and visualize your finances.
                </p>
            </div>
        </div>
        <Button asChild variant="default" size="sm" className="gap-2">
            <Link href="/">
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
            </Link>
        </Button>
    </div>
);

interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ReactElement<any>;
    bgColor: string;
    textColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, bgColor, textColor }) => (
    <Card className={`${bgColor} border-none shadow-sm`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="font-medium text-muted-foreground">{title}</CardDescription>
            <div className={`${textColor}`}>{icon}</div>
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${textColor}`}>{value}</div>
        </CardContent>
    </Card>
);

interface DashboardSummaryProps {
    transactions: Transaction[];
}

const DashboardSummary = ({ transactions }: DashboardSummaryProps): React.ReactNode => {
    // Calculate totals in one memo
    const { income, expense, netFlow } = useMemo(() => {
        let inc: number = 0;
        let exp: number = 0;

        transactions.forEach(t => {
            if (t.amount < 0) {
                inc += Math.abs(t.amount); // Income/Credit
            } else {
                exp += t.amount; // Expense/Debit
            }
        });

        return {
            income: inc,
            expense: exp,
            netFlow: inc - exp,
        };
    }, [transactions]);

    // Format currency (Indian Rupee is appropriate for HDFC)
    const formatter = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }), []);

    if (transactions.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard
                title="Total Expenses"
                value={formatter.format(expense)}
                icon={<DollarSign size={20} />}
                bgColor="bg-red-50/60 dark:bg-red-950/30"
                textColor="text-red-600 dark:text-red-400"
            />
            <SummaryCard
                title="Total Income"
                value={formatter.format(income)}
                icon={<TrendingUp size={20} />}
                bgColor="bg-emerald-50/60 dark:bg-emerald-950/30"
                textColor="text-emerald-600 dark:text-emerald-400"
            />
            <SummaryCard
                title="Net Flow"
                value={formatter.format(netFlow)}
                icon={<FileText size={20} />}
                bgColor={netFlow >= 0 ? "bg-primary/5 dark:bg-primary/10" : "bg-red-50/60 dark:bg-red-950/30"}
                textColor={netFlow >= 0 ? "text-primary" : "text-red-600 dark:text-red-400"}
            />
        </div>
    );
};

interface TransactionsTableProps {
    transactions: Transaction[];
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
    if (transactions.length === 0) return null;
    const formatter = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }), []);

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-xl">Detailed Transactions</CardTitle>
                <CardDescription>{transactions.length} transactions extracted</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {transactions.map((t, index) => (
                                <tr key={index} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">{t.date}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{t.description}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <Badge variant={t.amount >= 0 ? "destructive" : "default"} className="font-medium">
                                            {t.category}
                                        </Badge>
                                    </td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-right tabular-nums ${t.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {formatter.format(t.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};


// --- Main App Component ---

const Page: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setTransactions([]);
            setError(null);
        } else {
            setFile(null);
            // Clear the file input if an invalid file was selected
            if (event.target) {
                event.target.value = '';
            }
            setError("Please select a valid PDF file.");
        }
    }, []);

    const analyzeStatement = useCallback(async () => {
        if (!file) {
            setError("No file selected.");
            return;
        }

        setLoading(true);
        setError(null);
        setTransactions([]);

        try {
            // STEP 1: Convert the PDF to Base64
            const { base64, mimeType } = await fileToBase64(file);

            const systemPrompt = "You are a world-class financial analysis bot specializing in HDFC bank statements. Your task is to analyze the provided PDF. Extract ALL transactions, including the date, a brief description, the monetary amount, and assign a broad category (e.g., 'Groceries', 'Rent', 'Salary', 'Transfer', 'Utilities', 'Dining', 'Shopping', 'Other'). Use positive amounts for expenses/debits and negative amounts for income/credits. Be precise with dates and amounts. Only return the final JSON array according to the specified schema, with no conversational text or markdown formatting outside of the JSON block.";
            const userQuery = "Analyze the uploaded HDFC bank statement PDF. Extract all transactions and categorize them strictly following the required JSON schema.";

            const payload = {
                contents: [{
                    parts: [
                        { text: userQuery },
                        { inlineData: { mimeType, data: base64 } }
                    ]
                }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: { 
                    responseMimeType: "application/json",
                    responseSchema: transactionSchema,
                },
            };

            // STEP 2: Send the Base64 content to the Gemini API
            const result = await callApiWithBackoff(payload);

            const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!jsonString) {
                throw new Error("API response was empty or malformed.");
            }

            // The model is forced to return JSON, so we parse it directly.
            const parsedTransactions = JSON.parse(jsonString) as Transaction[];

            if (Array.isArray(parsedTransactions)) {
                setTransactions(parsedTransactions);
            } else {
                throw new Error("The API returned data in an incorrect format (expected an array).");
            }

        } catch (err) {
            const error = err as Error;
            console.error("Analysis Error:", error);
            setError(`Failed to analyze statement: ${error.message || "An unknown error occurred. Please check the console."}`);
        } finally {
            setLoading(false);
        }
    }, [file]);
    
    const summaryComponent = DashboardSummary({ transactions });


    return (
        <div className="min-h-screen bg-background font-sans p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <Header />

                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                                <Sparkles className="w-3 h-3" />
                                Step 1
                            </Badge>
                            <CardTitle className="text-xl">Upload Statement</CardTitle>
                        </div>
                        <CardDescription>Select a non-encrypted PDF financial statement to analyze</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center gap-4 flex-col md:flex-row">
                            <label className="flex-1 w-full flex flex-col items-center px-6 py-8 bg-muted/50 text-foreground rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-muted hover:border-primary/50 transition-all duration-300">
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium">
                                    {file ? file.name : 'Click to select a PDF file'}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    {file ? 'PDF selected — click to change' : 'or drag and drop'}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                            </label>

                            <Button
                                onClick={analyzeStatement}
                                disabled={!file || loading}
                                size="lg"
                                className="w-full md:w-auto gap-2"
                            >
                                {loading && <Loader className="w-4 h-4 animate-spin" />}
                                <span>{loading ? 'Analyzing...' : 'Analyze Statement'}</span>
                            </Button>
                        </div>

                        {error && (
                            <div className="mt-4 p-4 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                                <XCircle className="w-5 h-5 shrink-0" />
                                <p className="font-medium text-sm">{error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {transactions.length > 0 && (
                    <div className="mt-10">
                        <div className="flex items-center gap-2 mb-6">
                            <Badge variant="secondary" className="gap-1">
                                <Sparkles className="w-3 h-3" />
                                Step 2
                            </Badge>
                            <h2 className="text-2xl font-bold tracking-tight">Extracted Dashboard</h2>
                        </div>

                        <div className="mb-6">
                            {summaryComponent}
                        </div>

                        <TransactionsTable transactions={transactions} />
                    </div>
                )}

                {!loading && !error && transactions.length === 0 && file && (
                    <Card className="mt-10">
                        <CardContent className="p-8 text-center">
                            <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">
                                File ready. Press <span className="font-medium text-foreground">"Analyze Statement"</span> to begin data extraction.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Page;
