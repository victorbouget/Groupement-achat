import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function getAccessToken() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  }

  // Encoder le JWT
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const signingInput = `${header}.${body}`

  // Importer la cle privee
  const privateKey = serviceAccount.private_key
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`

  // Echanger le JWT contre un access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

export async function POST(request) {
  try {
    const { titre, corps } = await request.json()

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    const projectId = serviceAccount.project_id

    // Recuperer tous les tokens
    const { data: tokens } = await supabase
      .from('notification_tokens')
      .select('token')

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ message: 'Aucun token trouve' })
    }

    const accessToken = await getAccessToken()

    // Envoyer les notifications
    const notifications = tokens.map(({ token }) =>
      fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: titre,
              body: corps
            },
            webpush: {
              notification: {
                icon: '/icon-192x192.png'
              }
            }
          }
        })
      })
    )

    await Promise.all(notifications)

    return NextResponse.json({ message: `${tokens.length} notification(s) envoyee(s)` })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
