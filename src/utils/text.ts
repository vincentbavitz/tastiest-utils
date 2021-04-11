export function titleCase(str: string) {
  return str?.length
    ? str
        .toLowerCase()
        .split(' ')
        .map(function (word) {
          return word.replace(word[0], word[0].toUpperCase());
        })
        .join(' ')
    : '';
}

export function convertRemToPixels(rem: number) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
