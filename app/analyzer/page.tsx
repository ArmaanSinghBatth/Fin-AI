"use client";
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

import { Upload, Loader, TrendingUp, DollarSign, XCircle, FileText, LayoutDashboard, FileBarChart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Transaction {
    date: string;
    description: string;
    amount: number;
    category: string;
}

const MAX_PDF_SIZE = 4 * 1024 * 1024;

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
        if (selectedFile && selectedFile.type === 'application/pdf' && selectedFile.size <= MAX_PDF_SIZE) {
            setFile(selectedFile);
            setTransactions([]);
            setError(null);
        } else {
            setFile(null);
            if (event.target) {
                event.target.value = '';
            }
            setError(
                selectedFile?.type !== 'application/pdf'
                    ? "Please select a valid PDF file."
                    : "PDF files must be 4 MB or smaller."
            );
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
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/pdf' },
                body: file,
            });
            const result: { transactions?: Transaction[]; error?: string } = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Analysis failed with status ${response.status}.`);
            }
            if (!Array.isArray(result.transactions)) {
                throw new Error("The server returned an invalid transaction list.");
            }
            setTransactions(result.transactions);

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
                        <CardDescription>Select a non-encrypted PDF financial statement (up to 4 MB) to analyze</CardDescription>
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
