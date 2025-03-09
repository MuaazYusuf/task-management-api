export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: PaginationMeta;
}