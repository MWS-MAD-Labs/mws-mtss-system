import React, { memo } from "react";
import { motion } from "framer-motion";
import { Brain, Battery, Sun, Cloud, CloudRain, Zap, Wind, Snowflake, Rainbow, Droplets, Flame } from "lucide-react";
import { weatherIcons } from "@/lib/ratingConstants";

const MetricsGrid = memo(({ data, analysis }) => {
    const iconMap = {
        "sunny": Sun,
        "partly-cloudy": Cloud,
        "light-rain": CloudRain,
        "thunderstorms": Zap,
        "tornado": Wind,
        "snowy": Snowflake,
        "rainbow": Rainbow,
        "foggy": Droplets,
        "heatwave": Flame,
        "windy": Wind
    };

    const WeatherIcon = iconMap[analysis.weatherValue] || Cloud;

    const metrics = [
        {
            icon: WeatherIcon,
            label: "Internal Weather",
            value: data.weatherReport.split('–')[0].trim(),
            color: "from-primary/10 to-primary/5 dark:from-primary/8 dark:to-primary/3"
        },
        {
            icon: Brain,
            label: "Presence Level",
            value: `${data.presenceLevel}/10`,
            color: "from-gold/10 to-gold/5 dark:from-gold/8 dark:to-gold/3"
        },
        {
            icon: Battery,
            label: "Capacity Level",
            value: `${data.capacityLevel}/10`,
            color: "from-emerald/10 to-emerald/5 dark:from-emerald/8 dark:to-emerald/3"
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-10 px-2"
        >
            {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                    <motion.div
                        key={index}
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.3 }}
                        className="glass glass-card hover-lift transition-all duration-300"
                    >
                        <div className="glass__refract" />
                        <div className="glass__refract--soft" />
                        <div className="glass__noise" />
                        <div className="relative z-10 p-4 md:p-5 flex items-center gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-sm`}>
                                <Icon className="w-5 h-5 md:w-6 md:h-6 text-foreground/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm text-muted-foreground mb-0.5">{metric.label}</p>
                                <p className="text-sm md:text-lg font-semibold text-foreground truncate">{metric.value}</p>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
});

MetricsGrid.displayName = 'MetricsGrid';

export default MetricsGrid;