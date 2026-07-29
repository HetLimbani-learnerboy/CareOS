import React from 'react';

const ApiDocs = () => {
    return (
        <div className="w-full h-screen">
            <iframe
                src="/api-doc.html"
                title="CareOS API Documentation"
                className="w-full h-full border-none"
            />
        </div>
    );
};

export default ApiDocs;