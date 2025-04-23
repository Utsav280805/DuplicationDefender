import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiDownload, FiSearch } from 'react-icons/fi';
import { getAllRecords, scanForDuplicates } from '../services/recordService';

const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const records = await getAllRecords();
        const foundRecord = records.find(r => r._id === id);
        if (foundRecord) {
          setRecord(foundRecord);
        } else {
          toast.error('Record not found');
          navigate('/records');
        }
      } catch (error) {
        console.error('Error fetching record:', error);
        toast.error('Failed to fetch record details');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, navigate]);

  const handleScanDuplicates = async () => {
    try {
      setScanning(true);
      navigate(`/duplicates?recordId=${id}&threshold=${confidenceThreshold}`);
    } catch (error) {
      console.error('Error initiating duplicate scan:', error);
      toast.error('Failed to initiate duplicate scan');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading record details...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500">Record not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/records')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2" />
          Back to Records
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {record.fileName || record.originalName}
              </h1>
              <p className="text-gray-500">
                Uploaded on {new Date(record.uploadedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleScanDuplicates}
                disabled={scanning}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <FiSearch className="mr-2" />
                {scanning ? 'Scanning...' : 'Scan for Duplicates'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">File Details</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.department || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">File Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.fileType || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">File Size</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.fileSize ? `${record.fileSize} KB` : 'Unknown'}</dd>
                </div>
                {record.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{record.description}</dd>
                  </div>
                )}
                {record.tags && record.tags.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tags</dt>
                    <dd className="mt-1">
                      <div className="flex flex-wrap gap-2">
                        {record.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Duplicate Analysis Settings</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="confidence" className="block text-sm font-medium text-gray-700">
                    Confidence Threshold (%)
                  </label>
                  <input
                    type="number"
                    id="confidence"
                    min="0"
                    max="100"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Set the minimum confidence level for duplicate detection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetail; 