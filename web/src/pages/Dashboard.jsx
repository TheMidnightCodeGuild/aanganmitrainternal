import React from 'react';
import DashboardCard from '../components/DashboardCard';

const Dashboard = () => {
  const stats = {
    properties: 12,
    clients: 5,
    tasks: 21,
    openList: 2,
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dashboard</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <DashboardCard title="Properties" count={stats.properties} />
        <DashboardCard title="Clients" count={stats.clients} />
        <DashboardCard title="Tasks" count={stats.tasks} />
        <DashboardCard title="Open List" count={stats.openList} />
      </div>
    </div>
  );
};

export default Dashboard;