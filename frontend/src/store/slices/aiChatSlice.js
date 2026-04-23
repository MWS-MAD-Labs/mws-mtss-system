import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as aiChatService from '@/services/aiChatService';
import { normalizeAssistantWidgets } from '@/features/assistant/runtime/responseValidator';

// Async thunks for API calls
export const sendMessage = createAsyncThunk(
    'aiChat/sendMessage',
    async ({ message, sessionId }, { rejectWithValue }) => {
        try {
            const response = await aiChatService.sendChatMessage(message, sessionId);
            if (response.success) {
                return response.data;
            }
            return rejectWithValue('Failed to send message');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const loadConversations = createAsyncThunk(
    'aiChat/loadConversations',
    async (_, { rejectWithValue }) => {
        try {
            const conversations = await aiChatService.getUserConversations();
            return conversations;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const loadConversationHistory = createAsyncThunk(
    'aiChat/loadConversationHistory',
    async ({ sessionId, limit = 120 }, { rejectWithValue }) => {
        try {
            const history = await aiChatService.getConversationHistory(sessionId, limit);
            return history;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const startNewConversation = createAsyncThunk(
    'aiChat/startNewConversation',
    async (_, { rejectWithValue }) => {
        try {
            const result = await aiChatService.startNewConversation();
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const loadAssistantProfile = createAsyncThunk(
    'aiChat/loadAssistantProfile',
    async (_, { rejectWithValue }) => {
        try {
            const result = await aiChatService.getAssistantProfile();
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const saveAssistantProfile = createAsyncThunk(
    'aiChat/saveAssistantProfile',
    async (payload, { rejectWithValue }) => {
        try {
            const result = await aiChatService.updateAssistantProfile(payload);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// AI Buddy expressions based on message sentiment
const BUDDY_EXPRESSIONS = {
    idle: '😊',
    thinking: '🤔',
    happy: '😄',
    excited: '🤩',
    explaining: '👨‍🏫',
    celebrating: '🎉',
    encouraging: '💪',
    listening: '👂',
    sad: '😔',
    confused: '😕'
};

// Detect expression from message content
const detectExpression = (message) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('great') || lowerMsg.includes('bagus') || lowerMsg.includes('keren')) {
        return 'celebrating';
    }
    if (lowerMsg.includes('help') || lowerMsg.includes('bantu') || lowerMsg.includes('explain') || lowerMsg.includes('jelasin')) {
        return 'explaining';
    }
    if (lowerMsg.includes('?')) {
        return 'thinking';
    }
    if (lowerMsg.includes('sad') || lowerMsg.includes('sedih') || lowerMsg.includes('stress')) {
        return 'encouraging';
    }
    if (lowerMsg.includes('!')) {
        return 'excited';
    }

    return 'happy';
};

const normalizeWidgets = (widgets) => normalizeAssistantWidgets(widgets);

const initialState = {
    // Current session
    sessionId: null,
    messages: [],

    // AI Buddy state
    buddyExpression: BUDDY_EXPRESSIONS.idle,
    buddyAnimation: 'idle', // idle, bounce, wave, nod, celebrate

    // Conversations list
    conversations: [],
    conversationsLoading: false,
    historyLoading: false,
    assistantProfile: null,
    assistantLoading: false,
    assistantSaving: false,

    // UI state
    isLoading: false,
    isTyping: false,
    inputValue: '',

    // Settings
    soundEnabled: false, // Default off untuk performance
    hapticEnabled: false,

    // Performance optimization
    messageCache: {}, // Cache untuk prevent re-renders
    lastMessageTime: null,

    // Error handling
    error: null
};

const aiChatSlice = createSlice({
    name: 'aiChat',
    initialState,
    reducers: {
        // User input
        setInputValue: (state, action) => {
            state.inputValue = action.payload;
        },

        // Add user message (optimistic update)
        addUserMessage: (state, action) => {
            const message = {
                role: 'user',
                content: action.payload,
                timestamp: new Date().toISOString(),
                id: `user_${Date.now()}`
            };
            state.messages.push(message);
            state.inputValue = '';
            state.isTyping = true;
            state.buddyExpression = BUDDY_EXPRESSIONS.thinking;
            state.buddyAnimation = 'nod';
            state.lastMessageTime = Date.now();
        },

        // Add AI message
        addAIMessage: (state, action) => {
            const message = {
                role: 'assistant',
                content: action.payload.content,
                timestamp: new Date().toISOString(),
                id: `ai_${Date.now()}`,
                expression: detectExpression(action.payload.content),
                widgets: normalizeWidgets(action.payload.widgets)
            };
            state.messages.push(message);
            state.isTyping = false;
            state.buddyExpression = BUDDY_EXPRESSIONS[message.expression] || BUDDY_EXPRESSIONS.happy;
            state.buddyAnimation = message.expression === 'celebrating' ? 'celebrate' : 'bounce';
        },

        // Set typing state
        setTyping: (state, action) => {
            state.isTyping = action.payload;
            if (action.payload) {
                state.buddyExpression = BUDDY_EXPRESSIONS.thinking;
                state.buddyAnimation = 'nod';
            }
        },

        // Buddy actions
        setBuddyExpression: (state, action) => {
            state.buddyExpression = BUDDY_EXPRESSIONS[action.payload] || BUDDY_EXPRESSIONS.idle;
        },

        setBuddyAnimation: (state, action) => {
            state.buddyAnimation = action.payload;
        },

        // Reset buddy to idle after animation
        resetBuddyToIdle: (state) => {
            state.buddyExpression = BUDDY_EXPRESSIONS.idle;
            state.buddyAnimation = 'idle';
        },

        // Clear messages (new chat)
        clearMessages: (state) => {
            state.messages = [];
            state.sessionId = null;
            state.buddyExpression = BUDDY_EXPRESSIONS.idle;
            state.buddyAnimation = 'wave';
        },

        // Settings
        toggleSound: (state) => {
            state.soundEnabled = !state.soundEnabled;
        },

        toggleHaptic: (state) => {
            state.hapticEnabled = !state.hapticEnabled;
        },

        // Error handling
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Send message
        builder
            .addCase(sendMessage.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isTyping = false;

                if (action.payload.sessionId && !state.sessionId) {
                    state.sessionId = action.payload.sessionId;
                }

                // AI response is added via addAIMessage action
                const aiMessage = {
                    role: 'assistant',
                    content: action.payload.message,
                    timestamp: new Date().toISOString(),
                    id: `ai_${Date.now()}`,
                    expression: detectExpression(action.payload.message),
                    widgets: normalizeWidgets(action.payload.uiWidgets)
                };
                state.messages.push(aiMessage);
                state.buddyExpression = BUDDY_EXPRESSIONS[aiMessage.expression] || BUDDY_EXPRESSIONS.happy;
                state.buddyAnimation = aiMessage.expression === 'celebrating' ? 'celebrate' : 'bounce';

                const assistantContext = action.payload?.context?.assistant;
                if (assistantContext) {
                    state.assistantProfile = {
                        ...(state.assistantProfile || {}),
                        assistant: {
                            ...(state.assistantProfile?.assistant || {}),
                            assistantName: assistantContext.name || state.assistantProfile?.assistant?.assistantName || 'Nova',
                            daily: {
                                ...(state.assistantProfile?.assistant?.daily || {}),
                                quickActions: assistantContext.quickActions || state.assistantProfile?.assistant?.daily?.quickActions || []
                            }
                        }
                    };
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isLoading = false;
                state.isTyping = false;
                state.error = action.payload;
                state.buddyExpression = BUDDY_EXPRESSIONS.confused;

                // Add error message
                state.messages.push({
                    role: 'assistant',
                    content: "Sorry, I'm having some technical issues right now. Please try asking again! 😊",
                    timestamp: new Date().toISOString(),
                    id: `error_${Date.now()}`,
                    isError: true
                });
            });

        // Load conversations
        builder
            .addCase(loadConversations.pending, (state) => {
                state.conversationsLoading = true;
            })
            .addCase(loadConversations.fulfilled, (state, action) => {
                state.conversationsLoading = false;
                state.conversations = action.payload;
            })
            .addCase(loadConversations.rejected, (state) => {
                state.conversationsLoading = false;
            });

        // Load conversation history
        builder
            .addCase(loadConversationHistory.pending, (state) => {
                state.historyLoading = true;
                state.error = null;
            })
            .addCase(loadConversationHistory.fulfilled, (state, action) => {
                state.historyLoading = false;
                const payload = action.payload || {};
                const sessionId = payload.sessionId || action.meta?.arg?.sessionId || null;
                const messages = Array.isArray(payload.messages) ? payload.messages : [];

                state.sessionId = sessionId;
                state.messages = messages.map((msg, index) => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp || new Date().toISOString(),
                    id: `hist_${sessionId || 'session'}_${index}`,
                    widgets: normalizeWidgets(msg?.metadata?.uiWidgets || msg?.uiWidgets)
                }));
                state.isTyping = false;
            })
            .addCase(loadConversationHistory.rejected, (state, action) => {
                state.historyLoading = false;
                state.error = action.payload || 'Failed to load conversation history';
            });

        // Start new conversation
        builder
            .addCase(startNewConversation.fulfilled, (state, action) => {
                state.sessionId = action.payload.sessionId;
                state.messages = [];
                state.buddyExpression = BUDDY_EXPRESSIONS.excited;
                state.buddyAnimation = 'wave';
            });

        // Load assistant profile
        builder
            .addCase(loadAssistantProfile.pending, (state) => {
                state.assistantLoading = true;
            })
            .addCase(loadAssistantProfile.fulfilled, (state, action) => {
                state.assistantLoading = false;
                state.assistantProfile = action.payload || null;
            })
            .addCase(loadAssistantProfile.rejected, (state) => {
                state.assistantLoading = false;
            });

        // Save assistant profile
        builder
            .addCase(saveAssistantProfile.pending, (state) => {
                state.assistantSaving = true;
                state.error = null;
            })
            .addCase(saveAssistantProfile.fulfilled, (state, action) => {
                state.assistantSaving = false;
                state.assistantProfile = {
                    ...(state.assistantProfile || {}),
                    assistant: {
                        ...(state.assistantProfile?.assistant || {}),
                        ...(action.payload || {})
                    }
                };
            })
            .addCase(saveAssistantProfile.rejected, (state, action) => {
                state.assistantSaving = false;
                state.error = action.payload || 'Failed to save assistant profile';
            });
    }
});

export const {
    setInputValue,
    addUserMessage,
    addAIMessage,
    setTyping,
    setBuddyExpression,
    setBuddyAnimation,
    resetBuddyToIdle,
    clearMessages,
    toggleSound,
    toggleHaptic,
    clearError
} = aiChatSlice.actions;

// Selectors (memoized for performance)
export const selectMessages = (state) => state.aiChat.messages;
export const selectSessionId = (state) => state.aiChat.sessionId;
export const selectIsLoading = (state) => state.aiChat.isLoading;
export const selectIsTyping = (state) => state.aiChat.isTyping;
export const selectInputValue = (state) => state.aiChat.inputValue;
export const selectBuddyExpression = (state) => state.aiChat.buddyExpression;
export const selectBuddyAnimation = (state) => state.aiChat.buddyAnimation;
export const selectConversations = (state) => state.aiChat.conversations;
export const selectConversationsLoading = (state) => state.aiChat.conversationsLoading;
export const selectHistoryLoading = (state) => state.aiChat.historyLoading;
export const selectSoundEnabled = (state) => state.aiChat.soundEnabled;
export const selectError = (state) => state.aiChat.error;
export const selectAssistantProfile = (state) => state.aiChat.assistantProfile;
export const selectAssistantLoading = (state) => state.aiChat.assistantLoading;
export const selectAssistantSaving = (state) => state.aiChat.assistantSaving;

// Computed selectors
export const selectLastMessage = (state) => {
    const messages = state.aiChat.messages;
    return messages.length > 0 ? messages[messages.length - 1] : null;
};

export const selectMessageCount = (state) => state.aiChat.messages.length;

export default aiChatSlice.reducer;
