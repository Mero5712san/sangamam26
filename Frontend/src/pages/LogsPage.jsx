import React from 'react';

export function LogsPage() {
    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sangamam-gold">Admin Area</p>
                <h1 className="mt-2 text-4xl font-bold text-sangamam-maroon">Audit Logs</h1>
                <p className="mt-2 text-gray-600">Review activity history and system events.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-sangamam-border bg-white shadow-sm">
                <table className="w-full">
                    <thead className="bg-sangamam-light-bg">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-sangamam-maroon">User</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-sangamam-maroon">Action</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-sangamam-maroon">Timestamp</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-sangamam-maroon">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sangamam-border">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <tr key={i} className="hover:bg-sangamam-light-bg transition">
                                <td className="px-6 py-4 text-gray-700">User {i}</td>
                                <td className="px-6 py-4 text-gray-700">Registered for Event</td>
                                <td className="px-6 py-4 text-gray-700">2024-05-{10 + i} 10:30 AM</td>
                                <td className="px-6 py-4 font-semibold text-green-700">Success</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
