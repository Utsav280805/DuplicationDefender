import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Download } from "lucide-react";

const FileScanner = () => {
    const [file, setFile] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResults(null);
            setError(null);
        }
    };

    const handleScan = async () => {
        if (!file) return;

        setScanning(true);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/api/files/scan', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to scan file');
            }

            const data = await response.json();
            setResults(data);
            setProgress(100);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setScanning(false);
        }
    };

    const handleDownload = async () => {
        if (!results?.reportPath) return;

        try {
            window.location.href = `http://localhost:3000/api/files/download-report?reportPath=${encodeURIComponent(results.reportPath)}`;
        } catch (err) {
            setError('Failed to download report');
        }
    };

    return (
        <Card className="p-6 max-w-2xl mx-auto">
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Select File to Scan</label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="border rounded-md p-2"
                        disabled={scanning}
                    />
                    {file && (
                        <p className="text-sm text-gray-500">
                            Selected file: {file.name}
                        </p>
                    )}
                </div>

                <Button
                    onClick={handleScan}
                    disabled={!file || scanning}
                    className="w-full"
                >
                    {scanning ? 'Scanning...' : 'Scan for Duplicates'}
                </Button>

                {scanning && (
                    <Progress value={progress} className="w-full" />
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {results && (
                    <div className="space-y-4">
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Scan Complete</AlertTitle>
                            <AlertDescription>
                                Found {results.duplicateRows} duplicate rows out of {results.totalRows} total rows.
                            </AlertDescription>
                        </Alert>

                        {results.duplicateRows > 0 && (
                            <Button
                                onClick={handleDownload}
                                className="w-full"
                                variant="outline"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Duplicate Report
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FileScanner; 