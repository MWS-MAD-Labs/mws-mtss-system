import { sanitizeText } from './utils';

// ============= UTILITY: INPUT SANITIZATION =============
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return sanitizeText(input);
};

// ============= PSYCHOLOGICAL ANALYSIS ENGINE =============
export const generateAnalysis = (data) => {
    const { emotions = [], presenceLevel = 5, capacityLevel = 5, weatherValue = "partly-cloudy" } = data;

    const positiveEmotions = ["Happy", "Excited", "Hopeful", "Calm"];
    const negativeEmotions = ["Sad", "Anxious", "Lonely", "Angry", "Fear", "Overwhelmed"];
    const neutralEmotions = ["Tired", "Hungry", "Bored", "Scattered"];

    const positiveCount = emotions.filter(e => positiveEmotions.includes(e)).length;
    const negativeCount = emotions.filter(e => negativeEmotions.includes(e)).length;
    const neutralCount = emotions.filter(e => neutralEmotions.includes(e)).length;

    let emotionalState = "balanced";
    if (positiveCount > negativeCount + 1) emotionalState = "positive";
    else if (negativeCount > positiveCount + 1) emotionalState = "challenging";
    else if (neutralCount > 2) emotionalState = "depleted";

    let presenceState = "moderate";
    if (presenceLevel >= 8) presenceState = "high";
    else if (presenceLevel <= 4) presenceState = "low";

    let capacityState = "moderate";
    if (capacityLevel >= 8) capacityState = "high";
    else if (capacityLevel <= 4) capacityState = "low";

    return {
        emotionalState,
        presenceState,
        capacityState,
        weatherValue,
        needsSupport: negativeCount >= 2 || capacityLevel <= 3 || presenceLevel <= 3
    };
};

// ============= RECOMMENDATION GENERATOR =============
export const generateRecommendations = (analysis, data) => {
    const recommendations = [];

    // Based on emotional state
    if (analysis.emotionalState === "positive") {
        recommendations.push({
            icon: "Heart",
            title: "Amplify Your Momentum",
            description: "Your positive energy is a powerful resource. Channel it into meaningful projects and share it with your colleagues.",
            color: "from-emerald/20 to-emerald/10",
            borderColor: "border-emerald/20",
            priority: "medium"
        });
    } else if (analysis.emotionalState === "challenging") {
        recommendations.push({
            icon: "Shield",
            title: "Emotional Support Priority",
            description: "You're experiencing difficult emotions. Reach out to your wellness team today. Professional support can make a significant difference.",
            color: "from-accent/20 to-accent/10",
            borderColor: "border-accent/30",
            priority: "high"
        });
    }

    // Based on presence level
    if (analysis.presenceState === "low") {
        recommendations.push({
            icon: "Brain",
            title: "Grounding Techniques",
            description: "Your attention is scattered. Try the 5-4-3-2-1 sensory awareness exercise to reconnect with the present moment.",
            color: "from-primary/20 to-primary/10",
            borderColor: "border-primary/20",
            priority: "high"
        });
    } else if (analysis.presenceState === "high") {
        recommendations.push({
            icon: "Target",
            title: "Optimize Focus Time",
            description: "You're highly present. This is ideal for tackling complex tasks that require deep concentration.",
            color: "from-gold/20 to-gold/10",
            borderColor: "border-gold/20",
            priority: "medium"
        });
    }

    // Based on capacity level
    if (analysis.capacityState === "low") {
        recommendations.push({
            icon: "Battery",
            title: "Rest & Recovery",
            description: "Your capacity is depleted. Schedule breaks, delegate tasks, and prioritize sleep. Recovery isn't optional—it's essential.",
            color: "from-maroon/20 to-maroon/10",
            borderColor: "border-maroon/20",
            priority: "high"
        });
    } else if (analysis.capacityState === "high") {
        recommendations.push({
            icon: "TrendingUp",
            title: "Strategic Growth",
            description: "You have capacity for new challenges. Consider taking on a stretch project that aligns with your development goals.",
            color: "from-emerald/20 to-emerald/10",
            borderColor: "border-emerald/20",
            priority: "low"
        });
    }

    // Always include mindfulness
    recommendations.push({
        icon: "Sparkles",
        title: "Daily Mindfulness",
        description: "Maintain emotional awareness with 5-minute check-ins throughout your day. Small practices create lasting change.",
        color: "from-primary/20 to-primary/10",
        borderColor: "border-primary/20",
        priority: "medium"
    });

    // Top-up to minimum 4 items with a small pool (no duplicates by title)
    const pool = [
        {
            icon: "Target",
            title: "One-Task Focus",
            description: "Pick one small task and complete it end-to-end to rebuild momentum.",
            color: "from-primary/20 to-primary/10",
            borderColor: "border-primary/20",
            priority: "low"
        },
        {
            icon: "Heart",
            title: "Connect Briefly",
            description: "Send a quick message to someone you trust. A 60-second connection helps regulate emotions.",
            color: "from-emerald/20 to-emerald/10",
            borderColor: "border-emerald/20",
            priority: "medium"
        },
        {
            icon: "Battery",
            title: "Micro Break",
            description: "Stand, stretch shoulders/neck, hydrate. Two minutes can meaningfully restore capacity.",
            color: "from-emerald/20 to-emerald/10",
            borderColor: "border-emerald/20",
            priority: "medium"
        }
    ];

    const existingTitles = new Set(recommendations.map(r => r.title));
    for (const item of pool) {
        if (recommendations.length >= 4) break;
        if (!existingTitles.has(item.title)) {
            recommendations.push(item);
            existingTitles.add(item.title);
        }
    }

    return recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    }).slice(0, 4);
};
