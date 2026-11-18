/**
 * Алгоритм тасования Фишера — Йетса
 * Принимает массив и асинхронно и быстро перемешивает его элементы за линейное время O(n).
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]; // Создаем копию массива, чтобы не портить оригинал в базе
    for (let i = shuffled.length - 1; i > 0; i--) {
        // floor округляет до целого в меньшую сторону
        const j = Math.floor(Math.random() * (i + 1)); 
        // Меняем элементы местами
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}