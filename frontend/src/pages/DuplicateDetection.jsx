import React, { useState, useEffect } from 'react';
import { FiDownload, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { scanForDuplicates, downloadDuplicateReport } from '../services/recordService';

const DuplicateDetection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confidence, setConfidence] = useState(80);
  const [isScanning, setIsScanning] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const results = await scanForDuplicates(confidence / 100);
      setDuplicates(results);
      toast.success(`Found ${results.length} potential duplicate groups`);
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to scan for duplicates');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = async (groupId) => {
    try {
      await downloadDuplicateReport(groupId);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };

  const filteredDuplicates = duplicates.filter(group =>
    group.files.some(file => 
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Duplicate Detection</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and resolve duplicate datasets</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search duplicates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Confidence:</span>
            <input
              type="number"
              value={confidence}
              onChange={(e) => setConfidence(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            <FiSearch className="w-5 h-5" />
            {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading results...</p>
          </div>
        ) : filteredDuplicates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No matching duplicates found' : 'No duplicates found. Try scanning with a different confidence level.'}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDuplicates.map((group, groupIndex) => (
              <div key={groupIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Duplicate Group #{groupIndex + 1}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Match Confidence: {(group.confidence * 100).toFixed(1)}%
                    </span>
                    <button
                      onClick={() => handleDownload(group.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <FiDownload className="w-4 h-4" />
                      Download Report
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Matched Fields</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.files.map((file, fileIndex) => (
                        <tr key={fileIndex}>
                          <td className="px-4 py-2 text-sm text-gray-900">{file.fileName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{file.department}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(file.uploadedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {file.matchedFields.map((field, fieldIndex) => (
                                <span
                                  key={fieldIndex}
                                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800"
                                  title={`Similarity: ${(field.similarity * 100).toFixed(1)}%`}
                                >
                                  {field.fieldName}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateDetection; 