import { parseDate } from "./parseDate";

/**
 * 
 * @param date 
 * @returns the date parsed or an empty string
 */
export function dateToString(date?: string): string {
    let parsed_date_to_string = "";

    if(date){
      let parsed_date = parseDate(date);
      parsed_date_to_string = `${parsed_date.month} ${parsed_date.day} ${parsed_date.year}`;
    }

    return parsed_date_to_string;
}