import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import {
  addAttributeValue,
  type AddAttributeValueData,
} from '@/lib/services/attributes';

/**
 * POST /api/admin/attributes/[id]/values
 * Ajoute une nouvelle valeur à un attribut
 *
 * Body:
 * {
 *   value: string,
 *   translations: [
 *     { language: 'EN', displayName: string },
 *     { language: 'FR', displayName: string }
 *   ]
 * }
 */
async function addValueHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: attributeId } = await params;
  const authContext = auth as AuthContext;

  try {
    const body = await request.json();

    logger.info(
      {
        requestId,
        action: 'add_attribute_value',
        userId: authContext.userId,
        attributeId,
        value: body.value,
      },
      `Adding value to attribute: ${attributeId}`
    );

    const valueData: AddAttributeValueData = {
      value: body.value,
      translations: body.translations,
    };

    const attributeValue = await addAttributeValue(attributeId, valueData);

    logger.info(
      {
        requestId,
        action: 'attribute_value_added',
        attributeId,
        valueId: attributeValue.id,
        value: attributeValue.value,
      },
      `Attribute value added: ${attributeValue.value}`
    );

    return NextResponse.json(attributeValue, { status: 201 });
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'add_attribute_value_error',
        attributeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Error while adding attribute value'
    );

    // Gérer les erreurs de contrainte unique
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Valeur dupliquée',
          message:
            'Cette valeur existe déjà pour cet attribut. Les valeurs doivent être uniques.',
          timestamp: new Date().toISOString(),
        },
        {
          status: 400,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    }

    throw error;
  }
}

export const POST = withError(
  withAdmin(withRateLimit(addValueHandler, RateLimits.ADMIN))
);
