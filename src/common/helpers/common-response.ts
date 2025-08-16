export class CommonResponse<Data, PaginationResponse = undefined> {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: Data,
    public pagination?: PaginationResponse,
  ) {}
}
