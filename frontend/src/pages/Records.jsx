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
import React, { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllRecords } from '../services/recordService';
import { toast } from 'react-hot-toast';

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

const Records = () => {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllRecords();
      console.log('Fetched records:', data);
      
      if (Array.isArray(data)) {
        // Process and sort records
        const processedRecords = data.map(record => ({
          ...record,
          fileName: record.fileName || record.originalName || 'Unnamed File',
          department: record.department || 'Unspecified',
          fileSize: parseInt(record.fileSize) || 0,
          fileType: record.fileType || record.fileName?.split('.').pop()?.toUpperCase() || 'Unknown',
          uploadedAt: record.uploadedAt || record.createdAt || new Date().toISOString(),
          duplicateAnalysis: {
            status: record.duplicateAnalysis?.status || 'pending',
            duplicatesCount: record.duplicateAnalysis?.duplicatesCount || 0,
            lastAnalyzedAt: record.duplicateAnalysis?.lastAnalyzedAt
          }
        }));

        // Sort by upload date, newest first
        const sortedRecords = processedRecords.sort((a, b) => 
          new Date(b.uploadedAt) - new Date(a.uploadedAt)
        );

        console.log('Processed and sorted records:', sortedRecords);
        setRecords(sortedRecords);
      } else {
        console.error('Invalid records data:', data);
        setRecords([]);
        toast.error('Invalid records data received');
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error('Failed to load records. Please try again.');
      setRecords([]);
    } finally {
      setLoading(false);
      // Clear the refresh flag from location state
      if (location.state?.refresh) {
        navigate('.', { replace: true, state: {} });
      }
    }
  }, [navigate, location.state]);

  // Effect for initial load
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Effect for handling refresh
  useEffect(() => {
    if (location.state?.refresh || location.state?.timestamp) {
      const timer = setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        loadRecords();
      }, 1000); // Small delay to ensure backend has processed the upload
      return () => clearTimeout(timer);
    }
  }, [location.state?.refresh, location.state?.timestamp, loadRecords]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadRecords();
    toast.success('Refreshing records...');
  };

  const handleAddRecord = () => {
    navigate('/upload-dataset');
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || record.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Records</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage your data records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleAddRecord}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Add Record
          </button>
        </div>
        <Button className="flex items-center gap-2" onClick={() => navigate('/upload')}>
          Add Record
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All Departments">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <FiDownload className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
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
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Analysis Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchQuery || selectedDepartment !== 'All Departments' 
                      ? 'No matching records found'
                      : 'No records available'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.fileName}
                      </div>
                      {record.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {record.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.department}</div>
                      {record.tags && record.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {record.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatFileSize(record.fileSize)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {record.fileType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.duplicateAnalysis.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : record.duplicateAnalysis.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.duplicateAnalysis.status}
                      </span>
                      {record.duplicateAnalysis.duplicatesCount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {record.duplicateAnalysis.duplicatesCount} duplicate(s) found
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/records/${record._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
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