export interface StandardResponse<T> {
  code: number;
  error?: string;
  message: string;
  data: T;
}

export interface StandardList<T> {
  data: T[];
  total: number;
}
