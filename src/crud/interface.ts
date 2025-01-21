import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { CondOperator } from './constant';

export interface Request {
  NESTJS_XION_CRUD_REQUEST?: CRUDRequest;
}

type SPrimitivesVal = boolean | number | string;

type SFiledValues = SPrimitivesVal | SPrimitivesVal[];

type SFieldOperator = Partial<Record<CondOperator, SFiledValues>>;

interface SFieldCondition {
  $and?: never;
  $or?: SFieldCondition & SFieldOperator;
}

export interface QueryFilter {
  field: string;
  operator: CondOperator;
  value: string;
}

export type SField = SPrimitivesVal | (SFieldCondition & SFieldOperator);

export interface SConditionAND {
  $and?: (SConditionAND | SFields)[];
  $or?: never;
}

export interface SFields {
  [key: string]: (SConditionAND | SFields)[] | SField | undefined;
  $or?: (SConditionAND | SFields)[];
  $and?: never;
}

export type SCondition = SConditionAND | SFields;

export type SConditionKey = keyof SFieldCondition;

export interface CRUDRequest {
  search: SCondition;
  limit: number;
  page: number;
}

export interface AllowedOptions {
  allow?: string[];
  exclude?: string[];
}

export interface JoinOption extends AllowedOptions {
  alias?: string;
  required?: boolean;
}

export type JoinOptions = Record<string, JoinOption>;

export interface QuerySort<T> {
  field: keyof T;
  order: 'ASC' | 'DESC';
}

export interface CRUDOptions<T extends ObjectLiteral> {
  allow?: (keyof T)[];
  exclude?: (keyof T)[];
  join?: JoinOptions;
  sort?: QuerySort<T>[];
  extend?: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>;
}
