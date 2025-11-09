import { NextRequest, NextResponse } from 'next/server';

import { Language } from '../../../../generated/prisma';
import { logger } from '../../../../lib/logger';
import { AuthContext, withAdmin } from '../../../../lib/middleware/withAuth';
import { withError } from '../../../../lib/middleware/withError';
import {
  getProductAttributes,
  createProductAttribute,
  CreateAttributeData,
} from '../../../../lib/services/attribute.service';

/**
 * GET /api/admin/attributes
 * Liste tous les attributs avec leurs traductions
 * 
 * Query params:
 * - language: EN | FR (optionnel) - Filtre les traductions par langue
 */
async function getAttributesHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') as Language | null;

  logger.info(
    {
      requestId,
      action: 'get_attributes_admin',
      userId: authContext.userId,
      language,
    },
    'Admin fetching attributes'
  );

  try {
    const attributes = await getProductAttributes(language ?? undefined);

    logger.info(
      {
        requestId,
        action: 'get_attributes_success',
        count: attributes.length,
      },
      'Attributes retrieved successfully'
    );

    return NextResponse.json(attributes, { status: 200 });
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'get_attributes_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to retrieve attributes'
    );
    throw error;
  }
}

/**
 * POST /api/admin/attributes
 * Crée un nouvel attribut avec ses traductions
 * 
 * Body:
 * {
 *   key: string,
 *   inputType: 'text' | 'select' | 'color',
 *   isRequired?: boolean,
 *   sortOrder?: number,
 *   translations: [
 *     { language: 'EN', name: string, description?: string },
 *     { language: 'FR', name: string, description?: string }
 *   ]
 * }
 */
async function createAttributeHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    const attributeData: CreateAttributeData = body;

    logger.info(
      {
        requestId,
        action: 'create_attribute_admin',
        userId: authContext.userId,
        key: attributeData.key,
      },
      'Admin creating attribute'
    );

    const attribute = await createProductAttribute(attributeData);

    logger.info(
      {
        requestId,
        action: 'create_attribute_success',
        attributeId: attribute.id,
        key: attribute.key,
      },
      'Attribute created successfully'
    );

    return NextResponse.json(attribute, { status: 201 });
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'create_attribute_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to create attribute'
    );
    throw error;
  }
}

// Export handlers avec middlewares
export const GET = withError(withAdmin(getAttributesHandler));
export const POST = withError(withAdmin(createAttributeHandler));
