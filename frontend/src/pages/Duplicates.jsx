import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { datasetService } from '../services/datasetService';
import { toast } from '../components/ui/use-toast';

const Duplicates = () => {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFile, setCurrentFile] = useState(null);

  useEffect(() => {
    const fetchDuplicates = async () => {
      try {
        setLoading(true);
        if (id) {
          console.log('Fetching details for record:', id);
          const response = await datasetService.getDatasetDetails(id);
          console.log('Dataset details response:', response);
          
          if (response.success) {
            setCurrentFile(response.file);
            console.log('File duplicates:', response.file.duplicates);
            
            if (response.file.duplicates?.duplicatePairs?.length > 0) {
              console.log('Processing duplicate pairs...');
              const processedDuplicates = response.file.duplicates.duplicatePairs
                .map(pair => {
                  try {
                    return {
                      original: typeof pair.original === 'string' ? JSON.parse(pair.original) : pair.original,
                      duplicate: typeof pair.duplicate === 'string' ? JSON.parse(pair.duplicate) : pair.duplicate,
                      confidence: pair.confidence,
                      rowNumber1: pair.rowNumber1,
                      rowNumber2: pair.rowNumber2
                    };
                  } catch (error) {
                    console.error('Error processing duplicate pair:', error);
                    return null;
                  }
                })
                .filter(Boolean);
              
              console.log('Processed duplicates:', processedDuplicates);
              setDuplicates(processedDuplicates);
            } else {
              console.log('No duplicates found in file');
              setDuplicates([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching duplicates:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch duplicates"
        });
        setDuplicates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDuplicates();
  }, [id]);

  const filteredDuplicates = duplicates.filter(dup => 
    dup.confidence >= confidenceThreshold &&
    (Object.values(dup.original).some(val => 
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    Object.values(dup.duplicate).some(val => 
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const renderDifferenceHighlight = (value1, value2) => {
    if (value1 === value2) {
      return <span className="text-green-600">{value1}</span>;
    }
    return <span className="text-red-600">{value1} ≠ {value2}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Duplicate Analysis</h1>
        <p className="text-gray-600">
          {currentFile?.filename} - Found {duplicates.length} potential duplicates
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search in duplicates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-64">
          <div className="flex items-center gap-2">
            <span className="text-sm">Confidence:</span>
            <Input
              type="number"
              min="0"
              max="100"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            />
            <span className="text-sm">%</span>
          </div>
        </div>
      </div>

      {filteredDuplicates.length > 0 ? (
        <div className="space-y-6">
          {filteredDuplicates.map((dup, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Duplicate Pair #{index + 1}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {dup.confidence}% Similar
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Original Record (Row {dup.rowNumber1})</h4>
                  <div className="space-y-2">
                    {Object.entries(dup.original).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span>{' '}
                        {renderDifferenceHighlight(value, dup.duplicate[key])}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Duplicate Record (Row {dup.rowNumber2})</h4>
                  <div className="space-y-2">
                    {Object.entries(dup.duplicate).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span>{' '}
                        {renderDifferenceHighlight(value, dup.original[key])}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Matching Fields:</h4>
                <div className="text-sm text-gray-600">
                  {Object.keys(dup.original).filter(key => 
                    dup.original[key] === dup.duplicate[key]
                  ).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No duplicates found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default Duplicates; 