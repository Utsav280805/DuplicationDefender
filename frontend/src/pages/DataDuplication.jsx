import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  CheckCircle,
  MoreVertical,
  Settings2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import Loading from "../components/ui/loading";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";
import { getDuplicates } from '../services/dataService';

const DataDuplication = () => {
  const [duplicates, setDuplicates] = useState([]);
  const [sortBy, setSortBy] = useState('similarity');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const fetchDuplicates = async () => {
      try {
        setLoading(true);
        const response = await getDuplicates(searchQuery, sortBy === 'similarity' ? 0.9 : 0.8);
        
        if (response.success) {
          setDuplicates(response.data?.duplicatePairs || []);
          setHasDuplicates(response.data?.hasDuplicates || false);
          
          if (response.data?.hasDuplicates) {
            toast({
              title: "Duplicates Found",
              description: `Found ${response.data.duplicatePairs.length} duplicate pairs affecting ${response.data.summary.affectedRows} rows.`,
              variant: "warning",
              duration: 5000,
            });
          }
        } else {
          throw new Error(response.message || 'Failed to fetch duplicates');
        }
      } catch (error) {
        console.error('Error fetching duplicates:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch duplicates",
          duration: 3000,
        });
        setDuplicates([]);
        setHasDuplicates(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDuplicates();
  }, [location.state, toast, searchQuery, sortBy]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (value) => {
    setSortBy(value);
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Duplicate Records</h1>
        <p className="mt-2 text-gray-600">Review and manage duplicate records in your datasets</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={handleSort}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="similarity">Similarity</SelectItem>
            <SelectItem value="rowNumber">Row Number</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Results */}
      {!hasDuplicates ? (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Duplicates Found</h3>
          <p className="mt-2 text-gray-500">Your data is clean and free of duplicates.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {duplicates.map((duplicate, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between bg-gray-50">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Duplicate Group #{index + 1}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {duplicate.similarity}% Match
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(index)}
                  >
                    {expandedGroups.has(index) ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Settings2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {expandedGroups.has(index) && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Record 1 (Row {duplicate.row1})</h4>
                      <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
                        {JSON.stringify(duplicate.record1, null, 2)}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Record 2 (Row {duplicate.row2})</h4>
                      <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
                        {JSON.stringify(duplicate.record2, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Keep Both
                    </Button>
                    <Button variant="default" size="sm">
                      Merge Records
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataDuplication;