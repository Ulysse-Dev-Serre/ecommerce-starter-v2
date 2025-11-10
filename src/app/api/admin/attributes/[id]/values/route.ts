import { NextRequest, NextResponse } from 'next/server';

import { Language } from '@/generated/prisma';
import { logger } from '@/lib/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import {
  addAttributeValue,
  AddAttributeValueData,
} from '@/lib/services/attribute.service';

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
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: attributeId } = await context.params;

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
      `Ajout d'une valeur à l'attribut: ${attributeId}`
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
      `Valeur d'attribut ajoutée: ${attributeValue.value}`
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
      'Erreur lors de l\'ajout de la valeur d\'attribut'
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
