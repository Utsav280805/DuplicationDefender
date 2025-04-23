import React, { useState, useEffect } from 'react';
import { Table } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search } from 'lucide-react';
import { datasetService } from '../services/datasetService';
import { toast } from '../components/ui/use-toast';
import { formatFileSize, formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

// Helper function to detect file type from filename
const detectFileType = (filename) => {
  if (!filename) return 'unknown';
  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'csv':
      return 'csv';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'dfg':
      return 'dfg';
    case 'kn':
      return 'kn';
    default:
      return 'unknown';
  }
};

const Records = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fileTypes = ['all', 'csv', 'xlsx', 'json', 'css', 'dfg', 'kn', 'unknown'];

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching records...');
      const response = await datasetService.getDatasets();
      console.log('Records response:', response);
      if (response.success) {
        const transformedRecords = response.files.map(file => ({
          _id: file.id,
          name: file.filename,
          fileType: file.fileType || detectFileType(file.filename),
          size: file.size,
          createdAt: file.uploadDate,
          description: file.description,
          tags: file.tags,
          duplicates: file.duplicates || null
        }));
        setRecords(transformedRecords);
      } else {
        throw new Error(response.message || 'Failed to fetch records');
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch records"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleViewDuplicates = (recordId) => {
    navigate(`/duplicates/${recordId}`);
  };

  const filteredRecords = records.filter(record => 
    (selectedFileType === 'all' || record.fileType?.toLowerCase() === selectedFileType) &&
    (record.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Records</h1>
          <p className="text-gray-600">View and manage your data records</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => navigate('/upload')}>
          Add Record
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {fileTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All File Types' : type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.name}</div>
                    {record.description && (
                      <div className="text-sm text-gray-500">{record.description}</div>
                    )}
                    {record.duplicates && record.duplicates.hasDuplicates && (
                      <div className="text-sm text-red-500 mt-1">
                        {record.duplicates.duplicatePairs.length} duplicate(s) found
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 uppercase">
                      {record.fileType || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatFileSize(record.size)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(record.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDuplicates(record._id)}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Records;