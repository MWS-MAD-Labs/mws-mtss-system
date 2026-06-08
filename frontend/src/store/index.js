import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import mtssReducer from './slices/mtssSlice';
import aiChatReducer from './slices/aiChatSlice';
import checkinReducer from './slices/checkinSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        mtss: mtssReducer,
        aiChat: aiChatReducer,
        // Registered for the shared ProfilePage, which reads state.checkin.
        // Check-in thunks degrade gracefully (rejected) since the MTSS backend
        // does not expose check-in endpoints.
        checkin: checkinReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});
