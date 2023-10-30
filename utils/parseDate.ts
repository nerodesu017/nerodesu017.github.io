export function parseDate(date: string): {
    year: number,
    month: string,
    day: number
  }{
    let all = (new Date(date)).toString().split(" ");
    let [_, month, day, year] = all;
    return {
      year: parseInt(year),
      month,
      day: parseInt(day)
    };
  }