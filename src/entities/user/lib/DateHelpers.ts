import { formatIsoDate } from "shared/lib/isoTimestamp";

export const parseRegistrationDate = (dateString: string): string => formatIsoDate(dateString);
