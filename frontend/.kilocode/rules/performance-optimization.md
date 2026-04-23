## Brief overview
This set of guidelines is project-specific to the MWS APP, focusing on optimizing React components for performance while maintaining visual fidelity. Key emphasis on code splitting, lazy loading, bundle analysis, and limiting file sizes to under 200 lines to prevent performance bottlenecks.

## Performance optimization
- Prioritize lazy loading for components and assets to reduce initial bundle size and GPU usage.
- Implement code splitting for large components, breaking them into smaller, loadable chunks.
- Use React memoization (memo, useCallback) to minimize unnecessary re-renders.
- Optimize animations and interactive elements for smoothness without increasing resource consumption.
- Conduct bundle analysis to identify and eliminate redundancies in JSX structure and CSS.

## Code structure
- Limit each file to a maximum of 200 lines to avoid creating performance-heavy "monster" files.
- Break large components into smaller sections, sub-components, or functions for better modularity and load times.
- Ensure components remain mobile-friendly and responsive without adding extra resource overhead.

## Visual fidelity
- Maintain exact visual presentation and layout during optimizations.
- Preserve accessibility and responsiveness best practices without increasing bundle size.

## Development workflow
- Analyze JSX for inefficiencies before refactoring.
- Test performance improvements on mobile devices to ensure lightweight user experience.
- Use tools for bundle analysis and lazy loading optimization as part of the development process.