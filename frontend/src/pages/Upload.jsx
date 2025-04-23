import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { datasetService } from '../services/datasetService';
import { toast } from '../components/ui/use-toast';

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [metadata, setMetadata] = useState({
    fileType: '',
    description: '',
    tags: []
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setConsoleOutput([]); // Clear previous console output
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      setMetadata(prev => ({
        ...prev,
        fileType: fileType
      }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload"
      });
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      setAnalysisProgress(null);
      setConsoleOutput([]); // Clear previous console output

      const response = await datasetService.uploadDataset(file, metadata, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
        onConsoleLog: (log) => {
          setConsoleOutput(prev => [...prev, log]);
        }
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "File uploaded and analyzed successfully"
        });
        navigate('/records');
      }
    } catch (error) {
      setConsoleOutput(prev => [...prev, `Error: ${error.message}`]);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload file"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload File</h1>
        
        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">File</label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.json,.css,.dfg,.kn"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <Input
              type="text"
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              placeholder="Enter file description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
            <Input
              type="text"
              value={metadata.tags.join(', ')}
              onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
              disabled={loading}
              placeholder="Enter tags separated by commas"
            />
          </div>

          {/* Progress and Console Output Display */}
          {(uploadProgress !== null || consoleOutput.length > 0) && (
            <div className="mt-4 space-y-4">
              {uploadProgress !== null && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {consoleOutput.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Console Output</div>
                  <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 overflow-y-auto max-h-96">
                    {consoleOutput.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !file}
            className="w-full"
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Upload; 