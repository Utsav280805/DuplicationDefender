import React, { useState } from 'react';
import { scanForDuplicates, downloadDuplicateReport } from '../services/recordService';
import { FiUpload } from 'react-icons/fi';

const DuplicateDetection = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [confidence, setConfidence] = useState(80);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [downloadReady, setDownloadReady] = useState(false);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        setError(null);
        setAnalysisResults(null);
        setDownloadReady(false);
    };

    const handleScan = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one file to scan');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Process each file sequentially to avoid overwhelming the server
            const results = [];
            for (const file of selectedFiles) {
                const result = await scanForDuplicates(confidence / 100, file);
                results.push(result);
            }
            
            setAnalysisResults(results);
            setDownloadReady(true);
        } catch (err) {
            console.error('Error scanning files:', err);
            setError(err.message || 'Error scanning for duplicates');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!analysisResults || analysisResults.length === 0) {
            setError('No analysis results available for download');
            return;
        }
        
        try {
            setLoading(true);
            await downloadDuplicateReport(analysisResults[0].recordId);
            setLoading(false);
        } catch (err) {
            console.error('Error downloading report:', err);
            setError(err.message || 'Error downloading duplicate report');
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Duplicate Detection</h1>
            
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Select Files to Scan</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                        <FiUpload />
                        Choose Files
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".csv,.xlsx,.xls,.json"
                            onChange={handleFileSelect}
                        />
                    </label>
                    {selectedFiles.length > 0 && (
                        <span className="text-gray-600">
                            {selectedFiles.length} file(s) selected
                        </span>
                    )}
                </div>
                
                {selectedFiles.length > 0 && (
                    <div className="mt-3">
                        <ul className="text-sm text-gray-600">
                            {selectedFiles.map((file, index) => (
                                <li key={index}>{file.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Confidence Threshold (%)</h2>
                <input
                    type="number"
                    value={confidence}
                    onChange={(e) => setConfidence(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-24 px-3 py-2 border rounded"
                    min="0"
                    max="100"
                />
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleScan}
                    disabled={loading || selectedFiles.length === 0}
                    className={`px-4 py-2 rounded-lg ${
                        loading || selectedFiles.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                >
                    {loading ? 'Scanning...' : 'Scan for Duplicates'}
                </button>

                {downloadReady && !loading && (
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Download Duplicates
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {analysisResults && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Analysis Results</h2>
                    {analysisResults.map((result, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg mb-4">
                            <h3 className="font-semibold">{result.fileName}</h3>
                            <p>Status: {result.status || 'Processing'}</p>
                            {result.message && <p>{result.message}</p>}
                            {result.duplicates && (
                                <p>Found {result.duplicates.length} duplicate groups</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DuplicateDetection; 