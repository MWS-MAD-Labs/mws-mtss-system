// Emotion database for AI face scan analysis
export const emotionDatabase = [
    {
        id: "genuine_happiness",
        detectedEmotion: "Genuine Happiness",
        confidence: 89,
        icon: "😊",
        weatherIcon: "☀️",
        internalWeather: "☀️ Sunny and Clear",
        weatherDesc: "Feeling upbeat, calm, and full of clarity",
        selfreportedEmotions: ["Happy", "Excited", "Hopeful", "Calm"],
        microExpressions: [
            "Crow's feet wrinkles (orbicularis oculi)",
            "Duchenne smile activation",
            "Elevated cheeks symmetrically",
            "Genuine eye crinkling"
        ],
        aiAnalysis: "Your facial microexpressions reveal authentic joy that cannot be consciously fabricated. The orbicularis oculi engagement confirms genuine happiness.",
        psychologicalInsight: "This authentic happiness pattern suggests strong psychological well-being and life satisfaction. The Duchenne smile correlates with genuine positive affect.",
        personalizedRecommendation: "Your elevated mood enhances cognitive performance by ~23% and boosts creative problem-solving. Channel this positive energy into collaborative work or meaningful projects.",
        presenceCapacity: { estimatedPresence: 8, estimatedCapacity: 7, reasoning: "High emotional clarity suggests strong present-moment awareness and available cognitive resources" },
        suggestedActions: ["Engage in collaborative tasks", "Share positive energy with team", "Document happiness triggers"]
    },
    {
        id: "focused_calm",
        detectedEmotion: "Focused Calm",
        confidence: 86,
        icon: "😌",
        weatherIcon: "⛅",
        internalWeather: "⛅ Partly Cloudy",
        weatherDesc: "Doing alright with mild clarity",
        selfreportedEmotions: ["Calm", "Hopeful"],
        microExpressions: ["Relaxed facial muscles", "Steady focused gaze", "Minimal tension indicators", "Balanced neutral expression"],
        aiAnalysis: "Your expression indicates an optimal cognitive-emotional state—the 'flow state' precursor where focus meets calm.",
        psychologicalInsight: "You're in a state of relaxed concentration, ideal for deep work and complex problem-solving.",
        personalizedRecommendation: "You're in an optimal state for deep focused work. Block time for your most important tasks while in this productive state.",
        presenceCapacity: { estimatedPresence: 9, estimatedCapacity: 8, reasoning: "Optimal emotional state indicates high presence and strong capacity for complex tasks" },
        suggestedActions: ["Block calendar for deep work", "Tackle complex tasks", "Minimize notifications"]
    },
    {
        id: "concealed_stress",
        detectedEmotion: "Concealed Stress",
        confidence: 82,
        icon: "😰",
        weatherIcon: "🌧️",
        internalWeather: "🌧️ Light Rain / Thunderstorms",
        weatherDesc: "Emotionally heavy with underlying tension",
        selfreportedEmotions: ["Anxious", "Overwhelmed", "Tired", "Scattered"],
        microExpressions: ["Jaw tension", "Forced smile asymmetry", "Lip compression", "Micro-frown suppression"],
        aiAnalysis: "Despite conscious attempts to appear calm, your microexpressions reveal underlying stress you're trying to mask.",
        psychologicalInsight: "Emotional suppression detected. The incongruence between felt emotions and displayed expressions can lead to emotional exhaustion.",
        personalizedRecommendation: "Acknowledge these feelings rather than suppressing them—emotional authenticity prevents burnout.",
        presenceCapacity: { estimatedPresence: 4, estimatedCapacity: 3, reasoning: "High stress reduces present-moment awareness and significantly limits available cognitive capacity" },
        suggestedActions: ["Schedule mindfulness break", "Identify top stressors", "Connect with trusted colleague"]
    },
    {
        id: "suppressed_sadness",
        detectedEmotion: "Suppressed Sadness",
        confidence: 76,
        icon: "😔",
        weatherIcon: "🌫️",
        internalWeather: "🌫️ Foggy / Light Rain",
        weatherDesc: "Mentally unclear with emotional heaviness",
        selfreportedEmotions: ["Sad", "Lonely", "Tired", "Bored"],
        microExpressions: ["Downturned mouth corners", "Reduced facial animation", "Flattened affect range", "Lowered brow positioning"],
        aiAnalysis: "Your facial expression shows subtle sadness indicators you may be minimizing.",
        psychologicalInsight: "Emotional suppression of sadness detected. While experiencing difficult emotions is natural, prolonged suppression impacts both mental and physical health.",
        personalizedRecommendation: "It's healthy and courageous to acknowledge difficult feelings. Consider reaching out to a trusted confidant.",
        presenceCapacity: { estimatedPresence: 5, estimatedCapacity: 4, reasoning: "Emotional withdrawal reduces engagement and limits capacity for demanding tasks" },
        suggestedActions: ["Schedule time with confidant", "Engage in self-care", "Consider journaling"]
    },
    {
        id: "concealed_anxiety",
        detectedEmotion: "Concealed Anxiety",
        confidence: 79,
        icon: "😬",
        weatherIcon: "🌪️",
        internalWeather: "🌪️ Tornado Watch / Windy",
        weatherDesc: "Everything feels chaotic and restless",
        selfreportedEmotions: ["Anxious", "Fear", "Overwhelmed", "Scattered"],
        microExpressions: ["Rapid blink frequency", "Eyebrow micro-elevations", "Lip tension", "Facial asymmetry"],
        aiAnalysis: "Your microexpressions reveal significant anxiety you're attempting to control.",
        psychologicalInsight: "High anxiety with attempted emotional regulation. The gap between internal state and external presentation causes additional cognitive strain.",
        personalizedRecommendation: "Your body is in heightened alert mode. Try grounding techniques and consider reaching out for support.",
        presenceCapacity: { estimatedPresence: 3, estimatedCapacity: 2, reasoning: "Severe anxiety drastically reduces presence and depletes cognitive capacity" },
        suggestedActions: ["Practice grounding exercise", "Reduce stimulants", "Contact support resources"]
    }
];

export const featureDetectionSequence = [
    { name: "Face detected", delay: 100 },
    { name: "43 facial landmarks mapped", delay: 300 },
    { name: "Eye region analyzed", delay: 500 },
    { name: "Mouth microexpressions captured", delay: 700 },
    { name: "Autonomic responses tracked", delay: 900 },
    { name: "Psychological markers analyzed", delay: 1100 }
];