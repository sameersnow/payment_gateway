import { Outlet, NavLink } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';

export function DevelopersLayout() {
    const tabs = [
        { name: 'Documentation', path: '/developers/documentation' },
        { name: 'API Keys', path: '/developers/api-keys' },
        { name: 'IP Whitelist', path: '/developers/ip-whitelist' },
        { name: 'Webhooks', path: '/developers/webhooks' },
        { name: 'Logs', path: '/developers/logs' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Developers</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your API integration and monitor events
                    </p>
                </div>

                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) => `
                px-4 py-2 text-sm font-medium rounded-md transition-all duration-150
                ${isActive
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }
              `}
                        >
                            {tab.name}
                        </NavLink>
                    ))}
                </div>

                <Outlet />
            </div>
        </DashboardLayout>
    );
}
