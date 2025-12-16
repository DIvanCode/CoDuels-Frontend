export const parseRegistrationDate = (dateString: string): string =>
    new Date(dateString).toISOString().split("T")[0];
