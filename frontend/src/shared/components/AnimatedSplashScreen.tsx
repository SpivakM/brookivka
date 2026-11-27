import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';

interface AnimatedSplashScreenProps {
    onAnimationFinish: () => void;
}

const { width } = Dimensions.get('window');

const ROWS = 4;
const COLS = 4;
const TOTAL_STONES = ROWS * COLS;

// Генерація індексів у шаховому порядку (спочатку парні суми координат, потім непарні)
const generateCheckerboardOrder = (): number[] => {
    const evens: number[] = [];
    const odds: number[] = [];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const idx = r * COLS + c;
            if ((r + c) % 2 === 0) {
                evens.push(idx);
            } else {
                odds.push(idx);
            }
        }
    }

    return [...evens, ...odds];
};

const CHECKERBOARD_ORDER = generateCheckerboardOrder();

// Легкий випадковий нахил для кожної цеглинки для ефекту автентичної бруківки
const STONE_ROTATIONS = [
    '-2deg', '3deg', '-1deg', '2deg',
    '3deg', '-3deg', '2deg', '-2deg',
    '-1deg', '2deg', '-3deg', '1deg',
    '2deg', '-2deg', '3deg', '-1deg',
];

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
    onAnimationFinish,
}) => {
    const stoneAnimations = useRef(
        Array.from({ length: TOTAL_STONES }, () => new Animated.Value(0))
    ).current;

    const textFade = useRef(new Animated.Value(0)).current;
    const screenFade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Анімації цеглинок у порядку шахової дошки
        const orderedStoneAnimations = CHECKERBOARD_ORDER.map((stoneIdx) =>
            Animated.spring(stoneAnimations[stoneIdx], {
                toValue: 1,
                friction: 5,
                tension: 50,
                useNativeDriver: true,
            })
        );

        const stoneStagger = Animated.stagger(55, orderedStoneAnimations);

        Animated.sequence([
            stoneStagger,
            Animated.timing(textFade, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.delay(450),
            Animated.timing(screenFade, {
                toValue: 0,
                duration: 320,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onAnimationFinish();
        });
    }, [onAnimationFinish, screenFade, stoneAnimations, textFade]);

    return (
        <Animated.View style={[styles.container, { opacity: screenFade }]}>
            <StatusBar barStyle="dark-content" />

            {/* Сітка бруківки */}
            <View style={styles.grid}>
                {Array.from({ length: ROWS }).map((_, rowIndex) => (
                    <View
                        key={`row-${rowIndex}`}
                        style={[
                            styles.row,
                            rowIndex % 2 !== 0 && styles.rowShifted,
                        ]}
                    >
                        {Array.from({ length: COLS }).map((_, colIndex) => {
                            const index = rowIndex * COLS + colIndex;
                            const anim = stoneAnimations[index];
                            const rotation = STONE_ROTATIONS[index] || '0deg';

                            return (
                                <Animated.View
                                    key={`stone-${index}`}
                                    style={[
                                        styles.stone,
                                        {
                                            opacity: anim,
                                            transform: [
                                                { rotate: rotation },
                                                {
                                                    scale: anim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0.2, 1],
                                                    }),
                                                },
                                                {
                                                    translateY: anim.interpolate({
                                                        inputRange: [0, 0.7, 1],
                                                        outputRange: [-26, 4, 0], // пружний відскок при ударі об поверхню
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Текстовий блок */}
            <Animated.View style={[styles.textWrapper, { opacity: textFade }]}>
                <Text style={styles.title}>brookivka</Text>
                <Text style={styles.subtitle}>твій гід старим містом</Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#F3EBD8', // Теплий золотисто-бежевий пісковик
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    grid: {
        width: width * 0.55,
        maxWidth: 220,
        alignItems: 'center',
        marginBottom: 26,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 7,
    },
    rowShifted: {
        marginLeft: 18,
    },
    stone: {
        width: 38,
        height: 24,
        backgroundColor: '#4A433A', // Насичений камінь теплого базальтового відтінку
        borderRadius: 4,
        marginHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#E4D5B8', // Золотисто-піщаний шов
        elevation: 4,
        shadowColor: '#2F261D',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
    },
    textWrapper: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#262019',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 13,
        color: '#7E7060',
        marginTop: 6,
        letterSpacing: 0.8,
    },
});