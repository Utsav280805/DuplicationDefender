import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Upload, File, X, FileText } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import Loader3D from '../components/ui/Loader3D';
import { datasetService } from '../services/datasetService';
import authService from '../services/authService';

const UploadDataset = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    fileType: '',
    description: '',
    tags: []
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to upload files"
      });
      navigate('/signin');
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const detectFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'csv': return 'csv';
      case 'xlsx':
      case 'xls': return 'xlsx';
      case 'json': return 'json';
      case 'css': return 'css';
      default: return '';
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setMetadata(prev => ({
        ...prev,
        fileType: detectFileType(file.name)
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/css': ['.css']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: name === 'tags' ? value.split(',').map(tag => tag.trim()) : value
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
      });
      return;
    }

    try {
      setIsUploading(true);

      if (!authService.isAuthenticated()) {
        throw new Error('Please sign in to upload files');
      }

      const result = await datasetService.uploadDataset(selectedFile, metadata);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      if (result.duplicates && result.duplicates.length > 0) {
        toast({
          variant: "warning",
          title: "Potential Duplicates Found",
          description: `Found ${result.duplicates.length} potential duplicate(s)`,
        });
      }

      navigate('/records');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setMetadata({
      fileType: '',
      description: '',
      tags: []
    });
  };

  if (isLoading) return <Loader3D />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Upload Dataset</h1>
        <p className="text-gray-600 mb-8">Upload your data files for duplicate detection</p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Drag & drop files here, or click to select files</p>
              <p className="text-sm text-gray-500 mt-2">Supported formats: CSV, XLSX, XLS, JSON, CSS (Max size: 10MB)</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Selected File</h3>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-4">File Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select
                  name="fileType"
                  value={metadata.fileType}
                  onChange={handleMetadataChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select File Type</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX/XLS)</option>
                  <option value="json">JSON</option>
                  <option value="css">CSS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={metadata.description}
                  onChange={handleMetadataChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a description for this dataset..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={metadata.tags.join(', ')}
                  onChange={handleMetadataChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tags separated by commas..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleClear}>Clear All</Button>
          <Button
            variant="default"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={!selectedFile || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isUploading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </div>
            ) : (
              'Upload Files'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadDataset;