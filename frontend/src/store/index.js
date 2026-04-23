import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import mtssReducer from './slices/mtssSlice';
import aiChatReducer from './slices/aiChatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        mtss: mtssReducer,
        aiChat: aiChatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});
