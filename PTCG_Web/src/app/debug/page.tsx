'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  ExternalLink, 
  Server, 
  FileText, 
  Database, 
  Settings, 
  Home, 
  Package, 
  Code,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Palette
} from 'lucide-react';

// Dynamically import UIDraft component
const UIDraft = dynamic(() => import('../../components/UIDraft'), { ssr: false });

interface Route {
  path: string;
  type: 'page' | 'api';
  description: string;
  status?: 'available' | 'error' | 'checking';
  method?: string;
}

interface LinkGroup {
  title: string;
  icon: any;
  routes: Route[];
  color: string;
}

export default function DebugPage() {
  const [routes, setRoutes] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showUIDraft, setShowUIDraft] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = () => {
    const routeGroups: LinkGroup[] = [
      {
        title: 'Main Application Pages',
        icon: Home,
        color: 'blue',
        routes: [
          { path: '/', type: 'page', description: 'Home - Card Search and Browse' },
          { path: '/deck-builder', type: 'page', description: 'Deck Builder - Create and Manage Decks' },
          { path: '/inventory', type: 'page', description: 'Collection Inventory Management' }
        ]
      },
      {
        title: 'Admin Pages',
        icon: Settings,
        color: 'purple',
        routes: [
          { path: '/admin/import-decks', type: 'page', description: 'Admin - Import Construction Decks' }
        ]
      },
      {
        title: 'API Endpoints - Card Data',
        icon: Database,
        color: 'green',
        routes: [
          { path: '/api/cards', type: 'api', method: 'GET', description: 'Get all cards data with search and filtering' },
          { path: '/api/cards', type: 'api', method: 'POST', description: 'Add new card to database' }
        ]
      },
      {
        title: 'API Endpoints - Deck Management',
        icon: Package,
        color: 'orange',
        routes: [
          { path: '/api/decks', type: 'api', method: 'GET', description: 'Get user created decks' },
          { path: '/api/decks', type: 'api', method: 'POST', description: 'Create new deck' },
          { path: '/api/decks', type: 'api', method: 'PUT', description: 'Update existing deck' },
          { path: '/api/decks', type: 'api', method: 'DELETE', description: 'Delete deck' },
          { path: '/api/construction-decks', type: 'api', method: 'GET', description: 'Get official construction decks with expansion codes' }
        ]
      },
      {
        title: 'API Endpoints - Inventory',
        icon: FileText,
        color: 'teal',
        routes: [
          { path: '/api/inventory', type: 'api', method: 'GET', description: 'Get user inventory/collection' },
          { path: '/api/inventory', type: 'api', method: 'POST', description: 'Update inventory quantities' },
          { path: '/api/test-inventory', type: 'api', method: 'GET', description: 'Test inventory functionality' }
        ]
      },
      {
        title: 'API Endpoints - Admin',
        icon: Server,
        color: 'red',
        routes: [
          { path: '/api/import-decks', type: 'api', method: 'POST', description: 'Import construction decks from external sources' }
        ]
      },
      {
        title: 'Development & Debug',
        icon: Code,
        color: 'gray',
        routes: [
          { path: '/debug', type: 'page', description: 'This debug page - All routes and API endpoints' }
        ]
      },
      {
        title: 'UI Components',
        icon: Palette,
        color: 'purple',
        routes: [
          { path: '/deck-studio', type: 'page', description: 'New Comprehensive Deck UI - Manager, Builder & Library' },
          { path: '#ui-draft', type: 'page', description: 'Modern UI Draft - Component showcase without functionality' }
        ]
      }
    ];

    setRoutes(routeGroups);
    setLoading(false);
  };

  const checkEndpointStatus = async (route: Route): Promise<'available' | 'error' | 'checking'> => {
    if (route.type !== 'api') {
      return 'available';
    }

    try {
      const response = await fetch(route.path, {
        method: route.method === 'GET' ? 'GET' : 'HEAD'
      });
      return response.ok ? 'available' : 'error';
    } catch (error) {
      return 'error';
    }
  };

  const checkAllStatuses = async () => {
    setCheckingStatus(true);
    
    const updatedGroups = await Promise.all(
      routes.map(async (group) => ({
        ...group,
        routes: await Promise.all(
          group.routes.map(async (route) => ({
            ...route,
            status: await checkEndpointStatus(route)
          }))
        )
      }))
    );
    
    setRoutes(updatedGroups);
    setCheckingStatus(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
      green: 'border-green-200 bg-green-50',
      orange: 'border-orange-200 bg-orange-50',
      teal: 'border-teal-200 bg-teal-50',
      red: 'border-red-200 bg-red-50',
      gray: 'border-gray-200 bg-gray-50'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getIconColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      teal: 'text-teal-600',
      red: 'text-red-600',
      gray: 'text-gray-600'
    };
    return colorMap[color] || colorMap.gray;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🐛 Debug Console</h1>
              <p className="text-gray-600">PTCG Web Application - All Routes & API Endpoints</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={checkAllStatuses}
                disabled={checkingStatus}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>Check Status</span>
              </button>
              <a
                href="/"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Back to App</span>
              </a>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Pages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {routes.reduce((acc, group) => acc + group.routes.filter(r => r.type === 'page').length, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">API Endpoints</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {routes.reduce((acc, group) => acc + group.routes.filter(r => r.type === 'api').length, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {routes.reduce((acc, group) => acc + group.routes.filter(r => r.status === 'available').length, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {routes.reduce((acc, group) => acc + group.routes.filter(r => r.status === 'error').length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Groups */}
        <div className="space-y-8">
          {routes.map((group, groupIndex) => {
            const IconComponent = group.icon;
            return (
              <div
                key={groupIndex}
                className={`border-2 rounded-xl p-6 ${getColorClasses(group.color)}`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <IconComponent className={`h-6 w-6 ${getIconColor(group.color)}`} />
                  <h2 className="text-xl font-bold text-gray-900">{group.title}</h2>
                  <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
                    {group.routes.length} routes
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {group.routes.map((route, routeIndex) => (
                    <div
                      key={routeIndex}
                      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              {route.type === 'page' ? (
                                <FileText className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Server className="h-4 w-4 text-green-500" />
                              )}
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                {route.method && (
                                  <span className={`text-xs font-bold mr-2 ${
                                    route.method === 'GET' ? 'text-blue-600' :
                                    route.method === 'POST' ? 'text-green-600' :
                                    route.method === 'PUT' ? 'text-orange-600' :
                                    route.method === 'DELETE' ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {route.method}
                                  </span>
                                )}
                                {route.path}
                              </code>
                            </div>
                            {route.status && getStatusIcon(route.status)}
                          </div>
                          <p className="text-sm text-gray-600">{route.description}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}${route.path}`)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy full URL"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          {route.type === 'page' && (
                            <a
                              href={route.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* UI Draft Section */}
        <div className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Palette className="h-8 w-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">UI Components Draft</h2>
                <p className="text-gray-600">Modern UI showcase without functionality</p>
              </div>
            </div>
            <button
              onClick={() => setShowUIDraft(!showUIDraft)}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Palette className="h-5 w-5" />
              <span>{showUIDraft ? 'Hide' : 'Show'} UI Draft</span>
            </button>
          </div>

          {showUIDraft && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-purple-50 border-b border-gray-200">
                <p className="text-sm text-purple-800">
                  This is a non-functional UI draft showcasing modern design patterns for the PTCG application.
                  All components are for visual demonstration only.
                </p>
              </div>
              <div className="max-h-96 overflow-auto">
                <UIDraft />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Debug Console for PTCG Card Search Application</p>
          <p className="text-sm mt-1">Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}