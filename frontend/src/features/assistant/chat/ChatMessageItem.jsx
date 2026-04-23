import React from 'react';
import MessageBubble from './MessageBubble';

const TIME_FORMATTER = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
});

const formatMessageTime = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return TIME_FORMATTER.format(parsed);
};

const ChatMessageItem = React.memo(({ message, onWidgetAction }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isUser ? 'message-user' : 'message-assistant'}`}>
            <div className={isUser ? 'max-w-[85%] sm:max-w-[74%]' : 'max-w-[95%] sm:max-w-[88%]'}>
                <MessageBubble
                    message={message}
                    isUser={isUser}
                    onWidgetAction={onWidgetAction}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-2">
                    {formatMessageTime(message.timestamp)}
                </p>
            </div>
        </div>
    );
}, (previousProps, nextProps) => (
    previousProps.message === nextProps.message
    && previousProps.onWidgetAction === nextProps.onWidgetAction
));

ChatMessageItem.displayName = 'ChatMessageItem';

export default ChatMessageItem;
