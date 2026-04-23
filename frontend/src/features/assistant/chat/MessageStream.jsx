import React, { Suspense } from 'react';

const ChatMessageItem = React.lazy(() => import('./ChatMessageItem'));

const MessageStream = React.memo(({
    canLoadOlderMessages,
    hiddenMessageCount,
    onLoadOlderMessages,
    messageWindowStep,
    renderedMessages,
    visibleStartIndex,
    isTyping,
    onWidgetAction
}) => (
    <>
        {canLoadOlderMessages && (
            <div className="flex justify-center pt-1">
                <button
                    type="button"
                    onClick={onLoadOlderMessages}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-cyan-200/60 dark:border-cyan-200/20 bg-white/75 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:brightness-105 transition-all"
                >
                    Load {Math.min(messageWindowStep, hiddenMessageCount)} older message(s)
                </button>
            </div>
        )}

        <Suspense
            fallback={
                <div className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-4 chat-soft-panel backdrop-blur-sm text-sm text-slate-600 dark:text-slate-300">
                    Loading messages...
                </div>
            }
        >
            {renderedMessages.map((message, index) => (
                <ChatMessageItem
                    key={message.id || `message-${visibleStartIndex + index}`}
                    message={message}
                    onWidgetAction={onWidgetAction}
                />
            ))}
        </Suspense>

        {isTyping && (
            <div className="flex justify-start message-assistant">
                <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-4 chat-soft-panel backdrop-blur-sm">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full typing-dot"></div>
                            <div className="w-2.5 h-2.5 bg-violet-500 rounded-full typing-dot"></div>
                            <div className="w-2.5 h-2.5 bg-pink-500 rounded-full typing-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
), (previousProps, nextProps) => (
    previousProps.canLoadOlderMessages === nextProps.canLoadOlderMessages
    && previousProps.hiddenMessageCount === nextProps.hiddenMessageCount
    && previousProps.messageWindowStep === nextProps.messageWindowStep
    && previousProps.renderedMessages === nextProps.renderedMessages
    && previousProps.visibleStartIndex === nextProps.visibleStartIndex
    && previousProps.isTyping === nextProps.isTyping
    && previousProps.onWidgetAction === nextProps.onWidgetAction
    && previousProps.onLoadOlderMessages === nextProps.onLoadOlderMessages
));

MessageStream.displayName = 'MessageStream';

export default MessageStream;
