export class UtilCalculate {
    // Tính toán random con số
    static generateRandomIntegers(integersLength: number): number {
        const characters = "123456789";
        let result: string = "";
        const charactersLength = characters.length;
        for (let i = 0; i < integersLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return parseInt(result, 10);
    }
}
