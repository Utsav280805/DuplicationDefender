import React, { useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../services/recordService';

const departments = [
  'HR',
  'Finance',
  'Marketing',
  'Sales',
  'IT',
  'Operations',
  'Legal',
  'Research & Development',
  'Customer Service',
  'Product Management',
  'Quality Assurance',
  'Administration'
];

const UploadDataset = () => {
  const [files, setFiles] = useState([]);
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(uploadedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['csv', 'xls', 'xlsx'].includes(ext);
    });
    if (validFiles.length > 0) {
      setFiles(validFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!department || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = [];
    const errors = [];

    try {
      // Upload each file individually
      for (const file of files) {
        try {
          // Create FormData for each file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', file.name);
          formData.append('originalName', file.name);
          formData.append('fileType', file.type);
          formData.append('fileSize', file.size);
          formData.append('department', department);
          formData.append('description', description || '');
          formData.append('tags', JSON.stringify(tags ? tags.split(',').map(tag => tag.trim()) : []));

          console.log('Uploading file with data:', {
            fileName: file.name,
            department,
            description,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
          });

          const uploadPromise = uploadFile(formData);
          uploadPromises.push(uploadPromise);
        } catch (error) {
          errors.push(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises);
      
      // Check results
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.filter(result => result.status === 'rejected').length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
        
        // Reset form
        setFiles([]);
        setDepartment('');
        setDescription('');
        setTags('');
        
        // Navigate to records page with refresh flag
        navigate('/records', { 
          state: { 
            refresh: true,
            timestamp: Date.now()
          }
        });
      }

      if (failureCount > 0) {
        toast.error(`Failed to upload ${failureCount} file${failureCount > 1 ? 's' : ''}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex items-center justify-center gap-3">
          <FiUpload className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-semibold text-gray-900">Upload Dataset</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for your dataset..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Files
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <FiUpload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-blue-600 font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">CSV, XLS, XLSX up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.map((file, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {file.name.split('.').pop().toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!department || files.length === 0 || isUploading}
                className={`flex items-center justify-center w-full px-4 py-3 rounded-md text-white transition-colors ${
                  department && files.length > 0 && !isUploading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-300 cursor-not-allowed'
                }`}
              >
                <FiUpload className="w-5 h-5 mr-2" />
                {isUploading ? (
                  'Uploading...'
                ) : !department ? (
                  'Please Select Department'
                ) : files.length === 0 ? (
                  'Please Select Files'
                ) : (
                  `Upload ${files.length} File${files.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadDataset;