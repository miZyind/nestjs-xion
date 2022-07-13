import type { CondOperator } from './constant';

export interface Request {
  NESTJS_XION_CRUD_REQUEST?: CRUDRequest;
}

type SPrimitivesVal = boolean | number | string;

type SFiledValues = SPrimitivesVal | SPrimitivesVal[];

type SFieldOperator = Record<CondOperator, SFiledValues>;

export interface QueryFilter {
  field: string;
  operator: CondOperator;
  value: string;
}

type SField = SFieldOperator | SPrimitivesVal;

interface SConditionAND {
  $and?: (SConditionAND | SFields)[];
  $or?: never;
}

interface SFields {
  [key: string]: (SConditionAND | SFields)[] | SField | undefined;
  $or?: (SConditionAND | SFields)[];
  $and?: never;
}

export type SCondition = SConditionAND | SFields;

export type SConditionKey = '$and' | '$or';

export interface CRUDRequest {
  search: SCondition;
  limit: number;
  page: number;
}

export interface JoinOption {
  alias?: string;
  allow?: string[];
  exclude?: string[];
  required?: boolean;
}

export type JoinOptions = Record<string, JoinOption>;

export interface QuerySort<T> {
  field: keyof T;
  order: 'ASC' | 'DESC';
}

export interface CRUDOptions<T> {
  allow?: (keyof T)[];
  exclude?: (keyof T)[];
  join?: JoinOptions;
  sort?: QuerySort<T>[];
}
