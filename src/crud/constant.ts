export const DEFAULT_CRUD_LIMIT = 8;
export const DEFAULT_CRUD_PAGE = 1;
export const MIN_COLUMN_CHAIN_LENGTH = 1;
export const MAX_COLUMN_CHAIN_LENGTH = 2;
export enum CondOperator {
  Equals = '$eq',
  NotEquals = '$ne',
  GreaterThan = '$gt',
  LowerThan = '$lt',
  GreaterThanEquals = '$gte',
  LowerThanEquals = '$lte',
  Starts = '$starts',
  Ends = '$ends',
  Contains = '$cont',
  Excludes = '$excl',
  In = '$in',
  NotIn = '$notin',
  IsNull = '$isnull',
  NotNull = '$notnull',
  Between = '$between',
  EqualsLow = '$eqL',
  NotEqualsLow = '$neL',
  StartsLow = '$startsL',
  EndsLow = '$endsL',
  ContainsLow = '$contL',
  ExcludesLow = '$exclL',
  InLow = '$inL',
  NotInLow = '$notinL',
}
