import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Upload, File, X, FileText } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import Loader from '../components/Loader';

const UploadDataset = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    setFiles(prev => [...prev, ...acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9)
    }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    if (!metadata.department) {
      toast({
        title: "Error",
        description: "Please select a department",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically upload the files
    toast({
      title: "Success",
      description: "Files uploaded successfully",
    });
  };

  return (
    <div className="container mx-auto px-4 py-5 max-w-3xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader />
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
              <p className="text-xs text-gray-500">Supported formats: CSV, XLS, XLSX</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Selected Files</h3>
                <div className="space-y-2">
                  {files.map(({ file, id }) => (
                    <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(id)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Form */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-medium">File Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Department
                  </label>
                  <select
                    value={metadata.department}
                    onChange={(e) => setMetadata({ ...metadata, department: e.target.value })}
                    className="w-full text-xs border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tags
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. monthly, reports"
                    value={metadata.tags}
                    onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <Input
                    type="text"
                    placeholder="Brief description of these files"
                    value={metadata.description}
                    onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setFiles([])}
                size="sm"
              >
                Clear All
              </Button>
              <Button 
                onClick={handleUpload}
                size="sm"
              >
                Upload Files
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadDataset;