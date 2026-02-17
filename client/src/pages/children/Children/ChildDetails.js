import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';

const ChildDetails = () => {
    const { id } = useParams();
    
    return (
        <div className="p-6">
            <div className="mb-8">
                <Link to="/children" className="flex items-center text-blue-600 hover:text-blue-800">
                    <FiChevronLeft className="mr-1" />
                    Back to Children
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 mt-4">Child Details</h1>
                <p className="text-gray-600">Viewing details for child ID: {id}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-blue-600">C</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Child Details Page</h2>
                <p className="text-gray-600 mb-6">This page is under construction. Please check back later.</p>
                <Link 
                    to="/children" 
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Back to Children List
                </Link>
            </div>
        </div>
    );
};

export default ChildDetails;