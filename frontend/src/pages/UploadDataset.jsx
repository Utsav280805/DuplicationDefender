import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Upload, File, X, FileText } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import Loader3D from '../components/ui/Loader3D';
import { datasetService } from '../services/datasetService';
import { useNavigate } from 'react-router-dom';

const UploadDataset = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    department: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    // Show loading animation for 4 seconds to match the animation duration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000); // Changed from 1000 to 4000 to show full animation cycle
    return () => clearTimeout(timer);
  }, []);

  const onDrop = useCallback(acceptedFiles => {
    console.log('Files dropped:', acceptedFiles);
    setFiles(prev => [...prev, ...acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9)
    }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 10 * 1024 * 1024 // 10MB in bytes
  });

  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select files to upload"
      });
      return;
    }

    if (!metadata.department) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a department"
      });
      return;
    }

    try {
      setIsUploading(true);
      console.log('Starting file upload...');

      for (const fileObj of files) {
        if (!['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(fileObj.file.type)) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a CSV, XLSX, or XLS file"
          });
          return;
        }

        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('department', metadata.department);
        formData.append('description', metadata.description);
        formData.append('tags', metadata.tags);

        console.log('Uploading file:', fileObj.file.name);
        const response = await datasetService.uploadDataset(formData);
        console.log('Upload response:', response);

        if (response.success) {
          toast({
            title: "Success",
            description: "File uploaded successfully"
          });
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      }

      // Redirect to Records page instead of Data Repository
      navigate('/records');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload files"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-5 max-w-3xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader3D />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-xl font-semibold">Upload Dataset</h1>
            <p className="text-sm text-gray-600">Upload your data files for duplicate detection</p>
          </div>

          <div className="space-y-4">
            {/* Upload Area */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                {isDragActive ? 'Drop the files here' : 'Drag & drop files here, or click to select files'}
              </p>
              <p className="text-xs text-gray-500">Supported formats: CSV, XLSX, XLS (Max size: 10MB)</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Selected Files</h2>
                {files.map(({ file, id }) => (
                  <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File Information */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">File Information</h2>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Department</label>
                <select
                  name="department"
                  value={metadata.department}
                  onChange={handleMetadataChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea
                  name="description"
                  value={metadata.description}
                  onChange={handleMetadataChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter file description..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Tags</label>
                <Input
                  name="tags"
                  value={metadata.tags}
                  onChange={handleMetadataChange}
                  placeholder="Enter tags (comma separated)"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={files.length === 0 || isUploading}
              >
                Clear All
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Files'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadDataset;