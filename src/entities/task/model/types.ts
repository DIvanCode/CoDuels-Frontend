export interface Task {
    id: string;
    name: string;
    level: number;
    statement: string;
    tl: number;
    ml: number;
    tests: Array<{
        order: number;
        input: string;
        output: string;
    }>;
}
