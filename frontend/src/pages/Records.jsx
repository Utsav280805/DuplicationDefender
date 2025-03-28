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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
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
        </div>
      </div>
    </div>
  );
};

export default Records; 