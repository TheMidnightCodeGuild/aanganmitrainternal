import React from 'react';

const cardStyle = {
  padding: '1.5rem',
  backgroundColor: '#f5f5f5',
  borderRadius: '10px',
  width: '200px',
  textAlign: 'center',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
};

const DashboardCard = ({ title, count }) => {
  return (
    <div style={cardStyle}>
      <h3>{title}</h3>
      <p style={{ fontSize: '2rem', margin: 0 }}>{count}</p>
    </div>
  );
};

export default DashboardCard;