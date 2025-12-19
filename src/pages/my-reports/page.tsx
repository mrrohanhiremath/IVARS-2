import { useState, useEffect } from 'react';
import { incidentAPI } from '../../services/incident.service';
import Header from '../../components/feature/Header';

interface Responder {
  _id: string;
  name: string;
  email: string;
  contact?: string;
  responderType?: string;
}

interface Incident {
  _id: string;
  reportId: string;
  name: string;
  contact: string;
  vehicleNo?: string;
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  images?: Array<{ url: string; publicId: string }>;
  responderAssigned?: Responder;
  estimatedResponseTime?: string;
  notes?: string;
}

const MyReports = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const response = await incidentAPI.getMyReports();
      if (response.success) {
        setIncidents(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true;
    return incident.status === filter;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
            <p className="mt-4 text-gray-600">Loading your reports...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <p className="mt-2 text-gray-600">Track the status of your accident reports</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex space-x-1 p-2 overflow-x-auto">
            {[
              { label: 'All Reports', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in-progress' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Closed', value: 'closed' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        {filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <i className="ri-file-list-3-line text-6xl text-gray-300"></i>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No reports found</h3>
            <p className="mt-2 text-gray-600">
              {filter === 'all' 
                ? "You haven't submitted any reports yet."
                : `No reports with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => (
              <div key={incident._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={`text-sm font-semibold ${getSeverityColor(incident.severity)}`}>
                          <i className="ri-alert-line mr-1"></i>
                          {incident.severity.toUpperCase()} SEVERITY
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Report ID: {incident.reportId}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <i className="ri-calendar-line mr-1"></i>
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Location</p>
                      <p className="text-gray-900">
                        <i className="ri-map-pin-line text-red-500 mr-1"></i>
                        {incident.location}
                      </p>
                    </div>
                    {incident.vehicleNo && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle Number</p>
                        <p className="text-gray-900">
                          <i className="ri-car-line mr-1"></i>
                          {incident.vehicleNo}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900">{incident.description}</p>
                  </div>

                  {incident.images && incident.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Photos</p>
                      <div className="flex space-x-2 overflow-x-auto">
                        {incident.images.map((image, idx) => (
                          <img
                            key={idx}
                            src={image.url}
                            alt={`Evidence ${idx + 1}`}
                            className="h-20 w-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responder Information */}
                  {incident.responderAssigned ? (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        <i className="ri-user-star-line mr-2"></i>
                        Responder Assigned
                      </p>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Name: </span>
                          <span className="font-medium text-gray-900">{incident.responderAssigned.name}</span>
                        </div>
                        {incident.responderAssigned.responderType && (
                          <div>
                            <span className="text-gray-600">Type: </span>
                            <span className="font-medium text-gray-900 capitalize">
                              {incident.responderAssigned.responderType}
                            </span>
                          </div>
                        )}
                        {incident.responderAssigned.contact && (
                          <div>
                            <span className="text-gray-600">Contact: </span>
                            <span className="font-medium text-gray-900">{incident.responderAssigned.contact}</span>
                          </div>
                        )}
                        {incident.estimatedResponseTime && (
                          <div>
                            <span className="text-gray-600">ETA: </span>
                            <span className="font-medium text-gray-900">{incident.estimatedResponseTime}</span>
                          </div>
                        )}
                      </div>
                      {incident.notes && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Update: </span>
                            {incident.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <i className="ri-time-line mr-2"></i>
                        Waiting for responder assignment...
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <i className="ri-user-line mr-1"></i>
                      Reported by: {incident.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      <i className="ri-phone-line mr-1"></i>
                      {incident.contact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default MyReports;
