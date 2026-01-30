
//Converts a currency amount to its subcurrency (e.g., dollars to cents)

export default function convertToSubcurrency(amount: number, factor = 100) {
    return Math.round(amount * factor);
}