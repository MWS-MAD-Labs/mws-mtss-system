import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const markdownSanitizeSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'u', 'ins', 'mark'],
    attributes: {
        ...(defaultSchema.attributes || {}),
        a: [...((defaultSchema.attributes && defaultSchema.attributes.a) || []), 'target', 'rel'],
        code: [...((defaultSchema.attributes && defaultSchema.attributes.code) || []), 'className']
    }
};

const MarkdownRenderer = ({ content, isUser }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
            rehypeRaw,
            [rehypeSanitize, markdownSanitizeSchema]
        ]}
        components={{
            p: ({ children, ...props }) => (
                <p className="my-1 whitespace-pre-wrap leading-relaxed" {...props}>{children}</p>
            ),
            strong: ({ children, ...props }) => (
                <strong className="font-bold" {...props}>{children}</strong>
            ),
            em: ({ children, ...props }) => (
                <em className="italic" {...props}>{children}</em>
            ),
            u: ({ children, ...props }) => (
                <u className="underline underline-offset-2" {...props}>{children}</u>
            ),
            table: ({ children, ...props }) => (
                <div className={`my-3 overflow-x-auto rounded-xl border ${isUser ? 'border-white/35 bg-white/12' : 'border-slate-200/80 dark:border-white/12 bg-white/70 dark:bg-slate-900/35'}`}>
                    <table className="min-w-full border-separate border-spacing-0 text-[12px] sm:text-sm leading-relaxed" {...props}>
                        {children}
                    </table>
                </div>
            ),
            thead: ({ children, ...props }) => (
                <thead className={isUser ? 'bg-white/20' : 'bg-slate-100/90 dark:bg-slate-800/80'} {...props}>{children}</thead>
            ),
            tbody: ({ children, ...props }) => (
                <tbody className={isUser ? 'bg-transparent' : 'bg-white/75 dark:bg-slate-900/20'} {...props}>{children}</tbody>
            ),
            tr: ({ children, ...props }) => (
                <tr className={isUser ? 'border-b border-white/20' : 'border-b border-slate-200/70 dark:border-white/10 odd:bg-white/60 dark:odd:bg-white/[0.03]'} {...props}>{children}</tr>
            ),
            th: ({ children, ...props }) => (
                <th className={`px-3 py-2 text-left font-semibold align-top border-b ${isUser ? 'text-white border-white/25' : 'text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-white/12'}`} {...props}>
                    {children}
                </th>
            ),
            td: ({ children, ...props }) => (
                <td className={`px-3 py-2 align-top whitespace-pre-line break-words border-b ${isUser ? 'text-white/95 border-white/15' : 'text-slate-800 dark:text-slate-100 border-slate-200/70 dark:border-white/10'}`} {...props}>
                    {children}
                </td>
            ),
            ul: ({ children, ...props }) => (
                <ul className="list-disc pl-5 my-2 space-y-1" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }) => (
                <ol className="list-decimal pl-5 my-2 space-y-1" {...props}>{children}</ol>
            ),
            li: ({ children, ...props }) => (
                <li className="leading-relaxed" {...props}>{children}</li>
            ),
            blockquote: ({ children, ...props }) => (
                <blockquote
                    className={`my-2 pl-3 border-l-2 ${isUser ? 'border-white/60 text-white/95' : 'border-violet-300/50 text-gray-700 dark:text-gray-200'}`}
                    {...props}
                >
                    {children}
                </blockquote>
            ),
            h1: ({ children, ...props }) => (
                <h1 className="text-lg sm:text-xl font-bold mt-2 mb-1" {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }) => (
                <h2 className="text-base sm:text-lg font-bold mt-2 mb-1" {...props}>{children}</h2>
            ),
            h3: ({ children, ...props }) => (
                <h3 className="text-sm sm:text-base font-semibold mt-2 mb-1" {...props}>{children}</h3>
            ),
            a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>
            ),
            code: ({ inline, children, ...props }) => (
                inline ? (
                    <code className={`px-1 py-0.5 rounded ${isUser ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`} {...props}>
                        {children}
                    </code>
                ) : (
                    <code className={`block my-2 p-2.5 rounded-xl whitespace-pre-wrap text-[12px] sm:text-[13px] leading-relaxed ${isUser ? 'bg-white/18 text-white' : 'bg-black/10 dark:bg-white/8'}`} {...props}>
                        {children}
                    </code>
                )
            ),
            hr: () => (
                <hr className={`my-2 ${isUser ? 'border-white/35' : 'border-gray-300/60 dark:border-white/15'}`} />
            )
        }}
    >
        {content}
    </ReactMarkdown>
);

export default MarkdownRenderer;
