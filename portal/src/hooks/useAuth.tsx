// useAuth Hook
// Custom hook for authentication state management using frappe-react-sdk

import { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useFrappeAuth, useFrappeGetCall } from 'frappe-react-sdk';
import { authMethods } from '../services/methods';
import { UserContext } from '../types/models';

interface AuthContextType {
    user: UserContext | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => void;
}

// Backend response type
interface BackendUserContextResponse {
    user: {
        name: string;
        email: string;
        full_name: string;
        user_image?: string;
        roles: string[];
    };
    merchant?: any;
    app_name?: string;
    app_logo?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { currentUser, login: frappeLogin, logout: frappeLogout, isLoading: authLoading } = useFrappeAuth();
    const [loginError, setLoginError] = useState<string | null>(null);

    // Fetch user details when currentUser is available
    const {
        data: apiResponse,
        error: userError,
        isLoading: userLoading,
        mutate: refreshUserDetails
    } = useFrappeGetCall<{ message: BackendUserContextResponse }>(
        authMethods.getUserContext,
        undefined,
        currentUser ? ['user-context', currentUser] : null, // Only fetch if user is logged in
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
        }
    );

    // Transform backend response to application UserContext
    const userContext = useMemo<UserContext | null>(() => {
        // Need to handle the message wrapper from Frappe SDK
        const data = apiResponse?.message;

        if (!data) return null;

        const roles = data.user.roles || [];
        const isAdmin = roles.includes('Admin') || roles.includes('System Manager');
        const isMerchant = roles.includes('Merchant');

        return {
            user: data.user,
            merchant: data.merchant,
            isAdmin,
            isMerchant,
            appName: data.app_name,
            appLogo: data.app_logo
        };
    }, [apiResponse]);

    // Combine loading states - include authLoading from useFrappeAuth
    // This prevents redirect during page refresh while auth cookies are being checked
    const loading = authLoading || userLoading || (!userContext && !!currentUser);

    // Handle login
    const login = async (email: string, password: string): Promise<void> => {
        try {
            setLoginError(null);
            await frappeLogin({ username: email, password });
            // User details will be fetched automatically via useFrappeGetCall
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setLoginError(message);
            throw err;
        }
    };

    // Handle logout
    const logout = async () => {
        try {
            await frappeLogout();
            // Clear user details cache
            refreshUserDetails();
        } catch (err) {
            console.error('Logout failed:', err);
            throw err;
        }
    };

    // Refresh user data
    const refreshUser = () => {
        refreshUserDetails();
    };

    // Combine errors
    const error = loginError || (userError ? userError.message : null);

    return (
        <AuthContext.Provider
            value={{
                user: userContext,
                loading,
                error,
                login,
                logout,
                refreshUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
