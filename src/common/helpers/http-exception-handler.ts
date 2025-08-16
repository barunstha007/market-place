import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse: any = {
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    const res = exception.getResponse?.();

    if (status === 400 && res) {
      // Case 1: If it's an object and has a message array
      if (typeof res === 'object' && Array.isArray((res as any).message)) {
        const messages = (res as any).message;

        // Case 2: If message is array of strings
        if (messages.every((m: any) => typeof m === 'string')) {
          errorResponse.message = messages.join(', ');
        }

        // Case 3: If message is array of objects with constraints
        else if (
          messages.every(
            (m: any) =>
              typeof m === 'object' &&
              m?.constraints &&
              typeof m.constraints === 'object',
          )
        ) {
          errorResponse.message = messages
            .map((m: any) => Object.values(m.constraints).join(', '))
            .join(', ');
        }
      }

      // Case 4: message is a single string
      else if (typeof (res as any).message === 'string') {
        errorResponse.message = (res as any).message;
      }
    }

    response.status(status).json(errorResponse);
  }
}
