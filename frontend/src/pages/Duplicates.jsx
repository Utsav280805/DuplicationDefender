import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Duplicates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch duplicates when confidence threshold changes
  useEffect(() => {
    fetchDuplicates();
  }, [confidenceThreshold]);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/records/duplicates', {
        params: { confidence: confidenceThreshold }
      });
      setDuplicates(response.data.duplicates);
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      toast.error('Failed to fetch duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (sourceId, targetId) => {
    try {
      await axios.post('/api/records/merge', { sourceId, targetId });
      toast.success('Records merged successfully');
      fetchDuplicates(); // Refresh the list
    } catch (error) {
      console.error('Error merging records:', error);
      toast.error('Failed to merge records');
    }
  };

  const handleIgnore = async (duplicateId) => {
    try {
      await axios.post(`/api/records/${duplicateId}/ignore`);
      toast.success('Duplicate ignored');
      fetchDuplicates(); // Refresh the list
    } catch (error) {
      console.error('Error ignoring duplicate:', error);
      toast.error('Failed to ignore duplicate');
    }
  };

  const handleScan = () => {
    fetchDuplicates();
  };

  const filteredDuplicates = duplicates.filter(dup =>
    dup.original.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dup.duplicate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'resolved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-5 h-5" />;
      case 'resolved': return <CheckCircle2 className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Duplicate Detection</h1>
        <p className="text-gray-600">Manage and resolve duplicate datasets</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search duplicates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Confidence:</span>
          <Input
            type="number"
            min="0"
            max="100"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
        <Button onClick={handleScan} disabled={loading}>
          {loading ? 'Scanning...' : 'Scan for Duplicates'}
        </Button>
      </div>

      <div className="space-y-4">
        {filteredDuplicates.map((duplicate) => (
          <div key={duplicate.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className={getStatusColor(duplicate.status)}>
                  {getStatusIcon(duplicate.status)}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  Match Confidence: {duplicate.confidence}%
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleIgnore(duplicate.id)}
                  disabled={duplicate.status !== 'pending'}
                >
                  Ignore
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleMerge(duplicate.duplicate.id, duplicate.original.id)}
                  disabled={duplicate.status !== 'pending'}
                >
                  Merge
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Original Record</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Name:</dt>
                      <dd className="text-sm text-gray-900">{duplicate.original.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Department:</dt>
                      <dd className="text-sm text-gray-900">{duplicate.original.department}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Date:</dt>
                      <dd className="text-sm text-gray-900">{duplicate.original.date}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Duplicate Record</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Name:</dt>
                      <dd className="text-sm text-gray-900">{duplicate.duplicate.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Department:</dt>
                      <dd className="text-sm text-gray-900">{duplicate.duplicate.department}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Date:</dt>
                      <dd className="text-sm text-gray-900">{duplicate.duplicate.date}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Scanning for duplicates...</p>
          </div>
        )}

        {!loading && filteredDuplicates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No duplicates found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Duplicates; 