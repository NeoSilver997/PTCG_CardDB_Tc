'use client';

import React, { useState, useEffect } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ImportReport {
  timestamp: string;
  totalDecksProcessed: number;
  successfulImports: number;
  errors: string[];
  importedDecks: Array<{
    name: string;
    cardCount: number;
    action?: string;
    matchStats?: {
      totalCards: number;
      matchedCards: number;
      unmatchedCards: number;
    };
  }>;
}

interface ImportStatus {
  status: string;
  currentDeckCount: number;
  lastImport: ImportReport | null;
  scriptsAvailable: {
    constructionDecks: boolean;
    pythonScripts: boolean;
  };
}

export default function DeckImportAdmin() {
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forceReimport, setForceReimport] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);

  useEffect(() => {
    fetchImportStatus();
  }, []);

  const fetchImportStatus = async () => {
    try {
      const response = await fetch('/api/import-decks');
      const data = await response.json();
      setImportStatus(data);
    } catch (error) {
      console.error('Failed to fetch import status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/import-decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceReimport,
          updateExisting
        })
      });

      const result = await response.json();
      setImportResult(result);
      
      if (result.success) {
        // Refresh status after successful import
        await fetchImportStatus();
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: 'Failed to run import',
        details: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading import status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  Pokemon TCG Construction Deck Import
                </h1>
                <p className="text-gray-600 mt-1">
                  Import official construction decks from Python script output
                </p>
              </div>
            </div>
          </div>

          {/* Import Options */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Import Options</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="forceReimport"
                  type="checkbox"
                  checked={forceReimport}
                  onChange={(e) => {
                    setForceReimport(e.target.checked);
                    if (e.target.checked) setUpdateExisting(false);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="forceReimport" className="ml-2 block text-sm text-gray-900">
                  Force Re-import (Replace existing decks completely)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="updateExisting"
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => {
                    setUpdateExisting(e.target.checked);
                    if (e.target.checked) setForceReimport(false);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="updateExisting" className="ml-2 block text-sm text-gray-900">
                  Update Existing (Update card lists in existing decks)
                </label>
              </div>
              <p className="text-sm text-gray-500">
                If neither option is selected, duplicate decks will be skipped.
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-blue-700">Total Imported Decks</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{importStatus?.currentDeckCount || 0}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${
                importStatus?.scriptsAvailable.constructionDecks ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center">
                  {importStatus?.scriptsAvailable.constructionDecks ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    importStatus?.scriptsAvailable.constructionDecks ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Construction Decks File
                  </span>
                </div>
                <p className={`text-sm ${
                  importStatus?.scriptsAvailable.constructionDecks ? 'text-green-600' : 'text-red-600'
                }`}>
                  {importStatus?.scriptsAvailable.constructionDecks ? 'Available' : 'Not Found'}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                importStatus?.scriptsAvailable.pythonScripts ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center">
                  {importStatus?.scriptsAvailable.pythonScripts ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    importStatus?.scriptsAvailable.pythonScripts ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    Python Scripts
                  </span>
                </div>
                <p className={`text-sm ${
                  importStatus?.scriptsAvailable.pythonScripts ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {importStatus?.scriptsAvailable.pythonScripts ? 'Available' : 'Not Found'}
                </p>
              </div>
            </div>

            {/* Import Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={runImport}
                disabled={isImporting || !importStatus?.scriptsAvailable.constructionDecks}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isImporting || !importStatus?.scriptsAvailable.constructionDecks
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Upload className="h-5 w-5" />
                {isImporting ? 'Importing...' : 'Import Construction Decks'}
              </button>
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Result</h3>
              <div className={`rounded-lg p-4 ${
                importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      importResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResult.success ? 'Import Successful!' : 'Import Failed'}
                    </h4>
                    <p className={`mt-1 text-sm ${
                      importResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {importResult.message || importResult.error}
                    </p>
                    
                    {importResult.success && importResult.report && (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm text-green-700">
                          <strong>Imported:</strong> {importResult.imported} deck(s)
                        </div>
                        {importResult.errors > 0 && (
                          <div className="text-sm text-yellow-700">
                            <strong>Warnings:</strong> {importResult.errors} issue(s)
                          </div>
                        )}
                        {importResult.report.importedDecks && importResult.report.importedDecks.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-green-800 mb-2">Imported Decks:</h5>
                            <div className="space-y-1">
                              {importResult.report.importedDecks.map((deck: any, index: number) => (
                                <div key={index} className="text-xs bg-green-100 p-2 rounded flex justify-between">
                                  <span>{deck.name}</span>
                                  <span className="text-green-600">
                                    {deck.cardCount} cards | {deck.action || 'imported'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {importResult.details && (
                      <div className="mt-3 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        <strong>Details:</strong> {importResult.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Last Import Report */}
          {importStatus?.lastImport && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Last Import Report</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Import Time:</span>
                  <span className="text-sm font-medium">
                    {new Date(importStatus.lastImport.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Decks Processed:</span>
                  <span className="text-sm font-medium">{importStatus.lastImport.totalDecksProcessed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Successful Imports:</span>
                  <span className={`text-sm font-medium ${
                    importStatus.lastImport.successfulImports > 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {importStatus.lastImport.successfulImports}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Errors:</span>
                  <span className={`text-sm font-medium ${
                    importStatus.lastImport.errors.length > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {importStatus.lastImport.errors.length}
                  </span>
                </div>
                
                {importStatus.lastImport.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-red-700 mb-2">Errors:</h4>
                    <div className="space-y-1">
                      {importStatus.lastImport.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> If decks already exist, use the &quot;Force Re-import&quot; or &quot;Update Existing&quot; options above.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">How to Use</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Step 1: Generate Deck Data</h4>
                <p className="text-sm text-gray-600 mb-2">Run the Python script to scrape and process construction deck data:</p>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm block">
                  cd scripts && python run_deck_import.py
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Step 2: Import into Web App</h4>
                <p className="text-sm text-gray-600">
                  Once the script generates <code className="bg-gray-100 px-1 rounded">construction_decks.json</code>, 
                  click the import button above to add the decks to your web application.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Import Options:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Default:</strong> Skip decks that already exist</li>
                  <li><strong>Force Re-import:</strong> Replace existing decks completely</li>
                  <li><strong>Update Existing:</strong> Update card lists in existing decks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}