import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRecords } from '../services/recordService';
import { FaUpload, FaSearch, FaDownload, FaSpinner } from 'react-icons/fa';
import { formatFileSize, formatDate } from '../utils/formatters';

const Records = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define departments array
  const departments = ['all', 'HR', 'Finance', 'Operations', 'IT', 'Marketing', 'Sales', 'Legal', 'Admin'];

  // Load records on mount and set up refresh interval
  useEffect(() => {
    console.log('Records component mounted');
    loadRecords();

    // Refresh records every 30 seconds
    const interval = setInterval(loadRecords, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debug log for records state changes
  useEffect(() => {
    console.log('Current records state:', records);
    console.log('Number of records:', records.length);
  }, [records]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading records...');
      const fetchedRecords = await getAllRecords();
      console.log('Fetched records:', fetchedRecords);
      
      if (!Array.isArray(fetchedRecords)) {
        console.error('Fetched records is not an array:', fetchedRecords);
        setRecords([]);
        return;
      }

      setRecords(fetchedRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      setError(error.message || 'Failed to load records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate filtered records
  const filteredRecords = records.filter(record => {
    if (!record) return false;

    // Department filter
    const departmentMatch = selectedDepartment === 'all' || record.department === selectedDepartment;

    // Search filter
    const searchQuery = searchTerm.toLowerCase();
    const fileNameMatch = (record.originalName || record.fileName || '')
      .toLowerCase()
      .includes(searchQuery);
    const departmentSearchMatch = (record.department || '')
      .toLowerCase()
      .includes(searchQuery);

    return departmentMatch && (fileNameMatch || departmentSearchMatch);
  });

  // Debug log for filtered records
  useEffect(() => {
    console.log('Filtered records count:', filteredRecords.length);
  }, [filteredRecords, searchTerm, selectedDepartment]);

  const handleAddRecord = () => {
    navigate('/upload-dataset');
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting records...');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || statusColors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Error loading records</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={loadRecords}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
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
        <button
          onClick={handleAddRecord}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <FaUpload className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.originalName || record.fileName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{record.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{formatFileSize(record.fileSize)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatDate(record.uploadedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.duplicateAnalysis?.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/records/${record._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FaUpload className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedDepartment !== 'all'
                ? "Try adjusting your search or filter to find what you're looking for"
                : 'Get started by uploading your first dataset'}
            </p>
            {!searchTerm && selectedDepartment === 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleAddRecord}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaUpload className="-ml-1 mr-2 h-4 w-4" />
                  Upload Dataset
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Records; 