import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { scanForDuplicates, getAllRecords, downloadDuplicateReport } from '../services/recordService';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiCheck } from 'react-icons/fi';

const Duplicates = () => {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [downloading, setDownloading] = useState({});
  const navigate = useNavigate();

  const fetchRecords = async () => {
    try {
      const data = await getAllRecords();
      if (Array.isArray(data)) {
        setRecords(data);
        console.log('Fetched records:', data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to fetch records');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDownload = async (groupId) => {
    setDownloading(prev => ({ ...prev, [groupId]: true }));
    try {
      await downloadDuplicateReport(groupId);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download report');
    } finally {
      setDownloading(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const fetchDuplicates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view duplicates');
        navigate('/login');
        return;
      }

      if (selectedRecords.length === 0) {
        toast.error('Please select at least one file to scan');
        return;
      }

      console.log('Scanning with confidence:', confidenceThreshold, 'and records:', selectedRecords);
      const results = await scanForDuplicates(confidenceThreshold / 100, selectedRecords);
      console.log('Duplicate scan results:', results);
      setDuplicates(results || []);
      
      if (results && results.length > 0) {
        toast.success(`Found ${results.length} duplicate groups!`);
      } else {
        toast.warn('No duplicates found with current threshold.');
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to scan for duplicates');
      }
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchDuplicates();
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSelect = (recordId) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      }
      return [...prev, recordId];
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Duplicate Detection</h1>

          {/* File Selection Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Files to Scan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {records.map(record => (
                <div
                  key={record._id}
                  onClick={() => handleRecordSelect(record._id)}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRecords.includes(record._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {selectedRecords.includes(record._id) && (
                    <div className="absolute top-2 right-2">
                      <FiCheck className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  <div className="font-medium text-gray-900">{record.fileName || record.originalName}</div>
                  <div className="text-sm text-gray-500 mt-1">{record.department}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(record.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scan Controls */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleScan}
              disabled={loading || selectedRecords.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scanning...' : 'Scan for Duplicates'}
            </button>
          </div>

          {/* Results Section */}
          {duplicates.length > 0 ? (
            <div className="space-y-6">
              {duplicates.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Match Confidence: {(group.confidence * 100).toFixed(1)}%
                    </h3>
                    <button
                      onClick={() => handleDownload(group.id)}
                      disabled={downloading[group.id]}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <FiDownload className="w-4 h-4" />
                      {downloading[group.id] ? 'Downloading...' : 'Download Report'}
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {group.files.map((file) => (
                      <div key={file.id} className="bg-gray-50 p-4 rounded-md">
                        <div className="font-medium text-gray-900">{file.fileName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Department: {file.department}
                        </div>
                        <div className="text-sm text-gray-600">
                          Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700">Matched Fields:</div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {file.matchedFields.map((field, index) => (
                              <div key={index} className="text-sm bg-white px-3 py-1 rounded border">
                                {field.fieldName}: {(field.similarity * 100).toFixed(1)}%
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {loading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4">Scanning for duplicates...</p>
                </div>
              ) : (
                <p>Select files and adjust the confidence threshold to scan for duplicates.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Duplicates; 