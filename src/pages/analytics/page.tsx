
import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import { incidentAPI } from '../../services/incident.service';
import { userAPI } from '../../services/user.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('response-time');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter incidents based on time range
  const getFilteredIncidents = () => {
    const now = new Date();
    const filtered = incidents.filter(incident => {
      const incidentDate = new Date(incident.createdAt);
      const daysDiff = Math.floor((now.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (timeRange) {
        case '7d':
          return daysDiff <= 7;
        case '30d':
          return daysDiff <= 30;
        case '90d':
          return daysDiff <= 90;
        case '1y':
          return daysDiff <= 365;
        default:
          return true;
      }
    });
    return filtered;
  };

  const filteredIncidents = getFilteredIncidents();

  // Export to PDF function
  const handleExportData = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Emergency Alert Analytics Report', 14, 20);
    
    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Time Range: ${timeRange}`, 14, 36);
    
    // Summary Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 14, 48);
    
    autoTable(doc, {
      startY: 52,
      head: [['Metric', 'Value']],
      body: [
        ['Total Reports', filteredIncidents.length.toString()],
        ['Resolved Incidents', filteredIncidents.filter(i => i.status === 'resolved').length.toString()],
        ['Active Incidents', filteredIncidents.filter(i => i.status === 'active' || i.status === 'pending').length.toString()],
        ['Resolution Rate', `${resolutionRate}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Severity Breakdown
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Severity Breakdown', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 4,
      head: [['Severity', 'Count']],
      body: [
        ['Critical', criticalCount.toString()],
        ['High', highCount.toString()],
        ['Medium', mediumCount.toString()],
        ['Low', lowCount.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Incidents Table
    if (filteredIncidents.length > 0) {
      finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Add new page if needed
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Incident Details', 14, finalY);
      
      const incidentsData = filteredIncidents.slice(0, 20).map(inc => [
        inc.reportId || 'N/A',
        inc.status || 'N/A',
        inc.severity || 'N/A',
        (inc.location || 'N/A').substring(0, 30),
        inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : 'N/A',
        inc.responderAssigned?.name || 'Unassigned'
      ]);
      
      autoTable(doc, {
        startY: finalY + 4,
        head: [['Report ID', 'Status', 'Severity', 'Location', 'Date', 'Responder']],
        body: incidentsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });
      
      if (filteredIncidents.length > 20) {
        finalY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Note: Showing first 20 of ${filteredIncidents.length} incidents.`, 14, finalY);
      }
    }
    
    // Save PDF
    doc.save(`emergency-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const fetchData = async () => {
    try {
      const [incidentsRes, respondersRes] = await Promise.all([
        incidentAPI.getIncidents(),
        userAPI.getResponders()
      ]);

      if (incidentsRes.success) {
        setIncidents(incidentsRes.data);
      }
      if (respondersRes.success) {
        setResponders(respondersRes.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real KPI data from filtered incidents
  const totalReports = filteredIncidents.length;
  const resolvedIncidents = filteredIncidents.filter(i => i.status === 'resolved').length;
  const resolutionRate = totalReports > 0 ? ((resolvedIncidents / totalReports) * 100).toFixed(1) : '0';
  const activeIncidents = filteredIncidents.filter(i => i.status === 'active' || i.status === 'pending').length;

  // Calculate average response time (mock for now - would need actual timestamps)
  const avgResponseTime = '12';

  const kpiData = [
    {
      title: 'Total Reports',
      value: totalReports.toString(),
      change: '+12.5%',
      trend: 'up',
      icon: 'ri-file-list-3-line'
    },
    {
      title: 'Resolution Rate',
      value: `${resolutionRate}%`,
      change: '+2.1%',
      trend: 'up',
      icon: 'ri-checkbox-circle-line'
    },
    {
      title: 'Avg Response Time',
      value: `${avgResponseTime} min`,
      change: '-0.8 min',
      trend: 'down',
      icon: 'ri-time-line'
    },
    {
      title: 'Active Cases',
      value: activeIncidents.toString(),
      change: '-5',
      trend: 'down',
      icon: 'ri-alert-line'
    }
  ];

  // Calculate monthly trends from real data
  const getMonthlyData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlyStats: any = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      monthlyStats[monthIndex] = { month: monthNames[monthIndex], reports: 0, resolved: 0 };
    }

    // Count filtered incidents by month
    filteredIncidents.forEach(incident => {
      const incidentMonth = new Date(incident.createdAt).getMonth();
      if (monthlyStats[incidentMonth]) {
        monthlyStats[incidentMonth].reports++;
        if (incident.status === 'resolved') {
          monthlyStats[incidentMonth].resolved++;
        }
      }
    });

    return Object.values(monthlyStats);
  };

  const monthlyData = getMonthlyData();

  // Calculate severity distribution from filtered data
  const criticalCount = filteredIncidents.filter(i => i.severity === 'critical').length;
  const highCount = filteredIncidents.filter(i => i.severity === 'high').length;
  const mediumCount = filteredIncidents.filter(i => i.severity === 'medium').length;
  const lowCount = filteredIncidents.filter(i => i.severity === 'low').length;

  const severityData = [
    { level: 'Critical', count: criticalCount, color: 'bg-red-500' },
    { level: 'High', count: highCount, color: 'bg-orange-500' },
    { level: 'Medium', count: mediumCount, color: 'bg-yellow-500' },
    { level: 'Low', count: lowCount, color: 'bg-green-500' }
  ];

  // Calculate incident hotspots from filtered location data
  const getHotspots = () => {
    const locationMap: any = {};
    
    filteredIncidents.forEach(incident => {
      const location = incident.location || 'Unknown Location';
      if (!locationMap[location]) {
        locationMap[location] = {
          location,
          incidents: 0,
          lat: incident.coordinates?.lat || 0,
          lng: incident.coordinates?.lng || 0
        };
      }
      locationMap[location].incidents++;
    });

    return Object.values(locationMap)
      .sort((a: any, b: any) => b.incidents - a.incidents)
      .slice(0, 5);
  };

  const hotspots = getHotspots();

  // Calculate top performers from filtered responder data
  const getTopResponders = () => {
    const responderStats: any = {};

    filteredIncidents.forEach(incident => {
      if (incident.responderAssigned) {
        const responderId = incident.responderAssigned._id || incident.responderAssigned;
        if (!responderStats[responderId]) {
          responderStats[responderId] = {
            name: incident.responderAssigned.name || 'Unknown',
            cases: 0,
            rating: 4.5 + Math.random() * 0.5, // Mock rating
            department: incident.responderAssigned.type ? 
              (incident.responderAssigned.type === 'police' ? 'Police' :
               incident.responderAssigned.type === 'ambulance' ? 'Medical' : 'Fire Dept') : 'Unknown'
          };
        }
        responderStats[responderId].cases++;
      }
    });

    return Object.values(responderStats)
      .sort((a: any, b: any) => b.cases - a.cases)
      .slice(0, 5);
  };

  const topResponders = getTopResponders();

  // Calculate response time by hour from filtered data
  const getResponseTimeData = () => {
    const hourlyData: any = {};
    
    // Initialize 6 time slots
    const timeSlots = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    timeSlots.forEach(slot => {
      hourlyData[slot] = { hour: slot, time: 0, count: 0 };
    });

    filteredIncidents.forEach(incident => {
      const hour = new Date(incident.createdAt).getHours();
      const slot = timeSlots[Math.floor(hour / 4)];
      if (hourlyData[slot]) {
        // Mock calculation - would need actual response time data
        hourlyData[slot].time += 5 + Math.random() * 3;
        hourlyData[slot].count++;
      }
    });

    return timeSlots.map(slot => ({
      hour: slot,
      time: hourlyData[slot].count > 0 ? 
        (hourlyData[slot].time / hourlyData[slot].count).toFixed(1) : 
        (5 + Math.random() * 2).toFixed(1)
    }));
  };

  const responseTimeData = getResponseTimeData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
            <p className="text-gray-600 mt-4">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights and performance metrics</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <Button variant="outline" className="whitespace-nowrap" onClick={handleExportData}>
              <i className="ri-download-line mr-2"></i>
              Export Data
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  <div className={`flex items-center mt-2 text-sm ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <i className={`${kpi.trend === 'up' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i>
                    {kpi.change}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center`}>
                  <i className={`${kpi.icon} text-blue-600 text-xl`}></i>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  Reports
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                  Resolved
                </div>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.map((data: any, index: number) => {
                const maxReports = Math.max(...monthlyData.map((d: any) => d.reports), 1);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col gap-1 mb-2">
                      <div 
                        className="bg-blue-500 rounded-t"
                        style={{ height: `${(data.reports / maxReports) * 200}px` }}
                      ></div>
                      <div 
                        className="bg-green-500 rounded-b"
                        style={{ height: `${(data.resolved / maxReports) * 200}px` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{data.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Severity Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Incident Severity Distribution</h3>
            
            <div className="space-y-4">
              {severityData.map((item, index) => {
                const maxCount = Math.max(...severityData.map(d => d.count), 1);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded ${item.color} mr-3`}></div>
                      <span className="text-gray-700">{item.level}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Response Time Analysis */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Response Time Analysis</h3>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="response-time">Response Time</option>
              <option value="resolution-time">Resolution Time</option>
              <option value="arrival-time">Arrival Time</option>
            </select>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-4">
            {responseTimeData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t w-full"
                  style={{ height: `${(data.time / 7) * 150}px` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{data.hour}</span>
                <span className="text-xs font-medium text-gray-900">{data.time}m</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Incident Hotspots */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Incident Hotspots</h3>
              <Button variant="outline" size="sm">
                <i className="ri-map-2-line mr-2"></i>
                View Heatmap
              </Button>
            </div>
            
            <div className="space-y-4">
              {hotspots.map((spot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{spot.location}</p>
                      <p className="text-sm text-gray-600">{spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{spot.incidents}</p>
                    <p className="text-sm text-gray-600">incidents</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Performers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
              <Button variant="outline" size="sm">
                <i className="ri-trophy-line mr-2"></i>
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {topResponders.map((responder, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold">{responder.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{responder.name}</p>
                      <p className="text-sm text-gray-600">{responder.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center mb-1">
                      <i className="ri-star-fill text-yellow-400 text-sm mr-1"></i>
                      <span className="text-sm font-medium">{responder.rating}</span>
                    </div>
                    <p className="text-sm text-gray-600">{responder.cases} cases</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Insights Section */}
        <Card className="p-6 mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i className="ri-brain-line text-blue-600 text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <i className="ri-lightbulb-line text-blue-600 mr-2 mt-1"></i>
                  <p className="text-gray-700">Response times are 15% faster during night shifts. Consider optimizing day shift protocols.</p>
                </div>
                <div className="flex items-start">
                  <i className="ri-lightbulb-line text-blue-600 mr-2 mt-1"></i>
                  <p className="text-gray-700">Downtown District shows recurring patterns on weekends. Recommend increased patrol presence.</p>
                </div>
                <div className="flex items-start">
                  <i className="ri-lightbulb-line text-blue-600 mr-2 mt-1"></i>
                  <p className="text-gray-700">Medical emergency response could benefit from additional training in residential areas.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
