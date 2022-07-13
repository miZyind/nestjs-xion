import { Brackets } from 'typeorm';

import { BadRequestException } from '@nestjs/common';

import { hasValidValue } from '../guarder';
import {
  CondOperator,
  DEFAULT_CRUD_PAGE,
  MAX_COLUMN_CHAIN_LENGTH,
  MIN_COLUMN_CHAIN_LENGTH,
} from './constant';

import type {
  DataSourceOptions,
  EntityMetadata,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import type { StandardList } from '../model';
import type {
  CRUDOptions,
  CRUDRequest,
  JoinOption,
  JoinOptions,
  QueryFilter,
  QuerySort,
  SCondition,
  SConditionKey,
} from './interface';

interface Relation {
  alias?: string;
  nested: boolean;
  name: string;
  path: string;
  columns: string[];
  primaryColumns: string[];
  allowedColumns: string[];
}

export class CRUDService<T> {
  protected dbName: DataSourceOptions['type'];

  protected entityPrimaryColumns: string[] = [];

  protected entityColumns: string[] = [];

  protected entityColumnsHash: Record<string, string> = {};

  protected entityRelationsHash: Map<string, Relation> = new Map();

  protected sqlInjectionRegEx: RegExp[] = [
    /* eslint-disable prefer-named-capture-group, require-unicode-regexp, no-useless-escape */
    /(%27)|(\')|(--)|(%23)|(#)/gi,
    /((%3D)|(=))[^\n]*((%27)|(\')|(--)|(%3B)|(;))/gi,
    /w*((%27)|(\'))((%6F)|o|(%4F))((%72)|r|(%52))/gi,
    /((%27)|(\'))union/gi,
    /* eslint-enable prefer-named-capture-group, require-unicode-regexp, no-useless-escape */
  ];

  constructor(protected repo: Repository<T>) {
    this.dbName = this.repo.metadata.connection.options.type;
    this.entityColumns = this.repo.metadata.columns.map((prop) => {
      if (prop.embeddedMetadata) {
        this.entityColumnsHash[prop.propertyPath] = prop.databasePath;

        return prop.propertyPath;
      }
      this.entityColumnsHash[prop.propertyName] = prop.databasePath;

      return prop.propertyName;
    });
    this.entityPrimaryColumns = this.repo.metadata.columns
      .filter((prop) => prop.isPrimary)
      .map((prop) => prop.propertyName);
  }

  private get alias(): string {
    return this.repo.metadata.targetName;
  }

  async getMany(
    req: CRUDRequest,
    options: CRUDOptions<T> = {},
  ): Promise<StandardList<T>> {
    const builder = this.repo.createQueryBuilder(this.alias);

    this.setSearchCondition(builder, req.search);

    const joinOptions = options.join ?? {};
    const allowedJoins = Object.keys(joinOptions);

    if (allowedJoins.length) {
      Object.keys(joinOptions).forEach((field) =>
        this.setJoin(field, joinOptions, builder),
      );
    }

    if (options.sort) {
      builder.orderBy(this.mapSort(options.sort));
    }

    const [data, total] = await builder
      .select(this.getSelect(options))
      .take(req.limit)
      .skip((req.page - DEFAULT_CRUD_PAGE) * req.limit)
      .getManyAndCount();

    return { data, total };
  }

  // eslint-disable-next-line complexity -- Necessary for operators
  protected mapOperatorsToQuery(
    cond: QueryFilter,
    param: string,
  ): { str: string; params: Record<string, unknown> } {
    const field = this.getFieldWithAlias(cond.field);
    const likeOperator = this.dbName === 'postgres' ? 'ILIKE' : 'LIKE';
    let str = `${field} = :${param}`;
    let params: Record<string, unknown> = {};

    switch (cond.operator) {
      case CondOperator.Equals:
        str = `${field} = :${param}`;
        break;
      case CondOperator.NotEquals:
        str = `${field} != :${param}`;
        break;
      case CondOperator.GreaterThan:
        str = `${field} > :${param}`;
        break;
      case CondOperator.LowerThan:
        str = `${field} < :${param}`;
        break;
      case CondOperator.GreaterThanEquals:
        str = `${field} >= :${param}`;
        break;
      case CondOperator.LowerThanEquals:
        str = `${field} <= :${param}`;
        break;
      case CondOperator.Starts:
        str = `${field} LIKE :${param}`;
        params = { [param]: `${cond.value}%` };
        break;
      case CondOperator.Ends:
        str = `${field} LIKE :${param}`;
        params = { [param]: `%${cond.value}` };
        break;
      case CondOperator.Contains:
        str = `${field} LIKE :${param}`;
        params = { [param]: `%${cond.value}%` };
        break;
      case CondOperator.Excludes:
        str = `${field} NOT LIKE :${param}`;
        params = { [param]: `%${cond.value}%` };
        break;
      case CondOperator.In:
        str = `${field} IN (:...${param})`;
        break;
      case CondOperator.NotIn:
        str = `${field} NOT IN (:...${param})`;
        break;
      case CondOperator.IsNull:
        str = `${field} IS NULL`;
        params = {};
        break;
      case CondOperator.NotNull:
        str = `${field} IS NOT NULL`;
        params = {};
        break;
      case CondOperator.Between: {
        const [first, second] = cond.value;

        str = `${field} BETWEEN :${param}0 AND :${param}1`;
        params = {
          [`${param}0`]: first,
          [`${param}1`]: second,
        };
        break;
      }
      case CondOperator.EqualsLow:
        str = `LOWER(${field}) = :${param}`;
        break;
      case CondOperator.NotEqualsLow:
        str = `LOWER(${field}) != :${param}`;
        break;
      case CondOperator.StartsLow:
        str = `LOWER(${field}) ${likeOperator} :${param}`;
        params = { [param]: `${cond.value}%` };
        break;
      case CondOperator.EndsLow:
        str = `LOWER(${field}) ${likeOperator} :${param}`;
        params = { [param]: `%${cond.value}` };
        break;
      case CondOperator.ContainsLow:
        str = `LOWER(${field}) ${likeOperator} :${param}`;
        params = { [param]: `%${cond.value}%` };
        break;
      case CondOperator.ExcludesLow:
        str = `LOWER(${field}) NOT ${likeOperator} :${param}`;
        params = { [param]: `%${cond.value}%` };
        break;
      case CondOperator.InLow:
        str = `LOWER(${field}) IN (:...${param})`;
        break;
      case CondOperator.NotInLow:
        str = `LOWER(${field}) NOT IN (:...${param})`;
        break;
      default:
        str = `${field} = :${param}`;
        break;
    }

    if (typeof params === 'undefined') {
      params = { [param]: cond.value };
    }

    return { str, params };
  }

  private setSearchFieldObjectCondition(
    builder: SelectQueryBuilder<T>,
    condition: SConditionKey,
    field: string,
    object: SCondition,
  ): void {
    const operators = Object.keys(object);

    if (operators.length === MIN_COLUMN_CHAIN_LENGTH) {
      const [operator] = operators;
      const value = object[operator as SConditionKey];

      if (typeof object.$or === 'object') {
        const orKeys = Object.keys(object.$or);

        this.setSearchFieldObjectCondition(
          builder,
          orKeys.length === MIN_COLUMN_CHAIN_LENGTH ? condition : '$or',
          field,
          object.$or as SCondition,
        );
      } else {
        this.builderSetWhere(
          builder,
          condition,
          field,
          value,
          operator as CondOperator,
        );
      }
    } else if (operators.length > MIN_COLUMN_CHAIN_LENGTH) {
      this.builderAddBrackets(
        builder,
        condition,
        new Brackets((qb) => {
          operators.forEach((operator) => {
            const value = object[operator as SConditionKey];

            if (operator === '$or') {
              const orKeys = Object.keys(object.$or as SCondition[]);

              if (orKeys.length === MIN_COLUMN_CHAIN_LENGTH) {
                this.setSearchFieldObjectCondition(
                  qb as SelectQueryBuilder<T>,
                  condition,
                  field,
                  object.$or as SCondition,
                );
              } else {
                this.builderAddBrackets(
                  qb as SelectQueryBuilder<T>,
                  condition,
                  new Brackets((qb2) => {
                    this.setSearchFieldObjectCondition(
                      qb2 as SelectQueryBuilder<T>,
                      '$or',
                      field,
                      object.$or as SCondition,
                    );
                  }),
                );
              }
            } else {
              this.builderSetWhere(
                qb as SelectQueryBuilder<T>,
                condition,
                field,
                value,
                operator as CondOperator,
              );
            }
          });
        }),
      );
    }
  }

  private builderSetWhere(
    builder: SelectQueryBuilder<T>,
    condition: SConditionKey,
    field: string,
    value: unknown,
    operator = CondOperator.Equals,
  ): void {
    const [first, second] = process.hrtime();
    const index = `${field}${first}${second}`;
    const args = [
      {
        field,
        operator: value === null ? CondOperator.IsNull : operator,
        value: value as string,
      },
      index,
      builder,
    ] as const;

    if (condition === '$and') {
      this.setAndWhere(...args);
    } else {
      this.setOrWhere(...args);
    }
  }

  private builderAddBrackets(
    builder: SelectQueryBuilder<T>,
    condition: SConditionKey,
    brackets: Brackets,
  ): void {
    if (condition === '$and') {
      builder.andWhere(brackets);
    } else {
      builder.orWhere(brackets);
    }
  }

  private setSearchCondition(
    builder: SelectQueryBuilder<T>,
    search: SCondition,
    condition: SConditionKey = '$and',
  ): void {
    const keys = Object.keys(search);

    // Search: {$and: [...], ...}
    if (hasValidValue(search.$and)) {
      // Search: {$and: [{}]}
      if (search.$and.length === MIN_COLUMN_CHAIN_LENGTH) {
        const [field] = search.$and;

        this.setSearchCondition(builder, field, condition);
      }
      // Search: {$and: [{}, {}, ...]}
      else {
        this.builderAddBrackets(
          builder,
          condition,
          new Brackets((qb) => {
            search.$and?.forEach((item) => {
              this.setSearchCondition(
                qb as SelectQueryBuilder<T>,
                item,
                '$and',
              );
            });
          }),
        );
      }
    }
    // Search: {$or: [...], ...}
    else if (hasValidValue(search.$or)) {
      // Search: {$or: [...]}
      if (keys.length === MIN_COLUMN_CHAIN_LENGTH) {
        // Search: {$or: [{}]}
        if (search.$or.length === MIN_COLUMN_CHAIN_LENGTH) {
          const [field] = search.$or;

          this.setSearchCondition(builder, field, condition);
        }
        // Search: {$or: [{}, {}, ...]}
        else {
          this.builderAddBrackets(
            builder,
            condition,
            new Brackets((qb) => {
              search.$or?.forEach((item) => {
                this.setSearchCondition(
                  qb as SelectQueryBuilder<T>,
                  item,
                  '$or',
                );
              });
            }),
          );
        }
      }
      // Search: {$or: [...], foo, ...}
      else {
        this.builderAddBrackets(
          builder,
          condition,
          new Brackets((qb) => {
            keys.forEach((field) => {
              if (field !== '$or') {
                const value = search[field as keyof SCondition];

                if (typeof value === 'object') {
                  this.setSearchFieldObjectCondition(
                    qb as SelectQueryBuilder<T>,
                    '$and',
                    field,
                    value as SCondition,
                  );
                } else {
                  this.builderSetWhere(
                    qb as SelectQueryBuilder<T>,
                    '$and',
                    field,
                    value,
                  );
                }
              } else if (search.$or?.length === MIN_COLUMN_CHAIN_LENGTH) {
                const [target] = search.$or;

                this.setSearchCondition(builder, target, '$and');
              } else {
                this.builderAddBrackets(
                  qb as SelectQueryBuilder<T>,
                  '$and',
                  new Brackets((qb2) => {
                    search.$or?.forEach((item) => {
                      this.setSearchCondition(
                        qb2 as SelectQueryBuilder<T>,
                        item,
                        '$or',
                      );
                    });
                  }),
                );
              }
            });
          }),
        );
      }
    }
    // Search: {foo}
    else if (keys.length === MIN_COLUMN_CHAIN_LENGTH) {
      const [field] = keys;
      const value = search[field as keyof SCondition];

      if (typeof value === 'object') {
        this.setSearchFieldObjectCondition(
          builder,
          condition,
          field,
          value as SCondition,
        );
      } else {
        this.builderSetWhere(builder, condition, field, value);
      }
    }
    // Search: {foo, ...}
    else {
      this.builderAddBrackets(
        builder,
        condition,
        new Brackets((qb) => {
          keys.forEach((field: string) => {
            const value = search[field as keyof SCondition];

            if (typeof value === 'object') {
              this.setSearchFieldObjectCondition(
                qb as SelectQueryBuilder<T>,
                '$and',
                field,
                value as SCondition,
              );
            } else {
              this.builderSetWhere(
                qb as SelectQueryBuilder<T>,
                '$and',
                field,
                value,
              );
            }
          });
        }),
      );
    }
  }

  private getEntityColumns(entityMetadata: EntityMetadata): {
    columns: string[];
    primaryColumns: string[];
  } {
    const columns = entityMetadata.columns.map((prop) => prop.propertyPath);
    const primaryColumns = entityMetadata.primaryColumns.map(
      (prop) => prop.propertyPath,
    );

    return { columns, primaryColumns };
  }

  private getRelationMetadata(
    field: string,
    options: JoinOption<T>,
  ): Relation | null {
    try {
      let allowedRelation: Relation | null = null;
      let nested = false;

      if (this.entityRelationsHash.has(field)) {
        allowedRelation = this.entityRelationsHash.get(field) as Relation;
      } else {
        const fields = field.split('.');
        let relationMetadata: EntityMetadata | null = null;
        let name = '';
        let path = '';
        let parentPath = '';

        if (fields.length === MIN_COLUMN_CHAIN_LENGTH) {
          const [targetName] = fields;
          const targetRelation = this.repo.metadata.relations.find(
            ({ propertyName }) => propertyName === targetName,
          );

          if (targetRelation) {
            name = targetName;
            path = `${this.alias}.${targetName}`;
            relationMetadata = targetRelation.inverseEntityMetadata;
          }
        } else {
          nested = true;

          const reduced = fields.reduce(
            (res, targetName, i) => {
              const targetRelation = res.relations.length
                ? res.relations.find(
                    ({ propertyName }) => propertyName === targetName,
                  )
                : null;
              const metadata = targetRelation
                ? targetRelation.inverseEntityMetadata
                : null;
              const relations = metadata ? metadata.relations : [];

              name = targetName;

              if (i !== fields.length - MIN_COLUMN_CHAIN_LENGTH) {
                parentPath = parentPath.length
                  ? `${parentPath}.${targetName}`
                  : targetName;
              }

              return {
                relations,
                relationMetadata: metadata,
              };
            },
            {
              relations: this.repo.metadata.relations,
              relationMetadata: null as EntityMetadata | null,
            },
          );

          ({ relationMetadata } = reduced);
        }

        if (relationMetadata) {
          const { columns, primaryColumns } =
            this.getEntityColumns(relationMetadata);

          if (!path && parentPath) {
            // eslint-disable-next-line max-depth
            if (this.entityRelationsHash.has(parentPath)) {
              const parentAllowedRelation = this.entityRelationsHash.get(
                parentPath,
              ) as Relation;

              path = hasValidValue(parentAllowedRelation.alias)
                ? `${parentAllowedRelation.alias}.${name}`
                : field;
            }
          }

          allowedRelation = {
            alias: options.alias,
            name,
            path,
            columns,
            nested,
            primaryColumns,
            allowedColumns: [],
          };
        }
      }

      if (allowedRelation) {
        const allowedColumns = this.getAllowedColumns(
          allowedRelation.columns,
          options,
        );
        const toSave: Relation = { ...allowedRelation, allowedColumns };

        this.entityRelationsHash.set(field, toSave);

        if (hasValidValue(options.alias)) {
          this.entityRelationsHash.set(options.alias, toSave);
        }

        return toSave;
      }

      return null;
    } catch {
      return null;
    }
  }

  private setJoin(
    field: string,
    options: JoinOptions<T>,
    builder: SelectQueryBuilder<T>,
  ): void {
    const option = options[field];
    const allowedRelation = this.getRelationMetadata(field, options);

    if (!allowedRelation) {
      return;
    }

    builder[hasValidValue(option.required) ? 'innerJoin' : 'leftJoin'](
      allowedRelation.path,
      hasValidValue(option.alias) ? option.alias : allowedRelation.name,
    );

    const alias = hasValidValue(option.alias)
      ? option.alias
      : allowedRelation.name;
    const select = [
      ...allowedRelation.primaryColumns,
      ...allowedRelation.allowedColumns,
    ].map((col) => `${alias}.${col}`);

    builder.addSelect([...new Set(select)]);
  }

  private setAndWhere(
    cond: QueryFilter,
    i: string,
    builder: SelectQueryBuilder<T>,
  ): void {
    const { str, params } = this.mapOperatorsToQuery(cond, `andWhere${i}`);

    builder.andWhere(str, params);
  }

  private setOrWhere(
    cond: QueryFilter,
    i: string,
    builder: SelectQueryBuilder<T>,
  ): void {
    const { str, params } = this.mapOperatorsToQuery(cond, `orWhere${i}`);

    builder.orWhere(str, params);
  }

  private getSelect(options: CRUDOptions<T>): string[] {
    const columns =
      !hasValidValue(options.exclude) && !hasValidValue(options.allow)
        ? this.entityColumns
        : this.entityColumns.filter(
            (column) =>
              (hasValidValue(options.exclude)
                ? !options.exclude.some((col) => col === column)
                : true) &&
              (hasValidValue(options.allow)
                ? options.allow.some((col) => col === column)
                : true),
          );
    const select = [...this.entityPrimaryColumns, ...columns].map(
      (col) => `${this.alias}.${col}`,
    );

    return [...new Set(select)];
  }

  private getFieldWithAlias(field: string, sort = false): string {
    const i = this.dbName === 'mysql' ? '`' : '"';
    const cols = field.split('.');

    switch (cols.length) {
      case MIN_COLUMN_CHAIN_LENGTH: {
        if (sort) {
          return `${this.alias}.${field}`;
        }

        const dbColName =
          this.entityColumnsHash[field] === field
            ? field
            : this.entityColumnsHash[field];

        return `${i}${this.alias}${i}.${i}${dbColName}${i}`;
      }
      case MAX_COLUMN_CHAIN_LENGTH:
        return field;
      default:
        return cols
          .slice(cols.length - MAX_COLUMN_CHAIN_LENGTH, cols.length)
          .join('.');
    }
  }

  private mapSort(sort: QuerySort<T>[]): Record<string, QuerySort<T>['order']> {
    return sort.reduce<Record<string, QuerySort<T>['order']>>(
      (params, { field, order }) => {
        params[
          this.checkSqlInjection(this.getFieldWithAlias(field as string, true))
        ] = order;

        return params;
      },
      {},
    );
  }

  private getAllowedColumns(
    columns: string[],
    options: CRUDOptions<T>,
  ): string[] {
    return !hasValidValue(options.exclude) && !hasValidValue(options.allow)
      ? columns
      : columns.filter(
          (column) =>
            (hasValidValue(options.exclude)
              ? !options.exclude.some((col) => col === column)
              : true) &&
            (hasValidValue(options.allow)
              ? options.allow.some((col) => col === column)
              : true),
        );
  }

  private checkSqlInjection(field: string): string {
    for (const regex of this.sqlInjectionRegEx) {
      if (regex.test(field)) {
        throw new BadRequestException(`SQL injection detected: "${field}"`);
      }
    }

    return field;
  }
}
