export interface TaskPaginationOptions {
    page: number;
    limit: number;
    sort?: Record<string, 1 | -1>;
}