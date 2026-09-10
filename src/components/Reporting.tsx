
// This file is deprecated. Please use src/views/Reporting.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const Reporting: React.FC = () => {
    return <Navigate to="/reporting" replace />;
};

export default Reporting;
