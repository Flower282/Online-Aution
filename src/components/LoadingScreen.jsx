const LoadingScreen = () => {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;

