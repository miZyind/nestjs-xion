import type { SwaggerCustomOptions } from '@nestjs/swagger';

export function customOptions(appName: string): SwaggerCustomOptions {
  return {
    swaggerOptions: {
      defaultModelExpandDepth: 10,
      defaultModelsExpandDepth: -1,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .information-container .info { margin: 20px 0 }
      .swagger-ui .scheme-container {
        padding: unset;
        background: unset;
        box-shadow: unset;
        margin: -60px 0 0 0;
        padding-bottom: 30px;
      }
      .swagger-ui .download-contents { display: none }
      .swagger-ui .copy-to-clipboard {
        bottom: 5px;
        right: 10px;
        width: 20px;
        height: 20px;
      }
      .swagger-ui .copy-to-clipboard button {
        padding-left: 18px;
        height: 18px;
      }
    `,
    customSiteTitle: `${appName} APIs`,
  };
}
