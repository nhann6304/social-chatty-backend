export class UtilConvert {
    static convertFirstLetterUppercase(str: string): string {
        const valueString = str.toLocaleLowerCase();
        return valueString
            .split("")
            .map(
                (value: string) =>
                    `${value.charAt(0).toLocaleUpperCase()}${value
                        .slice(1)
                        .toLocaleLowerCase()}`
            )
            .join("");
    }

    static lowerCase(str: string): string {
        return str.toLocaleLowerCase();
    }
}
