import { Landmark } from '../components/LandmarkCard';

export type SortOption = 'default' | 'nearest' | 'oldest' | 'newest' | 'alphabetical';
export type EraOption = 'all' | 'before1600' | '17th' | '18th' | '19th20th';

export interface LandmarkFilterState {
    categories: string[];
    styles: string[];
    eras: EraOption[];
    sortBy: SortOption;
}

export const INITIAL_FILTER_STATE: LandmarkFilterState = {
    categories: [],
    styles: [],
    eras: [],
    sortBy: 'default',
};

export const ERA_OPTIONS: { key: EraOption; label: string }[] = [
    { key: 'all', label: 'Усі епохи' },
    { key: 'before1600', label: 'До XVII ст.' },
    { key: '17th', label: 'XVII ст.' },
    { key: '18th', label: 'XVIII ст.' },
    { key: '19th20th', label: 'XIX–XX ст.' },
];

export const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'default', label: 'За замовчуванням' },
    { key: 'nearest', label: 'Найближчі' },
    { key: 'oldest', label: 'Найдавніші' },
    { key: 'newest', label: 'Найновіші' },
    { key: 'alphabetical', label: 'За алфавітом' },
];

export const extractUniqueTags = (
    items: Landmark[],
    selector: (item: Landmark) => string | null | undefined
): string[] => {
    const uniqueSet = new Set<string>();
    items.forEach((item) => {
        const raw = selector(item);
        if (!raw) return;
        raw.split('/').forEach((part) => {
            const trimmed = part.trim();
            if (trimmed) uniqueSet.add(trimmed);
        });
    });
    return Array.from(uniqueSet);
};

const getDistanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371e3;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const matchesSingleEra = (buildYear: number | null | undefined, era: EraOption): boolean => {
    if (!buildYear) return false;
    if (era === 'before1600') return buildYear < 1600;
    if (era === '17th') return buildYear >= 1600 && buildYear < 1700;
    if (era === '18th') return buildYear >= 1700 && buildYear < 1800;
    if (era === '19th20th') return buildYear >= 1800;
    return false;
};

export const countActiveFilters = (filters: LandmarkFilterState): number => {
    return (
        filters.categories.length +
        filters.styles.length +
        filters.eras.length +
        (filters.sortBy !== 'default' ? 1 : 0)
    );
};

export const applyLandmarkFiltersAndSort = (
    items: Landmark[],
    searchQuery: string,
    filters: LandmarkFilterState,
    referenceCoords = { lat: 49.8418, lng: 24.0316 }
): Landmark[] => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = items.filter((item) => {
        const matchesSearch =
            !query ||
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.architectureStyle && item.architectureStyle.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        if (filters.categories.length > 0) {
            const itemCat = item.category?.toLowerCase() || '';
            const hasAnyCategory = filters.categories.some((cat) =>
                itemCat.includes(cat.toLowerCase())
            );
            if (!hasAnyCategory) return false;
        }

        if (filters.styles.length > 0) {
            const itemStyle = item.architectureStyle?.toLowerCase() || '';
            const hasAnyStyle = filters.styles.some((st) =>
                itemStyle.includes(st.toLowerCase())
            );
            if (!hasAnyStyle) return false;
        }

        if (filters.eras.length > 0) {
            const hasAnyEra = filters.eras.some((era) => matchesSingleEra(item.buildYear, era));
            if (!hasAnyEra) return false;
        }

        return true;
    });

    if (filters.sortBy === 'default') return filtered;

    return [...filtered].sort((a, b) => {
        switch (filters.sortBy) {
            case 'nearest':
                return (
                    getDistanceMeters(referenceCoords.lat, referenceCoords.lng, a.latitude, a.longitude) -
                    getDistanceMeters(referenceCoords.lat, referenceCoords.lng, b.latitude, b.longitude)
                );
            case 'oldest':
                return (a.buildYear ?? Number.MAX_SAFE_INTEGER) - (b.buildYear ?? Number.MAX_SAFE_INTEGER);
            case 'newest':
                return (b.buildYear ?? 0) - (a.buildYear ?? 0);
            case 'alphabetical':
                return a.name.localeCompare(b.name, 'uk');
            default:
                return 0;
        }
    });
};