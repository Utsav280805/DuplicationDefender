import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from '../components/ui/use-toast';
import { API_ENDPOINTS } from '../config/api';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DatasetUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    department: '',
    tags: [],
    accessLevel: 'public'
  });
  const [currentTag, setCurrentTag] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setDuplicateData(null);
    const file = acceptedFiles[0];

    // Log file details
    console.log('File selected for upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    });

    try {
      // First check for duplicates
      const checkFormData = new FormData();
      checkFormData.append('file', file);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('Starting duplicate check for file:', file.name);

      // Step 1: Check for duplicates
      const checkResponse = await fetch(API_ENDPOINTS.ANALYZE_FILE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: checkFormData
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        throw new Error(errorData.message || 'Failed to check for duplicates');
      }

      const checkResult = await checkResponse.json();
      console.log('Duplicate check result:', checkResult);

      if (checkResult.data?.hasDuplicates) {
        console.log('Duplicates found:', {
          totalPairs: checkResult.data.duplicatePairs.length,
          affectedRows: checkResult.data.summary.affectedRows
        });
        
        setDuplicateData(checkResult.data);
        
        toast({
          variant: "destructive",
          title: "Duplicates Detected!",
          description: (
            <div className="space-y-2">
              <p>Found {checkResult.data.duplicatePairs.length} duplicate pairs in your file.</p>
              <p>Affecting {checkResult.data.summary.affectedRows} rows.</p>
              <button 
                onClick={() => navigate('/duplicates')} 
                className="text-white hover:text-gray-100 underline"
              >
                View Duplicates
              </button>
            </div>
          ),
          duration: 10000,
        });
      } else {
        console.log('No duplicates found in file:', file.name);
      }

      // Step 2: Upload the file
      console.log('Starting file upload:', file.name);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const metadataToSend = {
        ...metadata,
        name: metadata.name || file.name,
        duplicateInfo: checkResult.data?.summary || {}
      };
      uploadFormData.append('metadata', JSON.stringify(metadataToSend));

      const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD_FILE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload successful:', uploadResult);

      toast({
        title: "Success!",
        description: "File uploaded successfully.",
        variant: "success",
        duration: 5000,
      });

      // If duplicates were found, redirect to duplicates page
      if (checkResult.data?.hasDuplicates) {
        navigate('/duplicates');
      }

    } catch (error) {
      console.error('Error in file upload process:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload file",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  }, [metadata, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    onDropRejected: (rejectedFiles) => {
      console.log('Files rejected:', rejectedFiles);
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload only CSV, XLS, or XLSX files.",
        duration: 5000,
      });
    }
  });

  const handleAddTag = (e) => {
    e.preventDefault();
    if (currentTag.trim() && !metadata.tags.includes(currentTag.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Dataset</h1>
        <p className="mt-2 text-gray-600">Add new datasets to check for duplicates</p>
      </div>

      {duplicateData && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Duplicate Records Detected!</h3>
              <p className="text-sm text-red-700 mt-1">
                Found {duplicateData.duplicatePairs.length} duplicate pairs affecting {duplicateData.summary.affectedRows} rows.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => navigate('/duplicates')}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  View Duplicates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={isUploading} />
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path
                  d="M24 8l-8 8h6v16h4V16h6l-8-8z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isUploading ? (
                <p className="text-gray-600">Uploading and checking for duplicates...</p>
              ) : (
                <>
                  <p className="text-gray-600">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag and drop a file here, or click to select"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: CSV, XLS, XLSX
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Metadata Form */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dataset Name</label>
              <input
                type="text"
                value={metadata.name}
                onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter dataset name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the dataset"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                value={metadata.department}
                onChange={(e) => setMetadata(prev => ({ ...prev, department: e.target.value }))}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                <option value="research">Research</option>
                <option value="academic">Academic</option>
                <option value="administrative">Administrative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add tags"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {metadata.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Access Level</label>
              <select
                value={metadata.accessLevel}
                onChange={(e) => setMetadata(prev => ({ ...prev, accessLevel: e.target.value }))}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Public</option>
                <option value="department">Department Only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              disabled={isUploading}
              className={`w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
                ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </div>
              ) : 'Upload Dataset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetUpload;