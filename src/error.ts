import * as changeCase from 'change-case';

import { Catch, HttpException, Logger } from '@nestjs/common';

import type { Request, Response } from 'express';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { StandardResponse } from './model';

enum HttpStatus {
  RequestError = 400,
  AuthorizationError = 401,
  AccountError = 402,
  PermissionError = 403,
  APINotFoundError = 404,
  InternalServerError = 500,
}

export class RequestError extends HttpException {
  constructor(message: string) {
    super(
      { error: changeCase.constantCase(message), message },
      HttpStatus.RequestError,
    );
  }
}
export class AuthorizationError extends HttpException {
  constructor() {
    super('', HttpStatus.AccountError);
  }
}
export class AccountError extends HttpException {
  constructor() {
    super('', HttpStatus.AccountError);
  }
}
export class PermissionError extends HttpException {
  constructor() {
    super('', HttpStatus.PermissionError);
  }
}

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorFilter.name);

  catch(error: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const body: StandardResponse<string[] | null> = {
      code: -1,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error, please contact the developers',
      data: null,
    };
    let status = HttpStatus.InternalServerError;

    if (
      error instanceof HttpException ||
      error instanceof RequestError ||
      error instanceof AuthorizationError ||
      error instanceof AccountError ||
      error instanceof PermissionError
    ) {
      const source = error.getResponse() as {
        error: string;
        message: string[] | string;
      };

      status = error.getStatus();

      switch (status) {
        case HttpStatus.RequestError:
          if (Array.isArray(source.message)) {
            body.error = 'VALIDATION_ERROR';
            body.message = 'Validation error, please check the parameters';
            body.data = source.message;
          } else {
            body.error =
              error instanceof RequestError
                ? source.error
                : changeCase.constantCase(source.message);
            body.message = source.message;
          }
          break;
        case HttpStatus.AuthorizationError:
          body.error = 'AUTHORIZATION_ERROR';
          body.message = 'Authorization error, please provide a valid token';
          break;
        case HttpStatus.AccountError:
          body.error = 'ACCOUNT_ERROR';
          body.message = 'Account error, your account has been deactivated';
          break;
        case HttpStatus.PermissionError:
          body.error = 'PERMISSION_ERROR';
          body.message = 'Permission error, please check your permissions';
          break;
        case HttpStatus.APINotFoundError:
          body.error = 'API_NOT_FOUND_ERROR';
          body.message = 'API not found error, please send the correct request';
          break;
        default:
          break;
      }
    }
    if (status === HttpStatus.InternalServerError) {
      this.logger.error(`${request.method} ${request.url}: ${error.message}`);
    }

    response.status(status).json(body);
  }
}
