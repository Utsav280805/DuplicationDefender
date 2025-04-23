import React, { useState, useEffect } from 'react';
import { toast } from '../components/ui/use-toast';
import { datasetService } from '../services/datasetService';
import { formatFileSize, formatDate } from '../utils/formatters';
import { Search, Filter, Download, Upload, FileSpreadsheet, File, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const DataRepository = () => {
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    fileType: 'all',
    dateRange: 'all',
    size: 'all'
  });

  // File type configurations
  const fileTypes = {
    css: { icon: File, color: 'text-blue-400' },
    csv: { icon: FileSpreadsheet, color: 'text-green-400' },
    xlsx: { icon: FileSpreadsheet, color: 'text-green-400' },
    json: { icon: File, color: 'text-yellow-400' },
    default: { icon: File, color: 'text-gray-400' }
  };

  // Fetch datasets from backend
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setIsLoading(true);
        const response = await datasetService.getDatasets();
        if (response?.success && Array.isArray(response?.files)) {
          // Sort datasets by file type and name with null checks
          const sortedDatasets = response.files
            .filter(dataset => dataset && typeof dataset === 'object') // Filter out null/undefined entries
            .map(dataset => ({
              ...dataset,
              fileType: dataset.fileType || 'unknown',
              name: dataset.name || 'Untitled',
              size: dataset.size || 0,
              uploadedAt: dataset.uploadedAt || new Date().toISOString()
            }))
            .sort((a, b) => {
              const fileTypeA = a.fileType.toLowerCase();
              const fileTypeB = b.fileType.toLowerCase();
              const nameA = a.name.toLowerCase();
              const nameB = b.name.toLowerCase();

              if (fileTypeA !== fileTypeB) {
                return fileTypeA.localeCompare(fileTypeB);
              }
              return nameA.localeCompare(nameB);
            });
          setDatasets(sortedDatasets);
        } else {
          setDatasets([]);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch datasets or invalid data format"
          });
        }
      } catch (error) {
        console.error('Error fetching datasets:', error);
        setDatasets([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch datasets"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  // Get file icon with proper error handling
  const getFileIcon = (fileType) => {
    if (!fileType || typeof fileType !== 'string') {
      return <File className="w-5 h-5 text-gray-400" />;
    }
    const type = fileType.toLowerCase();
    const config = fileTypes[type] || fileTypes.default;
    const IconComponent = config.icon;
    return <IconComponent className={`w-5 h-5 ${config.color}`} />;
  };

  // Filter datasets based on search query and file type with null checks
  const filteredDatasets = datasets.filter(dataset => {
    if (!dataset || typeof dataset !== 'object') return false;
    
    const searchLower = searchQuery.toLowerCase();
    const name = dataset.name.toLowerCase();
    const fileType = dataset.fileType.toLowerCase();
    
    const matchesSearch = name.includes(searchLower) || fileType.includes(searchLower);
    const matchesFileType = filters.fileType === 'all' || fileType === filters.fileType.toLowerCase();
    
    return matchesSearch && matchesFileType;
  });

  const handleDownload = async (id) => {
    try {
      await datasetService.downloadDataset(id);
      toast({
        title: "Success",
        description: "File download started"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to download file"
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await datasetService.deleteDataset(id);
      setDatasets(datasets.filter(d => d._id !== id));
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete file"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
import { toast } from 'react-toastify';
import { getAllRecords } from '../services/recordService';
import { FiDownload, FiSearch, FiFilter, FiCalendar, FiFolder } from 'react-icons/fi';

const DataRepository = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await getAllRecords();
      if (Array.isArray(data)) {
        setRecords(data);
        console.log('Fetched records:', data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Get unique departments from records
  const departments = [...new Set(records.map(record => record.department))].filter(Boolean);

  // Filter and sort records
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment = selectedDepartment === '' || record.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  }).sort((a, b) => {
    if (sortBy === 'uploadedAt') {
      return sortOrder === 'desc' 
        ? new Date(b.uploadedAt) - new Date(a.uploadedAt)
        : new Date(a.uploadedAt) - new Date(b.uploadedAt);
    }
    if (sortBy === 'fileName') {
      return sortOrder === 'desc'
        ? b.fileName.localeCompare(a.fileName)
        : a.fileName.localeCompare(b.fileName);
    }
    return 0;
  });


  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Repository</h1>
          <p className="mt-2 text-gray-600">Manage and access your datasets</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => window.location.href = '/upload'}>
          <Upload className="w-4 h-4" />
          Upload Dataset
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name or file type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select 
              value={filters.fileType}
              onValueChange={(value) => setFilters({ ...filters, fileType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All File Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All File Types</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>

            <div className="md:col-span-2 flex justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.reload()}
                className="h-10 w-10"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dataset Grid */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map(dataset => (
              <div
                key={dataset._id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                    {dataset.description && (
                      <p className="text-sm text-gray-500 mt-1">{dataset.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getFileIcon(dataset.fileType)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">File Type:</span>
                    <p className="font-medium text-gray-900 uppercase">{dataset.fileType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <p className="font-medium text-gray-900">{formatFileSize(dataset.size)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Uploaded:</span>
                    <p className="font-medium text-gray-900">{formatDate(dataset.uploadedAt)}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(dataset._id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(dataset._id)}
                    className="flex items-center gap-2"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredDatasets.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No datasets found</h3>
              <p className="text-gray-500">
                Try adjusting your search or file type filter to find what you're looking for
              </p>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Data Repository</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading records...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        if (sortBy === 'fileName') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('fileName');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => {
                        if (sortBy === 'uploadedAt') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('uploadedAt');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiFolder className="flex-shrink-0 mr-2 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900">
                            {record.fileName || record.originalName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{record.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiCalendar className="flex-shrink-0 mr-2" />
                          {new Date(record.uploadedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {record.tags?.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownload(record.fileUrl, record.fileName)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <FiDownload className="w-4 h-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || selectedDepartment ? (
                <p>No records found matching your search criteria.</p>
              ) : (
                <p>No records found in the repository.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataRepository;