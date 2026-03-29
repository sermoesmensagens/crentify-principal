export const safeLocalStorageGet = <T>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        return JSON.parse(item) as T;
    } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        return fallback;
    }
};

export const getLocalDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatActivityDate = (item: any): string => {
    if (!item || !item.frequency) return '';
    
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        return `${d}/${m}/${y.slice(-2)}`;
    };

    switch (item.frequency) {
        case 'daily':
            return 'Hoje';
        case 'weekly':
            if (item.selectedDays && item.selectedDays.length > 0) {
                const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                return item.selectedDays.map((d: number) => daysMap[d]).join(', ');
            }
            return 'Semanal';
        case 'period':
            if (item.startDate && item.endDate) {
                return `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;
            }
            return 'Período';
        case 'monthly':
            if (item.date) return `${formatDate(item.date).substring(0, 2)}/Mês`;
            return 'Mensal';
        case 'annual':
        case 'once':
            if (item.date) return formatDate(item.date);
            return '';
        default:
            return '';
    }
};
