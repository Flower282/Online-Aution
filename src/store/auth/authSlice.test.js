import { createSlice } from '@reduxjs/toolkit';

// FAKE DATA FOR TESTING (no backend needed)
const FAKE_USERS = [
    {
        id: 1,
        email: 'test@test.com',
        password: '123456',
        user: {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            role: 'user'
        }
    },
    {
        id: 2,
        email: 'admin@test.com',
        password: 'admin123',
        user: {
            id: 2,
            name: 'Admin User',
            email: 'admin@test.com',
            role: 'admin'
        }
    }
];

// Mock async thunks for testing
export const checkAuth = () => async (dispatch) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user is saved in localStorage
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
        dispatch(checkAuthFulfilled(JSON.parse(savedUser)));
    } else {
        dispatch(checkAuthRejected());
    }
};

export const login = (credentials) => async (dispatch) => {
    dispatch(loginPending());

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user in fake data
    const foundUser = FAKE_USERS.find(
        u => u.email === credentials.email && u.password === credentials.password
    );

    if (foundUser) {
        localStorage.setItem('mockUser', JSON.stringify(foundUser.user));
        dispatch(loginFulfilled(foundUser.user));
    } else {
        dispatch(loginRejected('Email hoặc mật khẩu không đúng'));
    }
};

export const signup = (userData) => async (dispatch) => {
    dispatch(signupPending());

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if email already exists
    const emailExists = FAKE_USERS.some(u => u.email === userData.email);

    if (emailExists) {
        dispatch(signupRejected('Email đã tồn tại'));
    } else {
        // Create new user
        const newUser = {
            id: FAKE_USERS.length + 1,
            name: userData.name,
            email: userData.email,
            role: 'user'
        };

        localStorage.setItem('mockUser', JSON.stringify(newUser));
        dispatch(signupFulfilled(newUser));
    }
};

export const logout = () => async (dispatch) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    localStorage.removeItem('mockUser');
    dispatch(logoutFulfilled());
};

// Initial state
const initialState = {
    user: null,
    loading: false,
    error: null,
};

// Auth slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // checkAuth
        checkAuthFulfilled: (state, action) => {
            state.user = action.payload;
            state.loading = false;
            state.error = null;
        },
        checkAuthRejected: (state) => {
            state.user = null;
            state.loading = false;
            state.error = null;
        },

        // login
        loginPending: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginFulfilled: (state, action) => {
            state.user = action.payload;
            state.loading = false;
            state.error = null;
        },
        loginRejected: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // signup
        signupPending: (state) => {
            state.loading = true;
            state.error = null;
        },
        signupFulfilled: (state, action) => {
            state.user = action.payload;
            state.loading = false;
            state.error = null;
        },
        signupRejected: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // logout
        logoutFulfilled: (state) => {
            state.user = null;
            state.loading = false;
            state.error = null;
        },
    },
});

export const {
    checkAuthFulfilled,
    checkAuthRejected,
    loginPending,
    loginFulfilled,
    loginRejected,
    signupPending,
    signupFulfilled,
    signupRejected,
    logoutFulfilled,
} = authSlice.actions;

export default authSlice.reducer;

