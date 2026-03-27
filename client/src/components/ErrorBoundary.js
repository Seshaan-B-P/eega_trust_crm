import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full">
                        <div className="flex items-center mb-6">
                            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">Something went wrong</h1>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-800 font-mono overflow-auto max-h-64">
                            <p className="font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
