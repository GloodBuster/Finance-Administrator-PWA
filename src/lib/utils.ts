export function getCategoryIcon(iconName: string): string {
    const iconMap: Record<string, string> = {
        'glass-cocktail': '🍹',
        'netflix': '📺',
        'airplane': '✈️',
        'sofa': '🛋️',
        'piggy-bank': '🐷',
        'cart': '🛒',
        'food': '🍔',
        'car': '🚗',
    };

    return iconMap[iconName] || '📁';
}