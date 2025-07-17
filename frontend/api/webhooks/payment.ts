import { VercelRequest, VercelResponse } from '@vercel/node'
import { webhookService } from '../../src/services/webhookService'
import { WebhookPlatform } from '../../src/types/subscription'

// Rate limiting com Map simples (em produção usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10 // máximo 10 requests por minuto por IP
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return true
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return false
  }
  
  record.count++
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas métodos POST são aceitos
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] as string || 
                    req.headers['x-real-ip'] as string || 
                    req.connection?.remoteAddress || 
                    'unknown'
    
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests'
      })
    }

    // Extrair plataforma da URL ou header
    const platform = extractPlatform(req)
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing platform'
      })
    }

    // Extrair assinatura do header
    const signature = extractSignature(req, platform)
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      })
    }

    // Obter body como string
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    
    // Processar webhook
    const result = await webhookService.processWebhook(
      platform,
      signature,
      body,
      req.headers as Record<string, string>
    )

    return res.status(result.success ? 200 : 400).json(result)

  } catch (error) {
    console.error('Webhook endpoint error:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

function extractPlatform(req: VercelRequest): WebhookPlatform | null {
  // Tentar extrair da query string
  const platformFromQuery = req.query.platform as string
  if (platformFromQuery && isValidPlatform(platformFromQuery)) {
    return platformFromQuery as WebhookPlatform
  }

  // Tentar extrair do User-Agent ou headers específicos
  const userAgent = req.headers['user-agent']?.toLowerCase() || ''
  
  if (userAgent.includes('hotmart')) return 'hotmart'
  if (userAgent.includes('eduzz')) return 'eduzz'
  if (userAgent.includes('stripe')) return 'stripe'
  if (userAgent.includes('kirvano')) return 'kirvano'
  if (userAgent.includes('monetizze')) return 'monetizze'

  // Tentar detectar por headers específicos
  if (req.headers['x-hotmart-signature']) return 'hotmart'
  if (req.headers['x-eduzz-signature']) return 'eduzz'
  if (req.headers['stripe-signature']) return 'stripe'
  if (req.headers['x-kirvano-signature']) return 'kirvano'
  if (req.headers['x-monetizze-signature']) return 'monetizze'

  return null
}

function extractSignature(req: VercelRequest, platform: WebhookPlatform): string | null {
  switch (platform) {
    case 'hotmart':
      return req.headers['x-hotmart-signature'] as string || null
    case 'eduzz':
      return req.headers['x-eduzz-signature'] as string || null
    case 'stripe':
      return req.headers['stripe-signature'] as string || null
    case 'kirvano':
      return req.headers['x-kirvano-signature'] as string || null
    case 'monetizze':
      return req.headers['x-monetizze-signature'] as string || null
    default:
      return null
  }
}

function isValidPlatform(platform: string): boolean {
  return ['hotmart', 'eduzz', 'stripe', 'kirvano', 'monetizze'].includes(platform)
}

// Configuração para processar raw body
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}