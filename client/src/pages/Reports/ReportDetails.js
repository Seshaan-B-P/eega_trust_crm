import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';

const ReportDetails = () => {
    const { id } = useParams();
    
    return (
        <div className="p-6">
            <div className="mb-8">
                <Link to="/reports" className="flex items-center text-blue-600 hover:text-blue-800">
                    <FiChevronLeft className="mr-1" />
                    Back to Reports
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 mt-4">Report Details</h1>
                <p className="text-gray-600">Viewing report ID: {id}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Report Details Page</h2>
                <p className="text-gray-600">This page is under construction.</p>
            </div>
        </div>
    );
};

export default ReportDetails;