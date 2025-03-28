import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { scanForDuplicates, getAllRecords, downloadDuplicateReport } from '../services/recordService';
import { FiDownload, FiCheck } from 'react-icons/fi';

const Duplicates = () => {
    const [loading, setLoading] = useState(false);
    const [duplicates, setDuplicates] = useState([]);
    const [confidence, setConfidence] = useState(80);
    const [records, setRecords] = useState([]);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const data = await getAllRecords();
                setRecords(data);
            } catch (error) {
                toast.error('Failed to fetch records');
            }
        };
        fetchRecords();
    }, []);

    const handleScan = async () => {
        if (selectedRecords.length === 0) {
            toast.error('Please select at least one file');
            return;
        }

        setLoading(true);
        try {
            const results = await scanForDuplicates(confidence / 100, selectedRecords);
            setDuplicates(results.duplicates);
            
            if (results.duplicates.length > 0) {
                toast.success(`Found ${results.duplicates.length} duplicate groups`);
            } else {
                toast.info('No duplicates found with current threshold');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (selectedRecords.length === 0) return;
        
        setDownloading(true);
        try {
            await downloadDuplicateReport(selectedRecords[0]);
            toast.success('Report downloaded successfully');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setDownloading(false);
        }
    };

    const toggleRecordSelection = (recordId) => {
        setSelectedRecords(prev => 
            prev.includes(recordId) 
                ? prev.filter(id => id !== recordId) 
                : [...prev, recordId]
        );
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Duplicate Detection</h1>
            
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Select Files to Scan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {records.map(record => (
                        <div 
                            key={record._id}
                            onClick={() => toggleRecordSelection(record._id)}
                            className={`p-4 border rounded-lg cursor-pointer ${
                                selectedRecords.includes(record._id) 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200'
                            }`}
                        >
                            {selectedRecords.includes(record._id) && (
                                <FiCheck className="float-right text-blue-500" />
                            )}
                            <h3 className="font-medium">{record.fileName}</h3>
                            <p className="text-sm text-gray-600">{record.department}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                    Confidence Threshold: {confidence}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleScan}
                    disabled={loading || selectedRecords.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                    {loading ? 'Scanning...' : 'Scan for Duplicates'}
                </button>

                {duplicates.length > 0 && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                    >
                        {downloading ? 'Downloading...' : 'Download Report'}
                    </button>
                )}
            </div>

            {duplicates.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-xl font-semibold mb-4">Duplicate Results</h2>
                    {duplicates.map((group, index) => (
                        <div key={index} className="mb-6 p-4 border rounded">
                            <h3 className="font-medium mb-2">
                                Group {index + 1} - Confidence: {(group.confidence * 100).toFixed(1)}%
                            </h3>
                            <div className="grid gap-4">
                                {group.files.map((file, fileIndex) => (
                                    <div key={fileIndex} className="p-3 bg-gray-50 rounded">
                                        <p className="font-medium">{file.fileName}</p>
                                        <p className="text-sm text-gray-600">{file.department}</p>
                                        {file.matchedFields && (
                                            <div className="mt-2">
                                                <p className="text-sm font-medium">Matched Fields:</p>
                                                <ul className="list-disc pl-5">
                                                    {file.matchedFields.map((field, i) => (
                                                        <li key={i} className="text-sm">
                                                            {field.fieldName}: {(field.similarity * 100).toFixed(1)}%
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Duplicates;