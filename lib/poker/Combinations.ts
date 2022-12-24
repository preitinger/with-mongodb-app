// Combinations.ts

// Berechnung von Kombinationen (keine Wiederholung, keine Reihenfolge) von einer Liste

export function rawCombinations(n: number, k: number): Array<Array<number>> {
    const l: Array<Array<number>> = [];
    const next: number[] = [];

    for (let i = 0; i < k; ++i) {
        next.push(i);
    }

    do {
        l.push(next.concat());
        let j = k - 1;

        while (j >= 0 && next[j] === n - 1 - (k - 1 - j)) {
            --j;
        }

        if (j < 0) return l;
        ++next[j];

        for (let m = j + 1; m < k; ++m) {
            next[m] = next[j] + (m - j);
        }
    } while (true);
}

// Kombinationen "k aus l"
export function combinationsOf<T>(l: T[], k: number): Array<Array<T>> {
    return rawCombinations(l.length, k).map(rawCombination => (
        rawCombination.map(x => l[x])
    ));
}
